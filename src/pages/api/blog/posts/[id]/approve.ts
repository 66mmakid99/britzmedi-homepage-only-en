// Approve or reject a blog post (from admin panel)
// POST /api/blog/posts/[id]/approve

export const prerender = false;

import type { APIRoute } from 'astro';
import type { BlogPost } from '../../../../../lib/youtube-to-blog/schemas';
import { publishPost } from '../../../../../lib/youtube-to-blog/publish';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const action = body.action; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action. Use "approve" or "reject".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = (locals as any).runtime;
    const env = runtime?.env;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ success: true, message: `Post ${action}d (dev mode)` }), {
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

    if (action === 'reject') {
      await db.prepare(`
        UPDATE blog_posts SET
          status = 'draft',
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(id).run();

      return new Response(JSON.stringify({
        success: true,
        action,
        new_status: 'draft',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // approve → mark approved, then publish (1-click approve = publish)
    await db.prepare(`
      UPDATE blog_posts SET
        status = 'approved',
        approved_at = datetime('now'),
        approved_by = 'admin',
        approval_token = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    const approvedPost = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(id).first<BlogPost>();
    const publishResult = approvedPost
      ? await publishPost(approvedPost, env)
      : { ok: false, error: 'Post not found after approval' };

    if (!publishResult.ok) {
      // Approved but publish failed — report so caller can retry publish manually.
      return new Response(JSON.stringify({
        success: true,
        action,
        new_status: 'approved',
        published: false,
        publish_error: publishResult.error || 'Publishing failed',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      new_status: 'published',
      published: true,
      commit_sha: publishResult.commit_sha,
      slug: publishResult.slug,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Approve Post] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Action failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
