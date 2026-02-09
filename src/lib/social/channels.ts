// Social Media Channel Adapters

import type { SocialChannel, SocialPostResult, ChannelPosterEnv, ChannelPoster } from './types';
import { twitterPost } from './twitter';
import { linkedinPost } from './linkedin';
import { facebookPost } from './facebook';

export async function postToTwitter(content: string, env: ChannelPosterEnv): Promise<SocialPostResult> {
  if (!env.TWITTER_API_KEY || !env.TWITTER_API_SECRET || !env.TWITTER_ACCESS_TOKEN || !env.TWITTER_ACCESS_TOKEN_SECRET) {
    console.log('[Social:Twitter] API keys not configured');
    return {
      channel: 'twitter',
      success: false,
      error: 'Twitter API keys not configured. Set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET in environment.',
    };
  }

  const result = await twitterPost(content, {
    TWITTER_API_KEY: env.TWITTER_API_KEY,
    TWITTER_API_SECRET: env.TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN: env.TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET: env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  return {
    channel: 'twitter',
    success: result.success,
    externalId: result.tweetId,
    error: result.error,
  };
}

export async function postToLinkedIn(content: string, env: ChannelPosterEnv): Promise<SocialPostResult> {
  return linkedinPost(content, env);
}

export async function postToFacebook(content: string, env: ChannelPosterEnv): Promise<SocialPostResult> {
  return facebookPost(content, env);
}

export function getChannelPoster(channel: SocialChannel): ChannelPoster {
  switch (channel) {
    case 'twitter': return postToTwitter;
    case 'linkedin': return postToLinkedIn;
    case 'facebook': return postToFacebook;
  }
}
