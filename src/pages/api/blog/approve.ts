// Email token-based approval endpoint
// GET /api/blog/approve?token=xxx&action=approve|reject

export const prerender = false;

import type { APIRoute } from 'astro';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';
import { publishPost } from '../../../lib/youtube-to-blog/publish';

// Approval links expire after 7 days (the approval email promises this).
// send-approval.ts sets updated_at = datetime('now') when issuing the token,
// so updated_at is the token issuance time.
const APPROVAL_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// SQLite datetime('now') is 'YYYY-MM-DD HH:MM:SS' in UTC
function isApprovalTokenExpired(issuedAtRaw: string | null | undefined): boolean {
  if (!issuedAtRaw) return false; // no timestamp — don't brick the flow
  const issuedAt = Date.parse(issuedAtRaw.includes('T') ? issuedAtRaw : `${issuedAtRaw.replace(' ', 'T')}Z`);
  if (Number.isNaN(issuedAt)) return false;
  return Date.now() - issuedAt > APPROVAL_TOKEN_TTL_MS;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const action = url.searchParams.get('action');

  if (!token || !action) {
    return htmlResponse('Missing token or action', 400);
  }

  if (!['approve', 'reject'].includes(action)) {
    return htmlResponse('Invalid action', 400);
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return htmlResponse('Database not available', 503);
    }

    // Find post by approval token
    const post = await db.prepare(
      'SELECT * FROM blog_posts WHERE approval_token = ?'
    ).bind(token).first<BlogPost>();

    if (!post) {
      return htmlResponse('Invalid or expired approval token', 404);
    }

    // Enforce 7-day expiry on the approval token
    if (isApprovalTokenExpired(post.updated_at || post.created_at)) {
      await db.prepare(`
        UPDATE blog_posts SET approval_token = NULL, updated_at = datetime('now') WHERE id = ?
      `).bind(post.id).run().catch(() => {});

      return htmlResponse(`
        <h2 style="color: #dc2626;">Approval Link Expired</h2>
        <p><strong>${post.title}</strong></p>
        <p>This approval link has expired (links are valid for 7 days). Please send a new approval request from the editor.</p>
        <a href="/admin/youtube-to-blog/${post.id}" style="color: #2563eb;">Go to Editor</a>
      `, 410);
    }

    if (action === 'approve') {
      await db.prepare(`
        UPDATE blog_posts SET
          status = 'approved',
          approved_at = datetime('now'),
          approved_by = 'email',
          approval_token = NULL,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(post.id).run();

      // 1-click approve = publish: publish immediately after approving.
      const env = runtime?.env;
      let publishResult;
      try {
        // Re-read so status='approved' passes publishPost's guard.
        const approvedPost = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
          .bind(post.id).first<BlogPost>();
        publishResult = approvedPost ? await publishPost(approvedPost, env) : { ok: false, error: 'Post not found after approval' };
      } catch (pubErr: any) {
        publishResult = { ok: false, error: pubErr?.message || 'Publish failed' };
      }

      if (publishResult.ok) {
        return htmlResponse(`
          <h2 style="color: #16a34a;">Blog Post Approved &amp; Published!</h2>
          <p><strong>${post.title}</strong></p>
          <p>The post has been approved and published. Cloudflare Pages will rebuild automatically.</p>
          <a href="/admin/youtube-to-blog/${post.id}" style="color: #2563eb;">Go to Editor</a>
        `);
      }

      // Approved but publish failed — surface clearly, post stays 'approved' for manual publish.
      return htmlResponse(`
        <h2 style="color: #16a34a;">Blog Post Approved</h2>
        <p><strong>${post.title}</strong></p>
        <p>The post was approved, but automatic publishing failed: ${publishResult.error || 'unknown error'}.</p>
        <p>You can publish it manually from the editor.</p>
        <a href="/admin/youtube-to-blog/${post.id}" style="color: #2563eb;">Go to Editor</a>
      `);
    } else {
      await db.prepare(`
        UPDATE blog_posts SET
          status = 'draft',
          approval_token = NULL,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(post.id).run();

      return htmlResponse(`
        <h2 style="color: #dc2626;">Blog Post Rejected</h2>
        <p><strong>${post.title}</strong></p>
        <p>The post has been moved back to draft status for further editing.</p>
        <a href="/admin/youtube-to-blog/${post.id}" style="color: #2563eb;">Go to Editor</a>
      `);
    }
  } catch (error: any) {
    console.error('[Email Approve] Error:', error);
    return htmlResponse('An error occurred. Please try again.', 500);
  }
};

function htmlResponse(content: string, status = 200): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Approval | BRITZMEDI</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 500px; margin: 80px auto; padding: 20px; text-align: center; }
    h2 { font-size: 24px; }
    p { color: #64748b; line-height: 1.6; }
    a { color: #2563eb; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
