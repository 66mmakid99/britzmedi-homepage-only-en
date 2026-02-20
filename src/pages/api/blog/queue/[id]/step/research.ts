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
    const originalTranscript = job.transcript_text || '';
    const anthropicKey = runtime?.env?.ANTHROPIC_API_KEY as string | undefined;
    let doctorInfo: DoctorResearchResult | null = null;

    // Get detected names from translate step
    const detectedNames: { korean: string; romanized: string; title?: string }[] =
      job.detected_names ? JSON.parse(job.detected_names) : [];

    if (geminiKey) {
      doctorInfo = await researchDoctor(
        geminiKey,
        transcript || originalTranscript,
        job.video_title || '',
        undefined
      );
    }

    // Enhanced: Claude web_search for Korean doctor profile
    let doctorProfile: any = null;
    if (detectedNames.length > 0 && anthropicKey) {
      const primaryDoctor = detectedNames[0];
      try {
        const profilePrompt = `Research this Korean medical professional for a blog article. Compile their professional profile.

Name (Korean): ${primaryDoctor.korean}
Name (English): ${primaryDoctor.romanized}
Title: ${primaryDoctor.title || 'Doctor'}
Country: South Korea

Search the web and provide a structured profile. Return JSON only:

{
  "name_english": "${primaryDoctor.romanized}",
  "name_korean": "${primaryDoctor.korean}",
  "verified_english_name": "If you find their official English name on their website/papers, use that instead",
  "credentials": "MD, PhD, Board-certified [specialty], etc.",
  "current_position": "Current role and institution",
  "affiliation": "Hospital/Clinic name",
  "specialty": "Medical specialty",
  "education": ["Medical school", "Residency", "Fellowship if any"],
  "certifications": ["Board certifications"],
  "notable_achievements": ["Key achievements, publications, conference presentations"],
  "profile_summary": "2-3 sentence professional bio suitable for blog article",
  "sources_checked": ["URLs of sources found"],
  "confidence": "high|medium|low",
  "note": "Any caveats about the information found"
}

IMPORTANT:
- If you find their OFFICIAL English name on a hospital website, academic paper, or social media, use that instead of the romanized version
- Do NOT fabricate credentials or achievements
- If you cannot find information, say "Not verified" — do not guess
- Korean academic paper databases: PubMed, KoreaMed, RISS`;

        const profileResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'content-type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            messages: [{ role: 'user', content: profilePrompt }]
          })
        });

        const profileData: any = await profileResponse.json();
        const profileText = profileData.content
          ?.filter((b: any) => b.type === 'text')
          ?.map((b: any) => b.text)
          ?.join('\n') || '';

        const jsonMatch = profileText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          doctorProfile = JSON.parse(jsonMatch[0]);

          // If Claude found verified English name, use it
          if (doctorProfile.verified_english_name &&
              doctorProfile.verified_english_name !== primaryDoctor.romanized &&
              doctorProfile.verified_english_name !== 'Not verified') {
            if (doctorInfo) {
              doctorInfo.name = `Dr. ${doctorProfile.verified_english_name}`;
              doctorInfo.verified = true;
              doctorInfo.verifiedSource = 'claude-web-search';
            }
          }
        }
      } catch (err) {
        console.warn('[Research] Claude doctor profile research failed:', err);
      }
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
      if (containsKorean(originalTranscript)) {
        try {
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

      const doctorNameKorean = detectedNames.length > 0 ? detectedNames[0].korean : null;

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

      // Save doctor profile and Korean name to blog_jobs
      if (doctorProfile || doctorNameKorean) {
        await db.prepare(`
          UPDATE blog_jobs SET
            doctor_profile = ?,
            doctor_name = ?,
            doctor_name_korean = ?
          WHERE id = ?
        `).bind(
          doctorProfile ? JSON.stringify(doctorProfile) : null,
          doctorInfo.name,
          doctorNameKorean,
          id
        ).run();
      }
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
