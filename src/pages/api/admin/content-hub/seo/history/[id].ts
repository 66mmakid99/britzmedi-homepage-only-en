// SEO Keyword History Proxy API - Fetches keyword ranking history from SEO Workers API
// GET /api/admin/content-hub/seo/history/:id
// GET /api/admin/content-hub/seo/history/:id?limit=12

export const prerender = false;

import type { APIRoute } from 'astro';

const DEFAULT_SEO_API = 'https://britzmedi-seo.mmakid.workers.dev/api';
const FETCH_TIMEOUT_MS = 10000;

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const baseUrl = env?.SEO_WORKERS_URL || DEFAULT_SEO_API;

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({
        data: null,
        error: 'Keyword ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');

    // Build target URL
    let targetUrl = `${baseUrl}/keywords/${encodeURIComponent(id)}/history`;
    if (limit) {
      targetUrl += `?limit=${encodeURIComponent(limit)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BRITZMEDI-ContentHub/1.0',
        },
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn('[SEO History API] SEO API unreachable:', fetchErr.message);
      return new Response(JSON.stringify({
        data: null,
        connected: false,
        error: 'SEO API is currently unreachable',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[SEO History API] SEO API returned status:', response.status);
      return new Response(JSON.stringify({
        data: null,
        connected: false,
        error: `SEO API returned status ${response.status}`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      data,
      connected: true,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[SEO History API] Error:', error);
    return new Response(JSON.stringify({
      data: null,
      connected: false,
      error: error?.message || 'Failed to fetch keyword history',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
