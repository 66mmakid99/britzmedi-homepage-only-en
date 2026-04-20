// Lead notification system — email + DB
// Sends email via Resend (if API key set), always saves to admin_notifications

import type { ScoreBreakdown } from './lead-scoring';

const ADMIN_EMAIL = 'sh.lee@britzmedi.com';
const FROM_EMAIL = 'BRITZMEDI Global <noreply@britzmedi.com>';

export interface LeadNotification {
  type: 'contact_form' | 'chatbot' | 'newsletter';
  company?: string;
  name?: string;
  email?: string;
  country?: string;
  product_interest?: string;
  message?: string;
  source_url?: string;
  lead_score?: number;
  lead_grade?: string;
}

export async function notifyNewLead(env: any, lead: LeadNotification) {
  // 1. Save to admin_notifications DB
  await saveNotification(env, lead);

  // 2. Attempt email via Resend
  const apiKey = env?.RESEND_API_KEY;
  if (apiKey) {
    await sendEmailViaResend(apiKey, lead);
  } else {
    console.log('[EMAIL SKIP] RESEND_API_KEY not set. Lead notification:', JSON.stringify(lead));
  }
}

async function saveNotification(env: any, lead: LeadNotification) {
  const db = env?.DB as D1Database | undefined;
  if (!db) return;

  try {
    await db.prepare(
      'INSERT INTO admin_notifications (type, title, message, link, data) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      'new_lead',
      `New ${lead.type === 'chatbot' ? 'chatbot' : lead.type === 'newsletter' ? 'newsletter' : 'contact form'} lead: ${lead.company || lead.name || lead.email || 'Unknown'}`,
      lead.message?.substring(0, 200) || '',
      '/admin/leads',
      JSON.stringify(lead),
    ).run();
  } catch (e) {
    console.error('[NOTIFICATION DB] Failed to save:', e);
  }
}

async function sendEmailViaResend(apiKey: string, lead: LeadNotification) {
  const subject = getSubject(lead);
  const html = getEmailHtml(lead);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error('[EMAIL ERROR]', await res.text());
    } else {
      console.log('[EMAIL] Lead notification sent to', ADMIN_EMAIL);
    }
  } catch (e) {
    console.error('[EMAIL ERROR]', e);
  }
}

function getSubject(lead: LeadNotification): string {
  if (lead.type === 'chatbot') {
    if (lead.lead_score && lead.lead_score >= 80) {
      return `Chatbot Lead Converted! — ${lead.country || 'Unknown'}`;
    }
    return `New Chatbot Conversation — ${lead.country || 'Visitor'}`;
  }
  if (lead.type === 'newsletter') return `New Subscriber — ${lead.email}`;
  const grade = lead.lead_grade ? ` [${lead.lead_grade}]` : '';
  return `New Lead${grade} — ${lead.company || lead.name || 'Unknown'}`;
}

function esc(s?: string): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getEmailHtml(lead: LeadNotification): string {
  const sourceLabel = lead.type === 'chatbot' ? 'Chatbot Conversion' : lead.type === 'newsletter' ? 'Newsletter Signup' : 'Contact Form';

  const rows: string[] = [];
  if (lead.company) rows.push(row('Company', `<strong>${esc(lead.company)}</strong>`));
  if (lead.name) rows.push(row('Name', esc(lead.name)));
  if (lead.email) rows.push(row('Email', `<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>`));
  if (lead.country) rows.push(row('Country', esc(lead.country)));
  if (lead.product_interest) rows.push(row('Product', esc(lead.product_interest)));
  if (lead.message) rows.push(row('Message', esc(lead.message)));
  if (lead.lead_score != null) {
    const color = lead.lead_score >= 80 ? '#16a34a' : lead.lead_score >= 50 ? '#ca8a04' : '#dc2626';
    rows.push(row('Score', `<strong style="color:${color};">${lead.lead_score}/100 (${lead.lead_grade || '-'})</strong>`));
  }

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2563eb;color:white;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;font-size:18px;">New Lead — BRITZMEDI</h2>
        <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">${sourceLabel}</p>
      </div>
      <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        <table style="width:100%;border-collapse:collapse;">${rows.join('')}</table>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
          <a href="https://britzmedi.com/admin/leads" style="display:inline-block;background:#2563eb;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;">View in Admin →</a>
        </div>
      </div>
    </div>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px 0;color:#64748b;width:100px;vertical-align:top;font-size:14px;">${label}</td><td style="padding:8px 0;font-size:14px;">${value}</td></tr>`;
}

// ---------- Sales Intelligence Report Email ----------

