// Bridge API: Import a blog_posts entry into content_items
// POST /api/admin/content-hub/import-youtube
// Body: { blog_post_id, job_id }

export const prerender = false;

import type { APIRoute } from 'astro';
import { logActivity } from '../../../../lib/activity-log';

interface Env {
  DB: D1Database;
}

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

function countWords(text: string): number {
  if (!text) return 0;
  // Strip HTML tags
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

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
    const { blog_post_id, job_id } = body;

    if (!blog_post_id) {
      return new Response(JSON.stringify({ error: 'blog_post_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the blog post
    const post = await db.prepare(
      `SELECT id, job_id, title, slug, content, excerpt, meta_description,
              keywords, tags, category, featured_image,
              youtube_url, youtube_id, youtube_embed_url, channel_name,
              doctor_name, doctor_title, doctor_credentials, doctor_bio, doctor_image,
              status
       FROM blog_posts WHERE id = ?`
    ).bind(blog_post_id).first<Record<string, any>>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Blog post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate slug and check uniqueness
    let slug = post.slug ? generateSlug(post.slug) : generateSlug(post.title);
    const existing = await db.prepare(
      'SELECT id FROM content_items WHERE slug = ?'
    ).bind(slug).first();

    if (existing) {
      // Append timestamp suffix to make unique
      const suffix = Date.now().toString(36).slice(-4);
      slug = `${slug}-${suffix}`;
    }

    // Calculate word count and read time
    const wordCount = countWords(post.content || '');
    const readTime = estimateReadTime(wordCount);

    // Serialize tags
    const tagsStr = post.tags
      ? (typeof post.tags === 'string' ? post.tags : JSON.stringify(post.tags))
      : null;

    const now = new Date().toISOString();

    const result = await db.prepare(
      `INSERT INTO content_items (
        source_type, source_id, source_url, title, slug, content, excerpt,
        category, tags, featured_image, status, author,
        word_count, estimated_read_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      'youtube',
      blog_post_id,
      post.youtube_url || null,
      (post.title || '').trim(),
      slug,
      post.content || null,
      post.excerpt || post.meta_description || null,
      post.category || 'Medical Aesthetics',
      tagsStr,
      post.featured_image || null,
      'draft',
      post.doctor_name ? `Dr. ${post.doctor_name}` : 'BRITZMEDI Research Team',
      wordCount,
      readTime,
      now,
      now,
    ).run();

    const contentId = result.meta?.last_row_id;

    logActivity(db, {
      type: 'blog_created',
      detail: `YouTube content imported: "${post.title}" (blog_post_id: ${blog_post_id})`,
    }).catch(() => {});

    return new Response(JSON.stringify({
      content_id: contentId,
      slug,
      message: 'YouTube blog post imported to Content Hub successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Import YouTube API] POST error:', error);
    return new Response(JSON.stringify({ error: 'Failed to import YouTube blog post', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
