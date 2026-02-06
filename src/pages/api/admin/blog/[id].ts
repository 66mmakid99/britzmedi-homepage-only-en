// Admin Blog Post API - Get, update, or delete a single blog post
// GET /api/admin/blog/:id - Get post details
// PATCH /api/admin/blog/:id - Update post (status, schedule, etc.)
// DELETE /api/admin/blog/:id - Delete post

export const prerender = false;

import type { APIRoute } from 'astro';

interface Env {
  DB: D1Database;
}

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

    const post = await db.prepare(
      'SELECT * FROM blog_posts WHERE id = ?'
    ).bind(params.id).first();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ post }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Admin Blog API] GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch post', details: error?.message }), {
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

    const body = await request.json();
    const now = new Date().toISOString();

    // Build dynamic UPDATE query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.status !== undefined) {
      const validStatuses = ['draft', 'review', 'approved', 'scheduled', 'published', 'unpublished'];
      if (!validStatuses.includes(body.status)) {
        return new Response(JSON.stringify({ error: 'Invalid status value' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      updates.push('status = ?');
      values.push(body.status);

      // Auto-set published_at when publishing
      if (body.status === 'published' && !body.published_at) {
        updates.push('published_at = ?');
        values.push(now);
      }
    }

    if (body.scheduled_date !== undefined) {
      updates.push('scheduled_date = ?');
      values.push(body.scheduled_date);
    }

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }

    if (body.content !== undefined) {
      updates.push('content = ?');
      values.push(body.content);
    }

    if (body.excerpt !== undefined) {
      updates.push('excerpt = ?');
      values.push(body.excerpt);
    }

    if (body.meta_description !== undefined) {
      updates.push('meta_description = ?');
      values.push(body.meta_description);
    }

    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category);
    }

    if (body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags));
    }

    if (body.featured_image !== undefined) {
      updates.push('featured_image = ?');
      values.push(body.featured_image);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(params.id!);

    await db.prepare(
      `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    // Fetch updated post
    const post = await db.prepare(
      'SELECT * FROM blog_posts WHERE id = ?'
    ).bind(params.id).first();

    return new Response(JSON.stringify({ post }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Admin Blog API] PATCH error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update post', details: error?.message }), {
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

    await db.prepare('DELETE FROM blog_posts WHERE id = ?').bind(params.id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Admin Blog API] DELETE error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete post', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
