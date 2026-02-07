export const prerender = false;

import type { APIRoute } from 'astro';
import type { SocialPost, SocialChannel } from '../../../../../lib/social/types';
import { getChannelPoster } from '../../../../../lib/social/channels';

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await db.prepare('SELECT * FROM social_posts WHERE id = ?')
      .bind(id).first<SocialPost>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Social post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const channel = post.channel as SocialChannel;
    const poster = getChannelPoster(channel);
    const result = await poster(post.content);

    if (result.success) {
      await db.prepare(`
        UPDATE social_posts SET status = 'posted', published_at = ?, external_id = ?, error_message = NULL, updated_at = ?
        WHERE id = ?
      `).bind(now, result.externalId || null, now, id).run();

      return new Response(JSON.stringify({ success: true, externalId: result.externalId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      await db.prepare(`
        UPDATE social_posts SET status = 'failed', error_message = ?, updated_at = ?
        WHERE id = ?
      `).bind(result.error || 'Repost failed', now, id).run();

      return new Response(JSON.stringify({ error: result.error || 'Repost failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('[Social Repost API] Error:', error);
    return new Response(JSON.stringify({ error: 'Repost failed', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
