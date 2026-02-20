// GET /api/admin/analytics/overview?period=7d — Page view analytics from D1
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '7d';
  const days = parseInt(period) || 7;

  try {
    // Total views in period
    const totalViews = await db.prepare(
      `SELECT COUNT(*) as total FROM page_views WHERE created_at >= datetime('now', '-${days} days')`
    ).first<any>();

    // Unique visitors (by session_id)
    const uniqueVisitors = await db.prepare(
      `SELECT COUNT(DISTINCT session_id) as total FROM page_views WHERE created_at >= datetime('now', '-${days} days') AND session_id != ''`
    ).first<any>();

    // Daily breakdown
    const daily = await db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_visitors
      FROM page_views
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all<any>();

    // Top pages
    const topPages = await db.prepare(`
      SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_visitors
      FROM page_views
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY path
      ORDER BY views DESC
      LIMIT 20
    `).all<any>();

    // Top countries
    const topCountries = await db.prepare(`
      SELECT country, COUNT(*) as views
      FROM page_views
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY country
      ORDER BY views DESC
      LIMIT 10
    `).all<any>();

    // Top referrers
    const topReferrers = await db.prepare(`
      SELECT referrer, COUNT(*) as views
      FROM page_views
      WHERE created_at >= datetime('now', '-${days} days') AND referrer != ''
      GROUP BY referrer
      ORDER BY views DESC
      LIMIT 10
    `).all<any>();

    // Device breakdown
    const devices = await db.prepare(`
      SELECT device, COUNT(*) as views
      FROM page_views
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY device
    `).all<any>();

    // Blog content performance
    const blogPerformance = await db.prepare(`
      SELECT path, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_visitors
      FROM page_views
      WHERE created_at >= datetime('now', '-${days} days') AND path LIKE '/blog/%'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `).all<any>();

    return new Response(JSON.stringify({
      period: `${days}d`,
      total_views: totalViews?.total || 0,
      unique_visitors: uniqueVisitors?.total || 0,
      daily: daily.results || [],
      top_pages: topPages.results || [],
      top_countries: topCountries.results || [],
      top_referrers: topReferrers.results || [],
      devices: Object.fromEntries((devices.results || []).map((d: any) => [d.device, d.views])),
      blog_performance: blogPerformance.results || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
