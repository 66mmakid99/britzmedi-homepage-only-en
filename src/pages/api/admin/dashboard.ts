import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const kv = runtime?.env?.SESSION as KVNamespace | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        totalLeads: 0, weeklyLeads: 0, hotLeads: 0,
        totalPosts: 0, publishedPosts: 0,
        totalSubscribers: 0, weeklySubscribers: 0,
        recentActivities: [], lastHealthStatus: null, lastHealthAt: null,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [leads, weeklyLeads, hotLeads, posts, publishedPosts, subs, weeklySubs, activities] = await Promise.all([
      db.prepare('SELECT COUNT(*) as c FROM leads').first<{ c: number }>(),
      db.prepare('SELECT COUNT(*) as c FROM leads WHERE created_at >= ?').bind(weekAgo).first<{ c: number }>(),
      db.prepare("SELECT COUNT(*) as c FROM leads WHERE lead_grade = 'A'").first<{ c: number }>(),
      db.prepare('SELECT COUNT(*) as c FROM blog_posts').first<{ c: number }>(),
      db.prepare("SELECT COUNT(*) as c FROM blog_posts WHERE status = 'published'").first<{ c: number }>(),
      db.prepare('SELECT COUNT(*) as c FROM subscribers').first<{ c: number }>(),
      db.prepare('SELECT COUNT(*) as c FROM subscribers WHERE subscribed_at >= ?').bind(weekAgo).first<{ c: number }>(),
      db.prepare('SELECT id, type, detail, created_at FROM activity_log ORDER BY created_at DESC LIMIT 5').all().catch(() => ({ results: [] })),
    ]);

    // Get last health check from KV
    let lastHealthStatus: string | null = null;
    let lastHealthAt: string | null = null;
    if (kv) {
      try {
        const healthData = await kv.get('last-health-check');
        if (healthData) {
          const parsed = JSON.parse(healthData);
          lastHealthStatus = parsed.status;
          lastHealthAt = parsed.checkedAt;
        }
      } catch {}
    }

    return new Response(JSON.stringify({
      totalLeads: leads?.c ?? 0,
      weeklyLeads: weeklyLeads?.c ?? 0,
      hotLeads: hotLeads?.c ?? 0,
      totalPosts: posts?.c ?? 0,
      publishedPosts: publishedPosts?.c ?? 0,
      totalSubscribers: subs?.c ?? 0,
      weeklySubscribers: weeklySubs?.c ?? 0,
      recentActivities: activities.results || [],
      lastHealthStatus,
      lastHealthAt,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('[Dashboard API] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
