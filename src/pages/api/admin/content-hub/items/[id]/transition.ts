// Content Hub Item State Transition API
// POST /api/admin/content-hub/items/:id/transition
// Body: { action: 'start_generate' | 'complete_generate' | 'submit_review' | 'approve' | 'reject' | 'publish' | 'archive' }
//
// The 'publish' action performs a REAL publish (GitHub JSON commit + D1 update)
// via the shared lib/content-hub/publish-item.ts — a D1-only status flip here
// caused "ghost published" items that never appeared on the live site.

export const prerender = false;

import type { APIRoute } from 'astro';
import { logActivity } from '../../../../../../lib/activity-log';
import { deleteFileFromGitHub } from '../../../../../../lib/youtube-to-blog/github';
import { publishContentItem, countWords } from '../../../../../../lib/content-hub/publish-item';

interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
}

// Transition rules: action -> { from: requiredCurrentStatus, to: newStatus }
const TRANSITION_RULES: Record<string, { from: string; to: string }> = {
  start_generate:    { from: 'brief',      to: 'generating' },
  complete_generate: { from: 'generating', to: 'draft' },
  move_to_draft:     { from: 'brief',      to: 'draft' },
  back_to_brief:     { from: 'generating', to: 'brief' },
  submit_review:     { from: 'draft',      to: 'review' },
  approve:           { from: 'review',     to: 'approved' },
  reject:            { from: 'review',     to: 'draft' },
  publish:           { from: 'approved',   to: 'published' },
  back_to_draft:     { from: 'approved',   to: 'draft' },
  archive:           { from: 'published',  to: 'archived' },
  unpublish:         { from: 'published',  to: 'draft' },
  reopen:            { from: 'archived',   to: 'draft' },
};

const VALID_ACTIONS = Object.keys(TRANSITION_RULES);

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = params.id;
    const body = await request.json();
    const { action } = body as { action: string };

    if (!action) {
      return new Response(JSON.stringify({ error: 'action is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({
        error: `Invalid action "${action}". Must be one of: ${VALID_ACTIONS.join(', ')}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch current item (full row — publish and revision snapshots need content)
    const item = await db.prepare(
      'SELECT * FROM content_items WHERE id = ?'
    ).bind(id).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rule = TRANSITION_RULES[action];

    // Validate current status matches the required "from" status
    if (item.status !== rule.from) {
      return new Response(JSON.stringify({
        error: `Cannot perform "${action}" on item with status "${item.status}". Required status: "${rule.from}".`,
        currentStatus: item.status,
        requiredStatus: rule.from,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const previousStatus = item.status;
    const newStatus = rule.to;

    const env = runtime?.env as Env | undefined;

    // 'publish' delegates to the shared real-publish path (GitHub commit + D1 + revision).
    // If the commit fails, the item stays 'approved' — never a D1-only "published".
    if (action === 'publish') {
      const githubToken = env?.GITHUB_TOKEN;
      const githubRepo = env?.GITHUB_REPO;

      if (!githubToken || !githubRepo) {
        return new Response(JSON.stringify({
          error: 'GitHub credentials not configured (GITHUB_TOKEN, GITHUB_REPO) — publishing would not reach the live site',
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!item.content || !item.slug) {
        return new Response(JSON.stringify({
          error: `Content item is missing ${!item.content ? 'content' : 'slug'} — cannot publish`,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        // publishContentItem records the 'blog_published' activity itself
        const result = await publishContentItem(db, githubToken, githubRepo, item, body._changed_by || 'admin');

        return new Response(JSON.stringify({
          success: true,
          previousStatus,
          newStatus: 'published',
          action,
          commitSha: result.commitSha,
          htmlUrl: result.htmlUrl,
          message: `Content item published to ${result.filePath}`,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (pubErr: any) {
        console.error('[Content Hub Transition] Publish failed:', pubErr);
        return new Response(JSON.stringify({
          error: 'Publishing did not complete — item status was not updated. Retry publish (a re-run is safe).',
          details: pubErr?.message,
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // When unpublishing or archiving from published, delete the GitHub file FIRST.
    // The UI promises "removed from the live site" — if the delete genuinely fails
    // (a missing file is fine), refuse to flip D1, mirroring the publish invariant.
    if ((action === 'unpublish' || action === 'archive') && item.slug) {
      const githubToken = env?.GITHUB_TOKEN;
      const githubRepo = env?.GITHUB_REPO;
      if (!githubToken || !githubRepo) {
        return new Response(JSON.stringify({
          error: 'GitHub credentials not configured (GITHUB_TOKEN, GITHUB_REPO) — the live blog file could not be removed',
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      try {
        const filePath = `src/content/blog/${item.slug}.json`;
        await deleteFileFromGitHub(githubToken, githubRepo, filePath, `chore: ${action} "${item.title}"`);
      } catch (ghErr: any) {
        console.error(`[Transition] GitHub delete failed: ${ghErr.message}`);
        return new Response(JSON.stringify({
          error: `Could not remove the blog file from GitHub — item remains "${item.status}"`,
          details: ghErr?.message,
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await db.prepare(
      `UPDATE content_items SET status = ?, updated_at = ? WHERE id = ?`
    ).bind(newStatus, now, id).run();

    // Save a revision to track the transition
    try {
      const latestVer = await db.prepare(
        'SELECT MAX(version) as max_ver FROM content_revisions WHERE content_id = ?'
      ).bind(item.id).first<any>();
      const nextVersion = (latestVer?.max_ver || 0) + 1;

      let score: number | null = null;
      if (item.analysis_data) {
        try { score = JSON.parse(item.analysis_data).overall_score || null; } catch {}
      }

      await db.prepare(
        `INSERT INTO content_revisions (content_id, version, content, title, meta_description, faqs, change_summary, word_count, score, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        item.id,
        nextVersion,
        item.content || '',
        item.title,
        item.excerpt || null,
        item.faq || null,
        `Status transition: ${previousStatus} -> ${newStatus} (action: ${action})`,
        countWords(item.content || ''),
        score,
        body._changed_by || 'admin',
      ).run();
    } catch (revErr: any) {
      console.warn('[Content Hub Transition] Failed to save revision:', revErr.message);
    }

    logActivity(db, {
      type: 'content_transition',
      detail: `"${item.title}" ${previousStatus} -> ${newStatus} (${action})`,
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      previousStatus,
      newStatus,
      action,
      message: `Content item transitioned from "${previousStatus}" to "${newStatus}"`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Transition API] Error:', error);
    return new Response(JSON.stringify({ error: 'Transition failed', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
