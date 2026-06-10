import type { APIRoute } from 'astro';
import { logActivity } from '../../lib/activity-log';
import { sendEmail } from '../../lib/youtube-to-blog/email';
import { buildConfirmationEmail, isConfirmationTokenExpired } from './subscribers/subscribe';

export const prerender = false;

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
}

const CHECK_EMAIL_MESSAGE = 'Almost there! Please check your email to confirm your subscription.';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { email } = data;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;
    const resendKey = env?.RESEND_API_KEY;

    if (db) {
      // Check if email already exists in leads
      const existingLead = await db.prepare('SELECT id, source FROM leads WHERE email = ?').bind(email).first();

      if (!existingLead) {
        await db.prepare(`
          INSERT INTO leads (
            company_name, contact_name, job_title, email, country,
            interested_products, lead_score, lead_grade, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          'N/A',
          'Newsletter Subscriber',
          'N/A',
          email,
          'N/A',
          '[]',
          10,
          'D',
          'newsletter',
        ).run();
      }

      // Double opt-in (same flow as /api/subscribers/subscribe):
      // status 'pending' + confirmation token + confirmation email.
      const existingSub = await db.prepare('SELECT id, status, subscribed_at FROM subscribers WHERE email = ?')
        .bind(email).first<{ id: number; status: string; subscribed_at: string | null }>();

      if (existingSub?.status === 'active') {
        return new Response(JSON.stringify({
          success: true,
          message: "You're already subscribed! Thank you for your interest.",
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (existingSub?.status === 'pending' && !isConfirmationTokenExpired(existingSub.subscribed_at)) {
        return new Response(JSON.stringify({
          success: true,
          message: 'A confirmation email was already sent. Please check your inbox.',
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const confirmationToken = crypto.randomUUID();
      const unsubscribeToken = crypto.randomUUID();

      if (existingSub) {
        // Re-subscribe (was unsubscribed, or pending with an expired token)
        await db.prepare(`
          UPDATE subscribers SET
            status = 'pending',
            confirmation_token = ?,
            unsubscribe_token = ?,
            subscribed_at = CURRENT_TIMESTAMP,
            confirmed_at = NULL,
            unsubscribed_at = NULL
          WHERE id = ?
        `).bind(confirmationToken, unsubscribeToken, existingSub.id).run();
      } else {
        await db.prepare(`
          INSERT INTO subscribers (email, name, language, categories, status, confirmation_token, unsubscribe_token)
          VALUES (?, NULL, 'en', '[]', 'pending', ?, ?)
        `).bind(email, confirmationToken, unsubscribeToken).run();
      }

      // Send confirmation email
      if (resendKey) {
        const baseUrl = new URL(request.url).origin;
        const confirmUrl = `${baseUrl}/api/subscribers/confirm?token=${confirmationToken}`;
        const sent = await sendEmail({
          apiKey: resendKey,
          to: email,
          subject: 'Confirm your BRITZMEDI subscription',
          html: buildConfirmationEmail('there', confirmUrl, 'en'),
        });
        if (!sent) {
          console.error('[Newsletter API] Failed to send confirmation email to', email);
        }
      } else {
        console.log('[Newsletter API] No RESEND_API_KEY - skipping confirmation email');
      }

      // Log activity
      logActivity(db, { type: 'subscriber_added', detail: `Newsletter subscription (pending confirmation): ${email}` }).catch(() => {});
    } else {
      console.log('[Newsletter API] Dev mode - would save:', { email });
    }

    return new Response(JSON.stringify({
      success: true,
      message: CHECK_EMAIL_MESSAGE,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Newsletter API] Error:', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({
        success: true,
        message: "You're already subscribed! Thank you for your interest.",
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to subscribe. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
