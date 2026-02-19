// YouTube transcript extraction and metadata
// Uses YouTube innertube API with ANDROID client (works in Cloudflare Workers)

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name: string;
  kind?: string; // 'asr' for auto-generated
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

const USER_AGENT = 'com.google.android.youtube/19.44.38 (Linux; U; Android 14) gzip';

/**
 * Extract transcript from YouTube video.
 * Uses YouTube innertube API with ANDROID client (bypasses consent pages).
 * Works reliably in Cloudflare Workers environment.
 */
export async function extractTranscript(youtubeId: string): Promise<ExtractResult> {
  // Step 1: Get player response via innertube API
  const playerResponse = await fetchPlayerResponse(youtubeId);

  // Step 2: Extract caption tracks
  const captionTracks = extractCaptionTracks(playerResponse);

  if (captionTracks.length === 0) {
    throw new Error(
      'No captions available for this video. The video must have subtitles or auto-generated captions enabled.'
    );
  }

  // Step 3: Select best caption track
  const { track, language } = selectBestTrack(captionTracks);

  // Step 4: Fetch and parse the captions
  const segments = await fetchCaptions(track.baseUrl);

  if (!segments || segments.length === 0) {
    throw new Error('Caption track was found but contained no text segments.');
  }

  // Combine segments into full text
  const transcript = segments.map(s => s.text).join(' ');

  // Step 5: Extract metadata
  const metadata = extractMetadata(playerResponse);

  return { transcript, language, metadata };
}

/**
 * Fetch player response via YouTube innertube API (ANDROID client).
 * ANDROID client is used because WEB client requires consent cookies
 * and returns UNPLAYABLE from server environments like Cloudflare Workers.
 */
async function fetchPlayerResponse(youtubeId: string): Promise<any> {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      videoId: youtubeId,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.44.38',
          androidSdkVersion: 34,
          hl: 'en',
          gl: 'US',
        },
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      `YouTube innertube API failed (HTTP ${res.status}). ` +
      `This may indicate the ANDROID client version is blocked. ` +
      `Response: ${errBody.slice(0, 200)}`
    );
  }

  const data = await res.json();

  // Check playability
  const status = (data as any)?.playabilityStatus?.status;
  if (status === 'ERROR' || status === 'LOGIN_REQUIRED') {
    const reason = (data as any)?.playabilityStatus?.reason || 'Video unavailable';
    throw new Error(`Video not accessible: ${reason}`);
  }

  return data;
}

/**
 * Extract caption tracks from player response JSON
 */
function extractCaptionTracks(playerResponse: any): CaptionTrack[] {
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer;
  if (!captions?.captionTracks) {
    return [];
  }

  return captions.captionTracks.map((track: any) => ({
    baseUrl: track.baseUrl,
    languageCode: track.languageCode || 'unknown',
    name: track.name?.simpleText || track.name?.runs?.[0]?.text || '',
    kind: track.kind || '',
  }));
}

/**
 * Select the best caption track:
 * 1. English manual captions
 * 2. English auto-generated
 * 3. Any manual captions
 * 4. Any auto-generated captions
 */
function selectBestTrack(tracks: CaptionTrack[]): { track: CaptionTrack; language: string } {
  const enManual = tracks.find(t => t.languageCode.startsWith('en') && t.kind !== 'asr');
  if (enManual) return { track: enManual, language: 'en' };

  const enAuto = tracks.find(t => t.languageCode.startsWith('en') && t.kind === 'asr');
  if (enAuto) return { track: enAuto, language: 'en' };

  const anyManual = tracks.find(t => t.kind !== 'asr');
  if (anyManual) return { track: anyManual, language: anyManual.languageCode };

  return { track: tracks[0], language: tracks[0].languageCode };
}

/**
 * Fetch captions from the timedtext URL.
 * Tries JSON3 format first (easier to parse), falls back to XML.
 */
async function fetchCaptions(baseUrl: string): Promise<TranscriptSegment[]> {
  // Try JSON3 format first
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('fmt', 'json3');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (res.ok) {
      const data = await res.json() as any;
      if (data.events) {
        const segments = parseJson3Captions(data.events);
        if (segments.length > 0) return segments;
      }
    }
  } catch {
    // Fall through to XML
  }

  // Fallback: XML format
  const res = await fetch(baseUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch captions: HTTP ${res.status}`);
  }

  const xml = await res.text();
  return parseXmlCaptions(xml);
}

/**
 * Parse JSON3 format captions
 */
function parseJson3Captions(events: any[]): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];

  for (const event of events) {
    if (!event.segs) continue;

    const text = event.segs
      .map((seg: any) => seg.utf8 || '')
      .join('')
      .trim();

    if (text && text !== '\n') {
      segments.push({
        text: decodeHtmlEntities(text),
        offset: event.tStartMs || 0,
        duration: event.dDurationMs || 0,
      });
    }
  }

  return segments;
}

/**
 * Parse XML format captions (fallback)
 */
function parseXmlCaptions(xml: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const textRegex = /<text\s+start="([^"]*)"(?:\s+dur="([^"]*)")?\s*>([\s\S]*?)<\/text>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const text = decodeHtmlEntities(match[3].trim());
    if (text) {
      segments.push({
        text,
        offset: Math.round(parseFloat(match[1]) * 1000),
        duration: Math.round(parseFloat(match[2] || '0') * 1000),
      });
    }
  }

  return segments;
}

/**
 * Decode HTML entities in caption text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Extract metadata from player response
 */
function extractMetadata(playerResponse: any): VideoMetadata {
  const videoDetails = playerResponse?.videoDetails || {};
  const microformat = playerResponse?.microformat?.playerMicroformatRenderer || {};

  return {
    title: videoDetails.title || microformat.title?.simpleText || 'Untitled Video',
    channelName: videoDetails.author || microformat.ownerChannelName || 'Unknown Channel',
    channelId: videoDetails.channelId || microformat.externalChannelId || '',
    description: (videoDetails.shortDescription || microformat.description?.simpleText || '').slice(0, 500),
    duration: videoDetails.lengthSeconds ? formatDuration(parseInt(videoDetails.lengthSeconds)) : '',
    publishedAt: microformat.publishDate || microformat.uploadDate || '',
  };
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
