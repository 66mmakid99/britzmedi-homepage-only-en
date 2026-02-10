// SEO Progress Proxy API - Fetches progress data from SEO Workers API
// GET /api/admin/content-hub/seo/progress
// GET /api/admin/content-hub/seo/progress?type=weekly
// GET /api/admin/content-hub/seo/progress?type=weekly&week=2026-W07

export const prerender = false;

import type { APIRoute } from 'astro';

const DEFAULT_SEO_API = 'https://britzmedi-seo.mmakid.workers.dev/api';
const FETCH_TIMEOUT_MS = 10000;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const baseUrl = env?.SEO_WORKERS_URL || DEFAULT_SEO_API;

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const week = url.searchParams.get('week');

    // Build target URL
    let targetUrl: string;
    if (type === 'weekly') {
      targetUrl = `${baseUrl}/progress/weekly`;
      if (week) {
        targetUrl += `?week=${encodeURIComponent(week)}`;
      }
    } else {
      targetUrl = `${baseUrl}/progress`;
      if (week) {
        targetUrl += `?week=${encodeURIComponent(week)}`;
      }
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
      console.warn('[SEO Progress API] SEO API unreachable:', fetchErr.message);
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
      console.warn('[SEO Progress API] SEO API returned status:', response.status);
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
    console.error('[SEO Progress API] Error:', error);
    return new Response(JSON.stringify({
      data: null,
      connected: false,
      error: error?.message || 'Failed to fetch SEO progress',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
