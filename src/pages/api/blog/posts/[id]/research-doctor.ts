// Research doctor/expert from video transcript
// POST /api/blog/posts/[id]/research-doctor

export const prerender = false;

import type { APIRoute } from 'astro';
import { researchDoctor } from '../../../../../lib/youtube-to-blog/gemini';
import type { DoctorResearchResult } from '../../../../../lib/youtube-to-blog/gemini';
import { uploadToR2, generateImageKey } from '../../../../../lib/youtube-to-blog/images';
import type { BlogPost, BlogJob } from '../../../../../lib/youtube-to-blog/schemas';
import { containsKorean, romanizeName } from '../../../../../lib/youtube-to-blog/name-romanization';

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

    const doctorInfo: DoctorResearchResult | null = await researchDoctor(geminiKey, transcript, post.title);

    if (doctorInfo) {
      let doctorImageUrl: string | null = null;

      // Try to download doctor profile photo to R2
      if (doctorInfo.profileImageUrl) {
        const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;
        if (r2) {
          try {
            const imgRes = await fetch(doctorInfo.profileImageUrl, {
              headers: { 'User-Agent': 'BRITZMEDI-Blog-Publisher' },
            });
            if (imgRes.ok) {
              const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
              const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
              const imageKey = generateImageKey(id, Date.now(), ext);
              const buffer = await imgRes.arrayBuffer();
              doctorImageUrl = await uploadToR2(r2, `doctor-${imageKey}`, buffer, contentType);
            }
          } catch (err) {
            console.warn('[Research Doctor] Failed to download photo:', err);
          }
        }
      }

      // Check name_mappings for verified name override
      if (transcript && containsKorean(transcript)) {
        try {
          const koNameMatch = transcript.match(/[\uAC00-\uD7AF]{2,4}\s*(원장|의사|교수|박사|선생)/);
          if (koNameMatch) {
            const koName = koNameMatch[0].replace(/\s*(원장|의사|교수|박사|선생)/, '');
            const mapping = await romanizeName(db, koName);
            if (mapping.verified) {
              doctorInfo.name = `Dr. ${mapping.nameEn}`;
              doctorInfo.verified = true;
              doctorInfo.verifiedSource = mapping.source;
            }
          }
        } catch (err) {
          console.warn('[Research Doctor] Name mapping lookup failed:', err);
        }
      }

      await db.prepare(`
        UPDATE blog_posts SET
          doctor_name = ?,
          doctor_title = ?,
          doctor_credentials = ?,
          doctor_bio = ?,
          doctor_image = ?,
          doctor_verified = ?,
          doctor_verified_source = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        doctorInfo.name,
        doctorInfo.title,
        doctorInfo.credentials,
        doctorInfo.bio,
        doctorImageUrl,
        doctorInfo.verified ? 1 : 0,
        doctorInfo.verifiedSource,
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
