// GET /api/admin/aeo-engine/status — Latest cycle results + pipeline stats
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
    // Latest diagnosis
    const latestDiagnosis = await db.prepare(
      `SELECT data, created_at FROM aeo_cycles WHERE phase = 'diagnose' ORDER BY created_at DESC LIMIT 1`
    ).first<any>();

    // Latest plan
    const latestPlan = await db.prepare(
      `SELECT data, created_at FROM aeo_cycles WHERE phase = 'plan' ORDER BY created_at DESC LIMIT 1`
    ).first<any>();

    // Latest produce
    const latestProduce = await db.prepare(
      `SELECT data, created_at FROM aeo_cycles WHERE phase = 'produce' ORDER BY created_at DESC LIMIT 1`
    ).first<any>();

    // Latest analyze
    const latestAnalyze = await db.prepare(
      `SELECT data, created_at FROM aeo_cycles WHERE phase = 'analyze' ORDER BY created_at DESC LIMIT 1`
    ).first<any>();

    // Pipeline stats
    const pipelineStats = await db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued,
        COUNT(CASE WHEN status IN ('researching','generating','analyzing','rewriting','postprocessing') THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN status = 'manual_review' THEN 1 END) as reviewing,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM content_queue
    `).first<any>();

    // Content quality avg
    const qualityAvg = await db.prepare(`
      SELECT AVG(quality_score) as avg_score FROM content_items WHERE status = 'published' AND quality_score > 0
    `).first<any>();

    return new Response(JSON.stringify({
      diagnosis: latestDiagnosis ? { ...JSON.parse(latestDiagnosis.data || '{}'), run_at: latestDiagnosis.created_at } : null,
      plan: latestPlan ? { ...JSON.parse(latestPlan.data || '{}'), run_at: latestPlan.created_at } : null,
      produce: latestProduce ? { ...JSON.parse(latestProduce.data || '{}'), run_at: latestProduce.created_at } : null,
      analyze: latestAnalyze ? { ...JSON.parse(latestAnalyze.data || '{}'), run_at: latestAnalyze.created_at } : null,
      pipeline: pipelineStats || { queued: 0, processing: 0, published: 0, reviewing: 0, failed: 0 },
      avg_quality_score: Math.round(qualityAvg?.avg_score || 0),
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
