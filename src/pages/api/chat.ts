// Claude API Chatbot Endpoint
// POST /api/chat - Send a message to the chatbot

export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

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

// Load knowledge base from markdown file
function loadKnowledgeBase(): string {
  try {
    const knowledgePath = path.join(process.cwd(), 'src', 'data', 'chatbot-knowledge.md');
    return fs.readFileSync(knowledgePath, 'utf-8');
  } catch (error) {
    console.error('Failed to load knowledge base:', error);
    return '';
  }
}

function buildSystemPrompt(context?: { product?: string; page?: string }): string {
  const knowledgeBase = loadKnowledgeBase();

  let systemPrompt = `You are a professional sales consultant for BRITZMEDI, a medical device manufacturer.

## YOUR KNOWLEDGE BASE
The following document contains ALL information you are allowed to use. Read it carefully and follow its rules strictly.

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
      return new Response(JSON.stringify({
        message: getFallbackResponse(body.message, body.context),
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
      return new Response(JSON.stringify({
        message: getFallbackResponse(body.message, body.context),
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

    return new Response(JSON.stringify({
      message: assistantMessage,
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
