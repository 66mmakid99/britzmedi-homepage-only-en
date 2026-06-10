// Blog Queue API
// POST /api/blog/queue - Create new blog generation job
// GET /api/blog/queue - List all jobs

export const prerender = false;

import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import {
  validateCreateJob,
  extractYouTubeId,
  type BlogJob,
} from '../../../lib/youtube-to-blog/schemas';

interface Env {
  DB: D1Database;
}

// GET /api/blog/queue
export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'database unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      'SELECT * FROM blog_jobs ORDER BY created_at DESC LIMIT 50'
    ).all<BlogJob>();

    return new Response(JSON.stringify({ jobs: result.results || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Queue API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch jobs', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/blog/queue
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validation = validateCreateJob(body);

    if (!validation.valid) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors: validation.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data } = validation;
    const youtubeId = extractYouTubeId(data.youtube_url);

    if (!youtubeId) {
      return new Response(JSON.stringify({ error: 'Could not extract YouTube video ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = nanoid(12);

    const runtime = (locals as any).runtime;
    const db = (runtime?.env as Env | undefined)?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'database unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auto-fail stale jobs stuck for 30+ minutes
    await db.prepare(`
      UPDATE blog_jobs SET status = 'failed', error_message = 'Auto-cleanup: stuck for 30+ minutes', updated_at = datetime('now')
      WHERE youtube_id = ? AND status NOT IN ('completed', 'failed', 'pending')
      AND updated_at < datetime('now', '-30 minutes')
    `).bind(youtubeId).run();

    // Check if video already has a job
    const existing = await db.prepare(
      'SELECT id, status FROM blog_jobs WHERE youtube_id = ? AND status NOT IN (?, ?)'
    ).bind(youtubeId, 'failed', 'completed').first();

    if (existing) {
      return new Response(JSON.stringify({
        error: 'A job already exists for this video',
        existing_job_id: (existing as any).id,
        existing_status: (existing as any).status,
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare(`
      INSERT INTO blog_jobs (id, youtube_url, youtube_id, status, progress, target_lang, tone, word_count)
      VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)
    `).bind(id, data.youtube_url, youtubeId, data.target_lang, data.tone, data.word_count).run();

    const job = await db.prepare('SELECT * FROM blog_jobs WHERE id = ?').bind(id).first<BlogJob>();

    return new Response(JSON.stringify({ success: true, job }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Blog Queue API] Error creating job:', error);
    return new Response(JSON.stringify({ error: 'Failed to create job', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
