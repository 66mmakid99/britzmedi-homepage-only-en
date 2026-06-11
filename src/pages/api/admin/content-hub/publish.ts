// Content Hub Publish API - Publish content item to GitHub (Keystatic blog)
// POST /api/admin/content-hub/publish
// Actual publish logic lives in lib/content-hub/publish-item.ts (shared with the
// kanban transition 'publish' action).

export const prerender = false;

import type { APIRoute } from 'astro';
import { publishContentItem } from '../../../../lib/content-hub/publish-item';

interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const githubToken = env?.GITHUB_TOKEN;
    const githubRepo = env?.GITHUB_REPO;

    if (!githubToken || !githubRepo) {
      return new Response(JSON.stringify({ error: 'GitHub credentials not configured (GITHUB_TOKEN, GITHUB_REPO)' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { content_id } = body;

    if (!content_id) {
      return new Response(JSON.stringify({ error: 'content_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load content item from D1
    const item = await db.prepare(
      'SELECT * FROM content_items WHERE id = ?'
    ).bind(content_id).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only approved, draft, or published (re-publish) items can be published
    if (!['approved', 'draft', 'published'].includes(item.status)) {
      return new Response(JSON.stringify({
        error: `Cannot publish item with status "${item.status}". Must be "approved", "draft", or "published".`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!item.content) {
      return new Response(JSON.stringify({ error: 'Content item has no content to publish' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!item.slug) {
      return new Response(JSON.stringify({ error: 'Content item has no slug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await publishContentItem(db, githubToken, githubRepo, item, body._changed_by || 'admin');

    return new Response(JSON.stringify({
      success: true,
      commitSha: result.commitSha,
      htmlUrl: result.htmlUrl,
      slug: result.slug,
      message: `Content published successfully to ${result.filePath}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Publish API] Error:', error);

    const isGitHubError = error?.message?.includes('GitHub');
    return new Response(JSON.stringify({
      error: isGitHubError ? 'GitHub publishing failed' : 'Failed to publish content',
      details: error?.message,
    }), {
      status: isGitHubError ? 502 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
