// Claude API Chatbot Endpoint
// POST /api/chat - Send a message to the chatbot

export const prerender = false;

import type { APIRoute } from 'astro';
// Import knowledge base at build time (fs.readFileSync doesn't work on Cloudflare Workers)
import knowledgeBaseContent from '../../data/chatbot-knowledge.md?raw';

interface Env {
  ANTHROPIC_API_KEY?: string;
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
  verificationToken?: string; // For "I'm not a robot" verification
}

// Simple in-memory store for spam detection (resets on server restart)
const spamDetection = new Map<string, {
  messages: string[];
  lastActivity: number;
  messageCount: number;
  verified: boolean;
}>();

// Rate limiting store (IP-based)
const rateLimitStore = new Map<string, {
  requests: number[];  // timestamps of recent requests
  blocked: boolean;
  blockedUntil: number;
}>();

// Rate limit configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 10,   // Max 10 requests per minute per IP
  maxRequestsPerHour: 60,     // Max 60 requests per hour per IP
  blockDurationMs: 5 * 60 * 1000,  // 5 minute block after exceeding limits
  maxConversationTurns: 50,   // Max 50 turns per session
};

// Check rate limit for IP
function checkRateLimit(clientIP: string): { allowed: boolean; reason?: string; retryAfter?: number } {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  let record = rateLimitStore.get(clientIP);

  // Initialize if new IP
  if (!record) {
    record = { requests: [], blocked: false, blockedUntil: 0 };
    rateLimitStore.set(clientIP, record);
  }

  // Check if currently blocked
  if (record.blocked && now < record.blockedUntil) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, reason: 'rate_limited', retryAfter };
  }

  // Unblock if block period has passed
  if (record.blocked && now >= record.blockedUntil) {
    record.blocked = false;
    record.requests = [];
  }

  // Clean old requests
  record.requests = record.requests.filter(ts => ts > oneHourAgo);

  // Count recent requests
  const requestsLastMinute = record.requests.filter(ts => ts > oneMinuteAgo).length;
  const requestsLastHour = record.requests.length;

  // Check limits
  if (requestsLastMinute >= RATE_LIMIT.maxRequestsPerMinute) {
    record.blocked = true;
    record.blockedUntil = now + RATE_LIMIT.blockDurationMs;
    rateLimitStore.set(clientIP, record);
    console.warn(`[RATE LIMIT] IP ${clientIP.slice(0, 15)}... blocked: ${requestsLastMinute} req/min exceeded`);
    return { allowed: false, reason: 'too_many_requests_minute', retryAfter: 60 };
  }

  if (requestsLastHour >= RATE_LIMIT.maxRequestsPerHour) {
    record.blocked = true;
    record.blockedUntil = now + RATE_LIMIT.blockDurationMs;
    rateLimitStore.set(clientIP, record);
    console.warn(`[RATE LIMIT] IP ${clientIP.slice(0, 15)}... blocked: ${requestsLastHour} req/hour exceeded`);
    return { allowed: false, reason: 'too_many_requests_hour', retryAfter: 300 };
  }

  // Add current request timestamp
  record.requests.push(now);
  rateLimitStore.set(clientIP, record);

  return { allowed: true };
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

