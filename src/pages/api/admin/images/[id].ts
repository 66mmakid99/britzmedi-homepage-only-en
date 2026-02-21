// Delete an image by ID
// DELETE /api/admin/images/:id

export const prerender = false;

import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;

    if (!db || !r2) {
      return new Response(JSON.stringify({ error: 'Storage not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Image ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find the image record
    const image = await db.prepare(
      `SELECT * FROM content_images WHERE id = ?`
    ).bind(parseInt(id)).first();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete from R2
    if (image.r2_key) {
      try {
        await r2.delete(image.r2_key as string);
      } catch (err) {
        console.error('[Image Delete] R2 delete error:', err);
        // Continue to delete DB record even if R2 fails
      }
    }

    // Delete from D1
    await db.prepare(
      `DELETE FROM content_images WHERE id = ?`
    ).bind(parseInt(id)).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Image Delete] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
