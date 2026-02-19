// Content Revisions API - List and create revisions for a content item
// GET /api/admin/content-hub/items/:id/revisions - List revisions
// POST /api/admin/content-hub/items/:id/revisions - Save current state as revision

export const prerender = false;

import type { APIRoute } from 'astro';
import { countWords } from '../../../../../../lib/claude-api';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentId = params.id;

    const revisions = await db.prepare(
      `SELECT id, version, content, title, meta_description, faqs, change_summary, word_count, score, created_by, created_at
       FROM content_revisions
       WHERE content_id = ?
       ORDER BY version DESC`
    ).bind(contentId).all();

    return new Response(JSON.stringify({
      content_id: contentId,
      revisions: revisions.results || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Revisions API] GET error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch revisions' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentId = params.id;

    // Fetch current content item
    const item = await db.prepare(
      'SELECT id, title, content, excerpt, faq, analysis_data FROM content_items WHERE id = ?'
    ).bind(contentId).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const changeSummary = body.change_summary || 'Manual save';

    // Get latest version number
    const latest = await db.prepare(
      'SELECT MAX(version) as max_ver FROM content_revisions WHERE content_id = ?'
    ).bind(contentId).first<any>();
    const nextVersion = (latest?.max_ver || 0) + 1;

    // Extract score from analysis data
    let score: number | null = null;
    if (item.analysis_data) {
      try {
        const analysis = JSON.parse(item.analysis_data);
        score = analysis.overall_score || null;
      } catch { /* ignore */ }
    }

    const wc = countWords(item.content || '');

    const result = await db.prepare(
      `INSERT INTO content_revisions (content_id, version, content, title, meta_description, faqs, change_summary, word_count, score, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      contentId,
      nextVersion,
      item.content || '',
      item.title,
      item.excerpt || null,
      item.faq || null,
      changeSummary,
      wc,
      score,
      'admin',
    ).run();

    return new Response(JSON.stringify({
      id: result.meta?.last_row_id,
      version: nextVersion,
      change_summary: changeSummary,
      word_count: wc,
      score,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Revisions API] POST error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to save revision' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
