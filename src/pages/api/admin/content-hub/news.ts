// Content Hub news API
// GET /api/admin/content-hub/news
// The public /news section and its news.json were removed; this endpoint now
// returns an empty list so existing Content Hub / Social consumers keep working.

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' },
  });
};
