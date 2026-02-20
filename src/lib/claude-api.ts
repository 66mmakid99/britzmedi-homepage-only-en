// Shared Claude API helper for content analysis, rewriting, and generation

export interface ClaudeCallOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  system: string;
  userMessage: string;
}

/**
 * Call Claude API (non-streaming). Returns accumulated text.
 * Non-streaming is reliable on Cloudflare Workers — fetch wait time doesn't count as CPU time.
 */
export async function callClaude(opts: ClaudeCallOptions): Promise<string> {
  const {
    apiKey,
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4000,
    system,
    userMessage,
  } = opts;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  const data = await res.json() as any;

  // Extract text from content blocks
  let text = '';
  for (const block of data.content || []) {
    if (block.type === 'text') {
      text += block.text;
    }
  }

  if (!text) {
    const contentTypes = (data.content || []).map((b: any) => b.type).join(',');
    throw new Error(`Claude returned no text. stop_reason=${data.stop_reason}, content_types=[${contentTypes}], usage=${JSON.stringify(data.usage || {})}`);
  }

  return text;
}

/**
 * Call Claude API with web_search tool enabled.
 * Returns parsed JSON from Claude's text response.
 */
export async function callClaudeWithWebSearch(opts: ClaudeCallOptions): Promise<any> {
  const {
    apiKey,
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4000,
    system,
    userMessage,
  } = opts;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
      tools: [{ type: 'web_search_20250305' }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude web search error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  // Extract text from content blocks
  let text = '';
  for (const block of data.content || []) {
    if (block.type === 'text') {
      text += block.text;
    }
  }

  return text;
}

/**
 * Extract JSON from Claude's response, handling code fences.
 */
export function extractJson(raw: string): any {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

export function countWords(text: string): number {
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/[#*_>`~\[\]()!|-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return 0;
  return plain.split(/\s+/).filter(w => w.length > 0).length;
}
