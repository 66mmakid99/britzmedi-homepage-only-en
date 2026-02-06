// YouTube to Blog - Validation schemas and types

// ============================================
// Types
// ============================================

export type JobStatus =
  | 'pending'
  | 'extracting'
  | 'translating'
  | 'generating'
  | 'researching'
  | 'imaging'
  | 'finalizing'
  | 'completed'
  | 'failed';

export type PostStatus = 'draft' | 'review' | 'approved' | 'published' | 'unpublished';

export type StepName = 'extract' | 'translate' | 'generate' | 'research' | 'image' | 'finalize';

export interface BlogJob {
  id: string;
  youtube_url: string;
  youtube_id: string;
  video_title: string | null;
  channel_name: string | null;
  channel_id: string | null;
  status: JobStatus;
  current_step: string | null;
  progress: number;
  error_message: string | null;
  transcript_text: string | null;
  transcript_lang: string | null;
  translated_text: string | null;
  target_lang: string;
  tone: string;
  word_count: number;
  blog_post_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface BlogPost {
  id: string;
  job_id: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  meta_description: string | null;
  keywords: string | null;
  schema_json_ld: string | null;
  featured_image: string | null;
  images: string | null;
  youtube_embed_url: string | null;
  doctor_name: string | null;
  doctor_title: string | null;
  doctor_credentials: string | null;
  doctor_image: string | null;
  doctor_bio: string | null;
  doctor_verified: boolean | null;
  doctor_verified_source: string | null;
  category: string;
  tags: string | null;
  status: PostStatus;
  approval_token: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  github_commit_sha: string | null;
  youtube_url: string | null;
  youtube_id: string | null;
  channel_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface YouTubeChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_url: string | null;
  thumbnail_url: string | null;
  auto_process: number;
  last_checked_at: string | null;
  created_at: string;
}

export interface YouTubeVideo {
  id: string;
  youtube_id: string;
  channel_id: string | null;
  title: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  published_at: string | null;
  processed: number;
  job_id: string | null;
  blog_post_id: string | null;
  created_at: string;
}

// ============================================
// Validation helpers
// ============================================

const YOUTUBE_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?$/;
const YOUTUBE_CHANNEL_REGEX = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@[\w-]+|channel\/[a-zA-Z0-9_-]+|c\/[\w-]+)/;

export function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[1] : null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

export function isValidChannelUrl(url: string): boolean {
  return YOUTUBE_CHANNEL_REGEX.test(url);
}

export interface CreateJobInput {
  youtube_url: string;
  target_lang?: string;
  tone?: string;
  word_count?: number;
}

export interface CreateJobError {
  field: string;
  message: string;
}

export function validateCreateJob(data: unknown): { valid: true; data: CreateJobInput } | { valid: false; errors: CreateJobError[] } {
  const errors: CreateJobError[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }

  const input = data as Record<string, unknown>;

  if (!input.youtube_url || typeof input.youtube_url !== 'string') {
    errors.push({ field: 'youtube_url', message: 'YouTube URL is required' });
  } else if (!isValidYouTubeUrl(input.youtube_url)) {
    errors.push({ field: 'youtube_url', message: 'Invalid YouTube URL format' });
  }

  if (input.target_lang !== undefined && typeof input.target_lang !== 'string') {
    errors.push({ field: 'target_lang', message: 'target_lang must be a string' });
  }

  if (input.tone !== undefined) {
    const validTones = ['professional', 'casual', 'academic'];
    if (typeof input.tone !== 'string' || !validTones.includes(input.tone)) {
      errors.push({ field: 'tone', message: 'tone must be one of: professional, casual, academic' });
    }
  }

  if (input.word_count !== undefined) {
    const wc = Number(input.word_count);
    if (isNaN(wc) || wc < 500 || wc > 5000) {
      errors.push({ field: 'word_count', message: 'word_count must be between 500 and 5000' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      youtube_url: input.youtube_url as string,
      target_lang: (input.target_lang as string) || 'en',
      tone: (input.tone as string) || 'professional',
      word_count: input.word_count ? Number(input.word_count) : 1500,
    },
  };
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  excerpt?: string;
  meta_description?: string;
  keywords?: string[];
  featured_image?: string;
  category?: string;
  tags?: string[];
  doctor_name?: string;
  doctor_title?: string;
  doctor_credentials?: string;
  doctor_image?: string;
  doctor_bio?: string;
  status?: PostStatus;
}

export function validateUpdatePost(data: unknown): { valid: true; data: UpdatePostInput } | { valid: false; errors: CreateJobError[] } {
  const errors: CreateJobError[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }

  const input = data as Record<string, unknown>;

  if (input.status !== undefined) {
    const validStatuses: PostStatus[] = ['draft', 'review', 'approved', 'published', 'unpublished'];
    if (!validStatuses.includes(input.status as PostStatus)) {
      errors.push({ field: 'status', message: 'Invalid status value' });
    }
  }

  if (input.title !== undefined && (typeof input.title !== 'string' || input.title.length === 0)) {
    errors.push({ field: 'title', message: 'Title must be a non-empty string' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: input as UpdatePostInput };
}

// Step progress mapping
export const STEP_PROGRESS: Record<StepName, { start: number; end: number; status: JobStatus }> = {
  extract: { start: 0, end: 20, status: 'extracting' },
  translate: { start: 20, end: 40, status: 'translating' },
  generate: { start: 40, end: 60, status: 'generating' },
  research: { start: 60, end: 75, status: 'researching' },
  image: { start: 75, end: 95, status: 'imaging' },
  finalize: { start: 95, end: 100, status: 'finalizing' },
};
