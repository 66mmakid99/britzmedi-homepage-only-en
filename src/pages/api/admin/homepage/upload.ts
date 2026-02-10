import type { APIRoute } from 'astro';
import { commitFileToGitHub } from '../../../../lib/youtube-to-blog/github';

export const prerender = false;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const ALLOWED_VIDEO_TYPES = ['video/mp4'];

export const POST: APIRoute = async ({ request, cookies, locals }) => {
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
    const mediaType = formData.get('type') as string | null;
    const target = (formData.get('target') as string) || 'hero';
    const productId = formData.get('productId') as string | null;

    if (!file || !mediaType) {
      return new Response(JSON.stringify({ error: 'Missing file or type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'webp');
    const timestamp = Date.now();

    let r2Key: string;
    let urlPath: string;

    if (target === 'product' && productId) {
      const safeId = productId.replace(/[^a-z0-9-]/gi, '');
      r2Key = `homepage/products/${safeId}.${ext}`;
      urlPath = `/images/products/${safeId}.${ext}`;
    } else if (isVideo) {
      r2Key = `homepage/videos/hero-video-${timestamp}.${ext}`;
      urlPath = `/videos/hero-video-${timestamp}.${ext}`;
    } else {
      r2Key = `homepage/hero/hero-${mediaType}-${timestamp}.${ext}`;
      urlPath = `/images/hero/hero-${mediaType}-${timestamp}.${ext}`;
    }

    const runtime = (locals as any).runtime;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;
    const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
    const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

    const arrayBuffer = await file.arrayBuffer();

    if (r2) {
      // Upload to R2
      await r2.put(r2Key, arrayBuffer, {
        httpMetadata: { contentType: file.type },
      });
      console.log(`[Upload] Saved to R2: ${r2Key} (${(file.size / 1024).toFixed(1)}KB)`);
    }

    // Also commit to GitHub repo (public/ directory) for static build
    if (githubToken && githubRepo && !isVideo) {
      try {
        const base64Content = arrayBufferToBase64(arrayBuffer);
        const githubPath = `public${urlPath}`;
        const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${githubPath}`;

        // Check if file exists
        let existingSha: string | undefined;
        try {
          const checkRes = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'BRITZMEDI-Homepage-Editor',
            },
          });
          if (checkRes.ok) {
            const data = await checkRes.json();
            existingSha = data.sha;
          }
        } catch {}

        const body: Record<string, string> = {
          message: `chore: upload ${target} image via homepage editor`,
          content: base64Content,
          branch: 'main',
        };
        if (existingSha) body.sha = existingSha;

        const res = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'BRITZMEDI-Homepage-Editor',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          console.log(`[Upload] Committed to GitHub: ${githubPath}`);
        } else {
          console.warn(`[Upload] GitHub commit failed: ${res.status}`);
        }
      } catch (ghErr) {
        console.warn('[Upload] GitHub commit failed (non-fatal):', ghErr);
      }
    }

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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
