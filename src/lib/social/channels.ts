// Social Media Channel Adapters - Placeholder implementations
// Replace with actual API integrations when keys are configured

import type { SocialChannel, SocialPostResult } from './types';

export async function postToTwitter(content: string): Promise<SocialPostResult> {
  console.log('[Social:Twitter] Would post:', content.slice(0, 100));
  return {
    channel: 'twitter',
    success: true,
    externalId: `tw_placeholder_${Date.now()}`,
  };
}

export async function postToLinkedIn(content: string): Promise<SocialPostResult> {
  console.log('[Social:LinkedIn] Would post:', content.slice(0, 100));
  return {
    channel: 'linkedin',
    success: true,
    externalId: `li_placeholder_${Date.now()}`,
  };
}

export async function postToFacebook(content: string): Promise<SocialPostResult> {
  console.log('[Social:Facebook] Would post:', content.slice(0, 100));
  return {
    channel: 'facebook',
    success: true,
    externalId: `fb_placeholder_${Date.now()}`,
  };
}

export function getChannelPoster(channel: SocialChannel) {
  switch (channel) {
    case 'twitter': return postToTwitter;
    case 'linkedin': return postToLinkedIn;
    case 'facebook': return postToFacebook;
  }
}
