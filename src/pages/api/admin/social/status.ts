export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyCredentials } from '../../../../lib/social/twitter';
import { verifyLinkedInConnection } from '../../../../lib/social/linkedin';
import { verifyInstagramConnection } from '../../../../lib/social/instagram';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;

    const channels: Record<string, { connected: boolean; account?: string; error?: string }> = {
      twitter: { connected: false },
      linkedin: { connected: false },
      facebook: { connected: false, error: 'Not configured' },
      instagram: { connected: false },
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
        };
      } else {
        channels.twitter = {
          connected: false,
          error: result.error || 'Failed to verify credentials',
        };
      }
    } else {
      channels.twitter = {
        connected: false,
        error: 'API keys not configured',
      };
    }

    // Check LinkedIn connection
    if (env?.SESSION) {
      const liResult = await verifyLinkedInConnection(env.SESSION);
      channels.linkedin = liResult;
    } else {
      channels.linkedin = {
        connected: false,
        error: 'SESSION KV not available',
      };
    }

    // Check Instagram connection
    const igResult = await verifyInstagramConnection(env || {});
    channels.instagram = {
      connected: igResult.connected,
      account: igResult.account,
      error: igResult.error,
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
