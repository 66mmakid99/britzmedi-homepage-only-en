// Step 4: Research doctor/expert info
// POST /api/blog/queue/[id]/step/research

export const prerender = false;

import type { APIRoute } from 'astro';
import { researchDoctor } from '../../../../../../lib/youtube-to-blog/gemini';
import type { DoctorResearchResult } from '../../../../../../lib/youtube-to-blog/gemini';
import { uploadToR2, generateImageKey } from '../../../../../../lib/youtube-to-blog/images';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';
import type { BlogPost } from '../../../../../../lib/youtube-to-blog/schemas';
import { containsKorean, romanizeName } from '../../../../../../lib/youtube-to-blog/name-romanization';

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
    // Also use original transcript for subtitle-based name extraction
    const originalTranscript = job.transcript_text || '';
    let doctorInfo: DoctorResearchResult | null = null;

    if (geminiKey) {
      // Pass both transcripts - original may have "Dr." patterns the translation preserved
      doctorInfo = await researchDoctor(
        geminiKey,
        transcript || originalTranscript,
        job.video_title || '',
        undefined // video description not stored in job
      );
    }

    // Update blog post with doctor info if found
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
              const imageKey = generateImageKey(job.blog_post_id, Date.now(), ext);
              const buffer = await imgRes.arrayBuffer();
              doctorImageUrl = await uploadToR2(r2, `doctor-${imageKey}`, buffer, contentType);
            }
          } catch (err) {
            console.warn('[Research] Failed to download doctor photo:', err);
          }
        }
      }

      // Check name_mappings for verified name override
      const nameWithoutDr = doctorInfo.name.replace(/^Dr\.\s*/, '');
      if (containsKorean(originalTranscript)) {
        try {
          // Extract Korean name from original transcript if present
          const koNameMatch = originalTranscript.match(/[\uAC00-\uD7AF]{2,4}\s*(원장|의사|교수|박사|선생)/);
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
          console.warn('[Research] Name mapping lookup failed:', err);
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
