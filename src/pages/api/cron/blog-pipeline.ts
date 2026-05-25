// Cron API — semi-automated blog publishing pipeline
// POST /api/cron/blog-pipeline
// Security: Bearer token (CRON_SECRET) — same scheme as aeo-engine.ts
//
// On each run:
//   (a) For each youtube_channels row with auto_process=1, fetch its RSS feed,
//       detect new (unprocessed) videos, and create blog_jobs for them (capped).
//   (b) Advance every in-progress job (status not completed/failed) to 'review'
//       via the orchestrator, which also auto-sends the approval email.
//
// AI cost safeguards (hard caps, constants below):
//   - MAX_NEW_JOBS_PER_CHANNEL new jobs created per channel per run
//   - MAX_JOBS_PROCESSED_PER_RUN total jobs advanced (new + resumed) per run
//
// NOTE: Cloudflare Pages does NOT support native Workers cron triggers, so this
// must be invoked by an external scheduler (cron-job.org, GitHub Actions, etc.)
// with: Authorization: Bearer <CRON_SECRET>. Suggested: weekdays 09:00 KST
// => "0 0 * * 1-5" UTC.

export const prerender = false;

import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { runJobToReview } from '../../../lib/youtube-to-blog/orchestrator';
import type { BlogJob, YouTubeChannel } from '../../../lib/youtube-to-blog/schemas';

// ─── AI cost safeguards ───────────────────────────────────────
const MAX_NEW_JOBS_PER_CHANNEL = 2;
const MAX_JOBS_PROCESSED_PER_RUN = 5;

interface RssVideo {
  id: string;
  title: string;
  published: string;
}

function parseRssVideos(xml: string): RssVideo[] {
  const videos: RssVideo[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    if (idMatch) {
      videos.push({
        id: idMatch[1],
        title: titleMatch?.[1] || 'Untitled',
        published: publishedMatch?.[1] || '',
      });
    }
  }
  return videos;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const env = runtime?.env;
  const db = env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cron secret verification (Bearer, same as aeo-engine.ts)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.ADMIN_SESSION_SECRET) {
    return new Response(JSON.stringify({ error: 'ADMIN_SESSION_SECRET not configured (required for internal calls)' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = new URL(request.url).origin;
  const summary = {
    channels_checked: 0,
    new_videos_detected: 0,
    jobs_created: 0,
    jobs_processed: 0,
    jobs_to_review: 0,
    approval_emails_sent: 0,
    errors: [] as string[],
    details: [] as any[],
  };

  // ─── (a) Detect new videos from auto_process channels ───────
  try {
    const channelsRes = await db.prepare(
      'SELECT * FROM youtube_channels WHERE auto_process = 1'
    ).all<YouTubeChannel>();
    const channels = channelsRes.results || [];

    for (const channel of channels) {
      summary.channels_checked++;
      if (summary.jobs_created >= MAX_JOBS_PROCESSED_PER_RUN) break;

      try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channel_id}`;
        const rssRes = await fetch(rssUrl);
        if (!rssRes.ok) {
          summary.errors.push(`RSS fetch failed for ${channel.channel_id} (${rssRes.status})`);
          continue;
        }
        const xml = await rssRes.text();
        const videos = parseRssVideos(xml);

        let createdForChannel = 0;
        for (const video of videos) {
          if (createdForChannel >= MAX_NEW_JOBS_PER_CHANNEL) break;
          if (summary.jobs_created >= MAX_JOBS_PROCESSED_PER_RUN) break;

          // Skip if already tracked/processed as a video.
          const existingVideo = await db.prepare(
            'SELECT id, processed FROM youtube_videos WHERE youtube_id = ?'
          ).bind(video.id).first<{ id: string; processed: number }>();
          if (existingVideo) continue;

          // Skip if a non-terminal job already exists for this video.
          const existingJob = await db.prepare(
            'SELECT id FROM blog_jobs WHERE youtube_id = ? AND status NOT IN (?, ?)'
          ).bind(video.id, 'failed', 'completed').first<{ id: string }>();
          if (existingJob) continue;

          summary.new_videos_detected++;

          // Create job directly in D1 (mirrors POST /api/blog/queue logic).
          const jobId = nanoid(12);
          const youtubeUrl = `https://www.youtube.com/watch?v=${video.id}`;
          await db.prepare(`
            INSERT INTO blog_jobs (id, youtube_url, youtube_id, video_title, channel_id, channel_name, status, progress, target_lang, tone, word_count)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 'en', 'professional', 1500)
          `).bind(
            jobId,
            youtubeUrl,
            video.id,
            video.title,
            channel.channel_id,
            channel.channel_name
          ).run();

          // Track the video so we don't re-detect it next run, even if the
          // pipeline later fails. processed=0 until finalize links it.
          await db.prepare(`
            INSERT OR IGNORE INTO youtube_videos (id, youtube_id, channel_id, title, published_at, processed, job_id)
            VALUES (?, ?, ?, ?, ?, 0, ?)
          `).bind(nanoid(12), video.id, channel.channel_id, video.title, video.published || null, jobId).run();

          summary.jobs_created++;
          createdForChannel++;
        }

        await db.prepare(
          "UPDATE youtube_channels SET last_checked_at = datetime('now') WHERE id = ?"
        ).bind(channel.id).run();
      } catch (e: any) {
        summary.errors.push(`Channel ${channel.channel_id}: ${e?.message}`);
      }
    }
  } catch (e: any) {
    summary.errors.push(`Channel detection failed: ${e?.message}`);
  }

  // ─── (b) Advance in-progress jobs to review ─────────────────
  try {
    const jobsRes = await db.prepare(`
      SELECT * FROM blog_jobs
      WHERE status NOT IN ('completed', 'failed')
      ORDER BY created_at ASC
      LIMIT ?
    `).bind(MAX_JOBS_PROCESSED_PER_RUN).all<BlogJob>();
    const jobs = jobsRes.results || [];

    for (const job of jobs) {
      if (summary.jobs_processed >= MAX_JOBS_PROCESSED_PER_RUN) break;
      summary.jobs_processed++;

      const result = await runJobToReview(job.id, env, origin);
      if (result.ok) {
        summary.jobs_to_review++;
        if (result.approvalEmailSent) summary.approval_emails_sent++;
      } else if (result.error) {
        summary.errors.push(`Job ${job.id} (${result.failedStep || 'n/a'}): ${result.error}`);
      }
      summary.details.push({
        jobId: job.id,
        ok: result.ok,
        completedSteps: result.completedSteps,
        skippedSteps: result.skippedSteps,
        failedStep: result.failedStep,
        blogPostId: result.blogPostId,
        approvalEmailSent: result.approvalEmailSent,
        approvalEmailError: result.approvalEmailError,
        error: result.error,
      });
    }
  } catch (e: any) {
    summary.errors.push(`Job processing failed: ${e?.message}`);
  }

  return new Response(JSON.stringify({ success: true, summary }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
