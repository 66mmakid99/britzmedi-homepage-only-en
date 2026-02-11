// Claude API-powered SEO content generator for the Content Hub
// Uses streaming SSE to avoid Cloudflare Workers 30-second timeout

// ── Interfaces ──────────────────────────────────────────────────

export interface GenerateRequest {
  keyword: string;
  title: string;
  content_type: 'blog' | 'faq' | 'guide' | 'product_page';
  additional_keywords: string[];
  instructions?: string;
  word_count?: number;
  include_faq: boolean;
  include_schema: boolean;
  tone: string;
}

export interface GenerateResult {
  title: string;
  slug: string;
  meta_description: string;
  content: string;
  excerpt: string;
  faq: Array<{ question: string; answer: string }>;
  schema_type: string;
  internal_links: Array<{ text: string; url: string }>;
  estimated_read_time: string;
  word_count: number;
  tags: string[];
  category: string;
}

// ── System prompt ───────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a content strategist for BRITZMEDI, a Korean medical device company specializing in RF aesthetic devices (TORR RF, UlBlanc, NewChae, LuminoWave).

Target audience: medical device distributors, clinic owners, aesthetic practitioners worldwide.

BRITZMEDI products:
- TORR RF: Toroidal RF technology, monopolar RF for skin tightening, FDA 510(k) clearance pending
- UlBlanc: Fractional RF microneedling device
- NewChae: LED therapy device
- LuminoWave: Sonoillumination technology (ultrasound + light)

