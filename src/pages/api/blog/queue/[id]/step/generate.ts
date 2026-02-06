// Step 3: Generate blog post using Claude (streaming)
// POST /api/blog/queue/[id]/step/generate
//
// Returns SSE stream to keep CF Worker alive during Claude generation.
// Events: { type: 'progress', percent } | { type: 'done', blog_post_id, title, slug } | { type: 'error', message }

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

  // Pre-validate job before starting stream
  let job;
  try {
    job = await getJob(db, id);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to fetch job' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  // Return SSE stream - keeps CF Worker alive during Claude generation
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await updateJobStatus(db, id, 'generating', 45);
        send({ type: 'progress', percent: 45 });

        let lastProgressSent = Date.now();

        // Generate blog post with Claude (streaming)
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
          },
          // onProgress: send keepalive every 3 seconds during generation
          (_chunk, accumulated) => {
            const now = Date.now();
            if (now - lastProgressSent > 3000) {
              // Estimate progress based on accumulated length vs expected (~wordCount * 8 chars for JSON)
              const expectedLength = (job.word_count || 1500) * 8;
              const pct = Math.min(55, 45 + Math.floor((accumulated.length / expectedLength) * 10));
              send({ type: 'progress', percent: pct });
              lastProgressSent = now;
            }
          }
        );

        send({ type: 'progress', percent: 56 });

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

        send({
          type: 'done',
          success: true,
          blog_post_id: postId,
          title: post.title,
          slug: post.slug,
        });
      } catch (error: any) {
        console.error('[Generate Step] Error:', error);

        try {
          await failJob(db, id, error.message || 'Blog generation failed');
        } catch { /* ignore cleanup errors */ }

        send({ type: 'error', message: error.message || 'Generation failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};
