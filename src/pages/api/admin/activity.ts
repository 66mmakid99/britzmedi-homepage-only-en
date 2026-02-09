import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ activities: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const typeFilter = url.searchParams.get('type');
    const period = url.searchParams.get('period') || 'all';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);

    let dateFilter = '';
    if (period === 'today') {
      dateFilter = "AND created_at >= datetime('now', '-1 day')";
    } else if (period === 'week') {
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    } else if (period === 'month') {
      dateFilter = "AND created_at >= datetime('now', '-30 days')";
    }

    let query = `SELECT id, type, detail, ip, user, created_at FROM activity_log WHERE 1=1 ${dateFilter}`;
    const binds: any[] = [];

    if (typeFilter) {
      query += ' AND type = ?';
      binds.push(typeFilter);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    binds.push(limit);

    const stmt = db.prepare(query);
    const result = await (binds.length > 0 ? stmt.bind(...binds) : stmt).all();

    return new Response(JSON.stringify({ activities: result.results || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Activity API] Error:', err);
    // If table doesn't exist, return empty list gracefully
    if (err.message?.includes('no such table')) {
      return new Response(JSON.stringify({ activities: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
