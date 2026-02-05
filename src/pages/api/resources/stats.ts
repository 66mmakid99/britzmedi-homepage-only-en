import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  DB: D1Database;
}

// GET /api/resources/stats - Get resource download statistics
export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = (locals as any).runtime?.env as Env;
    if (!env?.DB) {
      // Return sample stats for dev mode
      return new Response(JSON.stringify({
        totalDownloads: 47,
        downloadsToday: 3,
        downloadsThisWeek: 12,
        uniqueResources: 6,
        byResource: [
          { resource_id: 'torr-rf-brochure', resource_title: 'TORR RF Product Brochure (Overseas)', count: 15 },
          { resource_id: 'fda-clearance-letter', resource_title: 'FDA Clearance Letter', count: 9 },
          { resource_id: 'ulblanc-brochure', resource_title: 'ULBLANC Product Brochure', count: 8 },
          { resource_id: 'torr-rf-strategic-proposal-en', resource_title: 'TORR RF Strategic Proposal (English)', count: 7 },
          { resource_id: 'torr-rf-cicm-lecture', resource_title: 'TORR RF 2025 CICM Lecture', count: 5 },
          { resource_id: 'fda-510k-premarket', resource_title: 'FDA 510(k) Premarket Notification', count: 3 },
        ],
        byCountry: { US: 15, DE: 8, BR: 6, KR: 5, JP: 4, GB: 3, FR: 3, AU: 2, CA: 1 },
        recentDownloads: [
          { resource_title: 'TORR RF Product Brochure (Overseas)', country: 'US', created_at: new Date().toISOString() },
          { resource_title: 'FDA Clearance Letter', country: 'DE', created_at: new Date(Date.now() - 3600000).toISOString() },
          { resource_title: 'ULBLANC Product Brochure', country: 'BR', created_at: new Date(Date.now() - 7200000).toISOString() },
        ],
        dailyTrend: Array.from({ length: 14 }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 8) + 1,
        })),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = env.DB;

    // Total downloads
    const totalResult = await db.prepare(
      'SELECT COUNT(*) as count FROM resource_downloads'
    ).first<{ count: number }>();
    const totalDownloads = totalResult?.count || 0;

    // Downloads today
    const todayResult = await db.prepare(
      "SELECT COUNT(*) as count FROM resource_downloads WHERE DATE(created_at) = DATE('now')"
    ).first<{ count: number }>();
    const downloadsToday = todayResult?.count || 0;

    // Downloads this week
    const weekResult = await db.prepare(
      "SELECT COUNT(*) as count FROM resource_downloads WHERE created_at >= datetime('now', '-7 days')"
    ).first<{ count: number }>();
    const downloadsThisWeek = weekResult?.count || 0;

    // Unique resources downloaded
    const uniqueResult = await db.prepare(
      'SELECT COUNT(DISTINCT resource_id) as count FROM resource_downloads'
    ).first<{ count: number }>();
    const uniqueResources = uniqueResult?.count || 0;

    // Top downloaded resources
    const byResourceResult = await db.prepare(
      'SELECT resource_id, resource_title, COUNT(*) as count FROM resource_downloads GROUP BY resource_id ORDER BY count DESC LIMIT 10'
    ).all();

    // Downloads by country
    const byCountryResult = await db.prepare(
      "SELECT country, COUNT(*) as count FROM resource_downloads WHERE country != '' GROUP BY country ORDER BY count DESC LIMIT 15"
    ).all();
    const byCountry: Record<string, number> = {};
    for (const row of byCountryResult.results as any[]) {
      byCountry[row.country] = row.count;
    }

    // Recent downloads
    const recentResult = await db.prepare(
      'SELECT resource_title, country, created_at FROM resource_downloads ORDER BY created_at DESC LIMIT 10'
    ).all();

    // Daily trend (last 14 days)
    const trendResult = await db.prepare(
      "SELECT DATE(created_at) as date, COUNT(*) as count FROM resource_downloads WHERE created_at >= datetime('now', '-14 days') GROUP BY DATE(created_at) ORDER BY date ASC"
    ).all();

    return new Response(JSON.stringify({
      totalDownloads,
      downloadsToday,
      downloadsThisWeek,
      uniqueResources,
      byResource: byResourceResult.results,
      byCountry,
      recentDownloads: recentResult.results,
      dailyTrend: trendResult.results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Resources API] Error fetching stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
