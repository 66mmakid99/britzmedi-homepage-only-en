// POST /api/admin/aeo-engine/run — Manual cycle execution from dashboard
export const prerender = false;

import type { APIRoute } from 'astro';
import { diagnose, plan, produce, analyze, track, runFullCycle } from '../../../../lib/aeo-engine';

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const env = runtime?.env;

  if (!env?.DB || !env?.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing required env vars' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const mode = body.mode || 'full';

  try {
    let result;

    switch (mode) {
      case 'diagnose':
        result = await diagnose(env);
        break;
      case 'plan': {
        const latest = await env.DB.prepare(
          `SELECT data FROM aeo_cycles WHERE phase='diagnose' ORDER BY created_at DESC LIMIT 1`
        ).first<any>();
        if (!latest?.data) {
          return new Response(JSON.stringify({ error: 'Run diagnose first' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        result = await plan(env, JSON.parse(latest.data));
        break;
      }
      case 'produce':
        result = await produce(env, body.max_items || 3);
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
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
