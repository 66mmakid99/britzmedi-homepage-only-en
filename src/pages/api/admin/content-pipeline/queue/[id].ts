// Content Pipeline Queue Item API
// DELETE /api/admin/content-pipeline/queue/:id - Remove item from queue

export const prerender = false;

import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const queueId = params.id;

    const item = await db.prepare('SELECT id, status FROM content_queue WHERE id = ?').bind(queueId).first<any>();
    if (!item) {
      return new Response(JSON.stringify({ error: 'Queue item not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Don't delete items currently being processed
    if (['researching', 'generating', 'analyzing', 'rewriting'].includes(item.status)) {
      return new Response(JSON.stringify({ error: 'Cannot delete item currently being processed' }), {
        status: 409, headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare('DELETE FROM content_queue WHERE id = ?').bind(queueId).run();

    return new Response(JSON.stringify({ success: true, message: 'Queue item deleted' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Queue Delete] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to delete' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
