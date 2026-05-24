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

    // Build enrichment_data with referral_source if provided
    let enrichmentData = null;
    if (data.referral_source) {
      enrichmentData = JSON.stringify({ referral_source: data.referral_source });
    }

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
      ctx.waitUntil((async () => {
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
                content: `You are Sarah Lee, International Sales Manager at BRITZMEDI (sh.lee@britzmedi.com). BRITZMEDI is a Korean medical aesthetic device manufacturer.

Write a personalized follow-up email for this new lead:
- Company: ${data.company_name || 'N/A'}
- Website: ${data.company_website || 'N/A'}
- Name: ${data.contact_name || 'N/A'}
- Title: ${data.job_title || 'N/A'}
- Country: ${data.country || 'N/A'}
- Interested in: ${interestedProducts.join(', ')}
- Their message: ${data.message || '(none)'}

Rules:
- Write in English
- Professional, warm, not pushy
- Mention specific benefits of the products they asked about
- Keep under 200 words
- Output ONLY the email body as HTML (no subject line, no markdown)
- Sign as "Sarah Lee | International Sales Manager | BRITZMEDI Co., Ltd."`,
              }],
            }),
          });

          if (!draftResponse.ok) {
            console.error('[ai-draft] Claude API error:', draftResponse.status);
            return;
          }

          const draftResult = await draftResponse.json() as any;
          const draftBody = draftResult.content?.[0]?.text || '';
          const draftSubject = `Thank you for your interest — ${interestedProducts[0] || 'BRITZMEDI'}`;

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
              htmlBody: draftBody,
            },
          );

          console.log(`[ai-draft] Gmail draft created for lead ${leadId}`);

          if (resendKey) {
            await sendEmail({
              apiKey: resendKey,
              to: 'sh.lee@britzmedi.com',
              subject: `[AI Draft Ready] ${data.company_name} (${data.country})`,
              html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
  <p style="font-size: 15px; color: #1e293b;">Gmail 임시보관함에 AI 응대 초안이 저장되었습니다.</p>
  <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 4px 0; color: #475569;"><strong>To:</strong> ${data.contact_name} &lt;${data.email}&gt;</p>
    <p style="margin: 4px 0; color: #475569;"><strong>Company:</strong> ${data.company_name}</p>
    <p style="margin: 4px 0; color: #475569;"><strong>Products:</strong> ${interestedProducts.join(', ')}</p>
    <p style="margin: 4px 0; color: #475569;"><strong>Subject:</strong> ${draftSubject}</p>
  </div>
  <p style="font-size: 14px; color: #64748b;">Gmail에서 확인 후 수정하여 발송하세요.</p>
</div>`,
              from: 'BRITZMEDI AI <noreply@britzmedi.com>',
            });
          }
        } catch (e) {
          console.error('[ai-draft] Failed:', e);
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
