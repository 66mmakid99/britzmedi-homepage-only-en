// YouTube Channel Videos API
// GET /api/youtube/channel?url=... - Fetch channel videos via RSS

export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const channelUrl = url.searchParams.get('url');

  if (!channelUrl) {
    return new Response(JSON.stringify({ error: 'Channel URL is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Extract channel identifier from URL
    const channelId = await resolveChannelId(channelUrl);

    if (!channelId) {
      return new Response(JSON.stringify({ error: 'Could not resolve channel ID. Please provide a valid YouTube channel URL.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch RSS feed
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssResponse = await fetch(rssUrl);

    if (!rssResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch channel feed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rssText = await rssResponse.text();
    const { channelName, videos } = parseRssFeed(rssText);

    return new Response(JSON.stringify({
      channel_id: channelId,
      channel_name: channelName,
      videos,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Channel API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch channel data', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function resolveChannelId(channelUrl: string): Promise<string | null> {
  // Direct channel ID URL: youtube.com/channel/UCxxxx
  const channelMatch = channelUrl.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelMatch) return channelMatch[1];

  // Handle @username or /c/name by fetching the page and extracting channel ID
  try {
    const res = await fetch(channelUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BritzmediBlogBot/1.0)' },
      redirect: 'follow',
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Look for channel ID in meta tags or page source
    const metaMatch = html.match(/(?:"channelId"|"externalId")\s*:\s*"([a-zA-Z0-9_-]+)"/);
    if (metaMatch) return metaMatch[1];

    // Try og:url or canonical
    const linkMatch = html.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    if (linkMatch) return linkMatch[1];
  } catch {
    // Fall through
  }

  return null;
}

interface RssVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  url: string;
}

function parseRssFeed(xml: string): { channelName: string; videos: RssVideo[] } {
  const channelNameMatch = xml.match(/<title>([^<]+)<\/title>/);
  const channelName = channelNameMatch ? channelNameMatch[1] : 'Unknown Channel';

  const videos: RssVideo[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

    if (idMatch) {
      const videoId = idMatch[1];
      videos.push({
        id: videoId,
        title: titleMatch?.[1] || 'Untitled',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        published: publishedMatch?.[1] || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  }

  return { channelName, videos };
}
