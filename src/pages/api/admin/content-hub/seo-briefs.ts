// SEO Briefs Proxy API - Fetches keyword data from SEO Workers API
// GET /api/admin/content-hub/seo-briefs

export const prerender = false;

import type { APIRoute } from 'astro';

const SEO_API_URL = 'https://britzmedi-seo.mmakid.workers.dev/api/keywords';
const FETCH_TIMEOUT_MS = 10000;

export const GET: APIRoute = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(SEO_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BRITZMEDI-ContentHub/1.0',
        },
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);

      // Network error or timeout - return fallback
      console.warn('[SEO Briefs API] SEO API unreachable:', fetchErr.message);
      return new Response(JSON.stringify({
        briefs: [],
        connected: false,
        error: 'SEO API is currently unreachable',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[SEO Briefs API] SEO API returned status:', response.status);
      return new Response(JSON.stringify({
        briefs: [],
        connected: false,
        error: `SEO API returned status ${response.status}`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Normalize response - handle different response shapes from the SEO API
    const briefs = Array.isArray(data) ? data : (data.keywords || data.briefs || data.data || []);

    return new Response(JSON.stringify({
      briefs,
      connected: true,
      total: briefs.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[SEO Briefs API] Error:', error);
    return new Response(JSON.stringify({
      briefs: [],
      connected: false,
      error: error?.message || 'Failed to fetch SEO briefs',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
