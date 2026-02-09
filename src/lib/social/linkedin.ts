// LinkedIn API Client — Placeholder
// TODO: Implement when LinkedIn API keys are available
// LinkedIn requires OAuth 2.0 and organization page access

import type { SocialPostResult } from './types';

export async function linkedinPost(content: string, _env: any): Promise<SocialPostResult> {
  console.log('[Social:LinkedIn] API not configured. Would post:', content.slice(0, 100));
  return {
    channel: 'linkedin',
    success: false,
    error: 'LinkedIn API not configured. Add LinkedIn API credentials to enable posting.',
  };
}
