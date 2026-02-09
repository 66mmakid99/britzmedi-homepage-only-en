export const prerender = false;

import type { APIRoute } from 'astro';
import type { SocialChannel } from '../../../../lib/social/types';
import { getChannelPoster } from '../../../../lib/social/channels';
import { generateContent } from '../../../../lib/social/content-generator';
import { logActivity } from '../../../../lib/activity-log';

const VALID_CHANNELS = ['twitter', 'linkedin', 'facebook', 'instagram'];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      channel: SocialChannel;
      content?: string;
      postId?: string;
      imageUrl?: string;
    };

    const { channel } = body;
    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return new Response(JSON.stringify({ error: `Valid channel required (${VALID_CHANNELS.join(', ')})` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let content = body.content;
    let imageUrl = body.imageUrl || null;

    // If postId provided, generate content from blog post
    if (!content && body.postId) {
      const blogPost = await db.prepare(
        'SELECT id, title, slug, excerpt, category, featured_image, doctor_name FROM blog_posts WHERE id = ?'
      ).bind(body.postId).first<{
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        category: string;
        featured_image: string | null;
        doctor_name: string | null;
      }>();

      if (!blogPost) {
        return new Response(JSON.stringify({ error: 'Blog post not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      content = generateContent(channel, {
        postId: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
        excerpt: blogPost.excerpt || '',
        category: blogPost.category || '',
        featuredImage: blogPost.featured_image,
        doctorName: blogPost.doctor_name,
      });

      // Use blog featured image for Instagram if not explicitly provided
      if (!imageUrl && blogPost.featured_image) {
        imageUrl = blogPost.featured_image;
      }
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content or postId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // Insert pending record
    const insertResult = await db.prepare(`
      INSERT INTO social_posts (post_id, channel, content, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).bind(body.postId || null, channel, content, now, now).run();

    const socialPostId = insertResult.meta.last_row_id;

    // Post to channel (pass metadata with image URL for Instagram)
    const poster = getChannelPoster(channel);
    const metadata = imageUrl ? { imageUrl } : undefined;
    const result = await poster(content, env, metadata);

    if (result.success) {
      await db.prepare(`
        UPDATE social_posts SET status = 'posted', published_at = ?, external_id = ?, updated_at = ?
        WHERE id = ?
      `).bind(now, result.externalId || null, now, socialPostId).run();

      logActivity(db, { type: 'social_posted', detail: `Social post to ${channel}: ${content.slice(0, 80)}...` }).catch(() => {});

      return new Response(JSON.stringify({
        success: true,
        externalId: result.externalId,
        socialPostId,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      await db.prepare(`
        UPDATE social_posts SET status = 'failed', error_message = ?, updated_at = ?
        WHERE id = ?
      `).bind(result.error || 'Post failed', now, socialPostId).run();

      logActivity(db, { type: 'social_failed', detail: `Social post failed on ${channel}: ${result.error}` }).catch(() => {});

      return new Response(JSON.stringify({ error: result.error || 'Post failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('[Social Post API] Error:', error);
    return new Response(JSON.stringify({ error: 'Post failed', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
