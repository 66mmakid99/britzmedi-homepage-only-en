import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  DB: D1Database;
}

// GET /api/leads/stats - Get dashboard statistics
export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = locals.runtime?.env as Env;
    if (!env?.DB) {
      // Return sample stats for dev mode
      return new Response(JSON.stringify({
        total: 3,
        hot: 1,
        newToday: 1,
        avgScore: 68,
        byGrade: { A: 1, B: 1, C: 1, D: 0 },
        byStatus: { new: 2, contacted: 1, qualified: 0, proposal: 0, won: 0, lost: 0 },
        byCountry: { US: 1, DE: 1, BR: 1 },
        recentLeads: [],
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get total count
    const totalResult = await env.DB.prepare('SELECT COUNT(*) as count FROM leads').first<{ count: number }>();
    const total = totalResult?.count || 0;

    // Get hot leads (grade A)
    const hotResult = await env.DB.prepare("SELECT COUNT(*) as count FROM leads WHERE lead_grade = 'A'").first<{ count: number }>();
    const hot = hotResult?.count || 0;

    // Get leads created today
    const todayResult = await env.DB.prepare("SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = DATE('now')").first<{ count: number }>();
    const newToday = todayResult?.count || 0;

    // Get average score
    const avgResult = await env.DB.prepare('SELECT AVG(lead_score) as avg FROM leads').first<{ avg: number }>();
    const avgScore = Math.round(avgResult?.avg || 0);

    // Get counts by grade
    const gradeResults = await env.DB.prepare('SELECT lead_grade, COUNT(*) as count FROM leads GROUP BY lead_grade').all();
    const byGrade: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const row of gradeResults.results as any[]) {
      byGrade[row.lead_grade] = row.count;
    }

    // Get counts by status
    const statusResults = await env.DB.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
    const byStatus: Record<string, number> = { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 };
    for (const row of statusResults.results as any[]) {
      byStatus[row.status] = row.count;
    }

    // Get counts by country (top 10)
    const countryResults = await env.DB.prepare('SELECT country, COUNT(*) as count FROM leads GROUP BY country ORDER BY count DESC LIMIT 10').all();
    const byCountry: Record<string, number> = {};
    for (const row of countryResults.results as any[]) {
      byCountry[row.country] = row.count;
    }

    // Get recent leads (last 5)
    const recentResults = await env.DB.prepare('SELECT id, company_name, contact_name, lead_grade, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5').all();

    return new Response(JSON.stringify({
      total,
      hot,
      newToday,
      avgScore,
      byGrade,
      byStatus,
      byCountry,
      recentLeads: recentResults.results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Leads API] Error fetching stats:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
