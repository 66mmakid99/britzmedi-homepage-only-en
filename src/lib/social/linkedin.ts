// LinkedIn API Client — OAuth 2.0 with REST API

import type { SocialPostResult, ChannelPosterEnv } from './types';

interface LinkedInCredentials {
  access_token: string;
  person_id: string;
  name: string;
  expires_at: number;
}

export async function getLinkedInCredentials(kv: KVNamespace): Promise<LinkedInCredentials | null> {
  const data = await kv.get('linkedin_credentials', { type: 'json' }) as LinkedInCredentials | null;
  if (!data) return null;
  if (Date.now() > data.expires_at) {
    console.log('[LinkedIn] Token expired');
    return null;
  }
  return data;
}

export async function verifyLinkedInConnection(kv: KVNamespace): Promise<{ connected: boolean; account?: string; error?: string }> {
  const creds = await getLinkedInCredentials(kv);
  if (!creds) {
    return { connected: false, error: 'Not connected' };
  }

  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${creds.access_token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[LinkedIn] Verify failed:', res.status, body);
      return { connected: false, error: `Token invalid (${res.status})` };
    }

    return { connected: true, account: creds.name };
  } catch (err: any) {
    console.error('[LinkedIn] Verify error:', err);
    return { connected: false, error: err.message || 'Connection check failed' };
  }
}

export async function linkedinPost(content: string, env: ChannelPosterEnv): Promise<SocialPostResult> {
  if (!env.SESSION) {
    return {
      channel: 'linkedin',
      success: false,
      error: 'SESSION KV not available',
    };
  }

  const creds = await getLinkedInCredentials(env.SESSION);
  if (!creds) {
    return {
      channel: 'linkedin',
      success: false,
      error: 'LinkedIn not connected. Please connect via Admin > Social.',
    };
  }

  try {
    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.access_token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${creds.person_id}`,
        commentary: content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[LinkedIn] Post error ${res.status}:`, errorBody);
      return {
        channel: 'linkedin',
        success: false,
        error: `LinkedIn API error ${res.status}: ${errorBody}`,
      };
    }

    // LinkedIn returns the post URN in the x-restli-id header
    const postId = res.headers.get('x-restli-id') || undefined;
    return {
      channel: 'linkedin',
      success: true,
      externalId: postId,
    };
  } catch (err: any) {
    console.error('[LinkedIn] Post error:', err);
    return {
      channel: 'linkedin',
      success: false,
      error: err.message || 'Failed to post to LinkedIn',
    };
  }
}
