import type { APIRoute } from 'astro';
import { sendSlackNotification, sendUrgentLeadAlert } from '../../../lib/slack';
import { logActivity } from '../../../lib/activity-log';
import { sendEmail } from '../../../lib/youtube-to-blog/email';
import { notifyNewLead, buildLeadReportEmail, sendLeadReportEmail } from '../../../lib/email-notifications';
import { isFreeEmail, isValidEmailFormat } from '../../../lib/email-validation';
import { scoreLead } from '../../../lib/lead-scoring';
import { researchCompany } from '../../../lib/lead-research';
import { createGmailDraft } from '../../../lib/gmail-draft';

export const prerender = false;

interface Env {
  DB: D1Database;
  SLACK_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
}

// ── Auto-reply draft: single source of product truth ─────────────
// status pinned to business reality (2026-06-09): TORR RF / NEWCHAE SHOT 판매중,
// ULBLANC 버전업 중, LUMINO WAVE 출시 전. 폼·답장이 같은 목록을 본다.
const PRODUCT_CATALOG: Record<string, { name: string; status: 'available' | 'coming_soon'; blurb: string }> = {
  'torr-rf':      { name: 'TORR RF',      status: 'available',   blurb: 'Professional medical RF device for clinics (US FDA 510(k) + Korea MFDS/KFDA approval; NO CE). Multi-wave RF for skin tightening, body contouring, wrinkle reduction. For licensed medical professionals.' },
  'newchae-shot': { name: 'NEWCHAE SHOT', status: 'available',   blurb: 'Personal home-use consumer beauty RF device adapted from TORR RF technology. NOT a medical device, NOT microneedling, NOT an injection system. Safe for home use without medical supervision.' },
  'ulblanc':      { name: 'ULBLANC',      status: 'coming_soon', blurb: 'Currently being upgraded to a new version — we will notify interested partners when it is available for their market.' },
  'lumino-wave':  { name: 'LUMINO WAVE',  status: 'coming_soon', blurb: 'Pre-launch — not yet released. We will notify interested partners at launch.' },
};
function displayInterest(slug: string): string {
  return PRODUCT_CATALOG[slug]?.name || slug;
}

// IP-based rate limiting for lead submissions
const leadRateLimitStore = new Map<string, number[]>();

const LEAD_RATE_LIMIT = {
  maxPerMinute: 3,
  maxPerHour: 10,
};

function checkLeadRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let timestamps = leadRateLimitStore.get(ip) || [];

  // Clean entries older than 1 hour
  timestamps = timestamps.filter(t => now - t < 3600000);
  leadRateLimitStore.set(ip, timestamps);

  // Check per-minute limit
  const minuteCount = timestamps.filter(t => now - t < 60000).length;
  if (minuteCount >= LEAD_RATE_LIMIT.maxPerMinute) {
    return { allowed: false, retryAfter: 60 };
  }

  // Check per-hour limit
  if (timestamps.length >= LEAD_RATE_LIMIT.maxPerHour) {
    return { allowed: false, retryAfter: 3600 };
  }

  timestamps.push(now);
  return { allowed: true };
}

// Periodically clean stale entries (every 100 requests)
let requestCounter = 0;
function cleanupRateLimitStore() {
  if (++requestCounter % 100 !== 0) return;
  const now = Date.now();
  for (const [ip, timestamps] of leadRateLimitStore) {
    const fresh = timestamps.filter(t => now - t < 3600000);
    if (fresh.length === 0) {
      leadRateLimitStore.delete(ip);
    } else {
      leadRateLimitStore.set(ip, fresh);
    }
  }
}

