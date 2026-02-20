// GET /api/admin/aeo-engine/history — AEO cycle history for growth timeline
export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // All diagnosis cycles (for growth timeline)
    const diagnosisHistory = await db.prepare(
      `SELECT data, created_at FROM aeo_cycles WHERE phase = 'diagnose' ORDER BY created_at DESC LIMIT 20`
    ).all<any>();

    const timeline = (diagnosisHistory.results || []).map((row: any) => {
      try {
        const data = JSON.parse(row.data);
        return {
          date: row.created_at,
          mention_rate: data.mention_rate || 0,
          total_queries: data.total_queries || 0,
          mentioned: data.mentioned || 0,
        };
      } catch {
        return { date: row.created_at, mention_rate: 0, total_queries: 0, mentioned: 0 };
      }
    }).reverse();

    // Recent cycle runs (all phases)
    const recentCycles = await db.prepare(
      `SELECT phase, status, created_at FROM aeo_cycles ORDER BY created_at DESC LIMIT 50`
    ).all<any>();

    return new Response(JSON.stringify({
      timeline,
      recent_cycles: recentCycles.results || [],
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
