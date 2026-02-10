export const prerender = false;

import type { APIRoute } from 'astro';
import { refreshInstagramToken } from '../../../../lib/social/instagram';

type RefreshChannel = 'instagram' | 'linkedin' | 'all';
const VALID_CHANNELS: RefreshChannel[] = ['instagram', 'linkedin', 'all'];

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
    if (channel === 'instagram' || channel === 'all') {
      const igResult = await refreshInstagramToken(env || {});
      results.push({
        channel: 'instagram',
        success: igResult.success,
        message: igResult.success ? 'Token refreshed successfully' : undefined,
        error: igResult.error,
      });
    }

    // LinkedIn — does not support token refresh
    if (channel === 'linkedin' || channel === 'all') {
      results.push({
        channel: 'linkedin',
        success: false,
        message: 'LinkedIn uses OAuth 2.0 authorization code flow and does not support token refresh. Please re-authorize via Admin > Social > LinkedIn Connect.',
      });
    }

    const allSuccess = results.every((r) => r.success);
    const anySuccess = results.some((r) => r.success);

    return new Response(JSON.stringify({
      success: channel === 'all' ? anySuccess : allSuccess,
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
