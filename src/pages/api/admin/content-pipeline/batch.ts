export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

  const { keywords } = await request.json();
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return new Response(JSON.stringify({ error: 'keywords array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const ids = [];
  for (const kw of keywords) {
    const keyword = typeof kw === 'string' ? kw : kw.keyword;
    const intent = (typeof kw === 'object' ? kw.search_intent : null) || 'informational';
    const priority = (typeof kw === 'object' ? kw.priority : null) || 5;
    const result = await db.prepare(
      'INSERT INTO content_queue (keyword, search_intent, priority) VALUES (?, ?, ?)'
    ).bind(keyword.trim(), intent, priority).run();
    ids.push(result.meta?.last_row_id);
  }

  return new Response(JSON.stringify({ queued: ids.length, ids }), {
    status: 201, headers: { 'Content-Type': 'application/json' },
  });
};
