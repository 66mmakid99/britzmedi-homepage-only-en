export const prerender = false;

import type { APIRoute } from 'astro';
import type { SocialPost } from '../../../../lib/social/types';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ posts: [], counts: {} }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const channel = url.searchParams.get('channel');
    const status = url.searchParams.get('status');
    const postId = url.searchParams.get('post_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = `
      SELECT sp.*, bp.title as blog_title, bp.slug as blog_slug
      FROM social_posts sp
      LEFT JOIN blog_posts bp ON sp.post_id = bp.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (channel) {
      query += ' AND sp.channel = ?';
      params.push(channel);
    }
    if (status) {
      query += ' AND sp.status = ?';
      params.push(status);
    }
    if (postId) {
      query += ' AND sp.post_id = ?';
      params.push(postId);
    }

    query += ' ORDER BY sp.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all<SocialPost>();

    const counts = await db.prepare(`
      SELECT status, COUNT(*) as count FROM social_posts GROUP BY status
    `).all<{ status: string; count: number }>();

    const total = await db.prepare('SELECT COUNT(*) as count FROM social_posts').first<{ count: number }>();

    return new Response(JSON.stringify({
      posts: result.results || [],
      total: total?.count || 0,
      counts: Object.fromEntries((counts.results || []).map(r => [r.status, r.count])),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Social Posts API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch social posts', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
