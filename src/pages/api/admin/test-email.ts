export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const apiKey = runtime?.env?.RESEND_API_KEY as string | undefined;

    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY not set' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BRITZMEDI Global <noreply@britzmedi.com>',
        to: ['sh.lee@britzmedi.co.kr'],
        subject: '[TEST] BRITZMEDI Email ' + new Date().toISOString(),
        html: '<h2>Email test OK</h2><p>Sent at ' + new Date().toISOString() + '</p>',
      }),
    });

    const body = await res.text();

    return new Response(JSON.stringify({
      ok: res.ok,
      status: res.status,
      body: body,
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }
};
