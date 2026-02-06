// YouTube transcript extraction and metadata
// Custom implementation that works in Cloudflare Workers (no Node.js deps)

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

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Extract transcript from YouTube video.
 * Uses direct YouTube page scraping to find caption tracks,
 * then fetches and parses the timedtext XML.
 * Works reliably in Cloudflare Workers environment.
 */
export async function extractTranscript(youtubeId: string): Promise<ExtractResult> {
  // Step 1: Fetch the YouTube video page to get player config
  const playerResponse = await fetchPlayerResponse(youtubeId);

  // Step 2: Extract caption tracks from player response
  const captionTracks = extractCaptionTracks(playerResponse);

  if (captionTracks.length === 0) {
    throw new Error(
      'No captions available for this video. Please use a video with subtitles/captions enabled.'
    );
  }

  // Step 3: Select best caption track (prefer English, then any manual, then auto-generated)
  const { track, language } = selectBestTrack(captionTracks);

  // Step 4: Fetch and parse the caption XML
  const segments = await fetchCaptionXml(track.baseUrl);

  if (!segments || segments.length === 0) {
    throw new Error('Caption track was found but contained no text segments.');
  }

  // Combine segments into full text
  const transcript = segments.map(s => s.text).join(' ');

  // Step 5: Extract metadata from player response
  const metadata = extractMetadata(playerResponse, youtubeId);

  return { transcript, language, metadata };
}

/**
 * Fetch YouTube video page and extract ytInitialPlayerResponse
 */
async function fetchPlayerResponse(youtubeId: string): Promise<any> {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch YouTube page: HTTP ${res.status}`);
  }

  const html = await res.text();

  // Extract ytInitialPlayerResponse from the page
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  if (playerMatch) {
    try {
      return JSON.parse(playerMatch[1]);
    } catch {
      // Try alternative extraction
    }
  }

  // Alternative: look for player response in script tags
  const altMatch = html.match(/var\s+ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  if (altMatch) {
    try {
      return JSON.parse(altMatch[1]);
    } catch {
      // Fall through
    }
  }

  // Try innertube API as fallback
  return await fetchViaInnertube(youtubeId);
}

/**
 * Fallback: Use YouTube's innertube API directly
 */
async function fetchViaInnertube(youtubeId: string): Promise<any> {
  const apiUrl = 'https://www.youtube.com/youtubei/v1/player';

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      videoId: youtubeId,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240101.00.00',
          hl: 'en',
          gl: 'US',
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`YouTube API request failed: HTTP ${res.status}`);
  }

  return await res.json();
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
  // Prefer English manual
  const enManual = tracks.find(t => t.languageCode.startsWith('en') && t.kind !== 'asr');
  if (enManual) return { track: enManual, language: 'en' };

  // English auto-generated
  const enAuto = tracks.find(t => t.languageCode.startsWith('en') && t.kind === 'asr');
  if (enAuto) return { track: enAuto, language: 'en' };

  // Any manual captions
  const anyManual = tracks.find(t => t.kind !== 'asr');
  if (anyManual) return { track: anyManual, language: anyManual.languageCode };

  // Any auto-generated
  return { track: tracks[0], language: tracks[0].languageCode };
}

/**
 * Fetch caption XML and parse into segments
 */
async function fetchCaptionXml(baseUrl: string): Promise<TranscriptSegment[]> {
  // Request JSON3 format for easier parsing (no XML parsing needed)
  const url = new URL(baseUrl);
  url.searchParams.set('fmt', 'json3');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (res.ok) {
    try {
      const data = await res.json() as any;
      if (data.events) {
        return parseJson3Captions(data.events);
      }
    } catch {
      // Fall back to XML format
    }
  }

  // Fallback: fetch XML format
  const xmlRes = await fetch(baseUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!xmlRes.ok) {
    throw new Error(`Failed to fetch captions: HTTP ${xmlRes.status}`);
  }

  const xml = await xmlRes.text();
  return parseXmlCaptions(xml);
}

/**
 * Parse JSON3 format captions (preferred - no XML parsing needed)
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

  // Simple regex-based XML parsing (works in Workers, no DOM parser needed)
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
function extractMetadata(playerResponse: any, youtubeId: string): VideoMetadata {
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
