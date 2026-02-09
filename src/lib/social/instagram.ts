// Instagram Graph API Client — Content Publishing API

import type { SocialPostResult, ChannelPosterEnv, PostMetadata } from './types';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`;

interface InstagramUser {
  id: string;
  username: string;
}

export async function getInstagramToken(env: ChannelPosterEnv): Promise<string | null> {
  // Check KV for refreshed token first, then fall back to env var
  if (env.SESSION) {
    const stored = await env.SESSION.get('instagram_credentials', { type: 'json' }) as { access_token: string; expires_at?: number } | null;
    if (stored?.access_token) {
      if (stored.expires_at && Date.now() > stored.expires_at) {
        console.log('[Instagram] KV token expired, falling back to env var');
      } else {
        return stored.access_token;
      }
    }
  }
  return env.INSTAGRAM_ACCESS_TOKEN || null;
}

export async function verifyInstagramConnection(env: ChannelPosterEnv): Promise<{ connected: boolean; account?: string; userId?: string; error?: string }> {
  const token = await getInstagramToken(env);
  if (!token) {
    return { connected: false, error: 'Not connected' };
  }

  try {
    const res = await fetch(`${GRAPH_API_BASE}/me?fields=id,username&access_token=${token}`);

    if (!res.ok) {
      const body = await res.text();
      console.error('[Instagram] Verify failed:', res.status, body);
      return { connected: false, error: `Token invalid (${res.status})` };
    }

    const user = await res.json() as InstagramUser;

    // Store/update token in KV if available (for future refresh)
    if (env.SESSION) {
      const existing = await env.SESSION.get('instagram_credentials', { type: 'json' }) as { access_token: string } | null;
      if (!existing) {
        await env.SESSION.put('instagram_credentials', JSON.stringify({
          access_token: token,
          user_id: user.id,
          username: user.username,
        }), { expirationTtl: 55 * 24 * 60 * 60 });
      }
    }

    return { connected: true, account: `@${user.username}`, userId: user.id };
  } catch (err: any) {
    console.error('[Instagram] Verify error:', err);
    return { connected: false, error: err.message || 'Connection check failed' };
  }
}

export async function refreshInstagramToken(env: ChannelPosterEnv): Promise<{ success: boolean; error?: string }> {
  const token = await getInstagramToken(env);
  if (!token) {
    return { success: false, error: 'No token to refresh' };
  }

  try {
    const res = await fetch(
      `${GRAPH_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[Instagram] Token refresh failed:', res.status, body);
      return { success: false, error: `Refresh failed (${res.status})` };
    }

    const data = await res.json() as { access_token: string; expires_in: number };

    if (env.SESSION) {
      // Fetch user info to store with token
      const meRes = await fetch(`${GRAPH_API_BASE}/me?fields=id,username&access_token=${data.access_token}`);
      let userId = '';
      let username = '';
      if (meRes.ok) {
        const user = await meRes.json() as InstagramUser;
        userId = user.id;
        username = user.username;
      }

      await env.SESSION.put('instagram_credentials', JSON.stringify({
        access_token: data.access_token,
        user_id: userId,
        username,
        expires_at: Date.now() + (data.expires_in * 1000),
      }), { expirationTtl: 55 * 24 * 60 * 60 });
    }

    console.log('[Instagram] Token refreshed successfully');
    return { success: true };
  } catch (err: any) {
    console.error('[Instagram] Token refresh error:', err);
    return { success: false, error: err.message };
  }
}

async function getInstagramUserId(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH_API_BASE}/me?fields=id&access_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json() as { id: string };
    return data.id;
  } catch {
    return null;
  }
}

export async function instagramPost(content: string, env: ChannelPosterEnv, metadata?: PostMetadata): Promise<SocialPostResult> {
  const token = await getInstagramToken(env);
  if (!token) {
    return {
      channel: 'instagram',
      success: false,
      error: 'Instagram not connected. Set INSTAGRAM_ACCESS_TOKEN in environment.',
    };
  }

  const imageUrl = metadata?.imageUrl;
  if (!imageUrl) {
    return {
      channel: 'instagram',
      success: false,
      error: 'Instagram requires an image. Provide an image URL to post.',
    };
  }

  // Ensure image URL is absolute
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `https://britzmedi.com${imageUrl}`;

  try {
    // Get user ID
    const userId = await getInstagramUserId(token);
    if (!userId) {
      return {
        channel: 'instagram',
        success: false,
        error: 'Failed to get Instagram user ID. Token may be invalid.',
      };
    }

    // Step 1: Create media container
    const createParams = new URLSearchParams({
      image_url: absoluteImageUrl,
      caption: content,
      access_token: token,
    });

    const createRes = await fetch(`${GRAPH_API_BASE}/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createParams.toString(),
    });

    if (!createRes.ok) {
      const errorBody = await createRes.text();
      console.error(`[Instagram] Create media error ${createRes.status}:`, errorBody);
      return {
        channel: 'instagram',
        success: false,
        error: `Instagram API error ${createRes.status}: ${errorBody}`,
      };
    }

    const createData = await createRes.json() as { id: string };
    const creationId = createData.id;

    // Step 2: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: token,
    });

    const publishRes = await fetch(`${GRAPH_API_BASE}/${userId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishParams.toString(),
    });

    if (!publishRes.ok) {
      const errorBody = await publishRes.text();
      console.error(`[Instagram] Publish error ${publishRes.status}:`, errorBody);
      return {
        channel: 'instagram',
        success: false,
        error: `Instagram publish error ${publishRes.status}: ${errorBody}`,
      };
    }

    const publishData = await publishRes.json() as { id: string };
    return {
      channel: 'instagram',
      success: true,
      externalId: publishData.id,
    };
  } catch (err: any) {
    console.error('[Instagram] Post error:', err);
    return {
      channel: 'instagram',
      success: false,
      error: err.message || 'Failed to post to Instagram',
    };
  }
}
