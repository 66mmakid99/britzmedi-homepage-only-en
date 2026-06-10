// Claude API Chatbot Endpoint
// POST /api/chat - Send a message to the chatbot

export const prerender = false;

import type { APIRoute } from 'astro';
// Import knowledge base at build time (fs.readFileSync doesn't work on Cloudflare Workers)
import knowledgeBaseContent from '../../data/chatbot-knowledge.md?raw';
import { notifyNewLead } from '../../lib/email-notifications';
import { CLAUDE_MODEL } from '../../lib/ai-models';

interface Env {
  ANTHROPIC_API_KEY?: string;
  DB?: D1Database;
  SESSION?: KVNamespace;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context?: {
    product?: string;
    page?: string;
  };
  sessionId?: string;
  conversationId?: number;
  verificationToken?: string; // For "I'm not a robot" verification
  leadConverted?: boolean;
}

// Simple in-memory store for spam detection (resets on server restart)
const spamDetection = new Map<string, {
  messages: string[];
  lastActivity: number;
  messageCount: number;
  verified: boolean;
  sessionStart: number;
}>();

// Rate limit configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 10,   // Max 10 requests per minute per IP
  windowMs: 60 * 1000,        // 1 minute fixed window
  kvTtlSeconds: 120,          // KV record TTL (window + grace)
  maxConversationTurns: 50,   // Max 50 turns per session
};

// Session ID must be a client-safe opaque token
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

// History sanitization limits (server-side, client input is untrusted)
const HISTORY_LIMITS = {
  maxMessages: 20,            // Keep only the last 20 messages
  maxMessageChars: 2000,      // Truncate each message to 2000 chars
  maxTotalChars: 30000,       // Total history budget (drop oldest beyond it)
};

// Validate and cap client-supplied history before forwarding to Claude
function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  // Validate entry shape and truncate each message
  const valid: ChatMessage[] = [];
  for (const entry of history) {
    if (!entry || typeof entry !== 'object') continue;
    const { role, content } = entry as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue;
    valid.push({ role, content: content.slice(0, HISTORY_LIMITS.maxMessageChars) });
  }

  // Keep only the most recent messages
  const recent = valid.slice(-HISTORY_LIMITS.maxMessages);

  // Enforce total budget — drop oldest messages beyond it
  const kept: ChatMessage[] = [];
  let totalChars = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    totalChars += recent[i].content.length;
    if (totalChars > HISTORY_LIMITS.maxTotalChars) break;
    kept.unshift(recent[i]);
  }

  return kept;
}

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

// KV-based rate limit (10 req/min/IP). Fails open if KV is unavailable.
async function checkRateLimit(
  kv: KVNamespace | undefined,
  clientIP: string,
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  if (!kv) return { allowed: true }; // fail-open when KV binding is missing

  const key = `rl:chat:${clientIP}`;
  try {
    const now = Date.now();
    const stored = await kv.get(key, { type: 'json' }) as RateLimitRecord | null;

    let record = stored;
    if (
      !record ||
      typeof record.count !== 'number' ||
      typeof record.windowStart !== 'number' ||
      now - record.windowStart >= RATE_LIMIT.windowMs
    ) {
      record = { count: 0, windowStart: now };
    }

    if (record.count >= RATE_LIMIT.maxRequestsPerMinute) {
      const retryAfter = Math.max(1, Math.ceil((record.windowStart + RATE_LIMIT.windowMs - now) / 1000));
      console.warn(`[RATE LIMIT] IP ${clientIP.slice(0, 15)}... blocked: ${record.count} req/min exceeded`);
      return { allowed: false, reason: 'too_many_requests_minute', retryAfter };
    }

    record.count += 1;
    await kv.put(key, JSON.stringify(record), { expirationTtl: RATE_LIMIT.kvTtlSeconds });
    return { allowed: true };
  } catch (e) {
    console.warn('[RATE LIMIT] KV error, failing open:', e);
    return { allowed: true }; // fail-open on KV errors
  }
}

// Check conversation turn limit
function checkTurnLimit(sessionId: string): { allowed: boolean; turnCount: number } {
  const session = spamDetection.get(sessionId);
  const turnCount = session?.messageCount || 0;

  if (turnCount >= RATE_LIMIT.maxConversationTurns) {
    return { allowed: false, turnCount };
  }

  return { allowed: true, turnCount };
}

// API usage tracking for cost monitoring
interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  month: string; // YYYY-MM format
}

const usageStats: UsageStats = {
  inputTokens: 0,
  outputTokens: 0,
  requestCount: 0,
  month: new Date().toISOString().slice(0, 7) // Current month
};

