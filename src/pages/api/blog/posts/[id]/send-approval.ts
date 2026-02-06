// Send approval email for a blog post
// POST /api/blog/posts/[id]/send-approval

export const prerender = false;

import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { sendApprovalEmail } from '../../../../../lib/youtube-to-blog/email';
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
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const resendKey = runtime?.env?.RESEND_API_KEY as string | undefined;
    const adminEmail = runtime?.env?.ADMIN_EMAIL as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!resendKey || !adminEmail) {
      return new Response(JSON.stringify({ error: 'Email configuration missing (RESEND_API_KEY, ADMIN_EMAIL)' }), {
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

    // Generate approval token
    const approvalToken = nanoid(32);

    // Save token to post
    await db.prepare(`
      UPDATE blog_posts SET
        approval_token = ?,
        status = 'review',
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(approvalToken, id).run();

    // Determine base URL
    const baseUrl = new URL(request.url).origin;

    // Send email
    const sent = await sendApprovalEmail(
      resendKey,
      adminEmail,
      {
        id,
        title: post.title,
        excerpt: post.excerpt || '',
        featured_image: post.featured_image || undefined,
      },
      approvalToken,
      baseUrl
    );

    if (!sent) {
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Approval email sent to ${adminEmail}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Send Approval] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send approval' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
