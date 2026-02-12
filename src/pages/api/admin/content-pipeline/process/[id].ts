// Content Pipeline Process API
// POST /api/admin/content-pipeline/process/:id - Process a specific queue item

export const prerender = false;

import type { APIRoute } from 'astro';
import { processKeyword } from '../../../../../lib/content-pipeline';

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const apiKey = runtime?.env?.ANTHROPIC_API_KEY as string | undefined;

    if (!db || !apiKey) {
      return new Response(JSON.stringify({ error: 'Required services not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const queueId = parseInt(params.id!);
    if (isNaN(queueId)) {
      return new Response(JSON.stringify({ error: 'Invalid queue ID' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await processKeyword(queueId, { DB: db, ANTHROPIC_API_KEY: apiKey });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Process] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Processing failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
