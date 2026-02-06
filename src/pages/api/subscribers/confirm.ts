// GET /api/subscribers/confirm?token={token}
// Verify confirmation token and activate subscription

import type { APIRoute } from 'astro';
import { sendEmail } from '../../../lib/youtube-to-blog/email';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect('/confirm-subscription?status=invalid');
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const resendKey = runtime?.env?.RESEND_API_KEY as string | undefined;

    if (!db) {
      console.log('[Confirm API] Dev mode - would confirm token:', token);
      return redirect('/confirm-subscription?status=success');
    }

    const subscriber = await db.prepare(
      'SELECT id, email, name, status FROM subscribers WHERE confirmation_token = ?'
    ).bind(token).first<{ id: number; email: string; name: string | null; status: string }>();

    if (!subscriber) {
      return redirect('/confirm-subscription?status=invalid');
    }

    if (subscriber.status === 'active') {
      return redirect('/confirm-subscription?status=already');
    }

    // Activate subscription
    await db.prepare(`
      UPDATE subscribers SET
        status = 'active',
        confirmed_at = CURRENT_TIMESTAMP,
        confirmation_token = NULL
      WHERE id = ?
    `).bind(subscriber.id).run();

    // Send welcome email
    if (resendKey) {
      const baseUrl = new URL(request.url).origin;
      await sendEmail({
        apiKey: resendKey,
        to: subscriber.email,
        subject: 'Welcome to BRITZMEDI Insights!',
        html: buildWelcomeEmail(subscriber.name || 'there', baseUrl),
      });
    }

    return redirect('/confirm-subscription?status=success');
  } catch (error: any) {
    console.error('[Confirm API] Error:', error);
    return redirect('/confirm-subscription?status=error');
  }
};

function buildWelcomeEmail(name: string, baseUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e293b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">BRITZMEDI</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Medical Aesthetics Technology</p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 32px; border-radius: 0 0 12px 12px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Welcome to BRITZMEDI Insights!</h2>

        <p style="color: #475569; line-height: 1.7; margin: 0 0 16px;">
          Hi ${name},
        </p>

        <p style="color: #475569; line-height: 1.7; margin: 0 0 16px;">
          Your subscription is now active. You'll receive notifications when we publish new articles about medical aesthetics technology, industry insights, and product updates.
        </p>

        <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
          In the meantime, check out our latest articles:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${baseUrl}/blog" style="display: inline-block; padding: 12px 28px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Read Our Blog
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
          You can unsubscribe at any time using the link at the bottom of any email.
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
