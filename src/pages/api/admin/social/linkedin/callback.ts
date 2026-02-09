export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;
    const db = env?.DB as D1Database | undefined;

    if (!env?.LINKEDIN_CLIENT_ID || !env?.LINKEDIN_CLIENT_SECRET || !env?.SESSION) {
      return Response.redirect(`${url.origin}/admin/social?linkedin_error=config`, 302);
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('[LinkedIn Callback] OAuth error:', error, url.searchParams.get('error_description'));
      return Response.redirect(`${url.origin}/admin/social?linkedin_error=${encodeURIComponent(error)}`, 302);
    }

    if (!code || !state) {
      return Response.redirect(`${url.origin}/admin/social?linkedin_error=missing_params`, 302);
    }

    // Validate state (CSRF protection)
    const storedState = await env.SESSION.get(`linkedin_oauth_state:${state}`);
    if (!storedState) {
      return Response.redirect(`${url.origin}/admin/social?linkedin_error=invalid_state`, 302);
    }

    // Clean up used state
    await env.SESSION.delete(`linkedin_oauth_state:${state}`);

    // Exchange code for access token
    const callbackUrl = `${url.origin}/api/admin/social/linkedin/callback`;
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: env.LINKEDIN_CLIENT_ID,
        client_secret: env.LINKEDIN_CLIENT_SECRET,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const tokenError = await tokenRes.text();
      console.error('[LinkedIn Callback] Token exchange failed:', tokenRes.status, tokenError);
      return Response.redirect(`${url.origin}/admin/social?linkedin_error=token_exchange`, 302);
    }

    const tokenData = await tokenRes.json() as {
      access_token: string;
      expires_in: number;
    };

    // Fetch user profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      const profileError = await profileRes.text();
      console.error('[LinkedIn Callback] Profile fetch failed:', profileRes.status, profileError);
      return Response.redirect(`${url.origin}/admin/social?linkedin_error=profile_fetch`, 302);
    }

    const profile = await profileRes.json() as {
      sub: string;
      name: string;
      email?: string;
    };

    // Store credentials in KV with 55-day TTL (token is valid for 60 days)
    const credentials = {
      access_token: tokenData.access_token,
      person_id: profile.sub,
      name: profile.name,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };

    const ttlSeconds = 55 * 24 * 60 * 60; // 55 days
    await env.SESSION.put('linkedin_credentials', JSON.stringify(credentials), {
      expirationTtl: ttlSeconds,
    });

    // Auto-create or update social_accounts record in D1
    if (db) {
      try {
        const existing = await db.prepare(
          'SELECT id FROM social_accounts WHERE channel = ?'
        ).bind('linkedin').first();

        if (existing) {
          await db.prepare(
            'UPDATE social_accounts SET account_name = ?, account_id = ?, enabled = 1, updated_at = datetime(\'now\') WHERE channel = ?'
          ).bind(profile.name, profile.sub, 'linkedin').run();
        } else {
          await db.prepare(
            'INSERT INTO social_accounts (channel, account_name, account_id, enabled, auto_post, created_at, updated_at) VALUES (?, ?, ?, 1, 0, datetime(\'now\'), datetime(\'now\'))'
          ).bind('linkedin', profile.name, profile.sub).run();
        }
      } catch (dbErr) {
        console.error('[LinkedIn Callback] DB update failed:', dbErr);
        // Non-fatal — continue
      }
    }

    console.log(`[LinkedIn] Connected: ${profile.name} (${profile.sub})`);
    return Response.redirect(`${url.origin}/admin/social?linkedin_connected=true`, 302);
  } catch (error: any) {
    console.error('[LinkedIn Callback] Error:', error);
    return Response.redirect(`${url.origin}/admin/social?linkedin_error=unknown`, 302);
  }
};
