// Step 1: Extract transcript from YouTube video
// POST /api/blog/queue/[id]/step/extract

export const prerender = false;

import type { APIRoute } from 'astro';
import { extractTranscript } from '../../../../../../lib/youtube-to-blog/youtube';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';

export const POST: APIRoute = async ({ params, locals, request }) => {
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
        message: 'Dev mode: extract step simulated',
        transcript_preview: 'Sample transcript text for development...',
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

    // Check for manual transcript (fallback when bot detection blocks server)
    let body: any = {};
    try {
      body = await request.json();
    } catch { /* no body or invalid JSON — proceed with auto-extract */ }

    await updateJobStatus(db, id, 'extracting', 5);

    if (body?.manual_transcript) {
      // Manual paste mode: user provided transcript from browser
      const transcript = body.manual_transcript.trim();
      if (transcript.length < 50) {
        return new Response(JSON.stringify({ error: 'Transcript too short (min 50 chars)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await updateJobStatus(db, id, 'extracting', 20, {
        transcript_text: transcript,
        transcript_lang: body.language || 'en',
        video_title: body.video_title || job.youtube_id,
        channel_name: body.channel_name || 'Unknown',
        channel_id: null,
      });

      return new Response(JSON.stringify({
        success: true,
        language: body.language || 'en',
        transcript_length: transcript.length,
        video_title: body.video_title || job.youtube_id,
        channel_name: body.channel_name || 'Unknown',
        manual: true,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auto-extract transcript from YouTube
    const result = await extractTranscript(job.youtube_id);

    await updateJobStatus(db, id, 'extracting', 20, {
      transcript_text: result.transcript,
      transcript_lang: result.language,
      video_title: result.metadata.title,
      channel_name: result.metadata.channelName,
      channel_id: result.metadata.channelId || null,
    });

    return new Response(JSON.stringify({
      success: true,
      language: result.language,
      transcript_length: result.transcript.length,
      video_title: result.metadata.title,
      channel_name: result.metadata.channelName,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Extract Step] Error:', error);

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) await failJob(db, id, error.message || 'Transcript extraction failed');

    return new Response(JSON.stringify({ error: error.message || 'Extraction failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
