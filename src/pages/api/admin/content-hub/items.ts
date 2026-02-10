// Content Hub Items API - List and create content items
// GET /api/admin/content-hub/items?source_type=seo_brief&status=draft&search=keyword&limit=50&offset=0
// POST /api/admin/content-hub/items - Create new content item

export const prerender = false;

import type { APIRoute } from 'astro';
import { logActivity } from '../../../../lib/activity-log';

interface Env {
  DB: D1Database;
}

const VALID_SOURCE_TYPES = ['youtube', 'file', 'seo_brief', 'manual'];
const VALID_STATUSES = ['brief', 'generating', 'draft', 'review', 'approved', 'published', 'archived'];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const sourceType = url.searchParams.get('source_type');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

    let query = `SELECT id, source_type, source_id, source_url, title, slug, excerpt,
                        category, tags, featured_image, seo_keyword, seo_secondary_keywords,
                        seo_gap_score, seo_target_position, schema_type, status, author,
                        word_count, estimated_read_time, published_at, created_at, updated_at
                 FROM content_items WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM content_items WHERE 1=1';
    const params: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (sourceType) {
      if (!VALID_SOURCE_TYPES.includes(sourceType)) {
        return new Response(JSON.stringify({ error: `Invalid source_type. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      query += ' AND source_type = ?';
      countQuery += ' AND source_type = ?';
      params.push(sourceType);
      countParams.push(sourceType);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      query += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR excerpt LIKE ? OR seo_keyword LIKE ? OR category LIKE ?)';
      countQuery += ' AND (title LIKE ? OR excerpt LIKE ? OR seo_keyword LIKE ? OR category LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
      countParams.push(pattern, pattern, pattern, pattern);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [itemsResult, totalResult] = await Promise.all([
      db.prepare(query).bind(...params).all(),
      db.prepare(countQuery).bind(...countParams).first<{ total: number }>(),
    ]);

    return new Response(JSON.stringify({
      items: itemsResult.results || [],
      total: totalResult?.total || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Items API] GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch content items', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
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
    const {
      source_type,
      title,
      slug: rawSlug,
      content,
      excerpt,
      category,
      tags,
      seo_keyword,
      seo_secondary_keywords,
      seo_gap_score,
      seo_target_position,
      schema_type,
      faq,
      status: rawStatus,
      author,
      source_id,
      source_url,
      featured_image,
      word_count,
      estimated_read_time,
    } = body;

    // Validate required fields
    if (!source_type || !title) {
      return new Response(JSON.stringify({ error: 'source_type and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_SOURCE_TYPES.includes(source_type)) {
      return new Response(JSON.stringify({ error: `Invalid source_type. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const status = rawStatus || 'draft';
    if (!VALID_STATUSES.includes(status)) {
      return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate slug from title if not provided
    const slug = rawSlug ? rawSlug.trim() : generateSlug(title);

    // Check for slug uniqueness
    const existing = await db.prepare(
      'SELECT id FROM content_items WHERE slug = ?'
    ).bind(slug).first();

    if (existing) {
      return new Response(JSON.stringify({ error: `Slug "${slug}" already exists. Please provide a unique slug.` }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Serialize array/object fields to JSON strings
    const tagsStr = tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null;
    const faqStr = faq ? (typeof faq === 'string' ? faq : JSON.stringify(faq)) : null;
    const seoSecondaryStr = seo_secondary_keywords
      ? (typeof seo_secondary_keywords === 'string' ? seo_secondary_keywords : JSON.stringify(seo_secondary_keywords))
      : null;

    const now = new Date().toISOString();

    const result = await db.prepare(
      `INSERT INTO content_items (
        source_type, source_id, source_url, title, slug, content, excerpt,
        category, tags, featured_image, seo_keyword, seo_secondary_keywords,
        seo_gap_score, seo_target_position, schema_type, faq, status, author,
        word_count, estimated_read_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      source_type,
      source_id || null,
      source_url || null,
      title.trim(),
      slug,
      content || null,
      excerpt || null,
      category || null,
      tagsStr,
      featured_image || null,
      seo_keyword || null,
      seoSecondaryStr,
      seo_gap_score ?? null,
      seo_target_position ?? null,
      schema_type || null,
      faqStr,
      status,
      author || 'BRITZMEDI Research Team',
      word_count ?? null,
      estimated_read_time || null,
      now,
      now,
    ).run();

    const insertedId = result.meta?.last_row_id;

    logActivity(db, {
      type: 'blog_created',
      detail: `Content item created: "${title}" (source: ${source_type}, status: ${status})`,
    }).catch(() => {});

    return new Response(JSON.stringify({
      id: insertedId,
      slug,
      message: 'Content item created successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Items API] POST error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create content item', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
