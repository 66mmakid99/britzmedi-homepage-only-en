// Claude API integration for blog post generation

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: { type: string; text?: string }[];
  usage?: { input_tokens: number; output_tokens: number };
}

/**
 * Call Claude API to generate blog post content
 */
async function callClaude(apiKey: string, systemPrompt: string, messages: ClaudeMessage[], maxTokens = 8192): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  const data: ClaudeResponse = await res.json();
  const text = data.content.find(c => c.type === 'text')?.text;

  if (!text) {
    throw new Error('Claude returned no text');
  }

  console.log(`[Claude] Tokens used: ${data.usage?.input_tokens} in / ${data.usage?.output_tokens} out`);
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
 * Generate a full blog post from translated transcript
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
  } = {}
): Promise<GeneratedBlogPost> {
  const { tone = 'professional', wordCount = 1500, targetLang = 'en' } = options;

  const systemPrompt = `You are an expert medical content writer for BRITZMEDI, a Korean medical aesthetics device company.
Your task is to transform a YouTube video transcript into a high-quality, SEO-optimized blog post.

BRITZMEDI products include:
- TORR RF: RF microneedling device for skin rejuvenation
- ULBLANC: Skin brightening/whitening device
- NEWCHAE SHOT: Mesotherapy injection device
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

  const result = await callClaude(apiKey, systemPrompt, [
    { role: 'user', content: userMessage },
  ]);

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
