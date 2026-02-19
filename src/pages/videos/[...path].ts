// R2 proxy for video files uploaded via the Homepage Editor.
// Videos are too large for GitHub commits, so they live in R2 only.
// This route serves them at /videos/* with proper caching and Range request support.

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request, locals }) => {
  const path = params.path;
  if (!path) {
    return new Response('Not found', { status: 404 });
  }

  // Sanitize: only allow alphanumeric, hyphens, dots, underscores
  if (!/^[\w\-.]+$/.test(path)) {
    return new Response('Invalid path', { status: 400 });
  }

  const runtime = (locals as any).runtime;
  const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;

  if (!r2) {
    return new Response('Storage not available', { status: 503 });
  }

  const r2Key = `homepage/videos/${path}`;
  const contentType = path.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';

  // Parse Range header for partial content requests (needed for video playback)
  const rangeHeader = request.headers.get('Range');

  if (rangeHeader) {
    // HEAD-only fetch to get size without streaming the body
    const head = await r2.head(r2Key);
    if (!head) {
      return new Response('Not found', { status: 404 });
    }

    const totalSize = head.size;
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!match) {
      return new Response('Invalid Range', { status: 416 });
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

    if (start >= totalSize || end >= totalSize) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${totalSize}` },
      });
    }

    // Fetch the requested byte range from R2
    const object = await r2.get(r2Key, {
      range: { offset: start, length: end - start + 1 },
    });

    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(object.body as ReadableStream, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  // Full file request (no Range header)
  const object = await r2.get(r2Key);

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(object.size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