// Claude Sonnet pricing (as of 2024)
const PRICING = {
  inputPerMillion: 3.00,  // $3 per 1M input tokens
  outputPerMillion: 15.00 // $15 per 1M output tokens
};

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function resetUsageIfNewMonth() {
  const currentMonth = getCurrentMonth();
  if (usageStats.month !== currentMonth) {
    // Log final stats for previous month
    logMonthlyUsage();
    // Reset for new month
    usageStats.inputTokens = 0;
    usageStats.outputTokens = 0;
    usageStats.requestCount = 0;
    usageStats.month = currentMonth;
  }
}

function updateUsage(inputTokens: number, outputTokens: number) {
  resetUsageIfNewMonth();
  usageStats.inputTokens += inputTokens;
  usageStats.outputTokens += outputTokens;
  usageStats.requestCount += 1;
}

function calculateCost(): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (usageStats.inputTokens / 1_000_000) * PRICING.inputPerMillion;
  const outputCost = (usageStats.outputTokens / 1_000_000) * PRICING.outputPerMillion;
  return {
    inputCost: Math.round(inputCost * 100) / 100,
    outputCost: Math.round(outputCost * 100) / 100,
    totalCost: Math.round((inputCost + outputCost) * 100) / 100
  };
}

function logMonthlyUsage() {
  const cost = calculateCost();
  console.log(`[API USAGE] Month: ${usageStats.month}`);
  console.log(`[API USAGE] Requests: ${usageStats.requestCount}`);
  console.log(`[API USAGE] Input tokens: ${usageStats.inputTokens.toLocaleString()} ($${cost.inputCost})`);
  console.log(`[API USAGE] Output tokens: ${usageStats.outputTokens.toLocaleString()} ($${cost.outputCost})`);
  console.log(`[API USAGE] Total estimated cost: $${cost.totalCost}`);
}

function logRequestUsage(inputTokens: number, outputTokens: number) {
  updateUsage(inputTokens, outputTokens);
  const cost = calculateCost();

  // Log every request with running totals
  console.log(`[API] Request #${usageStats.requestCount} | This: ${inputTokens}in/${outputTokens}out | Month total: ${usageStats.inputTokens.toLocaleString()}in/${usageStats.outputTokens.toLocaleString()}out | Est. cost: $${cost.totalCost}`);

  // Alert if approaching cost thresholds
  if (cost.totalCost >= 50 && usageStats.requestCount % 10 === 0) {
    console.warn(`[API COST WARNING] Monthly cost has reached $${cost.totalCost}!`);
  }
}

// Clean old sessions (older than 30 minutes)
function cleanOldSessions() {
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  for (const [key, value] of spamDetection.entries()) {
    if (value.lastActivity < thirtyMinutesAgo) {
      spamDetection.delete(key);
    }
  }
}

// Normalize message for comparison (lowercase, trim, remove extra spaces)
function normalizeMessage(msg: string): string {
  return msg.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Suspicious patterns that might indicate bot or abuse
const SUSPICIOUS_PATTERNS = [
  /(.)\1{10,}/i,                    // Same character repeated 10+ times
  /^[a-z]{50,}$/i,                  // Very long string without spaces
  /<script|javascript:|onclick/i,  // XSS attempts
  /\b(hack|exploit|inject|sql)\b/i, // Potential attack keywords
  /https?:\/\/[^\s]{100,}/i,       // Very long URLs
];

// Check for suspicious patterns
function checkSuspiciousPatterns(message: string): { suspicious: boolean; reason?: string } {
  // Check for suspicious regex patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(message)) {
      return { suspicious: true, reason: 'suspicious_content' };
    }
  }

  // Check message length (too short or too long)
  if (message.length > 2000) {
    return { suspicious: true, reason: 'message_too_long' };
  }

  return { suspicious: false };
}

// Check for repeated questions (3+ identical in a row)
function checkRepeatedQuestions(sessionId: string, message: string): { blocked: boolean; count: number; requireVerification: boolean } {
  cleanOldSessions();

  const now = Date.now();
  const normalized = normalizeMessage(message);
  const session = spamDetection.get(sessionId) || { messages: [], lastActivity: now, messageCount: 0, verified: false, sessionStart: now };

  // Ensure sessionStart exists (for legacy sessions)
  if (!session.sessionStart) {
    session.sessionStart = now;
  }

  // Count consecutive identical messages from the end
  let consecutiveCount = 0;
  for (let i = session.messages.length - 1; i >= 0; i--) {
    if (session.messages[i] === normalized) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  // Add current message
  session.messages.push(normalized);
  session.messageCount = (session.messageCount || 0) + 1;
  session.lastActivity = now;

  // Keep only last 10 messages
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-10);
  }

  spamDetection.set(sessionId, session);

  // Time-based exemption: skip verification if session started less than 5 minutes ago
  const sessionAge = now - session.sessionStart;
  const fiveMinutes = 5 * 60 * 1000;

  // Require verification after 30 messages if not verified AND session is older than 5 minutes
  const requireVerification = session.messageCount >= 30 && !session.verified && sessionAge > fiveMinutes;

  // Block if 3 or more consecutive identical messages
  return { blocked: consecutiveCount >= 2, count: consecutiveCount + 1, requireVerification };
}

