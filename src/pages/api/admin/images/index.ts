// List images for a content item
// GET /api/admin/images?content_item_id=123

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentItemId = url.searchParams.get('content_item_id');

    if (!contentItemId) {
      return new Response(JSON.stringify({ error: 'content_item_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await db.prepare(
      `SELECT * FROM content_images WHERE content_item_id = ? ORDER BY position ASC, created_at DESC`
    ).bind(parseInt(contentItemId)).all();

    return new Response(JSON.stringify({ images: results || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Image List] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to list images' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
