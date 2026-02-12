// Content Pipeline Queue API
// POST: Add keyword to queue
// GET: List queue items (optional ?status= filter)

export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { keyword, search_intent, priority, target_word_count, scheduled_at } = await request.json();

    if (!keyword) {
      return new Response(JSON.stringify({ error: 'keyword required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      'INSERT INTO content_queue (keyword, search_intent, priority, target_word_count, scheduled_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      keyword,
      search_intent || null,
      priority || 5,
      target_word_count || 2000,
      scheduled_at || null,
    ).run();

    return new Response(JSON.stringify({
      id: result.meta.last_row_id,
      keyword,
      status: 'queued',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Queue] POST error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to add to queue' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

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
    const status = url.searchParams.get('status');

    let query: string;
    let params: any[];

    if (status) {
      query = 'SELECT * FROM content_queue WHERE status = ? ORDER BY priority ASC, created_at ASC';
      params = [status];
    } else {
      query = 'SELECT * FROM content_queue ORDER BY priority ASC, created_at ASC';
      params = [];
    }

    const results = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(results.results || []), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Queue] GET error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch queue' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
