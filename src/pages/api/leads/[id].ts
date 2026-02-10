import type { APIRoute } from 'astro';
import { logActivity } from '../../../lib/activity-log';

export const prerender = false;

interface Env {
  DB: D1Database;
}

// GET /api/leads/[id] - Get single lead with activities
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    const env = locals.runtime?.env as Env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();

    if (!lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch activities for this lead
    let activities: any[] = [];
    try {
      const actResult = await env.DB.prepare(
        'SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT 50'
      ).bind(id).all();
      activities = actResult.results || [];
    } catch {
      // Table may not exist yet
    }

    return new Response(JSON.stringify({ lead, activities }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Leads API] Error fetching lead:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/leads/[id] - Update lead
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params;
    const data = await request.json();

    const env = locals.runtime?.env as Env;
    if (!env?.DB) {
      console.log('[Leads API] Would update lead:', id, data);
      return new Response(JSON.stringify({ success: true, lead: { id, ...data } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if lead exists
    const existing = await env.DB.prepare('SELECT id FROM leads WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current lead for change tracking
    const currentLead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first<any>();

    // Build update query dynamically
    const allowedFields = [
      'status', 'lead_score', 'lead_grade', 'notes', 'contacted_at', 'ai_research',
      'priority', 'last_contacted_at', 'next_action', 'next_action_date', 'assigned_to', 'lost_reason',
    ];
    const updates: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auto-set last_contacted_at when moving to 'contacted' stage
    if (data.status === 'contacted' && currentLead?.status !== 'contacted' && !data.last_contacted_at) {
      updates.push('last_contacted_at = CURRENT_TIMESTAMP');
    }

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...values).run();

    // Log stage change as activity
    if (data.status && data.status !== currentLead?.status) {
      try {
        await env.DB.prepare(
          `INSERT INTO lead_activities (lead_id, type, title, description, created_by)
           VALUES (?, 'stage_change', ?, ?, 'admin')`
        ).bind(
          id,
          `Stage: ${currentLead?.status || 'unknown'} → ${data.status}`,
          data.lost_reason ? `Reason: ${data.lost_reason}` : null,
        ).run();
      } catch { /* table may not exist yet */ }

      logActivity(env.DB, {
        type: 'lead_updated',
        detail: `Lead #${id} "${currentLead?.company_name}" moved to ${data.status}`,
      }).catch(() => {});
    }

    // Fetch updated lead
    const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();

    return new Response(JSON.stringify({ success: true, lead }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Leads API] Error updating lead:', error);
    return new Response(JSON.stringify({ error: 'Failed to update lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/leads/[id] - Delete lead
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    const env = locals.runtime?.env as Env;
    if (!env?.DB) {
      console.log('[Leads API] Would delete lead:', id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();

    if (result.meta?.changes === 0) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[Leads API] Lead deleted:', id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Leads API] Error deleting lead:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
