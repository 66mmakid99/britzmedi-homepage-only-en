// YouTube transcript extraction and metadata

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface VideoMetadata {
  title: string;
  channelName: string;
  channelId: string;
  description: string;
  duration: string;
  publishedAt: string;
}

export interface ExtractResult {
  transcript: string;
  language: string;
  metadata: VideoMetadata;
}

/**
 * Extract transcript from YouTube video using youtube-transcript package.
 * Falls back to fetching page data for metadata.
 */
export async function extractTranscript(youtubeId: string): Promise<ExtractResult> {
  // Dynamically import youtube-transcript (ESM)
  const { YoutubeTranscript } = await import('youtube-transcript');

  let segments: TranscriptSegment[];
  let language = 'en';

  try {
    // Try to get English transcript first
    segments = await YoutubeTranscript.fetchTranscript(youtubeId, { lang: 'en' });
    language = 'en';
  } catch {
    try {
      // Fallback: get any available transcript
      segments = await YoutubeTranscript.fetchTranscript(youtubeId);
      // Detect language from the content (will be translated later if needed)
      language = 'unknown';
    } catch (err) {
      throw new Error(`Failed to extract transcript: ${(err as Error).message}. The video may not have captions available.`);
    }
  }

  if (!segments || segments.length === 0) {
    throw new Error('No transcript segments found. The video may not have captions.');
  }

  // Combine segments into full text
  const transcript = segments.map(s => s.text).join(' ');

  // Fetch metadata from oEmbed API (no API key needed)
  const metadata = await fetchVideoMetadata(youtubeId);

  return {
    transcript,
    language,
    metadata,
  };
}

async function fetchVideoMetadata(youtubeId: string): Promise<VideoMetadata> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
    const res = await fetch(oembedUrl);

    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || 'Untitled Video',
        channelName: data.author_name || 'Unknown Channel',
        channelId: '',
        description: '',
        duration: '',
        publishedAt: '',
      };
    }
  } catch {
    // Fall through
  }

  return {
    title: 'Untitled Video',
    channelName: 'Unknown Channel',
    channelId: '',
    description: '',
    duration: '',
    publishedAt: '',
  };
}