// GET /api/leads - List leads with filtering
export const GET: APIRoute = async (context) => {
  const { request, locals } = context;

  // Debug mode - return locals structure
  const debugParam = new URL(request.url).searchParams.get('debug');
  if (debugParam === '1') {
    const runtime = (locals as any).runtime;
    return new Response(JSON.stringify({
      debug: true,
      localsKeys: Object.keys(locals || {}),
      runtimeKeys: runtime ? Object.keys(runtime) : null,
      envKeys: runtime?.env ? Object.keys(runtime.env) : null,
      hasDB: !!runtime?.env?.DB,
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Access Cloudflare runtime
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;

    if (!db) {
      // Return sample data if DB not available (dev mode)
      return new Response(JSON.stringify({ leads: getSampleLeads(), total: 3 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const grade = url.searchParams.get('grade');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params: (string | number)[] = [];

    if (grade) {
      query += ' AND lead_grade = ?';
      params.push(grade);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (company_name LIKE ? OR contact_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const countParams: string[] = [];

    if (grade) {
      countQuery += ' AND lead_grade = ?';
      countParams.push(grade);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (search) {
      countQuery += ' AND (company_name LIKE ? OR contact_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const countResult = await db.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return new Response(JSON.stringify({
      leads: result.results,
      total: countResult?.total || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Leads API] Error fetching leads:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch leads',
      details: error?.message || String(error),
      stack: error?.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/leads - Create new lead
export const POST: APIRoute = async ({ request, locals }) => {
  // Rate limiting
  const clientIP = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';

  cleanupRateLimitStore();
  const rateCheck = checkLeadRateLimit(clientIP);
  if (!rateCheck.allowed) {
    console.log(`[Leads API] Rate limited IP: ${clientIP}`);
    return new Response(JSON.stringify({
      error: 'Too many submissions. Please try again later.',
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(rateCheck.retryAfter),
      },
    });
  }

  try {
    const data = await request.json();
    const source = data.source || 'website';

    // Validate required fields based on source
    let required: string[];
    if (source === 'resource_download') {
      required = ['email', 'contact_name', 'company_name'];
    } else if (source === 'newsletter') {
      required = ['email'];
    } else {
      required = ['company_name', 'contact_name', 'job_title', 'email', 'country', 'interested_products'];
    }

    for (const field of required) {
      if (!data[field]) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 1. Validate email format
    if (!isValidEmailFormat(data.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format', field: 'email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Check free email — save but flag
    const isFree = isFreeEmail(data.email);

    // Build enrichment_data (referral_source + inquiry_type) if provided
    const enrichment: Record<string, unknown> = {};
    if (data.referral_source) enrichment.referral_source = data.referral_source;
    if (data.inquiry_type) enrichment.inquiry_type = data.inquiry_type;
    const enrichmentData = Object.keys(enrichment).length ? JSON.stringify(enrichment) : null;

    // 3. Intelligent 5-axis scoring (pre-research)
    const interestedProducts = Array.isArray(data.interested_products) ? data.interested_products : [];
    const initialScoring = scoreLead({
      email: data.email,
      companyName: data.company_name || '',
      companyWebsite: data.company_website || undefined,
      jobTitle: data.job_title || undefined,
      country: data.country || '',
      interestedIn: interestedProducts,
      message: data.message || undefined,
      source: source,
      isFreeEmail: isFree,
    });

    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;
    if (!db) {
      // Dev mode - just return success
      console.log('[Leads API] Would create lead:', { ...data, lead_score: initialScoring.total, lead_grade: initialScoring.grade });
      return new Response(JSON.stringify({
        success: true,
        lead: { id: Date.now(), ...data, lead_score: initialScoring.total, lead_grade: initialScoring.grade },
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Save to DB with new columns
    const result = await db.prepare(`
      INSERT INTO leads (
        company_name, company_website, contact_name, job_title, email, country,
        interested_products, message, lead_score, lead_grade,
        source, utm_source, utm_medium, utm_campaign, enrichment_data,
        is_free_email, research_status, score_breakdown
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      data.company_name || 'N/A',
      data.company_website || null,
      data.contact_name || 'N/A',
      data.job_title || 'N/A',
      data.email,
      data.country || 'N/A',
      JSON.stringify(interestedProducts),
      data.message || null,
      initialScoring.total,
      initialScoring.grade,
      source,
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null,
      enrichmentData,
      isFree ? 1 : 0,
      JSON.stringify(initialScoring),
    ).run();

    const leadId = result.meta?.last_row_id;
    console.log('[Leads API] Lead created:', leadId, `Grade ${initialScoring.grade}, Score ${initialScoring.total}`);

    // Log activity (non-blocking)
    logActivity(db, {
      type: 'lead_created',
      detail: `New lead: ${data.company_name} (${data.country}) — Grade ${initialScoring.grade}, Score ${initialScoring.total}${isFree ? ' [Free email]' : ''}`,
      ip: clientIP,
    }).catch(() => {});

    // 5. Instant 1st notification (score only, no research yet)
    try {
      await notifyNewLead(env, {
        type: source === 'newsletter' ? 'newsletter' : 'contact_form',
        company: data.company_name,
        name: data.contact_name,
        email: data.email,
        country: data.country,
        product_interest: interestedProducts.join(', '),
        message: data.message,
        lead_score: initialScoring.total,
        lead_grade: initialScoring.grade,
      });
    } catch (e) {
      console.error('[NOTIFY]', e);
    }

    // Send Slack notification (non-blocking)
    const slackUrl = (env as any)?.SLACK_WEBHOOK_URL as string | undefined;
    if (slackUrl) {
      const slackPayload = {
        companyName: data.company_name || 'N/A',
        contactName: data.contact_name || 'N/A',
        email: data.email,
        country: data.country || 'N/A',
        jobTitle: data.job_title || 'N/A',
        interestedProducts: interestedProducts,
        leadScore: initialScoring.total,
        leadGrade: initialScoring.grade,
        message: data.message,
        companyWebsite: data.company_website,
      };
      sendSlackNotification(slackPayload, slackUrl).catch(err =>
        console.error('[Leads API] Slack notification failed:', err)
      );
      if (initialScoring.grade === 'A') {
        sendUrgentLeadAlert(slackPayload, slackUrl).catch(err =>
          console.error('[Leads API] Slack urgent alert failed:', err)
        );
      }
    }

    // Send confirmation email to lead via Resend (non-blocking)
    const resendKey = (env as any)?.RESEND_API_KEY as string | undefined;
    if (resendKey && data.email && source === 'website') {
      const contactName = data.contact_name || 'there';
      const products = interestedProducts.join(', ');
      const confirmHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0070c4, #015a9f); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 20px;">Thank You for Your Inquiry</h2>
          </div>
          <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #1e293b; font-size: 16px; margin: 0 0 16px;">Dear ${contactName},</p>
            <p style="color: #475569; line-height: 1.7; margin: 0 0 16px;">
              Thank you for reaching out to BRITZMEDI. We have received your inquiry and our team will review it promptly.
            </p>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;"><strong>Company:</strong> ${data.company_name || 'N/A'}</p>
              ${products ? `<p style="color: #64748b; font-size: 14px; margin: 0 0 8px;"><strong>Products of Interest:</strong> ${products}</p>` : ''}
              <p style="color: #64748b; font-size: 14px; margin: 0;"><strong>Country:</strong> ${data.country || 'N/A'}</p>
            </div>
            <p style="color: #475569; line-height: 1.7; margin: 16px 0;">
              A member of our international sales team will get back to you within <strong>1-2 business days</strong>.
            </p>
            <p style="color: #475569; line-height: 1.7; margin: 16px 0 0;">
              In the meantime, feel free to explore our <a href="https://britzmedi.com/products" style="color: #0070c4; text-decoration: none;">product catalog</a> or <a href="https://britzmedi.com/blog" style="color: #0070c4; text-decoration: none;">industry insights blog</a>.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
              BRITZMEDI Co., Ltd. | Medical Aesthetic Device Manufacturer<br/>
              <a href="https://britzmedi.com" style="color: #94a3b8;">britzmedi.com</a>
            </p>
          </div>
        </div>
      `;
      sendEmail({
        apiKey: resendKey,
        to: data.email,
        subject: 'Thank you for your inquiry - BRITZMEDI',
        html: confirmHtml,
        from: 'BRITZMEDI Global <noreply@britzmedi.com>',
      }).catch(err =>
        console.error('[Leads API] Confirmation email failed:', err)
      );
    }

    // 6. AI Draft: generate personalized response → save to Gmail Drafts → notify
    const ctx = (locals as any)?.runtime?.ctx;
    if (ctx?.waitUntil && env?.ANTHROPIC_API_KEY && env?.GMAIL_CLIENT_ID && source === 'website') {
      const productLines = Object.values(PRODUCT_CATALOG)
        .map((p) => `  - ${p.name} [${p.status === 'available' ? 'AVAILABLE' : 'COMING SOON / being prepared'}]: ${p.blurb}`)
        .join('\n');
      const interestDisplay = interestedProducts.map(displayInterest).join(', ') || '(not specified)';
      const inquiryType = data.inquiry_type || '(not specified)';
      const leadGrade = initialScoring.grade;
      const leadScore = initialScoring.total;
      ctx.waitUntil((async () => {
        let draftBody = '';
        const primaryInterest = interestedProducts[0];
        let draftSubject = primaryInterest
          ? `Thank you for your interest in ${displayInterest(primaryInterest)} - BRITZMEDI`
          : 'Thank you for your inquiry - BRITZMEDI';
        let gmailOk = false;

        try {
          const draftResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': env.ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-6',
              max_tokens: 1024,
              messages: [{
                role: 'user',
                content: `You are Sungho Lee, Overseas Sales & Marketing Director at BRITZMEDI (sh.lee@britzmedi.com), a Korean aesthetic device manufacturer. Write a FIRST-CONTACT reply to a lead who just submitted our website inquiry form. A human (you) reviews this draft in Gmail before sending — write it as a ready-to-send, personal reply.

PRODUCTS (only these exist; never invent products or specs):
${productLines}
- ULBLANC and LUMINO WAVE are COMING SOON (ULBLANC is being upgraded to a new version; LUMINO WAVE is pre-launch). If a lead is interested in either, acknowledge it, say it is being prepared for international release and you will notify them when it is available for their market. Do NOT say it is unavailable or that it doesn't exist, and do NOT redirect or bait-and-switch them to a different product.
- NEVER describe NEWCHAE SHOT as a medical device, injection system, or microneedling device.

WHAT WE OFFER (important):
- For B2B, BRITZMEDI offers ONLY country-level distributorship (총판) of our finished products. We do NOT offer OEM or ODM.
- If the lead asks for OEM / ODM or private-label manufacturing, politely decline that specific request and instead invite them to consider becoming our country distributor for TORR RF / NEWCHAE SHOT.

REGULATORY SAFETY (critical — legal risk):
- Verified clearances: TORR RF holds US FDA 510(k) and Korea MFDS (KFDA) approval — and nothing else. TORR RF does NOT have CE; never claim CE (or any other country's approval) for TORR RF. Do NOT attribute TORR RF's clearances to NEWCHAE SHOT, ULBLANC, or LUMINO WAVE.
- If the lead asks about a SPECIFIC indication's clearance (e.g. body contouring) or a SPECIFIC country's approval (PMDA, TGA, ANVISA, NMPA, MFDS, etc.), do NOT assert it is approved — say you will confirm the exact regulatory scope for their market and follow up. Never put an unverified regulatory claim in writing.

LEAD (every field below was ALREADY collected by our form — do NOT ask for any of it again):
- Company: ${data.company_name || 'N/A'} | Website: ${data.company_website || 'N/A'}
- Name: ${data.contact_name || 'there'} | Title: ${data.job_title || 'N/A'} | Country: ${data.country || 'N/A'}
- Interested in: ${interestDisplay}
- Inquiry type (their selected intent): ${inquiryType}  (distributor = wants a country distributorship; product_info = wants product information / where to buy)
- Internal lead grade (NEVER reveal to the lead): ${leadGrade} (${leadScore}/100)
- Their message: ${data.message || '(none provided)'}
- Reply language: ALWAYS reply in the language the lead wrote their message in (even if it differs from their country's language). Only when the message is empty or unclear, use the main business language of their country; if still unsure, English.

CHOOSE the track from inquiry type + interested products + message:
- DISTRIBUTOR (inquiry_type 'distributor', or message implies importing / reselling / exclusive rights): warmly acknowledge their market and signal we are open to a country distributorship. The next step is our short online Distributor Qualification — direct them to complete it at this EXACT link, placed on its own line: https://britzmedi-partners.pages.dev/distributor/verify . Briefly explain that it takes only a few minutes: they verify their business email and securely upload ONE qualifying document, and our partnership team reviews qualified submissions and responds within about 24 hours. List the acceptable documents as a bullet list (per the ALWAYS-BULLET rule):
- Business registration certificate
- Medical-device distribution or import license
- Equivalent regulatory authorization
Do NOT ask them to email documents to you, and do NOT re-ask for the company name or country already provided — the qualification form is how they submit everything.
- PRODUCT-INFO / BUYER (inquiry_type 'product_info', a product SKU, or an end-user title such as director / owner / doctor / 院長): answer their product questions. Explain that internationally we supply through country distributors — offer to connect them with the distributor for their market. If they themselves are interested in distributing or reselling, invite them to start our Distributor Qualification at https://britzmedi-partners.pages.dev/distributor/verify . Do NOT ask an end-user for an import license.
- COMING-SOON only (ULBLANC / LUMINO WAVE): acknowledge interest, explain it is being prepared, and that you will notify them at release. Make no deal promises.

RESOURCES (for DISTRIBUTOR and PRODUCT-INFO inquiries, add a short "Resources:" list near the end so they can review our company and product brochures — use ONLY these official links, never invent or alter a URL):
- Product details & brochure: https://britzmedi.com/products/<slug>  (use slug "torr-rf" or "newchae-shot" matching their interested product; for multiple or general interest use https://britzmedi.com/products)
- Company & product brochures (download center): https://britzmedi.com/resources
Present this as a labeled "Resources:" block with each link on its own line starting with "- ". Omit it for coming-soon-only inquiries.

UNIVERSAL RULES (MUST follow):
1. If the lead asked specific questions (price, MOQ, margin, warranty, training, regulatory, availability, brochure, catalog), acknowledge EACH one explicitly. For any figure or fact you don't have, say you will confirm and follow up — never guess, never leave a question unanswered.
2. Do NOT re-ask for anything already listed in LEAD above (company, website, name, title, country, interests).
3. The distributor next step is our REAL online Distributor Qualification form — whenever you mention it you MUST include the exact link given in the DISTRIBUTOR track. Never say "I will send you a form" without the link, and never invent or alter a URL.
3a. ALWAYS-BULLET RULE (mandatory, no exceptions): any time your reply asks the lead for TWO OR MORE things — documents, details, or items — you MUST format them as a vertical bullet list: one short lead-in line ending with a colon, then EACH item on its OWN line beginning with "- " (a plain hyphen and a space). This applies in EVERY reply. NEVER combine two or more requested items into a single comma-separated sentence, even when prose would read more smoothly. The exact required format:
To proceed, please complete our Distributor Qualification and upload one of:
- Business registration certificate
- Medical-device distribution or import license
- Equivalent regulatory authorization
4. Do NOT propose a call, video meeting, or visit (company policy: later). You MAY offer a concrete next step that needs no meeting — e.g. preparing a quotation, sending a brochure, or reviewing their documents.
5. Tone and length scale with grade: A/B = warmer and more substantive (up to ~150 words); C/D = concise (~80–110 words).
6. Plain text only (no markdown, no HTML). Do NOT write a subject line in the body — the email subject is set separately.
7. Open with a warm, natural, human greeting that must NOT look auto-generated or like a mail-merge. The lead entered their name as: "${data.contact_name || '(none)'}". If it looks like a real personal name, address them naturally in proper Title Case — by first name ("Dear Virat,") or "Dear Mr./Ms. [Surname],". If that name field is empty, is an all-caps run-together blob (e.g. "VIRATJOSHI"), contains digits or symbols, looks like a company name, or is otherwise not a clean human name, do NOT echo it verbatim — open with "Dear Sir/Madam,". End EXACTLY with:

Warm regards,

Sungho Lee
Overseas Sales & Marketing Director
BRITZMEDI Co., Ltd.
sh.lee@britzmedi.com`,
              }],
            }),
          });

          if (!draftResponse.ok) {
            console.error('[ai-draft] Claude API error:', draftResponse.status, await draftResponse.text());
          } else {
            const draftResult = await draftResponse.json() as any;
            const rawText = draftResult.content?.[0]?.text || '';
            draftBody = rawText.replace(/```[\s\S]*?```/g, '').trim();
          }
        } catch (e) {
          console.error('[ai-draft] Claude API failed:', e);
        }

        if (draftBody) {
          try {
            await createGmailDraft(
              {
                clientId: env.GMAIL_CLIENT_ID!,
                clientSecret: env.GMAIL_CLIENT_SECRET!,
                refreshToken: env.GMAIL_REFRESH_TOKEN!,
              },
              {
                to: data.email,
                toName: data.contact_name || '',
                subject: draftSubject,
                htmlBody: `<div style="font-family: Arial, sans-serif; line-height: 1.7; white-space: pre-line;">${draftBody}</div>`,
              },
            );
            gmailOk = true;
            console.log(`[ai-draft] Gmail draft created for lead ${leadId}`);
          } catch (e) {
            console.error('[ai-draft] Gmail draft failed:', e);
          }
        }

        if (resendKey && !gmailOk) {
          try {
            await sendEmail({
              apiKey: resendKey,
              to: 'sh.lee@britzmedi.com',
              subject: `[AI Draft - Gmail Error] ${data.company_name} (${data.country})`,
              html: `<div style="font-family: Arial, sans-serif; max-width: 700px; padding: 20px;">
  <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px;">Gmail draft failed. Copy the draft below and send manually.</p>
  <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
    <p style="margin: 4px 0; color: #475569;"><strong>To:</strong> ${data.contact_name} &lt;${data.email}&gt;</p>
    <p style="margin: 4px 0; color: #475569;"><strong>Company:</strong> ${data.company_name}</p>
    <p style="margin: 4px 0; color: #475569;"><strong>Products:</strong> ${interestedProducts.join(', ')}</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; white-space: pre-line; line-height: 1.7; color: #1e293b; font-size: 15px;">${draftBody || '(AI draft generation failed)'}</div>
</div>`,
              from: 'BRITZMEDI AI <noreply@britzmedi.com>',
            });
          } catch (e) {
            console.error('[ai-draft] Fallback notification failed:', e);
          }
        }
      })());
    }

    // 7. Async company research via waitUntil (does not delay response)
    if (ctx?.waitUntil && env?.ANTHROPIC_API_KEY) {
      ctx.waitUntil((async () => {
        try {
          const research = await researchCompany(env, {
            companyName: data.company_name || '',
            companyWebsite: data.company_website || undefined,
            email: data.email,
            country: data.country || '',
            jobTitle: data.job_title || undefined,
            interestedIn: interestedProducts,
          });

          // Re-score with research data
          const finalScoring = scoreLead({
            email: data.email,
            companyName: data.company_name || '',
            companyWebsite: data.company_website || undefined,
            jobTitle: data.job_title || undefined,
            country: data.country || '',
            interestedIn: interestedProducts,
            message: data.message || undefined,
            source: source,
            isFreeEmail: isFree,
            companyResearch: research,
          });

          // Update DB with research results
          await db.prepare(
            `UPDATE leads SET company_research = ?, research_status = 'completed', lead_grade = ?, score_breakdown = ?, lead_score = ? WHERE id = ?`
          ).bind(
            JSON.stringify(research),
            finalScoring.grade,
            JSON.stringify(finalScoring),
            finalScoring.total,
            leadId,
          ).run();

          console.log(`[Leads API] Research complete for lead ${leadId}: Grade ${finalScoring.grade}, Score ${finalScoring.total}`);

          // 2nd notification: full sales intelligence report email
          const { subject, html } = buildLeadReportEmail({
            lead: { ...data, isFreeEmail: isFree },
            scoring: finalScoring,
            research,
          });
          await sendLeadReportEmail(env, { subject, html });

          // Save notification to admin_notifications
          await db.prepare(
            `INSERT INTO admin_notifications (type, title, message, link, data) VALUES (?, ?, ?, ?, ?)`
          ).bind(
            'lead_researched',
            `Lead Research Complete: ${data.company_name}`,
            `Grade ${finalScoring.grade} (${finalScoring.total}/100) — ${research.recommended_action || 'Review needed'}`,
            '/admin/leads',
            JSON.stringify({ lead_id: leadId, grade: finalScoring.grade, score: finalScoring.total }),
          ).run();

        } catch (e) {
          console.error('[Leads API] Research failed for lead', leadId, e);
          await db.prepare(
            `UPDATE leads SET research_status = 'failed' WHERE id = ?`
          ).bind(leadId).run().catch(() => {});
        }
      })());
    }

    // 8. Respond immediately (research runs in background)
    return new Response(JSON.stringify({
      success: true,
      lead: { id: leadId, ...data, lead_score: initialScoring.total, lead_grade: initialScoring.grade },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Leads API] Error creating lead:', error);

    // Handle duplicate email
    if (error.message?.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'A lead with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Sample data for development
function getSampleLeads() {
  return [
    {
      id: 1,
      company_name: 'Beauty Clinic NYC',
      company_website: 'https://beautyclinicnyc.com',
      contact_name: 'Dr. Sarah Johnson',
      job_title: 'Medical Director',
      email: 'sarah@beautyclinicnyc.com',
      country: 'US',
      interested_products: '["TORR RF", "ULBLANC"]',
      message: 'Interested in becoming a distributor for the East Coast region.',
      lead_score: 85,
      lead_grade: 'A',
      status: 'new',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      company_name: 'Derma Solutions GmbH',
      company_website: 'https://derma-solutions.de',
      contact_name: 'Klaus Mueller',
      job_title: 'Procurement Manager',
      email: 'k.mueller@derma-solutions.de',
      country: 'DE',
      interested_products: '["TORR RF"]',
      message: 'Looking for RF devices for our clinic chain.',
      lead_score: 68,
      lead_grade: 'B',
      status: 'contacted',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      company_name: 'Aesthetic Brazil',
      company_website: null,
      contact_name: 'Ana Costa',
      job_title: 'Owner',
      email: 'ana@aesthetic-brazil.com.br',
      country: 'BR',
      interested_products: '["NEWCHAE SHOT"]',
      message: null,
      lead_score: 52,
      lead_grade: 'C',
      status: 'new',
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}
