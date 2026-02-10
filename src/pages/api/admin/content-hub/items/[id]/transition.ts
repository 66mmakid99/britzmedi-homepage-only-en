// Content Hub Item State Transition API
// POST /api/admin/content-hub/items/:id/transition
// Body: { action: 'start_generate' | 'complete_generate' | 'submit_review' | 'approve' | 'reject' | 'publish' | 'archive' }

export const prerender = false;

import type { APIRoute } from 'astro';
import { logActivity } from '../../../../../../lib/activity-log';
import { deleteFileFromGitHub, commitFileToGitHub } from '../../../../../../lib/youtube-to-blog/github';

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

    // Fetch current item
    const item = await db.prepare(
      'SELECT id, title, slug, status FROM content_items WHERE id = ?'
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

    // When unpublishing or archiving from published, delete GitHub file
    if ((action === 'unpublish' || action === 'archive') && item.slug) {
      const githubToken = env?.GITHUB_TOKEN;
      const githubRepo = env?.GITHUB_REPO;
      if (githubToken && githubRepo) {
        try {
          const filePath = `src/content/blog/${item.slug}.json`;
          await deleteFileFromGitHub(githubToken, githubRepo, filePath, `chore: ${action} "${item.title}"`);
        } catch (ghErr: any) {
          console.warn(`[Transition] GitHub delete failed (may not exist): ${ghErr.message}`);
        }
      }
    }

    // Build update query
    const updateFields: string[] = ['status = ?', 'updated_at = ?'];
    const updateValues: (string | number | null)[] = [newStatus, now];

    // Set published_at when publishing
    if (action === 'publish') {
      updateFields.push('published_at = ?');
      updateValues.push(now);
    }

    updateValues.push(id!);

    await db.prepare(
      `UPDATE content_items SET ${updateFields.join(', ')} WHERE id = ?`
    ).bind(...updateValues).run();

    // Save a revision to track the transition
    try {
      await db.prepare(
        `INSERT INTO content_revisions (
          content_id, title, content, excerpt, status, changed_by, change_note, created_at
        ) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)`
      ).bind(
        item.id,
        item.title,
        newStatus,
        body._changed_by || 'admin',
        `Status transition: ${previousStatus} -> ${newStatus} (action: ${action})`,
        now,
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
