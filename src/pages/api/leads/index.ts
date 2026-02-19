import type { APIRoute } from 'astro';
import { sendSlackNotification, sendUrgentLeadAlert } from '../../../lib/slack';
import { calculateLeadScore as calculateAdvancedScore } from '../../../lib/lead-score';
import { logActivity } from '../../../lib/activity-log';
import { sendEmail } from '../../../lib/youtube-to-blog/email';
import { notifyNewLead } from '../../../lib/email-notifications';

export const prerender = false;

interface Env {
  DB: D1Database;
  SLACK_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
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

    // Build enrichment_data with referral_source if provided
    let enrichmentData = null;
    if (data.referral_source) {
      enrichmentData = JSON.stringify({ referral_source: data.referral_source });
    }

    // Calculate lead score
    const { score, grade } = calculateLeadScore(data);

    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;
    if (!db) {
      // Dev mode - just return success
      console.log('[Leads API] Would create lead:', { ...data, lead_score: score, lead_grade: grade });
      return new Response(JSON.stringify({
        success: true,
        lead: { id: Date.now(), ...data, lead_score: score, lead_grade: grade },
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(`
      INSERT INTO leads (
        company_name, company_website, contact_name, job_title, email, country,
        interested_products, message, lead_score, lead_grade,
        source, utm_source, utm_medium, utm_campaign, enrichment_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.company_name || 'N/A',
      data.company_website || null,
      data.contact_name || 'N/A',
      data.job_title || 'N/A',
      data.email,
      data.country || 'N/A',
      JSON.stringify(data.interested_products || []),
      data.message || null,
      score,
      grade,
      source,
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null,
      enrichmentData,
    ).run();

    console.log('[Leads API] Lead created:', result.meta?.last_row_id);

    // Log activity (non-blocking)
    logActivity(db, {
      type: 'lead_created',
      detail: `New lead: ${data.company_name} (${data.country}) — Grade ${grade}, Score ${score}`,
      ip: clientIP,
    }).catch(() => {});

    // Email + dashboard notification (non-blocking)
    notifyNewLead(env, {
      type: source === 'newsletter' ? 'newsletter' : 'contact_form',
      company: data.company_name,
      name: data.contact_name,
      email: data.email,
      country: data.country,
      product_interest: Array.isArray(data.interested_products) ? data.interested_products.join(', ') : data.interested_products,
      message: data.message,
      lead_score: score,
      lead_grade: grade,
    }).catch(e => console.error('[NOTIFY]', e));

    // Send Slack notification (non-blocking, failure won't affect response)
    const slackUrl = (env as any)?.SLACK_WEBHOOK_URL as string | undefined;
    if (slackUrl) {
      const slackPayload = {
        companyName: data.company_name || 'N/A',
        contactName: data.contact_name || 'N/A',
        email: data.email,
        country: data.country || 'N/A',
        jobTitle: data.job_title || 'N/A',
        interestedProducts: data.interested_products || [],
        leadScore: score,
        leadGrade: grade,
        message: data.message,
        companyWebsite: data.company_website,
      };
      // Fire-and-forget: don't await to avoid slowing response
      sendSlackNotification(slackPayload, slackUrl).catch(err =>
        console.error('[Leads API] Slack notification failed:', err)
      );
      if (grade === 'A') {
        sendUrgentLeadAlert(slackPayload, slackUrl).catch(err =>
          console.error('[Leads API] Slack urgent alert failed:', err)
        );
      }
    }

    // Send confirmation email to lead via Resend (non-blocking)
    const resendKey = (env as any)?.RESEND_API_KEY as string | undefined;
    if (resendKey && data.email && source === 'website') {
      const contactName = data.contact_name || 'there';
      const products = Array.isArray(data.interested_products)
        ? data.interested_products.join(', ')
        : '';
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
        from: 'BRITZMEDI <noreply@britzmedi.com>',
      }).catch(err =>
        console.error('[Leads API] Confirmation email failed:', err)
      );
    }

    return new Response(JSON.stringify({
      success: true,
      lead: { id: result.meta?.last_row_id, ...data, lead_score: score, lead_grade: grade },
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

// Lead scoring — delegates to the advanced 7-category algorithm in lead-score.ts
function calculateLeadScore(data: any): { score: number; grade: string } {
  const result = calculateAdvancedScore({
    companyName: data.company_name || '',
    companyWebsite: data.company_website || undefined,
    contactName: data.contact_name || '',
    jobTitle: data.job_title || '',
    email: data.email || '',
    country: data.country || '',
    interestedProducts: Array.isArray(data.interested_products)
      ? data.interested_products
      : [],
    message: data.message || undefined,
  });
  return { score: result.total, grade: result.grade };
}

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
