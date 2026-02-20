// Pageview tracking API
// POST /api/analytics/pageview

export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response('ok', { status: 200 });
  }

  try {
    const body = await request.json();
    const { path, referrer, sessionId } = body as {
      path?: string;
      referrer?: string;
      sessionId?: string;
    };

    if (!path) {
      return new Response('path required', { status: 400 });
    }

    // Skip admin pages and API routes
    if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/keystatic')) {
      return new Response('ok', { status: 200 });
    }

    const country = request.headers.get('CF-IPCountry') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const device = /Mobile|Android|iPhone/i.test(userAgent) ? 'mobile' : 'desktop';

    await db.prepare(
      `INSERT INTO page_views (path, referrer, country, device, session_id, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(path, referrer || '', country, device, sessionId || '').run();

    return new Response('ok', { status: 200 });
  } catch {
    return new Response('error', { status: 500 });
  }
};
