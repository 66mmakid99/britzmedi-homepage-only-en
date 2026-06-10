// Cloudflare Worker - Scheduled Blog Publishing
// Runs every hour via cron trigger
// Checks D1 for posts with scheduledDate <= now AND status='scheduled'
// Updates matching posts to status='published' and triggers a rebuild

export interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string; // format: "owner/repo"
  // Required to authorize the manual /trigger route. Set via:
  //   npx wrangler secret put CRON_SECRET --name <this-worker-name>
  CRON_SECRET: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('[Scheduled Publish] Cron triggered at', new Date().toISOString());

    try {
      const now = new Date().toISOString();

      // Find all posts that are scheduled and past their publish date
      const result = await env.DB.prepare(
        `SELECT id, title, slug, scheduled_date
         FROM blog_posts
         WHERE status = 'scheduled'
         AND scheduled_date <= ?`
      ).bind(now).all();

      const posts = result.results || [];

      if (posts.length === 0) {
        console.log('[Scheduled Publish] No posts to publish');
        return;
      }

      console.log(`[Scheduled Publish] Found ${posts.length} posts to publish`);

      // Update each post to published
      for (const post of posts) {
        await env.DB.prepare(
          `UPDATE blog_posts
           SET status = 'published',
               published_at = ?,
               updated_at = ?
           WHERE id = ?`
        ).bind(now, now, post.id).run();

        console.log(`[Scheduled Publish] Published: ${post.title} (${post.slug})`);
      }

      // Trigger GitHub Actions build via repository_dispatch
      if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
        try {
          const response = await fetch(
            `https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`,
            {
              method: 'POST',
              headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'BRITZMEDI-Scheduled-Publish',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                event_type: 'scheduled-publish',
                client_payload: {
                  published_count: posts.length,
                  slugs: posts.map((p: any) => p.slug).join(', '),
                },
              }),
            }
          );

          if (response.ok || response.status === 204) {
            console.log('[Scheduled Publish] GitHub rebuild triggered successfully');
          } else {
            const text = await response.text();
            console.error(`[Scheduled Publish] GitHub dispatch failed: ${response.status} ${text}`);
          }
        } catch (err) {
          console.error('[Scheduled Publish] Failed to trigger GitHub rebuild:', err);
        }
      } else {
        console.warn('[Scheduled Publish] GITHUB_TOKEN or GITHUB_REPO not configured, skipping rebuild trigger');
      }
    } catch (error) {
      console.error('[Scheduled Publish] Error:', error);
    }
  },

  // Also handle fetch for manual trigger / health check
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', worker: 'scheduled-publish' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/trigger') {
      // Manual trigger - requires Authorization: Bearer {CRON_SECRET}.
      // The secret must be configured on this worker via `wrangler secret put CRON_SECRET`;
      // if it is not set, the route is disabled rather than left open.
      const authHeader = request.headers.get('Authorization');
      if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Run the same logic as the cron schedule
      await this.scheduled({} as ScheduledController, env, {} as ExecutionContext);
      return new Response(JSON.stringify({ status: 'triggered' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
