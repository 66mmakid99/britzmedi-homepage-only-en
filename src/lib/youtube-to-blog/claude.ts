// Claude API integration for blog post generation

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Call Claude API with streaming to avoid CF Workers timeout.
 * Streams tokens from Claude and accumulates the full text.
 * Optionally calls onProgress callback for each chunk.
 */
async function callClaude(
  apiKey: string,
  systemPrompt: string,
  messages: ClaudeMessage[],
  maxTokens = 8192,
  onProgress?: (chunk: string, accumulated: string) => void
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  if (!res.body) {
    throw new Error('Claude returned no response body');
  }

  // Read SSE stream
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let buffer = '';
  let inputTokens = 0;
  let outputTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);

        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          text += event.delta.text;
          if (onProgress) {
            onProgress(event.delta.text, text);
          }
        }

        if (event.type === 'message_delta' && event.usage) {
          outputTokens = event.usage.output_tokens || 0;
        }

        if (event.type === 'message_start' && event.message?.usage) {
          inputTokens = event.message.usage.input_tokens || 0;
        }
      } catch {
        // Skip non-JSON lines
      }
    }
  }

  if (!text) {
    throw new Error('Claude returned no text');
  }

  console.log(`[Claude] Tokens used: ${inputTokens} in / ${outputTokens} out`);
  return text;
}

export interface GeneratedBlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  category: string;
}

/**
 * Generate a full blog post from translated transcript.
 * Uses streaming to avoid CF Workers timeout.
 * Calls onProgress for each text chunk to keep the client connection alive.
 */
export async function generateBlogPost(
  apiKey: string,
  transcript: string,
  videoTitle: string,
  channelName: string,
  youtubeId: string,
  options: {
    tone?: string;
    wordCount?: number;
    targetLang?: string;
  } = {},
  onProgress?: (chunk: string, accumulated: string) => void
): Promise<GeneratedBlogPost> {
  const { tone = 'professional', wordCount = 1500, targetLang = 'en' } = options;

  const systemPrompt = `You are an expert medical content writer for BRITZMEDI, a Korean medical aesthetics device company.
Your task is to transform a YouTube video transcript into a high-quality, SEO-optimized blog post.

BRITZMEDI products include:
- TORR RF: RF microneedling device for skin rejuvenation
- ULBLANC: Skin brightening/whitening device
- NEWCHAE SHOT: Personal home-use beauty device (RF technology from TORR RF, NOT a medical device)
- AQUA SHINE: Hydration treatment device

Writing guidelines:
- Tone: ${tone}
- Target word count: approximately ${wordCount} words
- Write in ${targetLang === 'en' ? 'English' : targetLang}
- Use proper medical terminology but remain accessible
- Include relevant headings (H2, H3) for SEO
- Add a compelling introduction and conclusion
- Naturally incorporate relevant keywords
- Cite the video source appropriately
- Format output as clean HTML (no <html>, <head>, <body> tags - just the article content)
- Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags
- Do NOT use markdown formatting - use proper HTML
- Do NOT include any frontmatter or metadata in the HTML

IMPORTANT: Return your response as a valid JSON object with the following structure:
{
  "title": "SEO-optimized blog post title",
  "slug": "url-friendly-slug",
  "content": "<h2>...</h2><p>...</p>...",
  "excerpt": "2-3 sentence excerpt for previews",
  "metaDescription": "Under 160 characters for SEO",
  "keywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...],
  "category": "medical-devices"
}`;

  const userMessage = `Transform this YouTube video transcript into a blog post.

Video Title: ${videoTitle}
Channel: ${channelName}
YouTube ID: ${youtubeId}

Transcript:
${transcript.slice(0, 12000)}

Generate a comprehensive, engaging blog post based on this content.`;

  const result = await callClaude(
    apiKey,
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    8192,
    onProgress
  );

  // Parse JSON response
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || videoTitle,
      slug: parsed.slug || generateSlug(videoTitle),
      content: parsed.content || '',
      excerpt: parsed.excerpt || '',
      metaDescription: parsed.metaDescription || parsed.meta_description || '',
      keywords: parsed.keywords || [],
      tags: parsed.tags || [],
      category: parsed.category || 'medical-devices',
    };
  } catch (parseErr) {
    // If JSON parsing fails, try to extract content
    console.error('[Claude] Failed to parse JSON response, using raw content');
    return {
      title: videoTitle,
      slug: generateSlug(videoTitle),
      content: `<div>${cleaned}</div>`,
      excerpt: cleaned.slice(0, 200),
      metaDescription: cleaned.slice(0, 160),
      keywords: [],
      tags: [],
      category: 'medical-devices',
    };
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
}
