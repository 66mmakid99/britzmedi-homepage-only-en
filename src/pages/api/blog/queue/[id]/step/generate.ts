// Step 3: Generate blog post using Claude
// POST /api/blog/queue/[id]/step/generate

export const prerender = false;

import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { generateBlogPost } from '../../../../../../lib/youtube-to-blog/claude';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';

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
    const anthropicKey = runtime?.env?.ANTHROPIC_API_KEY as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Dev mode: generate step simulated',
        blog_post_id: 'dev-post-001',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
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

    const transcript = job.translated_text || job.transcript_text;
    if (!transcript) {
      return new Response(JSON.stringify({ error: 'No transcript available. Run extract/translate steps first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateJobStatus(db, id, 'generating', 45);

    // Generate blog post with Claude
    const post = await generateBlogPost(
      anthropicKey,
      transcript,
      job.video_title || 'Untitled',
      job.channel_name || 'Unknown',
      job.youtube_id,
      {
        tone: job.tone,
        wordCount: job.word_count,
        targetLang: job.target_lang,
      }
    );

    // Create blog post in database
    const postId = nanoid(12);
    const youtubeEmbedUrl = `https://www.youtube.com/embed/${job.youtube_id}`;

    await db.prepare(`
      INSERT INTO blog_posts (
        id, job_id, title, slug, content, excerpt, meta_description,
        keywords, tags, category, youtube_embed_url, youtube_url,
        youtube_id, channel_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `).bind(
      postId,
      id,
      post.title,
      post.slug,
      post.content,
      post.excerpt,
      post.metaDescription,
      JSON.stringify(post.keywords),
      JSON.stringify(post.tags),
      post.category,
      youtubeEmbedUrl,
      job.youtube_url,
      job.youtube_id,
      job.channel_name || null
    ).run();

    // Update job with post reference
    await updateJobStatus(db, id, 'generating', 60, {
      blog_post_id: postId,
    });

    return new Response(JSON.stringify({
      success: true,
      blog_post_id: postId,
      title: post.title,
      slug: post.slug,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Generate Step] Error:', error);

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) await failJob(db, id, error.message || 'Blog generation failed');

    return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
