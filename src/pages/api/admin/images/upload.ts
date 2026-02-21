// Upload image to R2 and record in D1
// POST /api/admin/images/upload
// FormData: file, content_item_id, alt_text, caption, type

export const prerender = false;

import type { APIRoute } from 'astro';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const POST: APIRoute = async ({ request, locals }) => {
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const contentItemId = formData.get('content_item_id') as string | null;
    const altText = (formData.get('alt_text') as string) || '';
    const caption = (formData.get('caption') as string) || '';
    const type = (formData.get('type') as string) || 'inline';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!contentItemId) {
      return new Response(JSON.stringify({ error: 'content_item_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum: 5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate type value
    const validTypes = ['thumbnail', 'inline', 'og', 'hero'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: `Invalid type. Allowed: ${validTypes.join(', ')}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${random}.${ext}`;
    const r2Key = `blog/${contentItemId}/${filename}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await r2.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    // Public URL
    const url = `/api/images/${r2Key}`;

    // Insert into D1
    const result = await db.prepare(
      `INSERT INTO content_images (content_item_id, filename, original_name, alt_text, caption, type, size_bytes, r2_key, url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      parseInt(contentItemId),
      filename,
      file.name,
      altText,
      caption,
      type,
      file.size,
      r2Key,
      url,
    ).run();

    const id = result.meta?.last_row_id;

    return new Response(JSON.stringify({
      success: true,
      id,
      url,
      alt_text: altText,
      filename,
      original_name: file.name,
      size_bytes: file.size,
      type,
      r2_key: r2Key,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Image Upload] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
