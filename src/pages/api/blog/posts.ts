// Blog Posts API
// GET /api/blog/posts - List all generated blog posts

export const prerender = false;

import type { APIRoute } from 'astro';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';

interface Env {
  DB: D1Database;
}

// GET /api/blog/posts
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ posts: getSamplePosts(), total: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM blog_posts WHERE 1=1';
    const params: (string | number)[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR excerpt LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all<BlogPost>();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM blog_posts WHERE 1=1';
    const countParams: (string | number)[] = [];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (search) {
      countQuery += ' AND (title LIKE ? OR excerpt LIKE ?)';
      const pattern = `%${search}%`;
      countParams.push(pattern, pattern);
    }

    const countResult = await db.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return new Response(JSON.stringify({
      posts: result.results || [],
      total: countResult?.total || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Posts API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch posts', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function getSamplePosts(): Partial<BlogPost>[] {
  return [
    {
      id: 'post-001',
      job_id: 'sample-001',
      title: 'Understanding RF Technology in Modern Aesthetics',
      slug: 'understanding-rf-technology-modern-aesthetics',
      content: '<p>Sample blog post content...</p>',
      excerpt: 'An in-depth look at how RF technology is transforming the aesthetics industry.',
      status: 'draft',
      category: 'medical-devices',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
