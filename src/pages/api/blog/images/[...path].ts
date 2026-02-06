// Serve images from R2 bucket
// GET /api/blog/images/blog/postId/filename.png

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const { path } = params;
  if (!path) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const runtime = (locals as any).runtime;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;

    if (!r2) {
      return new Response('R2 not configured', { status: 503 });
    }

    const object = await r2.get(path);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/png');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body as ReadableStream, { headers });
  } catch (error: any) {
    console.error('[Image Serve] Error:', error);
    return new Response('Failed to serve image', { status: 500 });
  }
};
