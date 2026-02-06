// Blog Queue Item API
// GET /api/blog/queue/[id] - Get job details
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
      return new Response(JSON.stringify({ job: { id, status: 'pending', progress: 0 } }), {
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
      return new Response(JSON.stringify({ success: true }), {
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

    // Don't delete jobs that are actively processing (unless failed)
    const activeStatuses = ['extracting', 'translating', 'generating', 'researching', 'imaging', 'finalizing'];
    if (activeStatuses.includes(job.status)) {
      return new Response(JSON.stringify({ error: 'Cannot delete a job that is currently processing' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
