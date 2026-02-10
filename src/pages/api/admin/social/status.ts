export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyCredentials } from '../../../../lib/social/twitter';
import { verifyLinkedInConnection } from '../../../../lib/social/linkedin';
import { verifyInstagramConnection } from '../../../../lib/social/instagram';

type TokenStatus = 'healthy' | 'expiring' | 'expired' | 'disconnected';

interface ChannelStatus {
  connected: boolean;
  account?: string;
  error?: string;
  status: TokenStatus;
  expires_at?: number;
  expires_in_days?: number;
}

function computeTokenStatus(expiresAt: number | undefined, connected: boolean): { status: TokenStatus; expires_in_days?: number } {
  if (!connected) {
    return { status: 'disconnected' };
  }
  if (!expiresAt) {
    // No expiry info but connected (e.g. Twitter static tokens)
    return { status: 'healthy' };
  }
  const now = Date.now();
  if (now > expiresAt) {
    return { status: 'expired' };
  }
  const msRemaining = expiresAt - now;
  const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
  if (daysRemaining < 7) {
    return { status: 'expiring', expires_in_days: daysRemaining };
  }
  return { status: 'healthy', expires_in_days: daysRemaining };
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;

    const channels: Record<string, ChannelStatus> = {
      twitter: { connected: false, status: 'disconnected' },
      linkedin: { connected: false, status: 'disconnected' },
      facebook: { connected: false, error: 'Not configured', status: 'disconnected' },
      instagram: { connected: false, status: 'disconnected' },
    };

    // Check Twitter connection
    if (env?.TWITTER_API_KEY && env?.TWITTER_API_SECRET && env?.TWITTER_ACCESS_TOKEN && env?.TWITTER_ACCESS_TOKEN_SECRET) {
      const result = await verifyCredentials({
        TWITTER_API_KEY: env.TWITTER_API_KEY,
        TWITTER_API_SECRET: env.TWITTER_API_SECRET,
        TWITTER_ACCESS_TOKEN: env.TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_TOKEN_SECRET: env.TWITTER_ACCESS_TOKEN_SECRET,
      });

      if (result.success && result.user) {
        channels.twitter = {
          connected: true,
          account: `@${result.user.username}`,
          status: 'healthy',
          // Twitter uses static OAuth 1.0a tokens — they do not expire
        };
      } else {
        channels.twitter = {
          connected: false,
          error: result.error || 'Failed to verify credentials',
          status: 'disconnected',
        };
      }
    } else {
      channels.twitter = {
        connected: false,
        error: 'API keys not configured',
        status: 'disconnected',
      };
    }

    // Check LinkedIn connection
    if (env?.SESSION) {
      const liResult = await verifyLinkedInConnection(env.SESSION);

      // Read credentials from KV to get expires_at
      let liExpiresAt: number | undefined;
      try {
        const liCreds = await env.SESSION.get('linkedin_credentials', { type: 'json' }) as { expires_at?: number } | null;
        liExpiresAt = liCreds?.expires_at;
      } catch {
        // KV read failed, continue without expiry info
      }

      const { status: liStatus, expires_in_days: liDays } = computeTokenStatus(liExpiresAt, liResult.connected);

      channels.linkedin = {
        connected: liResult.connected,
        account: liResult.account,
        error: liResult.error,
        status: liStatus,
        expires_at: liExpiresAt,
        expires_in_days: liDays,
      };
    } else {
      channels.linkedin = {
        connected: false,
        error: 'SESSION KV not available',
        status: 'disconnected',
      };
    }

    // Check Instagram connection
    const igResult = await verifyInstagramConnection(env || {});

    // Read credentials from KV to get expires_at
    let igExpiresAt: number | undefined;
    if (env?.SESSION) {
      try {
        const igCreds = await env.SESSION.get('instagram_credentials', { type: 'json' }) as { expires_at?: number } | null;
        igExpiresAt = igCreds?.expires_at;
      } catch {
        // KV read failed, continue without expiry info
      }
    }

    const { status: igStatus, expires_in_days: igDays } = computeTokenStatus(igExpiresAt, igResult.connected);

    channels.instagram = {
      connected: igResult.connected,
      account: igResult.account,
      error: igResult.error,
      status: igStatus,
      expires_at: igExpiresAt,
      expires_in_days: igDays,
    };

    return new Response(JSON.stringify({ channels }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Social Status API] Error:', error);
    return new Response(JSON.stringify({ error: 'Status check failed', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
