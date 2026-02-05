import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  DB: D1Database;
}

// POST /api/resources/track - Track resource download
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.resource_id || !data.resource_title) {
      return new Response(JSON.stringify({ error: 'Missing resource_id or resource_title' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Collect server-side data
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    const country = request.headers.get('CF-IPCountry') || '';

    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;

    if (!db) {
      // Dev mode - log to console
      console.log('[Resources API] Download tracked (dev):', {
        resource_id: data.resource_id,
        resource_title: data.resource_title,
        resource_category: data.resource_category || null,
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
      data.resource_id,
      data.resource_title,
      data.resource_category || null,
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
