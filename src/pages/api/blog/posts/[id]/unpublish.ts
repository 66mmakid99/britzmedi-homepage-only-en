// Unpublish blog post (remove from GitHub)
// POST /api/blog/posts/[id]/unpublish

export const prerender = false;

import type { APIRoute } from 'astro';
import { deleteFileFromGitHub } from '../../../../../lib/youtube-to-blog/github';
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
    const db = runtime?.env?.DB as D1Database | undefined;
    const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
    const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

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

    if (post.status !== 'published') {
      return new Response(JSON.stringify({ error: 'Post is not published' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Remove from GitHub
    if (githubToken && githubRepo) {
      try {
        await deleteFileFromGitHub(
          githubToken,
          githubRepo,
          `src/content/blog/${post.slug}.json`,
          `chore: unpublish blog post "${post.title}"`
        );
      } catch (err) {
        console.error('[Unpublish] GitHub delete failed:', err);
        // Continue - maybe file was already removed
      }
    }

    // Update database
    await db.prepare(`
      UPDATE blog_posts SET
        status = 'unpublished',
        github_commit_sha = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Blog post unpublished. Site will rebuild automatically.',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Unpublish] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unpublishing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
