export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const search = url.searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  try {
    let countQuery: string;
    let listQuery: string;
    const bindings: any[] = [];
    const countBindings: any[] = [];

    if (search) {
      countQuery = `SELECT COUNT(*) as total FROM chat_conversations c WHERE EXISTS (SELECT 1 FROM chat_messages m WHERE m.conversation_id = c.id AND m.content LIKE ?)`;
      countBindings.push(`%${search}%`);
      listQuery = `SELECT c.*, (SELECT GROUP_CONCAT(m.content, ' | ') FROM chat_messages m WHERE m.conversation_id = c.id AND m.role = 'user' LIMIT 3) as preview FROM chat_conversations c WHERE EXISTS (SELECT 1 FROM chat_messages m WHERE m.conversation_id = c.id AND m.content LIKE ?) ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?`;
      bindings.push(`%${search}%`, limit, offset);
    } else {
      countQuery = 'SELECT COUNT(*) as total FROM chat_conversations';
      listQuery = `SELECT c.*, (SELECT GROUP_CONCAT(m.content, ' | ') FROM (SELECT content FROM chat_messages m WHERE m.conversation_id = c.id AND m.role = 'user' LIMIT 3) m) as preview FROM chat_conversations c ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);
    }

    const countResult = await db.prepare(countQuery).bind(...countBindings).first<{ total: number }>();
    const total = countResult?.total || 0;

    let stmt = db.prepare(listQuery);
    if (bindings.length) stmt = stmt.bind(...bindings);
    const conversations = await stmt.all();

    // Stats
    const stats = await db.batch([
      db.prepare('SELECT COUNT(*) as total FROM chat_conversations'),
      db.prepare("SELECT COUNT(*) as today FROM chat_conversations WHERE started_at >= date('now')"),
      db.prepare('SELECT AVG(message_count) as avg_messages FROM chat_conversations WHERE message_count > 0'),
      db.prepare('SELECT COUNT(*) as converted FROM chat_conversations WHERE lead_converted = 1'),
    ]);

    return new Response(JSON.stringify({
      conversations: conversations.results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        total: (stats[0].results[0] as any)?.total || 0,
        today: (stats[1].results[0] as any)?.today || 0,
        avgMessages: Math.round(((stats[2].results[0] as any)?.avg_messages || 0) * 10) / 10,
        leadConverted: (stats[3].results[0] as any)?.converted || 0,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ADMIN CHAT] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch conversations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
