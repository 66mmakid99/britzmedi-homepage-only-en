// Step 6: Finalize job
// POST /api/blog/queue/[id]/step/finalize

export const prerender = false;

import type { APIRoute } from 'astro';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Dev mode: finalize step simulated',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job = await getJob(db, id);
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!job.blog_post_id) {
      return new Response(JSON.stringify({ error: 'Blog post not generated yet' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update blog post status to review
    await db.prepare(`
      UPDATE blog_posts SET status = 'review', updated_at = datetime('now')
      WHERE id = ?
    `).bind(job.blog_post_id).run();

    // Also track in youtube_videos table if not already there
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO youtube_videos (id, youtube_id, channel_id, title, job_id, blog_post_id, processed)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).bind(
        job.id, // reuse job id
        job.youtube_id,
        job.channel_id || null,
        job.video_title || null,
        job.id,
        job.blog_post_id
      ).run();
    } catch {
      // Non-critical
    }

    // Mark job as completed
    await updateJobStatus(db, id, 'completed', 100);

    return new Response(JSON.stringify({
      success: true,
      blog_post_id: job.blog_post_id,
      status: 'completed',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Finalize Step] Error:', error);

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) await failJob(db, id, error.message || 'Finalization failed');

    return new Response(JSON.stringify({ error: error.message || 'Finalization failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
