// Approve or reject a blog post (from admin panel)
// POST /api/blog/posts/[id]/approve

export const prerender = false;

import type { APIRoute } from 'astro';
import type { BlogPost } from '../../../../../lib/youtube-to-blog/schemas';

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
    const db = runtime?.env?.DB as D1Database | undefined;

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

    if (action === 'approve') {
      await db.prepare(`
        UPDATE blog_posts SET
          status = 'approved',
          approved_at = datetime('now'),
          approved_by = 'admin',
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(id).run();
    } else {
      await db.prepare(`
        UPDATE blog_posts SET
          status = 'draft',
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      new_status: action === 'approve' ? 'approved' : 'draft',
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
