// Facebook Graph API Client — Placeholder
// TODO: Implement when Facebook API keys are available
// Facebook requires Page Access Token and Graph API v18+

import type { SocialPostResult } from './types';

export async function facebookPost(content: string, _env: any): Promise<SocialPostResult> {
  console.log('[Social:Facebook] API not configured. Would post:', content.slice(0, 100));
  return {
    channel: 'facebook',
    success: false,
    error: 'Facebook API not configured. Add Facebook API credentials to enable posting.',
  };
}
