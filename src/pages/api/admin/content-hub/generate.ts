// Content Hub Generate API - Generate SEO content using Claude AI
// POST /api/admin/content-hub/generate

export const prerender = false;

import type { APIRoute } from 'astro';
import { logActivity } from '../../../../lib/activity-log';
import { generateSEOContent } from '../../../../lib/content-pipeline/content-generator';

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
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

function estimateReadTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
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

    const apiKey = env?.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const {
      keyword,
      title: rawTitle,
      content_type,
      additional_keywords,
      instructions,
      word_count: targetWordCount,
      include_faq,
      tone,
    } = body;

    if (!keyword) {
      return new Response(JSON.stringify({ error: 'keyword is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call the content generator
    const generated = await generateSEOContent(
      apiKey,
      {
        keyword,
        title: rawTitle || keyword,
        content_type: content_type || 'blog',
        additional_keywords: additional_keywords || [],
        instructions: instructions || undefined,
        word_count: targetWordCount || 1500,
        include_faq: include_faq !== false,
        include_schema: true,
        tone: tone || 'professional',
      }
    );

    const title = generated.title || rawTitle || `${keyword} - BRITZMEDI Guide`;
    const slug = generateSlug(generated.slug || title);
    const wordCount = generated.content ? generated.content.split(/\s+/).length : 0;

    // Check slug uniqueness, append suffix if needed
    let finalSlug = slug;
    const existingSlug = await db.prepare(
      'SELECT id FROM content_items WHERE slug = ?'
    ).bind(finalSlug).first();

    if (existingSlug) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    const now = new Date().toISOString();

    // Save generated content to content_items as 'draft'
    const result = await db.prepare(
      `INSERT INTO content_items (
        source_type, title, slug, content, excerpt, category, tags,
        seo_keyword, seo_secondary_keywords, schema_type, faq,
        status, author, word_count, estimated_read_time, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      'seo_brief',
      title,
      finalSlug,
      generated.content || null,
      generated.excerpt || null,
      generated.category || 'medical-devices',
      generated.tags ? JSON.stringify(generated.tags) : null,
      keyword,
      additional_keywords ? JSON.stringify(additional_keywords) : null,
      generated.schemaType || 'Article',
      generated.faq ? JSON.stringify(generated.faq) : null,
      'draft',
      'BRITZMEDI Research Team',
      wordCount,
      estimateReadTime(wordCount),
      now,
      now,
    ).run();

    const contentId = result.meta?.last_row_id;

    logActivity(db, {
      type: 'blog_created',
      detail: `AI-generated content: "${title}" (keyword: ${keyword})`,
    }).catch(() => {});

    return new Response(JSON.stringify({
      content_id: contentId,
      title,
      slug: finalSlug,
      word_count: wordCount,
      message: 'Content generated and saved as draft',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Generate API] Error:', error);

    // Differentiate between generator errors and other errors
    const isGeneratorError = error?.message?.includes('Claude') || error?.message?.includes('API');
    return new Response(JSON.stringify({
      error: isGeneratorError ? 'Content generation failed' : 'Failed to generate content',
      details: error?.message,
    }), {
      status: isGeneratorError ? 502 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