// Clean up old rate limit records periodically
function cleanRateLimitStore() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [ip, record] of rateLimitStore.entries()) {
    // Remove records with no recent activity
    if (record.requests.length === 0 || record.requests[record.requests.length - 1] < oneHourAgo) {
      rateLimitStore.delete(ip);
    }
  }
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

  const normalized = normalizeMessage(message);
  const session = spamDetection.get(sessionId) || { messages: [], lastActivity: Date.now(), messageCount: 0, verified: false };

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
  session.lastActivity = Date.now();

  // Keep only last 10 messages
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-10);
  }

  spamDetection.set(sessionId, session);

  // Require verification after 10 messages if not verified
  const requireVerification = session.messageCount >= 10 && !session.verified;

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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as ChatRequest;

    if (!body.message || body.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate session ID from request if not provided
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
    const sessionId = body.sessionId || `${clientIP}-${request.headers.get('user-agent')?.slice(0, 50) || 'unknown'}`;

    // Clean up old rate limit records periodically (1% chance per request)
    if (Math.random() < 0.01) {
      cleanRateLimitStore();
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(clientIP);
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
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const apiKey = env?.ANTHROPIC_API_KEY || import.meta.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return a fallback response when API key is not configured
      const fallbackMessage = getFallbackResponse(body.message, body.context);
      const suggestions = generateFollowUpSuggestions(body.message, fallbackMessage, body.context);
      return new Response(JSON.stringify({
        message: fallbackMessage,
        suggestions,
        fallback: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build message history
    const messages = [
      ...(body.history || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: buildSystemPrompt(body.context),
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);

      // Return fallback on API error
      const fallbackMessage = getFallbackResponse(body.message, body.context);
      const suggestions = generateFollowUpSuggestions(body.message, fallbackMessage, body.context);
      return new Response(JSON.stringify({
        message: fallbackMessage,
        suggestions,
        fallback: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || 'I apologize, but I encountered an issue. Please try again.';

    // Log API usage for cost monitoring
    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0;
      const outputTokens = data.usage.output_tokens || 0;
      logRequestUsage(inputTokens, outputTokens);
    }

    // Generate context-aware follow-up suggestions
    const suggestions = generateFollowUpSuggestions(body.message, assistantMessage, body.context);

    return new Response(JSON.stringify({
      message: assistantMessage,
      suggestions,
      fallback: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process chat request',
      message: 'I apologize for the technical difficulty. Please contact us directly at contact@britzmedi.co.kr'
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
    suggestions.push('What OEM services do you offer?');
    suggestions.push('What is the minimum order for OEM?');
    suggestions.push('Can you customize device branding?');
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

// Fallback responses when API is not available
function getFallbackResponse(message: string, context?: { product?: string }): string {
  const lowerMessage = message.toLowerCase();

  // Product inquiries
  if (lowerMessage.includes('torr') || lowerMessage.includes('rf')) {
    return "TORR RF (MTX-C1) is our flagship FDA 510(k) cleared Multi-Wave RF system. It features patented Auto Circular Motion technology for even energy distribution, real-time temperature control, and the Vibro-Comfort system for patient comfort. Would you like to learn more about its specifications or discuss partnership opportunities?";
  }

  if (lowerMessage.includes('ulblanc') || lowerMessage.includes('ultrasound')) {
    return "ULBLANC (i-Booster) is our dual-frequency ultrasound system featuring Dynamic Dual Wave technology (1MHz + 3MHz) and i-Booster sonophoresis for enhanced product absorption. It's MFDS certified and excellent for skin elasticity treatments. Would you like more details?";
  }

  if (lowerMessage.includes('newchae') || lowerMessage.includes('home device')) {
    return "NEWCHAE SHOT is our innovative 3-in-1 home beauty device combining RF, EMS, and ELP technologies. Clinical studies show +128% skin density improvement and -26% pore size reduction. Perfect for at-home professional skincare routines!";
  }

  if (lowerMessage.includes('lumino') || lowerMessage.includes('laser')) {
    return "LUMINO WAVE (LSR-10) is our upcoming convergence device combining ultrasound and laser technologies. It's currently under MFDS review and scheduled for release in H2 2026. Sign up for updates on our contact page!";
  }

  // Company inquiries
  if (lowerMessage.includes('fda') || lowerMessage.includes('certification') || lowerMessage.includes('certified')) {
    return "BRITZMEDI holds FDA 510(k) clearance (K212561) for TORR RF, ISO 13485:2016 certification, GMP certification, and MFDS licensing. Our products meet the highest international regulatory standards.";
  }

  if (lowerMessage.includes('distributor') || lowerMessage.includes('partnership') || lowerMessage.includes('dealer')) {
    return "We're actively seeking distribution partners worldwide. Submit your inquiry at /contact with your company details, region of interest, and current portfolio - our team responds within 24-48 hours.";
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('quote')) {
    return "Pricing varies by region and order volume. Reach out through our contact form at /contact and we'll put together a customized quote for you.";
  }

  // General greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! Welcome to BRITZMEDI. I'm here to help you learn about our aesthetic medical devices. What would you like to know about? We offer FDA-cleared RF devices, ultrasound systems, and innovative home beauty devices.";
  }

  // Default response
  return "Thanks for reaching out! We specialize in aesthetic medical devices - TORR RF (FDA 510(k) cleared), ULBLANC ultrasound, and NEWCHAE SHOT home device. What would you like to know? For quotes or partnerships, you can reach us at /contact.";
}
