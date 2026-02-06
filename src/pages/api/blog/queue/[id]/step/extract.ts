// Step 1: Extract transcript from YouTube video
// POST /api/blog/queue/[id]/step/extract

export const prerender = false;

import type { APIRoute } from 'astro';
import { extractTranscript } from '../../../../../../lib/youtube-to-blog/youtube';
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

    // Update status to extracting
    await updateJobStatus(db, id, 'extracting', 5);

    // Extract transcript
    const result = await extractTranscript(job.youtube_id);

    // Update job with results
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
