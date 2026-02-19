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

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ANDROID_USER_AGENT = 'com.google.android.youtube/19.49.36 (Linux; U; Android 14; en_US) gzip';

/**
 * Extract transcript from YouTube video.
 * Tries WEB HTML scraping first (more resilient to bot detection),
 * then falls back to ANDROID innertube API.
 */
export async function extractTranscript(youtubeId: string): Promise<ExtractResult> {
  // Try WEB approach first (scrape watch page HTML)
  let playerResponse: any;
  let fetchMethod = 'web';

  try {
    playerResponse = await fetchPlayerResponseWeb(youtubeId);
  } catch (webErr: any) {
    console.warn('[YouTube] WEB extraction failed, trying ANDROID:', webErr.message);
    fetchMethod = 'android';
    // Fall back to ANDROID innertube API
    playerResponse = await fetchPlayerResponseAndroid(youtubeId);
  }

  // Extract caption tracks
  const captionTracks = extractCaptionTracks(playerResponse);

  if (captionTracks.length === 0) {
    throw new Error(
      'No captions available for this video. The video must have subtitles or auto-generated captions enabled.'
    );
  }

  // Select best caption track
  const { track, language } = selectBestTrack(captionTracks);

  // Fetch and parse the captions
  const segments = await fetchCaptions(track.baseUrl);

  if (!segments || segments.length === 0) {
    throw new Error('Caption track was found but contained no text segments.');
  }

  // Combine segments into full text
  const transcript = segments.map(s => s.text).join(' ');

  // Extract metadata
  const metadata = extractMetadata(playerResponse);

  return { transcript, language, metadata };
}

/**
 * Fetch player response by scraping the YouTube watch page HTML.
 * Extracts ytInitialPlayerResponse from the page source.
 * More resilient to bot detection than innertube API since it looks like
 * a regular browser page load.
 */
async function fetchPlayerResponseWeb(youtubeId: string): Promise<any> {
  const url = `https://www.youtube.com/watch?v=${youtubeId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      // Bypass YouTube consent/cookie wall
      'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch YouTube page (HTTP ${res.status})`);
  }

  const html = await res.text();

  // Check for bot detection page
  if (html.includes('Sign in to confirm') || html.includes('confirm you\'re not a bot')) {
    throw new Error('YouTube bot detection on watch page');
  }

  // Extract ytInitialPlayerResponse from the page HTML
  const playerData = extractJsonVarFromHtml(html, 'ytInitialPlayerResponse');
  if (!playerData) {
    throw new Error('Could not extract ytInitialPlayerResponse from YouTube page');
  }

  // Check playability
  const status = playerData?.playabilityStatus?.status;
  if (status === 'ERROR' || status === 'LOGIN_REQUIRED') {
    const reason = playerData?.playabilityStatus?.reason || 'Video unavailable';
    throw new Error(`Video not accessible: ${reason}`);
  }

  return playerData;
}

/**
 * Extract a JSON variable assignment from HTML source.
 * Handles nested braces correctly using bracket counting.
 */
function extractJsonVarFromHtml(html: string, varName: string): any {
  // Try multiple patterns YouTube uses
  const patterns = [
    `var ${varName} = `,
    `${varName} = `,
  ];

  for (const pattern of patterns) {
    const idx = html.indexOf(pattern);
    if (idx === -1) continue;

    const start = idx + pattern.length;
    if (html[start] !== '{') continue;

    // Count braces to find the end of the JSON object
    let depth = 0;
    let inStr = false;
    let esc = false;

    for (let i = start; i < Math.min(start + 2_000_000, html.length); i++) {
      if (esc) { esc = false; continue; }
      const c = html[i];
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(start, i + 1));
          } catch {
            break; // JSON parse failed, try next pattern
          }
        }
      }
    }
  }

  return null;
}

/**
 * Fetch player response via YouTube innertube API (ANDROID client).
 * Used as fallback when WEB scraping fails.
 */
async function fetchPlayerResponseAndroid(youtubeId: string): Promise<any> {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': ANDROID_USER_AGENT,
    },
    body: JSON.stringify({
      videoId: youtubeId,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.49.36',
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
      headers: { 'User-Agent': BROWSER_USER_AGENT },
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
    headers: { 'User-Agent': BROWSER_USER_AGENT },
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
