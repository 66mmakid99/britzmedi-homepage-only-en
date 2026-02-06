// GET /api/subscribers/export
// Admin: return CSV of subscribers

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response('email,name,language,categories,status,subscribed_at,confirmed_at\n', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="subscribers.csv"',
        },
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let query = 'SELECT email, name, language, categories, status, subscribed_at, confirmed_at, unsubscribed_at FROM subscribers';
    const params: string[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY subscribed_at DESC';

    const result = await db.prepare(query).bind(...params).all<{
      email: string;
      name: string | null;
      language: string;
      categories: string;
      status: string;
      subscribed_at: string;
      confirmed_at: string | null;
      unsubscribed_at: string | null;
    }>();

    const header = 'email,name,language,categories,status,subscribed_at,confirmed_at,unsubscribed_at';
    const rows = (result.results || []).map(row => {
      const cats = row.categories ? row.categories.replace(/"/g, '""') : '[]';
      const name = (row.name || '').replace(/"/g, '""');
      return `${row.email},"${name}",${row.language},"${cats}",${row.status},${row.subscribed_at || ''},${row.confirmed_at || ''},${row.unsubscribed_at || ''}`;
    });

    const csv = [header, ...rows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[Subscribers Export API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to export subscribers' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
