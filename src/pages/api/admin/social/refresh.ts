export const prerender = false;

import type { APIRoute } from 'astro';
import { refreshInstagramToken } from '../../../../lib/social/instagram';

type RefreshChannel = 'instagram' | 'linkedin' | 'twitter' | 'all' | 'auto';
const VALID_CHANNELS: RefreshChannel[] = ['instagram', 'linkedin', 'twitter', 'all', 'auto'];

interface RefreshResult {
  channel: string;
  success: boolean;
  message?: string;
  error?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;

    const body = await request.json() as { channel?: string };
    const channel = body.channel as RefreshChannel;

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return new Response(JSON.stringify({
        error: `Valid channel required: ${VALID_CHANNELS.join(', ')}`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: RefreshResult[] = [];

    // Instagram refresh
    if (channel === 'instagram' || channel === 'all' || channel === 'auto') {
      // For 'auto' mode, only refresh if token is expiring (< 14 days)
      let shouldRefresh = channel !== 'auto';
      if (channel === 'auto' && env?.SESSION) {
        try {
          const igCreds = await env.SESSION.get('instagram_credentials', { type: 'json' }) as { expires_at?: number } | null;
          if (igCreds?.expires_at) {
            const daysLeft = (igCreds.expires_at - Date.now()) / (1000 * 60 * 60 * 24);
            shouldRefresh = daysLeft < 14 && daysLeft > 0; // Only refresh if expiring but not yet expired
          }
        } catch { /* ignore */ }
      }

      if (shouldRefresh) {
        const igResult = await refreshInstagramToken(env || {});
        results.push({
          channel: 'instagram',
          success: igResult.success,
          message: igResult.success ? 'Token refreshed successfully' : undefined,
          error: igResult.error,
        });
      } else if (channel === 'auto') {
        results.push({
          channel: 'instagram',
          success: true,
          message: 'Token is healthy, no refresh needed',
        });
      }
    }

    // LinkedIn — does not support token refresh
    if (channel === 'linkedin' || channel === 'all') {
      results.push({
        channel: 'linkedin',
        success: false,
        message: 'LinkedIn requires re-authorization. Go to Social > Accounts and click "Reconnect LinkedIn".',
      });
    }

    // Twitter — static OAuth 1.0a tokens, no refresh needed
    if (channel === 'twitter' || channel === 'all') {
      results.push({
        channel: 'twitter',
        success: true,
        message: 'Twitter uses static OAuth 1.0a tokens that do not expire.',
      });
    }

    const allSuccess = results.every((r) => r.success);
    const anySuccess = results.some((r) => r.success);

    return new Response(JSON.stringify({
      success: channel === 'all' || channel === 'auto' ? anySuccess : allSuccess,
      results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Social Refresh API] Error:', error);
    return new Response(JSON.stringify({
      error: 'Token refresh failed',
      details: error?.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
