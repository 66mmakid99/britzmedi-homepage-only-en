// Quality check API for Content Hub
// GET /api/admin/content-hub/quality-check?id=... (single post)
// GET /api/admin/content-hub/quality-check (all posts)

export const prerender = false;

import type { APIRoute } from 'astro';
import { checkContentQuality } from '../../../../lib/content/quality-checker';

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  meta_description: string | null;
  featured_image: string | null;
  keywords: string | null;
  category: string | null;
  tags: string | null;
  doctor_name: string | null;
  status: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Single post quality check
      const post = await db.prepare(
        `SELECT id, title, slug, content, excerpt, meta_description,
                featured_image, keywords, category, tags, doctor_name, status
         FROM blog_posts WHERE id = ?`
      ).bind(id).first<BlogPostRow>();

      if (!post) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = checkContentQuality(post);
      return new Response(JSON.stringify({ id: post.id, ...result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // All posts quality check
    const posts = await db.prepare(
      `SELECT id, title, slug, content, excerpt, meta_description,
              featured_image, keywords, category, tags, doctor_name, status
       FROM blog_posts ORDER BY created_at DESC`
    ).all<BlogPostRow>();

    const results = (posts.results || []).map(post => {
      const result = checkContentQuality(post);
      return { id: post.id, slug: post.slug, title: post.title, status: post.status, ...result };
    });

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Quality Check API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Quality check failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
