// Step 5: Generate featured image
// POST /api/blog/queue/[id]/step/image

export const prerender = false;

import type { APIRoute } from 'astro';
import { generateImagePrompt, generateImage } from '../../../../../../lib/youtube-to-blog/gemini';
import { uploadToR2, generateImageKey } from '../../../../../../lib/youtube-to-blog/images';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';
import type { BlogPost } from '../../../../../../lib/youtube-to-blog/schemas';

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const geminiKey = runtime?.env?.GEMINI_API_KEY as string | undefined;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Dev mode: image step simulated',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job = await getJob(db, id);
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!job.blog_post_id) {
      return new Response(JSON.stringify({ error: 'Blog post not generated yet' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateJobStatus(db, id, 'imaging', 80);

    // Get blog post for context
    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(job.blog_post_id).first<BlogPost>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Blog post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let featuredImageUrl: string | null = null;

    if (geminiKey && r2) {
      try {
        // Generate image prompt
        const imagePrompt = await generateImagePrompt(
          geminiKey,
          post.title,
          post.excerpt || ''
        );

        // Generate image
        const imageData = await generateImage(geminiKey, imagePrompt);

        if (imageData) {
          // Upload to R2
          const imageKey = generateImageKey(job.blog_post_id, 0);
          featuredImageUrl = await uploadToR2(r2, imageKey, imageData);
        }
      } catch (imgErr) {
        console.error('[Image Step] Image generation failed:', imgErr);
        // Non-critical - continue without image
      }
    }

    // Use YouTube thumbnail as fallback
    if (!featuredImageUrl) {
      featuredImageUrl = `https://img.youtube.com/vi/${job.youtube_id}/maxresdefault.jpg`;
    }

    // Update blog post
    await db.prepare(`
      UPDATE blog_posts SET featured_image = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(featuredImageUrl, job.blog_post_id).run();

    await updateJobStatus(db, id, 'imaging', 95);

    return new Response(JSON.stringify({
      success: true,
      featured_image: featuredImageUrl,
      generated: featuredImageUrl !== `https://img.youtube.com/vi/${job.youtube_id}/maxresdefault.jpg`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Image Step] Error:', error);

    // Image is optional - don't fail the job, use YouTube thumbnail
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) {
      const job = await getJob(db, id);
      if (job?.blog_post_id) {
        const fallbackUrl = `https://img.youtube.com/vi/${job.youtube_id}/maxresdefault.jpg`;
        await db.prepare(`
          UPDATE blog_posts SET featured_image = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(fallbackUrl, job.blog_post_id).run();
      }
      await updateJobStatus(db, id, 'imaging', 95);
    }

    return new Response(JSON.stringify({
      success: true,
      warning: error.message,
      featured_image: null,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
