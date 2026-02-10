// SEO Discovered Keywords Proxy API - Fetches and manages discovered keywords from SEO Workers API
// GET  /api/admin/content-hub/seo/discovered?status=new&sort=impressions
// POST /api/admin/content-hub/seo/discovered  (body: { id, tier, category, ... })
// PATCH /api/admin/content-hub/seo/discovered (body: { id, status })

export const prerender = false;

import type { APIRoute } from 'astro';

const DEFAULT_SEO_API = 'https://britzmedi-seo.mmakid.workers.dev/api';
const FETCH_TIMEOUT_MS = 10000;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const baseUrl = env?.SEO_WORKERS_URL || DEFAULT_SEO_API;

    const url = new URL(request.url);
    const searchParams = new URLSearchParams();

    // Pass through supported query params
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort');
    if (status) searchParams.set('status', status);
    if (sort) searchParams.set('sort', sort);

    const queryString = searchParams.toString();
    const targetUrl = `${baseUrl}/discovered${queryString ? `?${queryString}` : ''}`;

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
      console.warn('[SEO Discovered API] SEO API unreachable:', fetchErr.message);
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
      console.warn('[SEO Discovered API] SEO API returned status:', response.status);
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
    console.error('[SEO Discovered API] GET error:', error);
    return new Response(JSON.stringify({
      data: null,
      connected: false,
      error: error?.message || 'Failed to fetch discovered keywords',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const baseUrl = env?.SEO_WORKERS_URL || DEFAULT_SEO_API;

    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Discovered keyword ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = `${baseUrl}/discovered/${encodeURIComponent(id)}/add`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'BRITZMEDI-ContentHub/1.0',
        },
        body: JSON.stringify(rest),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn('[SEO Discovered API] SEO API unreachable:', fetchErr.message);
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
      console.warn('[SEO Discovered API] SEO API returned status:', response.status);
      const errorBody = await response.text().catch(() => '');
      return new Response(JSON.stringify({
        data: null,
        connected: false,
        error: `SEO API returned status ${response.status}`,
        details: errorBody || undefined,
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      data,
      connected: true,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[SEO Discovered API] POST error:', error);
    return new Response(JSON.stringify({
      data: null,
      connected: false,
      error: error?.message || 'Failed to add discovered keyword',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const baseUrl = env?.SEO_WORKERS_URL || DEFAULT_SEO_API;

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Discovered keyword ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!status) {
      return new Response(JSON.stringify({
        error: 'Status is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = `${baseUrl}/discovered/${encodeURIComponent(id)}/status`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'BRITZMEDI-ContentHub/1.0',
        },
        body: JSON.stringify({ status }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn('[SEO Discovered API] SEO API unreachable:', fetchErr.message);
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
      console.warn('[SEO Discovered API] SEO API returned status:', response.status);
      const errorBody = await response.text().catch(() => '');
      return new Response(JSON.stringify({
        data: null,
        connected: false,
        error: `SEO API returned status ${response.status}`,
        details: errorBody || undefined,
      }), {
        status: response.status,
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
    console.error('[SEO Discovered API] PATCH error:', error);
    return new Response(JSON.stringify({
      data: null,
      connected: false,
      error: error?.message || 'Failed to update discovered keyword status',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
