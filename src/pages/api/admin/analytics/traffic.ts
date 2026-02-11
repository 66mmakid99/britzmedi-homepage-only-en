// GA4 Traffic Proxy API — Fetches traffic data from SEO Workers
// GET /api/admin/analytics/traffic?days=7

export const prerender = false;

import type { APIRoute } from 'astro';

const DEFAULT_SEO_API = 'https://britzmedi-seo.mmakid.workers.dev/api';
const FETCH_TIMEOUT_MS = 15000;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const baseUrl = env?.SEO_WORKERS_URL || DEFAULT_SEO_API;

    const url = new URL(request.url);
    const days = url.searchParams.get('days') || '7';
    const targetUrl = `${baseUrl}/ga4/traffic?days=${encodeURIComponent(days)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BRITZMEDI-Analytics/1.0',
        },
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn('[Analytics Traffic API] SEO API unreachable:', fetchErr.message);
      return new Response(JSON.stringify({
        data: null,
        connected: false,
        error: 'Analytics API is currently unreachable',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    clearTimeout(timeoutId);

    const data = await response.json();

    return new Response(JSON.stringify({
      data,
      connected: true,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Analytics Traffic API] Error:', error);
    return new Response(JSON.stringify({
      data: null,
      connected: false,
      error: error?.message || 'Failed to fetch traffic data',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
