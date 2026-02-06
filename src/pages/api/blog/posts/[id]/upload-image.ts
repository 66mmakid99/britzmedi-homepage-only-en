// Upload custom image for a blog post
// POST /api/blog/posts/[id]/upload-image

export const prerender = false;

import type { APIRoute } from 'astro';
import { uploadToR2, generateImageKey } from '../../../../../lib/youtube-to-blog/images';

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;

    if (!db || !r2) {
      return new Response(JSON.stringify({ error: 'Required services not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const target = formData.get('target') as string || 'featured'; // featured or content

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum 5MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const imageKey = generateImageKey(id, Date.now(), ext);
    const arrayBuffer = await file.arrayBuffer();
    const imageUrl = await uploadToR2(r2, imageKey, arrayBuffer, file.type);

    // Update featured image or doctor image based on target
    if (target === 'featured') {
      await db.prepare(`
        UPDATE blog_posts SET featured_image = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(imageUrl, id).run();
    } else if (target === 'doctor') {
      await db.prepare(`
        UPDATE blog_posts SET doctor_image = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(imageUrl, id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      url: imageUrl,
      target,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Upload Image] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
