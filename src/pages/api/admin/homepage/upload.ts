import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const ALLOWED_VIDEO_TYPES = ['video/mp4'];

export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth check
  const session = cookies.get('admin_session')?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mediaType = formData.get('type') as string | null; // 'image' | 'video' | 'poster'
    const target = (formData.get('target') as string) || 'hero'; // 'hero' | 'product'
    const productId = formData.get('productId') as string | null;

    if (!file || !mediaType) {
      return new Response(JSON.stringify({ error: 'Missing file or type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate media type
    const isVideo = mediaType === 'video';
    const allowedTypes = isVideo ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return new Response(JSON.stringify({
        error: `File too large. Maximum: ${maxMB}MB`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine save path based on target
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'webp');
    const timestamp = Date.now();

    let saveDir: string;
    let urlPath: string;
    let safeName: string;

    if (target === 'product' && productId) {
      // Product images: save as {productId}.webp
      const safeId = productId.replace(/[^a-z0-9-]/gi, '');
      safeName = `${safeId}.${ext}`;
      saveDir = path.join(PUBLIC_DIR, 'images', 'products');
      urlPath = `/images/products/${safeName}`;
    } else if (isVideo) {
      safeName = `hero-video-${timestamp}.${ext}`;
      saveDir = path.join(PUBLIC_DIR, 'videos');
      urlPath = `/videos/${safeName}`;
    } else {
      safeName = `hero-${mediaType}-${timestamp}.${ext}`;
      saveDir = path.join(PUBLIC_DIR, 'images', 'hero');
      urlPath = `/images/hero/${safeName}`;
    }

    // Ensure directory exists
    fs.mkdirSync(saveDir, { recursive: true });

    // Write file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(path.join(saveDir, safeName), buffer);

    console.log(`[Upload] Saved ${target}/${mediaType}: ${urlPath} (${(file.size / 1024).toFixed(1)}KB)`);

    return new Response(JSON.stringify({
      success: true,
      url: urlPath,
      size: file.size,
      type: file.type,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Upload] Failed:', err);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