export function buildLeadReportEmail(data: {
  lead: any;
  scoring: ScoreBreakdown;
  research: any;
}): { subject: string; html: string } {
  const { lead, scoring, research } = data;

  const gradeColor: Record<string, string> = {
    A: '#16a34a',
    B: '#2563eb',
    C: '#d97706',
    D: '#dc2626',
  };
  const gradeEmoji: Record<string, string> = { A: '\uD83D\uDD25', B: '\uD83D\uDC4D', C: '\uD83D\uDCCB', D: '\u26A0\uFE0F' };

  const color = gradeColor[scoring.grade] || '#6b7280';
  const emoji = gradeEmoji[scoring.grade] || '\uD83D\uDCCB';

  const subject = `${emoji} New Lead [${scoring.grade}] — ${esc(lead.companyName || lead.company_name)} (${lead.country})`;

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">

    <!-- Header -->
    <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">New Lead — BRITZMEDI</h1>
      <p style="margin: 4px 0 0; opacity: 0.9;">Grade ${scoring.grade} · Score ${scoring.total}/100 · ${esc(lead.country)}</p>
    </div>

    <!-- Lead Info -->
    <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">Lead Information</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #64748b; width: 120px;">Company</td><td style="padding: 6px 0; font-weight: bold;">${esc(lead.companyName || lead.company_name)}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Website</td><td style="padding: 6px 0;">${esc(lead.companyWebsite || lead.company_website) || '—'}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Name</td><td style="padding: 6px 0;">${esc(lead.name || lead.contact_name)}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Title</td><td style="padding: 6px 0;">${esc(lead.jobTitle || lead.job_title) || '—'}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0;"><a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>${lead.isFreeEmail ? ' (Free email)' : ''}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Country</td><td style="padding: 6px 0;">${esc(lead.country)}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Products</td><td style="padding: 6px 0;">${esc(Array.isArray(lead.interestedIn) ? lead.interestedIn.join(', ') : (lead.interested_products || '—'))}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Message</td><td style="padding: 6px 0;">${esc(lead.message) || '—'}</td></tr>
      </table>
    </div>

    <!-- Score Breakdown -->
    <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">Score Breakdown (${scoring.total}/100)</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${scoreRow('Email Quality', scoring.email_quality)}
        ${scoreRow('Company Info', scoring.company_info)}
        ${scoreRow('Product Interest', scoring.product_interest)}
        ${scoreRow('Engagement', scoring.engagement_signals)}
        ${scoreRow('Market Fit', scoring.market_fit)}
      </table>
    </div>

    <!-- Company Research (AI) -->
    ${research && !research.error ? `
    <div style="background: #f0f9ff; padding: 20px; border: 1px solid #bae6fd; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px; color: #0c4a6e;">AI Company Research</h2>

      <p style="margin: 0 0 8px;"><strong>Industry:</strong> ${esc(research.company_overview?.industry || 'Unknown')}</p>
      <p style="margin: 0 0 8px;"><strong>Business Type:</strong> ${esc(research.company_overview?.business_type || 'Unknown')}</p>
      <p style="margin: 0 0 8px;"><strong>Size:</strong> ${esc(research.company_overview?.estimated_size || 'Unknown')}</p>
      <p style="margin: 0 0 8px;"><strong>Website Status:</strong> ${esc(research.company_overview?.website_status || 'Unknown')}</p>

      ${research.relevance_assessment?.assessment_summary ?
        `<p style="margin: 12px 0 8px; padding: 10px; background: white; border-left: 3px solid #0ea5e9; border-radius: 4px;">
          <strong>Assessment:</strong> ${esc(research.relevance_assessment.assessment_summary)}
        </p>` : ''}

      ${research.relevance_assessment?.competitor_devices_used?.length > 0 ?
        `<p style="margin: 0 0 8px;"><strong>Current Devices:</strong> ${esc(research.relevance_assessment.competitor_devices_used.join(', '))}</p>` : ''}

      ${research.red_flags?.length > 0 ?
        `<div style="margin-top: 8px; padding: 10px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px;">
          <strong>Red Flags:</strong><br>${research.red_flags.map((f: string) => esc(f)).join('<br>')}
        </div>` : ''}

      <div style="margin-top: 12px; padding: 10px; background: white; border-radius: 4px;">
        <strong>Recommended Action:</strong><br>
        ${esc(research.recommended_action || 'Standard follow-up')}
      </div>

      ${research.talking_points?.length > 0 ?
        `<div style="margin-top: 12px;">
          <strong>Suggested Talking Points:</strong>
          <ul style="margin: 4px 0; padding-left: 20px;">
            ${research.talking_points.map((tp: string) => `<li style="margin: 4px 0;">${esc(tp)}</li>`).join('')}
          </ul>
        </div>` : ''}

      ${research.market_context?.country_market_size ?
        `<div style="margin-top: 12px; font-size: 13px; color: #64748b;">
          <strong>Market Context:</strong> ${esc(research.market_context.country_market_size)}
        </div>` : ''}
    </div>
    ` : `
    <div style="background: #fff7ed; padding: 20px; border: 1px solid #fed7aa; border-top: none;">
      <p style="margin: 0; color: #9a3412;">Company research unavailable. Manual verification recommended.</p>
    </div>
    `}

    <!-- CTA -->
    <div style="padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <a href="https://britzmedi.com/admin/leads" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Admin →</a>
    </div>
  </div>`;

  return { subject, html };
}

function scoreRow(label: string, axis: { score: number; max: number; reason: string }): string {
  return `<tr>
    <td style="padding: 6px 0;">${label}</td>
    <td style="padding: 6px 0; text-align: right; font-weight: bold;">${axis.score}/${axis.max}</td>
    <td style="padding: 6px 0; color: #64748b; font-size: 13px; padding-left: 8px;">${esc(axis.reason)}</td>
  </tr>`;
}

// Send full report email (called after company research completes)
export async function sendLeadReportEmail(env: any, emailData: { subject: string; html: string }) {
  const apiKey = env?.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[EMAIL SKIP] RESEND_API_KEY not set for lead report');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [ADMIN_EMAIL],
        subject: emailData.subject,
        html: emailData.html,
      }),
    });
    if (!res.ok) {
      console.error('[EMAIL ERROR] Lead report:', await res.text());
    } else {
      console.log('[EMAIL] Lead report sent to', ADMIN_EMAIL);
    }
  } catch (e) {
    console.error('[EMAIL ERROR] Lead report:', e);
  }
}
