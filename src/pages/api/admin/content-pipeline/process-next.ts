// Content Pipeline Process Next API
// POST /api/admin/content-pipeline/process-next - Process next queued item

export const prerender = false;

import type { APIRoute } from 'astro';
import { processKeyword } from '../../../../lib/content-pipeline';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const apiKey = runtime?.env?.ANTHROPIC_API_KEY as string | undefined;

    if (!db || !apiKey) {
      return new Response(JSON.stringify({ error: 'Required services not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const next = await db.prepare(
      "SELECT * FROM content_queue WHERE status = 'queued' ORDER BY priority ASC, created_at ASC LIMIT 1"
    ).first<any>();

    if (!next) {
      return new Response(JSON.stringify({ message: 'No items in queue' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await processKeyword(next.id, { DB: db, ANTHROPIC_API_KEY: apiKey });

    return new Response(JSON.stringify({ success: true, queue_id: next.id, ...result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Process Next] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Processing failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
