export type SocialChannel = 'twitter' | 'linkedin' | 'facebook' | 'instagram';
export type SocialPostStatus = 'pending' | 'posted' | 'failed' | 'skipped';

export interface SocialPost {
  id: number;
  post_id: string;
  channel: SocialChannel;
  content: string;
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  external_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  blog_title?: string;
  blog_slug?: string;
}

export interface SocialAccount {
  id: number;
  channel: SocialChannel;
  account_name: string;
  account_id: string | null;
  enabled: number;
  auto_post: number;
  created_at: string;
  updated_at: string;
}

export interface PostToSocialInput {
  postId: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featuredImage: string | null;
  doctorName: string | null;
}

export interface SocialPostResult {
  channel: SocialChannel;
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface PostMetadata {
  imageUrl?: string;
}

export const CHANNEL_LABELS: Record<SocialChannel, string> = {
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

export const CHANNEL_CHAR_LIMITS: Record<SocialChannel, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
};

export interface ChannelPosterEnv {
  TWITTER_API_KEY?: string;
  TWITTER_API_SECRET?: string;
  TWITTER_ACCESS_TOKEN?: string;
  TWITTER_ACCESS_TOKEN_SECRET?: string;
  SESSION?: KVNamespace;
  LINKEDIN_CLIENT_ID?: string;
  LINKEDIN_CLIENT_SECRET?: string;
  INSTAGRAM_ACCESS_TOKEN?: string;
  INSTAGRAM_APP_ID?: string;
  INSTAGRAM_APP_SECRET?: string;
}

export type ChannelPoster = (content: string, env: ChannelPosterEnv, metadata?: PostMetadata) => Promise<SocialPostResult>;
