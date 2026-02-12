// Content Pipeline Logs API
// GET /api/admin/content-pipeline/logs?queue_id=&limit=50

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const queueId = url.searchParams.get('queue_id');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 200);

    let query: string;
    let params: any[];

    if (queueId) {
      query = 'SELECT * FROM pipeline_logs WHERE queue_id = ? ORDER BY created_at DESC LIMIT ?';
      params = [parseInt(queueId), limit];
    } else {
      query = 'SELECT * FROM pipeline_logs ORDER BY created_at DESC LIMIT ?';
      params = [limit];
    }

    const results = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results.results || []), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Logs] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch logs' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
