// Publish blog post to GitHub (triggers Cloudflare Pages rebuild)
// POST /api/blog/posts/[id]/publish

export const prerender = false;

import type { APIRoute } from 'astro';
import { publishPost } from '../../../../../lib/youtube-to-blog/publish';
import type { BlogPost } from '../../../../../lib/youtube-to-blog/schemas';

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(id).first<BlogPost>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await publishPost(post, env);

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error || 'Publishing failed' }), {
        status: result.status || 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Blog post published! Cloudflare Pages will rebuild automatically.',
      commit_sha: result.commit_sha,
      slug: result.slug,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Publish] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Publishing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
