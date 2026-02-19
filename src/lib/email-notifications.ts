// Lead notification system — email + DB
// Sends email via Resend (if API key set), always saves to admin_notifications

const ADMIN_EMAIL = 'sh.lee@britzmedi.co.kr';
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
