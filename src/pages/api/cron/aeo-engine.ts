// Cron API — AEO Growth Engine scheduler
// POST /api/cron/aeo-engine
// Security: Bearer token (CRON_SECRET)
// Async: returns 200 immediately, runs cycle in background via ctx.waitUntil()

export const prerender = false;

import type { APIRoute } from 'astro';
import { diagnose, plan, produce, analyze, track, runFullCycle } from '../../../lib/aeo-engine';

async function executeMode(mode: string, env: any, body: any) {
  try {
    let result;

    switch (mode) {
      case 'diagnose':
        result = await diagnose(env);
        break;
      case 'plan': {
        const latestDiagnosis = await env.DB.prepare(
          `SELECT data FROM aeo_cycles WHERE phase='diagnose' ORDER BY created_at DESC LIMIT 1`
        ).first<any>();
        if (!latestDiagnosis?.data) {
          await env.DB.prepare(
            `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('plan', 'error', ?, datetime('now'))`
          ).bind(JSON.stringify({ error: 'No diagnosis found' })).run();
          return;
        }
        result = await plan(env, JSON.parse(latestDiagnosis.data));
        break;
      }
      case 'produce':
        result = await produce(env, body.max_items || 1);
        break;
      case 'track':
        result = await track(env);
        break;
      case 'analyze':
        result = await analyze(env);
        break;
      case 'full':
      default:
        result = await runFullCycle(env);
        break;
    }

    console.log(`[Cron AEO] ${mode} completed:`, JSON.stringify(result).substring(0, 500));
  } catch (e: any) {
    console.error(`[Cron AEO] ${mode} error:`, e.message);
    // Log error to DB so dashboard can show it
    try {
      await env.DB.prepare(
        `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES (?, 'error', ?, datetime('now'))`
      ).bind(mode, JSON.stringify({ error: e.message })).run();
    } catch {}
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const env = runtime?.env;
  const ctx = runtime?.ctx;

  if (!env?.DB || !env?.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing required env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cron secret verification
  const authHeader = request.headers.get('Authorization');
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const mode = body.mode || 'full';

  // Run in background via ctx.waitUntil — returns immediately
  if (ctx?.waitUntil) {
    ctx.waitUntil(executeMode(mode, env, body));

    return new Response(JSON.stringify({
      success: true,
      message: `AEO ${mode} cycle started in background`,
      mode,
      check_status: 'GET /api/admin/aeo-engine/status',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fallback: no ctx.waitUntil (local dev) — run synchronously
  try {
    await executeMode(mode, env, body);
    return new Response(JSON.stringify({ success: true, mode, message: 'Completed synchronously' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
