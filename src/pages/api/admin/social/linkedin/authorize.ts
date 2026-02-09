export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;

    if (!env?.LINKEDIN_CLIENT_ID || !env?.LINKEDIN_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: 'LinkedIn credentials not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env?.SESSION) {
      return new Response(JSON.stringify({ error: 'SESSION KV not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate random state for CSRF protection
    const stateBytes = new Uint8Array(16);
    crypto.getRandomValues(stateBytes);
    const state = Array.from(stateBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Store state in KV with 10-minute TTL
    await env.SESSION.put(`linkedin_oauth_state:${state}`, 'valid', { expirationTtl: 600 });

    // Build callback URL from the current request origin
    const origin = url.origin;
    const callbackUrl = `${origin}/api/admin/social/linkedin/callback`;

    // Build LinkedIn authorization URL
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', env.LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'openid profile w_member_social');

    return Response.redirect(authUrl.toString(), 302);
  } catch (error: any) {
    console.error('[LinkedIn Auth] Error:', error);
    return new Response(JSON.stringify({ error: 'Authorization failed', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
