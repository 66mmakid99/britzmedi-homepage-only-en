// Content Hub news API — returns news items from news.json
// GET /api/admin/content-hub/news

export const prerender = false;

import type { APIRoute } from 'astro';
import newsData from '../../../../data/news.json';

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify(newsData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch news' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