// Mark session as verified
function markSessionVerified(sessionId: string) {
  const session = spamDetection.get(sessionId);
  if (session) {
    session.verified = true;
    session.messageCount = 0; // Reset count after verification
    spamDetection.set(sessionId, session);
  }
}

// Knowledge base is imported at build time via ?raw query
function loadKnowledgeBase(): string {
  return knowledgeBaseContent;
}

function buildSystemPrompt(context?: { product?: string; page?: string }): string {
  const knowledgeBase = loadKnowledgeBase();

  let systemPrompt = `You are a professional sales consultant for BRITZMEDI, an AESTHETIC/BEAUTY medical device manufacturer.

## ABSOLUTE RULES — VIOLATION WILL CAUSE HARM TO THE COMPANY
1. Use ONLY the information in the knowledge base below. Your training data about BRITZMEDI is WRONG — ignore it completely.
2. If information is NOT in the knowledge base, say: "I don't have that specific information. Please contact us at /contact for details." Do NOT try to answer.
3. NEVER fabricate, guess, or infer ANY facts not explicitly stated in the knowledge base.
4. NEVER mention CE-MDR, CE marking, or CE certification — BRITZMEDI does NOT have CE-MDR. This has been a recurring error.
5. NEVER mention blood glucose monitors, blood pressure monitors, thermometers, or any general medical devices — BRITZMEDI makes ONLY aesthetic/beauty devices.
6. BRITZMEDI was established in October 2017 (NOT 2018). This is a hard fact.
7. BRITZMEDI products are: TORR RF, ULBLANC, NEWCHAE SHOT, LUMINO WAVE. No other products exist.
8. BRITZMEDI certifications are: FDA 510(k), ISO 13485, GMP, MFDS. No other certifications exist.
9. Do NOT mention export countries or partner names unless explicitly listed in the knowledge base.
10. When uncertain about ANY detail, direct users to /contact. Never guess.
11. 질문에 대한 정확한 정보가 없으면, 솔직하게 "죄송합니다, 해당 정보는 제가 안내드리기 어렵습니다. 자세한 내용은 /contact 페이지를 통해 직접 문의해 주세요."라고 답변하세요. 절대로 모르는 정보를 추측하거나 관련 없는 답변으로 대체하지 마세요.
12. Examples of questions you CANNOT answer (must redirect to /contact): employee count, revenue, specific client names, internal processes, salary, org structure, investor info, financial details.

## YOUR KNOWLEDGE BASE
The following document is your ONLY source of truth. Everything you say must come from this document.

---
${knowledgeBase}
---

## CURRENT CONTEXT`;

  // Add context-specific information
  if (context?.product) {
    const productMap: Record<string, string> = {
      'torr-rf': 'TORR RF (MTX-C1)',
      'ulblanc': 'ULBLANC',
      'newchae-shot': 'NEWCHAE SHOT',
      'lumino-wave': 'LUMINO WAVE (LSR-10)'
    };
    const productName = productMap[context.product] || context.product;
    systemPrompt += `
The user is currently viewing the **${productName}** product page. Prioritize information about this product, but be ready to discuss other products if asked.`;
  } else if (context?.page) {
    systemPrompt += `
The user is on the **${context.page}** page.`;
  } else {
    systemPrompt += `
The user is browsing the BRITZMEDI website.`;
  }

  systemPrompt += `

## COMPANY OVERVIEW
- Company: BRITZMEDI Co., Ltd. (브리츠메디)
- CEO: 이신재 (Shinjae Lee)
- Founded: October 2017
- Location: 경기도 성남시 (Seongnam-si, Gyeonggi-do, South Korea)
- Industry: RF, ultrasound, and aesthetic/beauty medical device design & manufacturing
- Products: TORR RF, ULBLANC, NEWCHAE SHOT, LUMINO WAVE

## LANGUAGE DETECTION
Detect the user's language from their message and respond in the SAME language.
- If the user writes in Korean (한국어), respond in Korean.
- If the user writes in Japanese (日本語), respond in Japanese.
- If the user writes in Chinese (中文), respond in Chinese.
- If the user writes in Spanish, respond in Spanish.
- For all other languages, respond in English.
- Keep product names (TORR RF, ULBLANC, etc.) and brand name (BRITZMEDI) in English regardless of language.

## CRITICAL: WRITE LIKE A HUMAN
You must sound like a real person, not an AI chatbot.

NEVER do this:
- Don't use **bold** or *italics* excessively
- Don't make bullet point lists for every answer
- Don't start with "Great question!" or "Absolutely!" or "I'd be happy to..."
- Don't use numbered lists unless specifically asked
- Don't over-structure your responses with headers

ALWAYS do this:
- Write in natural, flowing sentences
- Keep it conversational - like you're talking to a colleague
- Be direct and concise (2-4 sentences for simple questions)
- Use plain text, minimal formatting
- Only use formatting when genuinely needed (like technical specs)

For pricing, partnerships, or detailed inquiries, guide them to the contact form at /contact page.
When mentioning the contact form, say something like "You can reach us through our contact form at /contact" or "Feel free to submit an inquiry at /contact".`;

  return systemPrompt;
}

