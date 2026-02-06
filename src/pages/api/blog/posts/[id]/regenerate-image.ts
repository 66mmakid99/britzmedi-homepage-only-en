// Regenerate featured image for a blog post
// POST /api/blog/posts/[id]/regenerate-image

export const prerender = false;

import type { APIRoute } from 'astro';
import { generateImagePrompt, generateImage } from '../../../../../lib/youtube-to-blog/gemini';
import { uploadToR2, generateImageKey } from '../../../../../lib/youtube-to-blog/images';
import type { BlogPost } from '../../../../../lib/youtube-to-blog/schemas';

export const POST: APIRoute = async ({ params, locals }) => {
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
    const geminiKey = runtime?.env?.GEMINI_API_KEY as string | undefined;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;

    if (!db || !geminiKey || !r2) {
      return new Response(JSON.stringify({ error: 'Required services not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(id).first<BlogPost>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate new image
    const imagePrompt = await generateImagePrompt(geminiKey, post.title, post.excerpt || '');
    const imageData = await generateImage(geminiKey, imagePrompt);

    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Image generation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const imageKey = generateImageKey(id, Date.now());
    const imageUrl = await uploadToR2(r2, imageKey, imageData);

    await db.prepare(`
      UPDATE blog_posts SET featured_image = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(imageUrl, id).run();

    return new Response(JSON.stringify({
      success: true,
      featured_image: imageUrl,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Regenerate Image] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to regenerate image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
