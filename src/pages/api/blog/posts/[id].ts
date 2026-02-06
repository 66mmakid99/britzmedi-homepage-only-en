// Blog Post Item API
// GET /api/blog/posts/[id] - Get post details
// PUT /api/blog/posts/[id] - Update post
// DELETE /api/blog/posts/[id] - Delete post

export const prerender = false;

import type { APIRoute } from 'astro';
import { validateUpdatePost, type BlogPost } from '../../../../lib/youtube-to-blog/schemas';

interface Env {
  DB: D1Database;
}

// GET /api/blog/posts/[id]
export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({
        post: {
          id,
          title: 'Sample Post',
          slug: 'sample-post',
          content: '<p>Sample content</p>',
          status: 'draft',
          created_at: new Date().toISOString(),
        },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first<BlogPost>();

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
    console.error('[Blog Post API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch post', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/blog/posts/[id]
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const validation = validateUpdatePost(body);

    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors: validation.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data } = validation;

    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ success: true, post: { id, ...data } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check post exists and fetch current doctor_name + content for sync
    const existing = await db.prepare('SELECT id, doctor_name, content FROM blog_posts WHERE id = ?').bind(id).first<{ id: string; doctor_name: string | null; content: string | null }>();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Doctor name sync: if name changed, replace old name in content body
    let contentOverride = data.content;
    if (
      data.doctor_name &&
      existing.doctor_name &&
      data.doctor_name !== existing.doctor_name
    ) {
      const currentContent = data.content || existing.content;
      if (currentContent) {
        contentOverride = currentContent.replaceAll(existing.doctor_name, data.doctor_name);
      }
    }

    // Build dynamic UPDATE
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    const fields: [string, unknown][] = [
      ['title', data.title],
      ['content', contentOverride],
      ['excerpt', data.excerpt],
      ['meta_description', data.meta_description],
      ['keywords', data.keywords ? JSON.stringify(data.keywords) : undefined],
      ['featured_image', data.featured_image],
      ['category', data.category],
      ['tags', data.tags ? JSON.stringify(data.tags) : undefined],
      ['doctor_name', data.doctor_name],
      ['doctor_title', data.doctor_title],
      ['doctor_credentials', data.doctor_credentials],
      ['doctor_image', data.doctor_image],
      ['doctor_bio', data.doctor_bio],
      ['doctor_verified', (body as any).doctor_verified !== undefined ? ((body as any).doctor_verified ? 1 : 0) : undefined],
      ['doctor_verified_source', (body as any).doctor_verified_source],
      ['status', data.status],
    ];

    for (const [key, value] of fields) {
      if (value !== undefined) {
        setClauses.push(`${key} = ?`);
        values.push(value as string | number | null);
      }
    }

    if (setClauses.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    setClauses.push("updated_at = datetime('now')");
    values.push(id);

    await db.prepare(`UPDATE blog_posts SET ${setClauses.join(', ')} WHERE id = ?`).bind(...values).run();

    const updated = await db.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first<BlogPost>();

    return new Response(JSON.stringify({ success: true, post: updated }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Post API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update post', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/blog/posts/[id]
export const DELETE: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await db.prepare('SELECT status FROM blog_posts WHERE id = ?').bind(id).first<BlogPost>();
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (post.status === 'published') {
      return new Response(JSON.stringify({ error: 'Cannot delete a published post. Unpublish it first.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare('DELETE FROM blog_posts WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Post API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete post', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
