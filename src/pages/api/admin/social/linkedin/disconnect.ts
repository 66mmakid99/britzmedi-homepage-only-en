export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;
    const db = env?.DB as D1Database | undefined;

    if (!env?.SESSION) {
      return new Response(JSON.stringify({ error: 'SESSION KV not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete credentials from KV
    await env.SESSION.delete('linkedin_credentials');

    // Disable LinkedIn account in D1
    if (db) {
      try {
        await db.prepare(
          'UPDATE social_accounts SET enabled = 0, updated_at = datetime(\'now\') WHERE channel = ?'
        ).bind('linkedin').run();
      } catch (dbErr) {
        console.error('[LinkedIn Disconnect] DB update failed:', dbErr);
      }
    }

    console.log('[LinkedIn] Disconnected');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[LinkedIn Disconnect] Error:', error);
    return new Response(JSON.stringify({ error: 'Disconnect failed', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
