// Content Pipeline Stats API
// GET /api/admin/content-pipeline/stats

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const [total, published, manual, failed, avgScore, avgRetries] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM content_queue').first<any>(),
      db.prepare("SELECT COUNT(*) as count FROM content_queue WHERE status = 'published'").first<any>(),
      db.prepare("SELECT COUNT(*) as count FROM content_queue WHERE status = 'manual_review'").first<any>(),
      db.prepare("SELECT COUNT(*) as count FROM content_queue WHERE status = 'failed'").first<any>(),
      db.prepare("SELECT AVG(json_extract(analysis_data, '$.overall_score')) as avg FROM content_queue WHERE analysis_data IS NOT NULL").first<any>(),
      db.prepare("SELECT AVG(retry_count) as avg FROM content_queue WHERE status = 'published'").first<any>(),
    ]);

    const totalCount = total?.count || 0;

    return new Response(JSON.stringify({
      total: totalCount,
      published: published?.count || 0,
      manual_review: manual?.count || 0,
      failed: failed?.count || 0,
      auto_publish_rate: totalCount ? ((published?.count || 0) / totalCount * 100).toFixed(1) + '%' : '0%',
      avg_score: avgScore?.avg ? Math.round(avgScore.avg as number) : 0,
      avg_retries: avgRetries?.avg ? (avgRetries.avg as number).toFixed(1) : '0',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Pipeline Stats] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to fetch stats' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