Always write in professional, authoritative English. Include clinical evidence and data where relevant. Naturally mention BRITZMEDI products when contextually appropriate (don't force it).

CRITICAL FORMATTING RULES:
- Write ALL content in clean Markdown. NEVER use HTML tags.
- Use ## for h2, ### for h3, #### for h4
- Use - for unordered lists, 1. for ordered lists
- Use **bold** and *italic* for emphasis
- Use [text](url) for links
- Use > for blockquotes
- NEVER output <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <div>, <span>, or any other HTML tags

IMPORTANT: Return your response as a single valid JSON object. Do NOT wrap it in markdown code fences. Do NOT include any text before or after the JSON.`;

// ── Claude API streaming call ───────────────────────────────────

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Call Claude API with streaming to avoid CF Workers timeout.
 * Streams tokens and accumulates the full text.
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
      model: 'claude-sonnet-4-5-20250929',
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

  console.log(`[ContentGenerator] Tokens used: ${inputTokens} in / ${outputTokens} out`);
  return text;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Convert any HTML tags in content to Markdown equivalents.
 * Used as a safety net when Claude ignores the "no HTML" instruction.
 */
function ensureMarkdown(text: string): string {
  if (!text) return '';
  // Quick check — if no HTML tags, return as-is
  if (!/<[a-z][^>]*>/i.test(text)) return text;

  let md = text;
  // Headings
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
  // Bold / italic
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  // Ordered lists
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    let i = 0;
    return '\n' + items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, t: string) => {
      i++;
      return `${i}. ${t.replace(/<[^>]*>/g, '').trim()}\n`;
    }) + '\n';
  });
  // Unordered lists
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    return '\n' + items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, t: string) => {
      return `- ${t.replace(/<[^>]*>/g, '').trim()}\n`;
    }) + '\n';
  });
  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) => {
    return '\n> ' + c.replace(/<\/?p[^>]*>/gi, '').trim().split('\n').join('\n> ') + '\n';
  });
  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  // Strip remaining tags
  md = md.replace(/<\/?(?:div|span|section|article|header|footer)[^>]*>/gi, '');
  // Clean excessive blank lines
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

function countWords(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function estimateReadTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

/**
 * Extract JSON from Claude's response, handling optional markdown code fences.
 */
function extractJson(raw: string): string {
  let cleaned = raw.trim();

  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  // Find the outermost JSON object boundaries
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

// ── User prompt builder ─────────────────────────────────────────

function buildUserPrompt(req: GenerateRequest): string {
  const contentTypeLabels: Record<GenerateRequest['content_type'], string> = {
    blog: 'blog post',
    faq: 'FAQ article',
    guide: 'comprehensive guide',
    product_page: 'product page',
  };

  const targetWords = req.word_count || 1500;
  const label = contentTypeLabels[req.content_type];

  const parts: string[] = [
    `Generate a ${label} optimized for the keyword "${req.keyword}".`,
    '',
    `Title: ${req.title}`,
    `Primary keyword: ${req.keyword}`,
  ];

  if (req.additional_keywords.length > 0) {
    parts.push(`Secondary keywords: ${req.additional_keywords.join(', ')}`);
  }

  parts.push(`Target word count: ${targetWords}`);
  parts.push(`Tone: ${req.tone}`);

  if (req.instructions) {
    parts.push(`Additional instructions: ${req.instructions}`);
  }

  if (req.include_faq) {
    parts.push('Include 5-7 FAQ items relevant to the topic.');
  }

  if (req.include_schema) {
    parts.push('Include schema type recommendation.');
  }

  parts.push('');
  parts.push('Respond with a JSON object containing:');
  parts.push('- title: SEO-optimized title (50-70 characters)');
  parts.push('- slug: URL-friendly slug derived from the title');
  parts.push('- meta_description: compelling description under 160 characters');
  parts.push('- content: full article in clean Markdown ONLY (## for h2, ### for h3, - for unordered lists, 1. for ordered lists, **bold**, *italic*, [text](url) for links). ABSOLUTELY NO HTML tags — no <p>, <h2>, <li>, <strong>, <a>, <div> etc.');
  parts.push('- excerpt: 2-3 sentence summary for previews');
  parts.push('- faq: array of {question, answer} objects (empty array if FAQ not requested)');
  parts.push('- schema_type: recommended schema.org type (e.g. "Article", "FAQPage", "HowTo")');
  parts.push('- internal_links: suggested internal links as [{text, url}] using BRITZMEDI site paths like /products, /contact, /blog');
  parts.push('- tags: array of relevant tags (5-10)');
  parts.push('- category: article category (e.g. "aesthetic-technology", "clinical-insights", "industry-trends", "product-guides")');

  return parts.join('\n');
}

// ── Main generator function ─────────────────────────────────────

/**
 * Generate SEO-optimized content using Claude API with streaming.
 *
 * @param apiKey - Claude API key
 * @param req - Content generation request parameters
 * @param onProgress - Optional callback for streaming progress
 * @returns Structured content result ready for publishing
 */
export async function generateSEOContent(
  apiKey: string,
  req: GenerateRequest,
  onProgress?: (chunk: string, accumulated: string) => void
): Promise<GenerateResult> {
  const userPrompt = buildUserPrompt(req);

  const result = await callClaude(
    apiKey,
    SYSTEM_PROMPT,
    [{ role: 'user', content: userPrompt }],
    8192,
    onProgress
  );

  // Parse JSON from Claude's response
  const jsonStr = extractJson(result);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error('[ContentGenerator] Failed to parse JSON response:', parseErr);
    console.error('[ContentGenerator] Raw response (first 500 chars):', result.slice(0, 500));

    // Return a best-effort fallback using the raw text as content
    const fallbackContent = result;
    const fallbackWordCount = countWords(fallbackContent);
    return {
      title: req.title,
      slug: generateSlug(req.title),
      meta_description: '',
      content: fallbackContent,
      excerpt: stripHtml(result).slice(0, 200),
      faq: [],
      schema_type: 'Article',
      internal_links: [],
      estimated_read_time: estimateReadTime(fallbackWordCount),
      word_count: fallbackWordCount,
      tags: [],
      category: 'uncategorized',
    };
  }

  // Extract and validate fields with sensible defaults
  // Safety net: convert any HTML to Markdown if Claude ignored the instruction
  const content = ensureMarkdown((parsed.content as string) || '');
  const wordCount = countWords(content);
  const slug = (parsed.slug as string) || generateSlug((parsed.title as string) || req.title);

  // Parse FAQ array safely
  let faq: Array<{ question: string; answer: string }> = [];
  if (Array.isArray(parsed.faq)) {
    faq = (parsed.faq as Array<Record<string, unknown>>)
      .filter(item => typeof item.question === 'string' && typeof item.answer === 'string')
      .map(item => ({
        question: item.question as string,
        answer: item.answer as string,
      }));
  }

  // Parse internal_links array safely
  let internalLinks: Array<{ text: string; url: string }> = [];
  if (Array.isArray(parsed.internal_links)) {
    internalLinks = (parsed.internal_links as Array<Record<string, unknown>>)
      .filter(item => typeof item.text === 'string' && typeof item.url === 'string')
      .map(item => ({
        text: item.text as string,
        url: item.url as string,
      }));
  }

  // Parse tags array safely
  let tags: string[] = [];
  if (Array.isArray(parsed.tags)) {
    tags = (parsed.tags as unknown[])
      .filter((t): t is string => typeof t === 'string');
  }

  return {
    title: (parsed.title as string) || req.title,
    slug,
    meta_description: (parsed.meta_description as string) || (parsed.metaDescription as string) || '',
    content,
    excerpt: (parsed.excerpt as string) || '',
    faq,
    schema_type: (parsed.schema_type as string) || (parsed.schemaType as string) || 'Article',
    internal_links: internalLinks,
    estimated_read_time: estimateReadTime(wordCount),
    word_count: wordCount,
    tags,
    category: (parsed.category as string) || 'uncategorized',
  };
}
