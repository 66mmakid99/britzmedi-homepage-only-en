import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  DB: D1Database;
}

// GET /api/leads/[id] - Get single lead
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

    return new Response(JSON.stringify({ lead }), {
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

    // Build update query dynamically
    const allowedFields = ['status', 'lead_score', 'lead_grade', 'notes', 'contacted_at', 'ai_research'];
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

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...values).run();

    // Fetch updated lead
    const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();

    console.log('[Leads API] Lead updated:', id);

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
