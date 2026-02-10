// Content Hub Single Item API - Get, update, or delete a content item
// GET /api/admin/content-hub/items/:id - Get item details
// PATCH /api/admin/content-hub/items/:id - Update item fields (saves revision)
// DELETE /api/admin/content-hub/items/:id - Delete item

export const prerender = false;

import type { APIRoute } from 'astro';
import { logActivity } from '../../../../../lib/activity-log';
import { deleteFileFromGitHub } from '../../../../../lib/youtube-to-blog/github';

interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
}

const VALID_STATUSES = ['brief', 'generating', 'draft', 'review', 'approved', 'published', 'archived'];

// Fields that are allowed to be updated via PATCH
const UPDATABLE_FIELDS = [
  'title', 'slug', 'content', 'excerpt', 'category', 'tags',
  'featured_image', 'seo_keyword', 'seo_secondary_keywords',
  'seo_gap_score', 'seo_target_position', 'schema_type', 'faq',
  'status', 'author', 'word_count', 'estimated_read_time',
  'source_type', 'source_id', 'source_url',
];

// Fields that store JSON strings and may be passed as objects/arrays
const JSON_FIELDS = ['tags', 'faq', 'seo_secondary_keywords'];

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const item = await db.prepare(
      'SELECT * FROM content_items WHERE id = ?'
    ).bind(params.id).first();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ item }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Item API] GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch content item', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    // Fetch current item for revision snapshot
    const currentItem = await db.prepare(
      'SELECT * FROM content_items WHERE id = ?'
    ).bind(id).first<any>();

    if (!currentItem) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Validate status if being changed
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check slug uniqueness if being changed
    if (body.slug !== undefined && body.slug !== currentItem.slug) {
      const existing = await db.prepare(
        'SELECT id FROM content_items WHERE slug = ? AND id != ?'
      ).bind(body.slug, id).first();

      if (existing) {
        return new Response(JSON.stringify({ error: `Slug "${body.slug}" already exists` }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    for (const field of UPDATABLE_FIELDS) {
      if (body[field] !== undefined) {
        let value = body[field];

        // Serialize JSON fields
        if (JSON_FIELDS.includes(field) && value !== null && typeof value !== 'string') {
          value = JSON.stringify(value);
        }

        updates.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id!);

    // Save revision before updating
    try {
      await db.prepare(
        `INSERT INTO content_revisions (
          content_id, title, content, excerpt, status, changed_by, change_note, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        currentItem.id,
        currentItem.title,
        currentItem.content || null,
        currentItem.excerpt || null,
        currentItem.status,
        body._changed_by || 'admin',
        body._change_note || 'Content updated',
        now,
      ).run();
    } catch (revErr: any) {
      console.warn('[Content Hub Item API] Failed to save revision:', revErr.message);
      // Continue with update even if revision fails
    }

    // Perform update
    await db.prepare(
      `UPDATE content_items SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // Fetch updated item
    const updatedItem = await db.prepare(
      'SELECT * FROM content_items WHERE id = ?'
    ).bind(id).first();

    logActivity(db, {
      type: 'content_transition',
      detail: `Content item #${id} "${currentItem.title}" updated`,
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      message: 'Content item updated successfully',
      item: updatedItem,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Item API] PATCH error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update content item', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Verify item exists
    const item = await db.prepare(
      'SELECT id, title, slug, status FROM content_items WHERE id = ?'
    ).bind(id).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If published/archived and has a slug, delete the GitHub file
    if (['published', 'archived'].includes(item.status) && item.slug) {
      const env = runtime?.env as Env | undefined;
      const githubToken = env?.GITHUB_TOKEN;
      const githubRepo = env?.GITHUB_REPO;
      if (githubToken && githubRepo) {
        try {
          const filePath = `src/content/blog/${item.slug}.json`;
          await deleteFileFromGitHub(githubToken, githubRepo, filePath, `chore: delete "${item.title}"`);
        } catch (ghErr: any) {
          console.warn(`[Delete] GitHub file removal failed (may not exist): ${ghErr.message}`);
        }
      }
    }

    // Delete revisions first, then the item
    await db.batch([
      db.prepare('DELETE FROM content_revisions WHERE content_id = ?').bind(id),
      db.prepare('DELETE FROM content_items WHERE id = ?').bind(id),
    ]);

    logActivity(db, {
      type: 'content_transition',
      detail: `Content item #${id} "${item.title}" deleted`,
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      message: 'Content item deleted successfully',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Item API] DELETE error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete content item', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
