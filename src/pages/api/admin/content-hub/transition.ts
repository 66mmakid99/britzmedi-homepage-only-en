// Content Hub status transition API
// POST /api/admin/content-hub/transition
// Body: { id, targetStatus, override? }

export const prerender = false;

import type { APIRoute } from 'astro';
import { checkContentQuality } from '../../../../lib/content/quality-checker';
import { deleteFileFromGitHub } from '../../../../lib/youtube-to-blog/github';

// Valid transitions: [currentStatus] -> [allowed target statuses]
const TRANSITIONS: Record<string, string[]> = {
  draft: ['review'],
  review: ['approved', 'draft'],
  approved: ['published', 'draft'],
  published: ['archived', 'draft'],
  archived: ['draft'],
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, targetStatus, override } = body as {
      id: string;
      targetStatus: string;
      override?: boolean;
    };

    if (!id || !targetStatus) {
      return new Response(JSON.stringify({ error: 'id and targetStatus are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch post
    const post = await db.prepare(
      `SELECT id, title, slug, content, excerpt, meta_description,
              featured_image, keywords, category, tags, doctor_name, status
       FROM blog_posts WHERE id = ?`
    ).bind(id).first<any>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate transition
    const allowed = TRANSITIONS[post.status];
    if (!allowed || !allowed.includes(targetStatus)) {
      return new Response(JSON.stringify({
        error: `Cannot transition from "${post.status}" to "${targetStatus}"`,
        allowed: allowed || [],
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Quality gate for "approved" transition
    if (targetStatus === 'approved' && !override) {
      const quality = checkContentQuality(post);
      if (quality.score < 60) {
        return new Response(JSON.stringify({
          error: `Quality score too low (${quality.score}/100). Minimum 60 required.`,
          quality,
          canOverride: true,
        }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle "published" — delegate to existing publish endpoint
    if (targetStatus === 'published') {
      const publishRes = await fetch(new URL(`/api/blog/posts/${id}/publish`, request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok) {
        return new Response(JSON.stringify(publishData), {
          status: publishRes.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({
        success: true,
        message: 'Post published successfully',
        ...publishData,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle "archived" — unpublish from GitHub
    if (targetStatus === 'archived') {
      const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
      const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

      if (githubToken && githubRepo) {
        try {
          await deleteFileFromGitHub(
            githubToken,
            githubRepo,
            `src/content/blog/${post.slug}.json`,
            `chore: archive blog post "${post.title}"`
          );
        } catch (err: any) {
          console.warn('[Transition] GitHub delete warning:', err.message);
          // Continue even if GitHub delete fails (file may not exist)
        }
      }
    }

    // Handle "draft" from "published" — also remove from GitHub
    if (post.status === 'published' && targetStatus === 'draft') {
      const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
      const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

      if (githubToken && githubRepo) {
        try {
          await deleteFileFromGitHub(
            githubToken,
            githubRepo,
            `src/content/blog/${post.slug}.json`,
            `chore: unpublish blog post "${post.title}"`
          );
        } catch (err: any) {
          console.warn('[Transition] GitHub delete warning:', err.message);
        }
      }
    }

    // Update status in D1
    const now = new Date().toISOString();
    await db.prepare(
      `UPDATE blog_posts SET status = ?, updated_at = ? WHERE id = ?`
    ).bind(targetStatus, now, id).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Post moved to "${targetStatus}"`,
      previousStatus: post.status,
      newStatus: targetStatus,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Transition API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Transition failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
