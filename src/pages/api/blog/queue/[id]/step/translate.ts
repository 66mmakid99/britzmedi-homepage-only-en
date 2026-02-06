// Step 2: Translate transcript to English
// POST /api/blog/queue/[id]/step/translate

export const prerender = false;

import type { APIRoute } from 'astro';
import { translateTranscript } from '../../../../../../lib/youtube-to-blog/gemini';
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
    const geminiKey = runtime?.env?.GEMINI_API_KEY as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Dev mode: translate step simulated',
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

    if (!job.transcript_text) {
      return new Response(JSON.stringify({ error: 'No transcript available. Run extract step first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateJobStatus(db, id, 'translating', 25);

    let translatedText: string;

    if (job.transcript_lang === 'en') {
      // Already in English, just clean it up
      translatedText = job.transcript_text;
    } else {
      if (!geminiKey) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      translatedText = await translateTranscript(
        geminiKey,
        job.transcript_text,
        job.transcript_lang || 'unknown'
      );
    }

    await updateJobStatus(db, id, 'translating', 40, {
      translated_text: translatedText,
    });

    return new Response(JSON.stringify({
      success: true,
      original_lang: job.transcript_lang,
      translated_length: translatedText.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Translate Step] Error:', error);

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) await failJob(db, id, error.message || 'Translation failed');

    return new Response(JSON.stringify({ error: error.message || 'Translation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
