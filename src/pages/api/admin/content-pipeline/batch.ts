export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const keywords = body?.keywords;
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return new Response(JSON.stringify({ error: 'keywords array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Validate every item before any DB write: string, or object with string keyword
  for (const kw of keywords) {
    const keyword = typeof kw === 'string' ? kw : (kw && typeof kw === 'object' ? kw.keyword : undefined);
    if (typeof keyword !== 'string' || !keyword.trim()) {
      return new Response(JSON.stringify({ error: 'each item must be a non-empty string or an object with a non-empty string "keyword"' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const ids = [];
    for (const kw of keywords) {
      const isObj = kw !== null && typeof kw === 'object';
      const keyword = typeof kw === 'string' ? kw : kw.keyword;
      const intent = (isObj ? kw.search_intent : null) || 'informational';
      const priority = (isObj ? kw.priority : null) || 5;
      const cat = String((isObj ? kw.category : null) || 'medical-devices').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const result = await db.prepare(
        'INSERT INTO content_queue (keyword, search_intent, priority, category) VALUES (?, ?, ?, ?)'
      ).bind(keyword.trim(), intent, priority, cat).run();
      ids.push(result.meta?.last_row_id);
    }

    return new Response(JSON.stringify({ queued: ids.length, ids }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Batch] POST error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to queue keywords' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
