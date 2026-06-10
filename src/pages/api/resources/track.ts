import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  DB: D1Database;
}

const MAX_FIELD_LENGTH = 512;

// Coerce unknown input to a length-capped string; null when not a usable string
function sanitizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.slice(0, MAX_FIELD_LENGTH);
}

// POST /api/resources/track - Track resource download
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    let data: unknown;
    try {
      data = await request.json();
    } catch {
      // Garbage body — ignore silently
      return new Response(null, { status: 204 });
    }

    if (!data || typeof data !== 'object') {
      return new Response(null, { status: 204 });
    }

    const body = data as Record<string, unknown>;
    const resourceId = sanitizeString(body.resource_id);
    const resourceTitle = sanitizeString(body.resource_title);
    const resourceCategory = sanitizeString(body.resource_category);

    // Missing/invalid required fields — ignore silently
    if (!resourceId || !resourceTitle) {
      return new Response(null, { status: 204 });
    }

    // Collect server-side data
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || 'unknown';
    const userAgent = (request.headers.get('User-Agent') || '').slice(0, MAX_FIELD_LENGTH);
    const referer = (request.headers.get('Referer') || '').slice(0, MAX_FIELD_LENGTH);
    const country = (request.headers.get('CF-IPCountry') || '').slice(0, 8);

    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;

    if (!db) {
      // Dev mode - log to console
      console.log('[Resources API] Download tracked (dev):', {
        resource_id: resourceId,
        resource_title: resourceTitle,
        resource_category: resourceCategory,
        ip_address: ip,
        country,
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare(`
      INSERT INTO resource_downloads (
        resource_id, resource_title, resource_category,
        ip_address, user_agent, referer, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      resourceId,
      resourceTitle,
      resourceCategory,
      ip,
      userAgent,
      referer,
      country,
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Resources API] Error tracking download:', error);
    return new Response(JSON.stringify({ error: 'Failed to track download' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
