export const prerender = false;

import type { APIRoute } from 'astro';

// Sending a real email is a side effect — require POST. GET must not trigger sends
// (crawlers, prefetchers, or casual browsing would fire emails otherwise).
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed. Use POST.' }), {
    status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
  });
};

export const POST: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const apiKey = runtime?.env?.RESEND_API_KEY as string | undefined;

    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY not set' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const toAddress = (runtime?.env?.ADMIN_EMAIL as string | undefined) || 'sh.lee@britzmedi.com';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BRITZMEDI Global <noreply@britzmedi.com>',
        to: [toAddress],
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
