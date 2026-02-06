// POST /api/subscribers/subscribe
// Create a new subscriber with double opt-in (pending status + confirmation email)

import type { APIRoute } from 'astro';
import { sendEmail } from '../../../lib/youtube-to-blog/email';

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_LANGUAGES = ['en', 'ko', 'zh', 'ja', 'es', 'pt-br', 'de', 'ar'];
const VALID_CATEGORIES = ['medical-devices', 'aesthetics', 'company-news', 'industry-insights'];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { email, name, language, categories } = data;

    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email address is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lang = VALID_LANGUAGES.includes(language) ? language : 'en';
    const cats = Array.isArray(categories)
      ? categories.filter((c: string) => VALID_CATEGORIES.includes(c))
      : [];

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const resendKey = runtime?.env?.RESEND_API_KEY as string | undefined;

    if (!db) {
      console.log('[Subscribe API] Dev mode - would create subscriber:', { email, name, lang });
      return new Response(JSON.stringify({
        success: true,
        message: 'Please check your email to confirm your subscription.',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already subscribed
    const existing = await db.prepare('SELECT id, status FROM subscribers WHERE email = ?')
      .bind(email).first<{ id: number; status: string }>();

    if (existing) {
      if (existing.status === 'active') {
        return new Response(JSON.stringify({
          success: true,
          message: 'You are already subscribed!',
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (existing.status === 'pending') {
        return new Response(JSON.stringify({
          success: true,
          message: 'A confirmation email was already sent. Please check your inbox.',
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Was unsubscribed - resubscribe with new token
    }

    const confirmationToken = crypto.randomUUID();
    const unsubscribeToken = crypto.randomUUID();

    if (existing) {
      // Re-subscribe (was previously unsubscribed)
      await db.prepare(`
        UPDATE subscribers SET
          name = ?,
          language = ?,
          categories = ?,
          status = 'pending',
          confirmation_token = ?,
          unsubscribe_token = ?,
          subscribed_at = CURRENT_TIMESTAMP,
          confirmed_at = NULL,
          unsubscribed_at = NULL
        WHERE id = ?
      `).bind(
        name || null,
        lang,
        JSON.stringify(cats),
        confirmationToken,
        unsubscribeToken,
        existing.id,
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO subscribers (email, name, language, categories, status, confirmation_token, unsubscribe_token)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        email,
        name || null,
        lang,
        JSON.stringify(cats),
        confirmationToken,
        unsubscribeToken,
      ).run();
    }

    // Send confirmation email
    if (resendKey) {
      const baseUrl = new URL(request.url).origin;
      const confirmUrl = `${baseUrl}/api/subscribers/confirm?token=${confirmationToken}`;

      const sent = await sendEmail({
        apiKey: resendKey,
        to: email,
        subject: 'Confirm your BRITZMEDI subscription',
        html: buildConfirmationEmail(name || 'there', confirmUrl, lang),
      });

      if (!sent) {
        console.error('[Subscribe API] Failed to send confirmation email to', email);
      }
    } else {
      console.log('[Subscribe API] No RESEND_API_KEY - skipping confirmation email');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Please check your email to confirm your subscription.',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Subscribe API] Error:', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({
        success: true,
        message: 'You are already subscribed!',
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

function buildConfirmationEmail(name: string, confirmUrl: string, lang: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e293b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">BRITZMEDI</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Medical Aesthetics Technology</p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 32px; border-radius: 0 0 12px 12px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Confirm Your Subscription</h2>

        <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
          Hi ${name},<br><br>
          Thank you for subscribing to BRITZMEDI Insights! Please confirm your email address by clicking the button below.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Confirm Subscription
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
          If you did not request this subscription, you can safely ignore this email.<br>
          This confirmation link expires in 48 hours.
        </p>
      </div>

      <div style="text-align: center; padding: 16px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} BRITZMEDI. All rights reserved.
        </p>
      </div>
    </div>
  `;
}
