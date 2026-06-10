// Blog Queue Item API
// GET /api/blog/queue/[id] - Get job details
// PUT /api/blog/queue/[id] - Update job status (client-side error reporting)
// DELETE /api/blog/queue/[id] - Cancel/delete job

export const prerender = false;

import type { APIRoute } from 'astro';
import type { BlogJob } from '../../../../lib/youtube-to-blog/schemas';

interface Env {
  DB: D1Database;
}

// GET /api/blog/queue/[id]
export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'database unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job = await db.prepare('SELECT * FROM blog_jobs WHERE id = ?').bind(id).first<BlogJob>();

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ job }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Queue API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch job', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/blog/queue/[id] - Update job status (for client-side error reporting)
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'database unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only allow setting status to 'failed' or 'pending' (for retry reset)
    const allowedStatuses = ['failed', 'pending'];
    if (!body.status || !allowedStatuses.includes(body.status)) {
      return new Response(JSON.stringify({ error: 'Only "failed" or "pending" status allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const setClauses = ['status = ?', "updated_at = datetime('now')"];
    const values: (string | number | null)[] = [body.status];

    if (body.error_message) {
      setClauses.push('error_message = ?');
      values.push(String(body.error_message).slice(0, 500));
    }

    if (body.status === 'pending') {
      setClauses.push('progress = 0');
      setClauses.push('error_message = NULL');
    }

    values.push(id);
    await db.prepare(`UPDATE blog_jobs SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Queue API] PUT Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update job', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/blog/queue/[id]
export const DELETE: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'database unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job = await db.prepare('SELECT status FROM blog_jobs WHERE id = ?').bind(id).first<BlogJob>();

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Allow deleting jobs in any status (stuck jobs need cleanup too)

    await db.prepare('DELETE FROM blog_jobs WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Queue API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete job', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
