// Pageview tracking API
// POST /api/analytics/pageview

export const prerender = false;

import type { APIRoute } from 'astro';

const MAX_FIELD_LENGTH = 512;

// Coerce unknown input to a length-capped string; null when not a usable string
function sanitizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.slice(0, MAX_FIELD_LENGTH);
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response('ok', { status: 200 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // Garbage body — ignore silently
      return new Response(null, { status: 204 });
    }

    if (!body || typeof body !== 'object') {
      return new Response(null, { status: 204 });
    }

    const { path: rawPath, referrer: rawReferrer, sessionId: rawSessionId } = body as Record<string, unknown>;

    const path = sanitizeString(rawPath);
    if (!path) {
      // Missing/invalid path — ignore silently
      return new Response(null, { status: 204 });
    }

    const referrer = sanitizeString(rawReferrer) || '';
    const sessionId = sanitizeString(rawSessionId) || '';

    // Skip admin pages and API routes
    if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/keystatic')) {
      return new Response('ok', { status: 200 });
    }

    const country = (request.headers.get('CF-IPCountry') || 'unknown').slice(0, 8);
    const userAgent = request.headers.get('User-Agent') || '';
    const device = /Mobile|Android|iPhone/i.test(userAgent) ? 'mobile' : 'desktop';

    await db.prepare(
      `INSERT INTO page_views (path, referrer, country, device, session_id, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(path, referrer, country, device, sessionId).run();

    return new Response('ok', { status: 200 });
  } catch {
    return new Response('error', { status: 500 });
  }
};