// --- D1 Conversation Persistence ---
async function getOrCreateConversation(
  db: D1Database,
  sessionId: string,
  conversationId: number | undefined,
  clientIP: string,
  country: string | null,
  language: string | null,
): Promise<{ conversationId: number; isNew: boolean }> {
  // If conversationId provided, verify it exists
  if (conversationId) {
    const existing = await db.prepare(
      'SELECT id FROM chat_conversations WHERE id = ? AND session_id = ?'
    ).bind(conversationId, sessionId).first<{ id: number }>();
    if (existing) return { conversationId: existing.id, isNew: false };
  }

  // Check for recent active conversation with same session
  const recent = await db.prepare(
    "SELECT id FROM chat_conversations WHERE session_id = ? AND status = 'active' AND last_message_at > datetime('now', '-30 minutes') ORDER BY id DESC LIMIT 1"
  ).bind(sessionId).first<{ id: number }>();
  if (recent) return { conversationId: recent.id, isNew: false };

  // Create new conversation — isNew is returned to the caller so the
  // first-message notification uses a request-local value (no shared state)
  const result = await db.prepare(
    'INSERT INTO chat_conversations (session_id, visitor_ip, visitor_country, visitor_language) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, clientIP, country, language).run();

  return { conversationId: result.meta!.last_row_id as number, isNew: true };
}

async function saveMessage(
  db: D1Database,
  conversationId: number,
  role: string,
  content: string,
  tokensUsed: number = 0,
) {
  await db.prepare(
    'INSERT INTO chat_messages (conversation_id, role, content, tokens_used) VALUES (?, ?, ?, ?)'
  ).bind(conversationId, role, content, tokensUsed).run();

  await db.prepare(
    "UPDATE chat_conversations SET message_count = message_count + 1, last_message_at = datetime('now') WHERE id = ?"
  ).bind(conversationId).run();
}

async function markLeadConverted(db: D1Database, conversationId: number) {
  await db.prepare(
    'UPDATE chat_conversations SET lead_converted = 1 WHERE id = ?'
  ).bind(conversationId).run();
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as ChatRequest;

    if (!body.message || body.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate client-supplied session ID (opaque token, no IP/raw data allowed)
    if (body.sessionId && (typeof body.sessionId !== 'string' || !SESSION_ID_PATTERN.test(body.sessionId))) {
      return new Response(JSON.stringify({ error: 'Invalid sessionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate session ID if not provided
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
    const sessionId = body.sessionId || crypto.randomUUID();

    // Get D1 database for conversation persistence
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB as D1Database | undefined;
    const visitorCountry = request.headers.get('cf-ipcountry') || null;
    const visitorLanguage = request.headers.get('accept-language')?.split(',')[0] || null;

    // Handle lead conversion signal (early return)
    if (body.leadConverted && body.conversationId && db) {
      try {
        await markLeadConverted(db, body.conversationId);
        const conv = await db.prepare('SELECT visitor_ip, visitor_country FROM chat_conversations WHERE id = ?').bind(body.conversationId).first<any>();
        notifyNewLead(env, {
          type: 'chatbot',
          message: 'Chatbot visitor converted to lead! Clicked contact link.',
          country: conv?.visitor_country || 'Unknown',
          lead_score: 90,
        }).catch(e => console.error('[NOTIFY]', e));
      } catch (e) { /* non-critical */ }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check rate limit (KV-based, fail-open if KV unavailable)
    const rateLimitCheck = await checkRateLimit(env?.SESSION, clientIP);
    if (!rateLimitCheck.allowed) {
      console.warn(`[RATE LIMIT] Blocked request from ${clientIP.slice(0, 15)}... (${rateLimitCheck.reason})`);
      return new Response(JSON.stringify({
        message: "You're sending messages too quickly. Please wait a moment before trying again.",
        blocked: true,
        reason: rateLimitCheck.reason,
        retryAfter: rateLimitCheck.retryAfter
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitCheck.retryAfter || 60)
        }
      });
    }

    // Check conversation turn limit
    const turnCheck = checkTurnLimit(sessionId);
    if (!turnCheck.allowed) {
      console.info(`[TURN LIMIT] Session ${sessionId.slice(0, 20)}... reached ${turnCheck.turnCount} turns`);
      return new Response(JSON.stringify({
        message: "We've had quite a conversation! For more detailed assistance, please reach out to our team directly at /contact. They'll be happy to help you further.",
        blocked: true,
        reason: 'conversation_limit_reached'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle verification token (mark session as verified)
    if (body.verificationToken === 'human-verified') {
      markSessionVerified(sessionId);
    }

    // Check for suspicious patterns
    const suspiciousCheck = checkSuspiciousPatterns(body.message);
    if (suspiciousCheck.suspicious) {
      console.warn(`[SUSPICIOUS] Blocked suspicious message from session: ${sessionId.slice(0, 20)}... (${suspiciousCheck.reason})`);
      return new Response(JSON.stringify({
        message: "I couldn't process that message. Please try rephrasing your question in plain language.",
        blocked: true,
        reason: suspiciousCheck.reason
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for repeated questions (spam detection)
    const repeatCheck = checkRepeatedQuestions(sessionId, body.message);
    if (repeatCheck.blocked) {
      console.warn(`[SPAM] Blocked repeated question from session: ${sessionId.slice(0, 20)}... (${repeatCheck.count} times)`);
      return new Response(JSON.stringify({
        message: "I noticed you've asked this same question a few times. If my previous answers didn't help, please try rephrasing your question or reach out directly at /contact for personalized assistance.",
        blocked: true,
        reason: 'repeated_question'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if verification is required (10+ messages without verification)
    if (repeatCheck.requireVerification) {
      console.info(`[VERIFY] Requesting verification from session: ${sessionId.slice(0, 20)}...`);
      return new Response(JSON.stringify({
        message: "Before we continue, please confirm you're not a robot by clicking the button below.",
        requireVerification: true,
        reason: 'verification_required'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get API key from environment
    const apiKey = env?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('[CHAT] ANTHROPIC_API_KEY not configured - using fallback');
      const fallbackMessage = getFallbackResponse(body.message, body.context);
      const suggestions = generateFollowUpSuggestions(body.message, fallbackMessage, body.context);
      // Save fallback to D1 too
      let conversationId = body.conversationId;
      if (db) {
        try {
          const conversation = await getOrCreateConversation(db, sessionId, body.conversationId, clientIP, visitorCountry, visitorLanguage);
          conversationId = conversation.conversationId;
          await saveMessage(db, conversationId, 'user', body.message, 0);
          await saveMessage(db, conversationId, 'assistant', fallbackMessage, 0);
          if (conversation.isNew) {
            notifyNewLead(env, {
              type: 'chatbot',
              message: body.message.substring(0, 200),
              country: visitorCountry || 'Unknown',
              source_url: request.headers.get('referer') || 'https://britzmedi.com',
            }).catch(() => {});
          }
        } catch (e) { /* non-critical */ }
      }
      return new Response(JSON.stringify({
        message: fallbackMessage,
        suggestions,
        fallback: true,
        sessionId,
        conversationId,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build message history (client input is untrusted — validate, cap, truncate)
    const messages = [
      ...sanitizeHistory(body.history),
      {
        role: 'user' as const,
        content: body.message
      }
    ];

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: buildSystemPrompt(body.context),
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[CHAT] Claude API error (${response.status}):`, error);

      // Return fallback on API error
      const fallbackMessage = getFallbackResponse(body.message, body.context);
      const suggestions = generateFollowUpSuggestions(body.message, fallbackMessage, body.context);
      return new Response(JSON.stringify({
        message: fallbackMessage,
        suggestions,
        fallback: true,
        error: `API error: ${response.status}`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || 'I apologize, but I encountered an issue. Please try again.';

    // Log API usage for cost monitoring
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    if (data.usage) {
      logRequestUsage(inputTokens, outputTokens);
    }

    // Save conversation to D1 (non-blocking, don't fail the response)
    let conversationId = body.conversationId;
    if (db) {
      try {
        const conversation = await getOrCreateConversation(db, sessionId, body.conversationId, clientIP, visitorCountry, visitorLanguage);
        conversationId = conversation.conversationId;
        await saveMessage(db, conversationId, 'user', body.message, 0);
        await saveMessage(db, conversationId, 'assistant', assistantMessage, inputTokens + outputTokens);

        // Notify on brand new conversation (first message only) — request-local flag
        if (conversation.isNew) {
          notifyNewLead(env, {
            type: 'chatbot',
            message: body.message.substring(0, 200),
            country: visitorCountry || 'Unknown',
            source_url: request.headers.get('referer') || 'https://britzmedi.com',
          }).catch(e => console.error('[NOTIFY]', e));
        }
      } catch (e) {
        console.error('[CHAT DB] Failed to save conversation:', e);
      }
    }

    // Generate context-aware follow-up suggestions
    const suggestions = generateFollowUpSuggestions(body.message, assistantMessage, body.context);

    return new Response(JSON.stringify({
      message: assistantMessage,
      suggestions,
      fallback: false,
      sessionId,
      conversationId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process chat request',
      message: 'I apologize for the technical difficulty. Please contact us directly at sh.lee@britzmedi.com'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Generate context-aware follow-up suggestions based on conversation
function generateFollowUpSuggestions(
  userMessage: string,
  assistantResponse: string,
  context?: { product?: string; page?: string }
): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = assistantResponse.toLowerCase();
  const suggestions: string[] = [];

  // Product-specific suggestions
  if (lowerMessage.includes('torr') || lowerResponse.includes('torr rf')) {
    suggestions.push('What are TORR RF specifications?');
    suggestions.push('Is TORR RF FDA cleared?');
    suggestions.push('What treatments can TORR RF perform?');
  } else if (lowerMessage.includes('ulblanc') || lowerResponse.includes('ulblanc')) {
    suggestions.push('How does dual-frequency ultrasound work?');
    suggestions.push('What is i-Booster technology?');
    suggestions.push('What certifications does ULBLANC have?');
  } else if (lowerMessage.includes('newchae') || lowerResponse.includes('newchae')) {
    suggestions.push('What clinical results does NEWCHAE SHOT have?');
    suggestions.push('Is NEWCHAE SHOT safe for home use?');
    suggestions.push('What technologies are in NEWCHAE SHOT?');
  } else if (lowerMessage.includes('lumino') || lowerResponse.includes('lumino')) {
    suggestions.push('When will LUMINO WAVE be released?');
    suggestions.push('What makes LUMINO WAVE unique?');
    suggestions.push('Can I get updates on LUMINO WAVE?');
  }
  // Topic-specific suggestions
  else if (lowerMessage.includes('fda') || lowerMessage.includes('certification') || lowerResponse.includes('fda')) {
    suggestions.push('Which products are FDA cleared?');
    suggestions.push('Do you have ISO certification?');
    suggestions.push('What markets can you export to?');
  } else if (lowerMessage.includes('distributor') || lowerMessage.includes('partner') || lowerResponse.includes('distributor')) {
    suggestions.push('What regions need distributors?');
    suggestions.push('What support do you offer partners?');
    suggestions.push('What are the partnership requirements?');
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerResponse.includes('pricing')) {
    suggestions.push('Do you offer volume discounts?');
    suggestions.push('What payment terms are available?');
    suggestions.push('Can I request a demo unit?');
  } else if (lowerMessage.includes('oem') || lowerMessage.includes('odm') || lowerResponse.includes('oem')) {
    suggestions.push('How do I become a country distributor?');
    suggestions.push('Which products are available for distribution?');
    suggestions.push('What are the minimum order quantities?');
  }
  // General conversation suggestions
  else if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage.length < 20) {
    suggestions.push('Tell me about your products');
    suggestions.push('What certifications do you have?');
    suggestions.push('How can I become a distributor?');
  }
  // Default suggestions based on context
  else {
    if (context?.product) {
      suggestions.push(`What are the specifications?`);
      suggestions.push(`Is this product FDA approved?`);
      suggestions.push(`How can I order this product?`);
    } else {
      suggestions.push('Tell me about TORR RF');
      suggestions.push('What certifications do you have?');
      suggestions.push('How can I contact sales?');
    }
  }

  // Return max 3 unique suggestions
  return [...new Set(suggestions)].slice(0, 3);
}

// Detect if message is Korean
function isKorean(message: string): boolean {
  return /[\uAC00-\uD7AF\u1100-\u11FF]/.test(message);
}

// Fallback responses when API is not available
function getFallbackResponse(message: string, context?: { product?: string }): string {
  const lowerMessage = message.toLowerCase();
  const korean = isKorean(message);

  // Product inquiries (EN + KO)
  if (lowerMessage.includes('torr') || lowerMessage.includes('rf') || lowerMessage.includes('토르') || lowerMessage.includes('고주파')) {
    return korean
      ? "TORR RF (MTX-C1)는 FDA 510(k) 인증을 받은 멀티웨이브 RF 시스템입니다. Auto Circular Motion 기술로 고주파 에너지를 균일하게 분배하도록 설계되었으며, 실시간 온도 제어와 Vibro-Comfort 시스템으로 시술 시 편의를 돕습니다. 자세한 내용은 /contact 페이지에서 문의해 주세요."
      : "TORR RF (MTX-C1) is our flagship FDA 510(k) cleared Multi-Wave RF system. It features patented Auto Circular Motion technology for even energy distribution, real-time temperature control, and the Vibro-Comfort system for patient comfort. Would you like to learn more about its specifications or discuss partnership opportunities?";
  }

  if (lowerMessage.includes('ulblanc') || lowerMessage.includes('ultrasound') || lowerMessage.includes('울블랑') || lowerMessage.includes('초음파')) {
    return korean
      ? "ULBLANC (i-Booster)은 1MHz + 3MHz Dynamic Dual Wave 기술과 i-Booster 소노포레시스 기술을 결합한 멀티 모드 스킨케어 워크스테이션으로, MFDS 인증(제21-4685호)을 받은 의료기기입니다. 자세한 내용은 /contact에서 문의해 주세요."
      : "ULBLANC (i-Booster) is our dual-frequency ultrasound system featuring Dynamic Dual Wave technology (1MHz + 3MHz) and i-Booster sonophoresis for enhanced product absorption. It's MFDS certified and excellent for skin elasticity treatments. Would you like more details?";
  }

  if (lowerMessage.includes('newchae') || lowerMessage.includes('home device') || lowerMessage.includes('뉴채') || lowerMessage.includes('홈디바이스') || lowerMessage.includes('홈케어')) {
    return korean
      ? "NEWCHAE SHOT은 가정에서 사용하도록 설계된 3-in-1 개인용 뷰티 디바이스입니다. 의료기기가 아닌 개인용 미용기기(공산품)이며, 사용 방법은 제품 설명서를 참조해 주세요. 자세한 내용은 /contact에서 문의해 주세요."
      : "NEWCHAE SHOT is a personal home-use beauty device that applies TORR RF handpiece technology for consumer skincare. It is NOT a medical device — it's designed for safe, at-home use without medical supervision. For more details, visit /contact.";
  }

  if (lowerMessage.includes('lumino') || lowerMessage.includes('led') || lowerMessage.includes('루미노') || lowerMessage.includes('엘이디')) {
    return korean
      ? "LUMINO WAVE는 초음파와 레이저를 결합한 융복합(Convergence) 방식의 디바이스로, 2026년 하반기 출시를 목표로 현재 국내 인허가 절차를 진행 중입니다. 자세한 내용은 /contact에서 문의해 주세요."
      : "LUMINO WAVE is a professional LED phototherapy device with multiple wavelengths, designed for aesthetic clinics and medical spas. For details, visit /contact.";
  }

  // CEO / representative (KO + EN)
  if (lowerMessage.includes('대표') || lowerMessage.includes('ceo') || lowerMessage.includes('사장') || lowerMessage.includes('who leads') || lowerMessage.includes('founder')) {
    return korean
      ? "BRITZMEDI의 대표이사는 이신재입니다. 2017년 10월에 회사를 설립했으며, RF 및 초음파 기반 의료미용기기 전문 기업으로 성장시켰습니다. 추가 문의는 /contact에서 해주세요."
      : "BRITZMEDI's CEO is Shinjae Lee, who founded the company in October 2017. Under his leadership, BRITZMEDI has grown into a specialized manufacturer of RF and ultrasound-based aesthetic medical devices. For more info, visit /contact.";
  }

  // Location (KO + EN)
  if (lowerMessage.includes('어디') || lowerMessage.includes('위치') || lowerMessage.includes('주소') || lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
    return korean
      ? "BRITZMEDI는 경기도 성남시 중원구 둔촌대로 388, 1211호에 위치하고 있습니다. 전화번호는 070-4348-7244입니다. /contact 페이지에서 문의하실 수 있습니다."
      : "BRITZMEDI is located at 1211ho, 388, Dunchon-daero, Jungwon-gu, Seongnam-si, Gyeonggi-do, South Korea. You can reach us at +82-70-4348-7244 or through our contact form at /contact.";
  }

  // Products overview (KO)
  if (lowerMessage.includes('제품') || lowerMessage.includes('뭐 만') || lowerMessage.includes('뭐 팔') || lowerMessage.includes('어떤 제품') || lowerMessage.includes('products')) {
    return korean
      ? "BRITZMEDI의 주요 제품은 4가지입니다: TORR RF (FDA 510(k) 인증 멀티웨이브 RF), ULBLANC (이중주파수 초음파), NEWCHAE SHOT (홈뷰티 디바이스, 공산품), LUMINO WAVE (초음파+레이저 융복합, 국내 인허가 진행 중). 자세한 내용은 /products 또는 /contact에서 확인하세요."
      : "Thanks for reaching out! We specialize in aesthetic medical devices - TORR RF (FDA 510(k) cleared), ULBLANC ultrasound, NEWCHAE SHOT home device, and LUMINO WAVE (coming soon). What would you like to know? Visit /contact for inquiries.";
  }

  // Company inquiries (EN + KO)
  if (lowerMessage.includes('fda') || lowerMessage.includes('certification') || lowerMessage.includes('certified') || lowerMessage.includes('인증') || lowerMessage.includes('허가')) {
    return korean
      ? "BRITZMEDI는 FDA 510(k) 인증 (K212561, TORR RF), ISO 13485:2016, GMP, MFDS 인허가를 보유하고 있습니다. /contact에서 문의해 주세요."
      : "BRITZMEDI holds FDA 510(k) clearance (K212561) for TORR RF, ISO 13485:2016 certification, GMP certification, and MFDS licensing. Our products meet the highest international regulatory standards.";
  }

  if (lowerMessage.includes('distributor') || lowerMessage.includes('partnership') || lowerMessage.includes('dealer') || lowerMessage.includes('유통') || lowerMessage.includes('파트너') || lowerMessage.includes('대리점') || lowerMessage.includes('총판')) {
    return korean
      ? "전 세계 유통 파트너를 모집하고 있습니다. /contact에서 회사 정보, 관심 지역, 현재 포트폴리오를 알려주시면 24-48시간 내에 답변드립니다."
      : "We're actively seeking distribution partners worldwide. Submit your inquiry at /contact with your company details, region of interest, and current portfolio - our team responds within 24-48 hours.";
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('quote') || lowerMessage.includes('가격') || lowerMessage.includes('비용') || lowerMessage.includes('견적') || lowerMessage.includes('얼마')) {
    return korean
      ? "가격은 지역과 주문 수량에 따라 다릅니다. /contact 페이지에서 문의해 주시면 맞춤 견적을 보내드리겠습니다."
      : "Pricing varies by region and order volume. Reach out through our contact form at /contact and we'll put together a customized quote for you.";
  }

  // General greetings (EN + KO)
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('안녕') || lowerMessage.includes('하이')) {
    return korean
      ? "안녕하세요! BRITZMEDI에 오신 것을 환영합니다. RF, 초음파, 홈뷰티 디바이스 등 의료미용기기에 대해 궁금한 점을 물어보세요. 가격이나 파트너십 문의는 /contact에서 해주세요."
      : "Hello! Welcome to BRITZMEDI. I'm here to help you learn about our aesthetic medical devices. What would you like to know about? We offer FDA-cleared RF devices, ultrasound systems, and innovative home beauty devices.";
  }

  // Company overview (KO)
  if (lowerMessage.includes('회사') || lowerMessage.includes('브리츠') || lowerMessage.includes('소개') || lowerMessage.includes('설립') || lowerMessage.includes('about')) {
    return korean
      ? "BRITZMEDI(브리츠메디)는 2017년 10월 이신재 대표가 설립한 의료미용기기 전문 기업입니다. 경기도 성남시에 위치하며, FDA 510(k) 인증 TORR RF를 포함한 4개 제품 라인업을 보유하고 있습니다. /contact에서 자세히 문의하세요."
      : "BRITZMEDI was founded in October 2017 by CEO Shinjae Lee. Based in Seongnam-si, South Korea, we design and manufacture aesthetic medical devices including the FDA 510(k) cleared TORR RF system. Learn more at /about or contact us at /contact.";
  }

  // Default response — honest "I don't know" instead of generic product intro
  return korean
    ? "죄송합니다, 해당 내용은 안내가 어렵습니다. britzmedi.com/contact 에서 직접 문의해 주세요."
    : "I'm sorry, I don't have that information. Please contact us at britzmedi.com/contact for assistance.";
}
