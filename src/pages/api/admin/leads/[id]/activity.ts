// Lead Activity API
// GET  /api/admin/leads/:id/activity — list activities
// POST /api/admin/leads/:id/activity — add activity (email_sent, call, note, etc.)

export const prerender = false;

import type { APIRoute } from 'astro';

interface Env {
  DB: D1Database;
}

const VALID_TYPES = ['email_sent', 'email_received', 'call', 'note', 'stage_change', 'auto_action'];

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = ((locals as any).runtime?.env as Env | undefined)?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      'SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT 100'
    ).bind(params.id).all();

    return new Response(JSON.stringify({ activities: result.results || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to fetch activities', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const db = ((locals as any).runtime?.env as Env | undefined)?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { type, title, description } = body;

    if (!type || !title) {
      return new Response(JSON.stringify({ error: 'type and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_TYPES.includes(type)) {
      return new Response(JSON.stringify({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify lead exists
    const lead = await db.prepare('SELECT id FROM leads WHERE id = ?').bind(params.id).first();
    if (!lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      `INSERT INTO lead_activities (lead_id, type, title, description, created_by)
       VALUES (?, ?, ?, ?, 'admin')`
    ).bind(params.id, type, title, description || null).run();

    // Update last_contacted_at for contact-related activities
    if (['email_sent', 'call'].includes(type)) {
      await db.prepare(
        'UPDATE leads SET last_contacted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(params.id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      activity: {
        id: result.meta?.last_row_id,
        lead_id: parseInt(params.id!),
        type,
        title,
        description: description || null,
        created_by: 'admin',
        created_at: new Date().toISOString(),
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to add activity', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
