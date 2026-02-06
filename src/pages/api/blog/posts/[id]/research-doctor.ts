// Research doctor/expert from video transcript
// POST /api/blog/posts/[id]/research-doctor

export const prerender = false;

import type { APIRoute } from 'astro';
import { researchDoctor } from '../../../../../lib/youtube-to-blog/gemini';
import type { BlogPost, BlogJob } from '../../../../../lib/youtube-to-blog/schemas';

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const geminiKey = runtime?.env?.GEMINI_API_KEY as string | undefined;

    if (!db || !geminiKey) {
      return new Response(JSON.stringify({ error: 'Required services not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(id).first<BlogPost>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get transcript from associated job
    let transcript = '';
    if (post.job_id) {
      const job = await db.prepare('SELECT translated_text, transcript_text FROM blog_jobs WHERE id = ?')
        .bind(post.job_id).first<BlogJob>();
      transcript = job?.translated_text || job?.transcript_text || '';
    }

    if (!transcript) {
      // Fall back to blog content
      transcript = post.content.replace(/<[^>]+>/g, ' ');
    }

    const doctorInfo = await researchDoctor(geminiKey, transcript, post.title);

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
        id
      ).run();
    }

    return new Response(JSON.stringify({
      success: true,
      doctor_found: !!doctorInfo,
      doctor_info: doctorInfo,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Research Doctor] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Research failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
