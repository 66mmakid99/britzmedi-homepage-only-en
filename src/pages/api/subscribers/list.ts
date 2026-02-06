// GET /api/subscribers/list
// Admin: return paginated subscriber list with filters

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        subscribers: getSampleSubscribers(),
        total: 3,
        stats: { total: 3, active: 2, pending: 1, unsubscribed: 0 },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const language = url.searchParams.get('language');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM subscribers WHERE 1=1';
    const params: (string | number)[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (language) {
      query += ' AND language = ?';
      params.push(language);
    }
    if (search) {
      query += ' AND (email LIKE ? OR name LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    query += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all();

    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) as total FROM subscribers WHERE 1=1';
    const countParams: (string | number)[] = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (language) {
      countQuery += ' AND language = ?';
      countParams.push(language);
    }
    if (search) {
      countQuery += ' AND (email LIKE ? OR name LIKE ?)';
      const pattern = `%${search}%`;
      countParams.push(pattern, pattern);
    }
    const countResult = await db.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    // Get stats
    const statsResult = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed
      FROM subscribers
    `).first<{ total: number; active: number; pending: number; unsubscribed: number }>();

    return new Response(JSON.stringify({
      subscribers: result.results,
      total: countResult?.total || 0,
      stats: statsResult || { total: 0, active: 0, pending: 0, unsubscribed: 0 },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Subscribers List API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscribers' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function getSampleSubscribers() {
  return [
    {
      id: 1,
      email: 'dr.kim@example-clinic.com',
      name: 'Dr. Kim',
      language: 'ko',
      categories: '["medical-devices"]',
      status: 'active',
      subscribed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    },
    {
      id: 2,
      email: 'sarah@beautyclinic.com',
      name: 'Sarah Johnson',
      language: 'en',
      categories: '["aesthetics","industry-insights"]',
      status: 'active',
      subscribed_at: new Date(Date.now() - 86400000).toISOString(),
      confirmed_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      email: 'tanaka@medical.jp',
      name: 'Tanaka',
      language: 'ja',
      categories: '[]',
      status: 'pending',
      subscribed_at: new Date(Date.now() - 43200000).toISOString(),
      confirmed_at: null,
    },
  ];
}
