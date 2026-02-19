import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const kv = runtime?.env?.SESSION as KVNamespace | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        totalLeads: 0, weeklyLeads: 0, hotLeads: 0, overdueLeads: 0,
        totalPosts: 0, publishedPosts: 0,
        contentItems: 0, contentPublished: 0, contentDraft: 0,
        totalSubscribers: 0, weeklySubscribers: 0,
        recentActivities: [], lastHealthStatus: null, lastHealthAt: null,
        leadsByStatus: {},
        alerts: [],
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Helper: safely query a table (returns default if table doesn't exist)
    const safeCount = async (sql: string, binds?: any[]) => {
      try {
        const stmt = binds ? db.prepare(sql).bind(...binds) : db.prepare(sql);
        const row = await stmt.first<{ c: number }>();
        return row?.c ?? 0;
      } catch { return 0; }
    };

    const [
      leads, weeklyLeads, hotLeads, overdueLeads, newLeadsToday,
      posts, publishedPosts,
      contentItems, contentPublished, contentDraft,
      subs, weeklySubs,
      activities, leadsByStatusRaw, recentLeadsRaw,
    ] = await Promise.all([
      safeCount('SELECT COUNT(*) as c FROM leads'),
      safeCount('SELECT COUNT(*) as c FROM leads WHERE created_at >= ?', [weekAgo]),
      safeCount("SELECT COUNT(*) as c FROM leads WHERE lead_grade = 'A'"),
      safeCount(
        "SELECT COUNT(*) as c FROM leads WHERE status NOT IN ('won','lost') AND COALESCE(last_contacted_at, created_at) < ?",
        [twoDaysAgo],
      ),
      safeCount("SELECT COUNT(*) as c FROM leads WHERE status = 'new' AND created_at >= ?", [dayAgo]),
      safeCount('SELECT COUNT(*) as c FROM blog_posts'),
      safeCount("SELECT COUNT(*) as c FROM blog_posts WHERE status = 'published'"),
      safeCount('SELECT COUNT(*) as c FROM content_items'),
      safeCount("SELECT COUNT(*) as c FROM content_items WHERE status = 'published'"),
      safeCount("SELECT COUNT(*) as c FROM content_items WHERE status = 'draft'"),
      safeCount('SELECT COUNT(*) as c FROM subscribers'),
      safeCount('SELECT COUNT(*) as c FROM subscribers WHERE subscribed_at >= ?', [weekAgo]),
      db.prepare('SELECT id, type, detail, created_at FROM activity_log ORDER BY created_at DESC LIMIT 8').all().catch(() => ({ results: [] })),
      db.prepare('SELECT status, COUNT(*) as c FROM leads GROUP BY status').all().catch(() => ({ results: [] })),
      db.prepare('SELECT id, company_name, contact_name, email, country, product_interest, lead_score, lead_grade, status, source, created_at FROM leads ORDER BY created_at DESC LIMIT 5').all().catch(() => ({ results: [] })),
    ]);

    // Parse leads by status
    const leadsByStatus: Record<string, number> = {};
    for (const row of (leadsByStatusRaw.results || []) as any[]) {
      leadsByStatus[row.status] = row.c;
    }

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

    // Build alerts
    const alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'error' }> = [];

    if (newLeadsToday > 0) {
      alerts.push({
        type: 'new_leads',
        message: `${newLeadsToday} new lead${newLeadsToday > 1 ? 's' : ''} in the last 24 hours`,
        severity: 'info',
      });
    }

    if (overdueLeads > 0) {
      alerts.push({
        type: 'overdue_leads',
        message: `${overdueLeads} lead${overdueLeads > 1 ? 's' : ''} with no response for 48+ hours`,
        severity: 'warning',
      });
    }

    if (hotLeads > 0) {
      alerts.push({
        type: 'hot_leads',
        message: `${hotLeads} hot lead${hotLeads > 1 ? 's' : ''} (A-grade) need attention`,
        severity: 'info',
      });
    }

    if (contentDraft > 3) {
      alerts.push({
        type: 'draft_content',
        message: `${contentDraft} content items in draft — consider reviewing`,
        severity: 'info',
      });
    }

    return new Response(JSON.stringify({
      totalLeads: leads,
      weeklyLeads,
      hotLeads,
      overdueLeads,
      newLeadsToday,
      totalPosts: posts,
      publishedPosts,
      contentItems,
      contentPublished,
      contentDraft,
      totalSubscribers: subs,
      weeklySubscribers: weeklySubs,
      recentActivities: activities.results || [],
      recentLeads: recentLeadsRaw.results || [],
      lastHealthStatus,
      lastHealthAt,
      leadsByStatus,
      alerts,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('[Dashboard API] Error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong loading dashboard data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
