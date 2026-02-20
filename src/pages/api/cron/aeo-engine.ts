// Cron API — AEO Growth Engine scheduler
// POST /api/cron/aeo-engine
// Security: Bearer token (CRON_SECRET)
// Individual modes (diagnose, plan, produce, track, analyze): synchronous
// Full mode: ctx.waitUntil() background execution

export const prerender = false;

import type { APIRoute } from 'astro';
import { diagnose, plan, produce, analyze, track, runFullCycle } from '../../../lib/aeo-engine';

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

  // Full mode → background (too long for synchronous)
  if (mode === 'full' && ctx?.waitUntil) {
    ctx.waitUntil((async () => {
      try {
        await runFullCycle(env);
      } catch (e: any) {
        console.error(`[Cron AEO] full cycle error:`, e.message);
        try {
          await env.DB.prepare(
            `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('full', 'error', ?, datetime('now'))`
          ).bind(JSON.stringify({ error: e.message })).run();
        } catch {}
      }
    })());

    return new Response(JSON.stringify({
      success: true,
      message: 'AEO full cycle started in background',
      mode: 'full',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // All other modes → synchronous (each step <100s)
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
          return new Response(JSON.stringify({ error: 'No diagnosis found. Run diagnose first.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
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

    return new Response(JSON.stringify({ success: true, mode, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[Cron AEO Engine] Error:', e);
    return new Response(JSON.stringify({ success: false, mode, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
