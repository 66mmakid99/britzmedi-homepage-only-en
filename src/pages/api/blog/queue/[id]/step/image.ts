// Step 5: Generate featured image
// POST /api/blog/queue/[id]/step/image

export const prerender = false;

import type { APIRoute } from 'astro';
import { generateImagePrompt, generateImage, generateContentImagePrompts } from '../../../../../../lib/youtube-to-blog/gemini';
import type { ContentImageSpec } from '../../../../../../lib/youtube-to-blog/gemini';
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
    let contentImagesInserted = 0;

    if (geminiKey && r2) {
      // --- Featured image ---
      try {
        const imagePrompt = await generateImagePrompt(
          geminiKey,
          post.title,
          post.excerpt || ''
        );

        const imageData = await generateImage(geminiKey, imagePrompt);

        if (imageData) {
          const imageKey = generateImageKey(job.blog_post_id, 0);
          featuredImageUrl = await uploadToR2(r2, imageKey, imageData);
        }
      } catch (imgErr) {
        console.error('[Image Step] Featured image generation failed:', imgErr);
      }

      // --- Content images (2 in-body images at H2 sections) ---
      try {
        if (post.content) {
          const specs = await generateContentImagePrompts(geminiKey, post.content, post.title);

          if (specs.length > 0) {
            // Generate all content images in parallel
            const imageResults = await Promise.all(
              specs.map(async (spec, i) => {
                const imgData = await generateImage(geminiKey, spec.imagePrompt);
                if (!imgData) return null;
                const imgKey = generateImageKey(job.blog_post_id, i + 1);
                const imgUrl = await uploadToR2(r2, imgKey, imgData);
                return { spec, url: imgUrl };
              })
            );

            // Insert figures into HTML content
            let updatedContent = post.content;
            for (const result of imageResults) {
              if (!result) continue;
              updatedContent = insertFigureAfterH2(updatedContent, result.spec, result.url);
              contentImagesInserted++;
            }

            if (contentImagesInserted > 0) {
              await db.prepare(`
                UPDATE blog_posts SET content = ?, updated_at = datetime('now')
                WHERE id = ?
              `).bind(updatedContent, job.blog_post_id).run();
            }
          }
        }
      } catch (contentImgErr) {
        console.error('[Image Step] Content images failed:', contentImgErr);
        // Non-critical - continue
      }
    }

    // Use YouTube thumbnail as fallback for featured image
    if (!featuredImageUrl) {
      featuredImageUrl = `https://img.youtube.com/vi/${job.youtube_id}/maxresdefault.jpg`;
    }

    // Update featured image
    await db.prepare(`
      UPDATE blog_posts SET featured_image = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(featuredImageUrl, job.blog_post_id).run();

    await updateJobStatus(db, id, 'imaging', 95);

    return new Response(JSON.stringify({
      success: true,
      featured_image: featuredImageUrl,
      generated: featuredImageUrl !== `https://img.youtube.com/vi/${job.youtube_id}/maxresdefault.jpg`,
      content_images: contentImagesInserted,
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

/**
 * Insert a <figure> block after the first </p> following a matching H2 heading
 */
function insertFigureAfterH2(html: string, spec: ContentImageSpec, imageUrl: string): string {
  // Find the H2 that contains the section heading text (case-insensitive)
  const escapedHeading = spec.sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const h2Regex = new RegExp(`<h2[^>]*>[^<]*${escapedHeading}[^<]*<\\/h2>`, 'i');
  const h2Match = h2Regex.exec(html);

  if (!h2Match) return html;

  // Find the first </p> after this H2
  const afterH2 = html.indexOf('</p>', h2Match.index + h2Match[0].length);
  if (afterH2 === -1) return html;

  const insertPos = afterH2 + '</p>'.length;
  const figureBlock = `\n<figure><img src="${imageUrl}" alt="${spec.altText.replace(/"/g, '&quot;')}" loading="lazy"><figcaption>${spec.caption}</figcaption></figure>\n`;

  return html.slice(0, insertPos) + figureBlock + html.slice(insertPos);
}
