// Admin Blog Posts API - List and manage blog posts with scheduling
// GET /api/admin/blog/posts?status=draft|scheduled|published&search=...

export const prerender = false;

import type { APIRoute } from 'astro';

interface Env {
  DB: D1Database;
}

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string;
  tags: string | null;
  status: string;
  scheduled_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  youtube_url: string | null;
  doctor_name: string | null;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ posts: [], total: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = `SELECT id, title, slug, excerpt, featured_image, category, tags,
                        status, scheduled_date, published_at, created_at, updated_at,
                        youtube_url, doctor_name
                 FROM blog_posts WHERE 1=1`;
    const params: (string | number)[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR excerpt LIKE ? OR slug LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all<BlogPostRow>();

    // Get counts by status
    const countsResult = await db.prepare(
      `SELECT status, COUNT(*) as count FROM blog_posts GROUP BY status`
    ).all<{ status: string; count: number }>();

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of (countsResult.results || [])) {
      counts[row.status] = row.count;
      total += row.count;
    }

    return new Response(JSON.stringify({
      posts: result.results || [],
      total,
      counts,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Admin Blog API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch posts', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
