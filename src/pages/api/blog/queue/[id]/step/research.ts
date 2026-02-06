// Step 4: Research doctor/expert info
// POST /api/blog/queue/[id]/step/research

export const prerender = false;

import type { APIRoute } from 'astro';
import { researchDoctor } from '../../../../../../lib/youtube-to-blog/gemini';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';
import type { BlogPost } from '../../../../../../lib/youtube-to-blog/schemas';

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
    const geminiKey = runtime?.env?.GEMINI_API_KEY as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Dev mode: research step simulated',
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

    await updateJobStatus(db, id, 'researching', 65);

    const transcript = job.translated_text || job.transcript_text || '';
    let doctorInfo = null;

    if (geminiKey) {
      doctorInfo = await researchDoctor(
        geminiKey,
        transcript,
        job.video_title || ''
      );
    }

    // Update blog post with doctor info if found
    if (doctorInfo) {
      await db.prepare(`
        UPDATE blog_posts SET
          doctor_name = ?,
          doctor_title = ?,
          doctor_credentials = ?,
          doctor_bio = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        doctorInfo.name,
        doctorInfo.title,
        doctorInfo.credentials,
        doctorInfo.bio,
        job.blog_post_id
      ).run();
    }

    await updateJobStatus(db, id, 'researching', 75);

    return new Response(JSON.stringify({
      success: true,
      doctor_found: !!doctorInfo,
      doctor_info: doctorInfo,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Research Step] Error:', error);

    // Research is optional - don't fail the entire job
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) {
      await updateJobStatus(db, id, 'researching', 75, {
        error_message: `Research warning: ${error.message}`,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      warning: error.message,
      doctor_found: false,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
