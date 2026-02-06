// POST /api/subscribers/notify
// Internal: send notification emails to matching subscribers for a new blog post

import type { APIRoute } from 'astro';
import { sendEmail } from '../../../lib/youtube-to-blog/email';

export const prerender = false;

interface NotifyPayload {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  featured_image?: string;
}

const LANGUAGE_CTA: Record<string, string> = {
  en: 'Read Full Article',
  ko: '전체 기사 읽기',
  zh: '阅读全文',
  ja: '記事全文を読む',
  es: 'Leer artículo completo',
  'pt-br': 'Ler artigo completo',
  de: 'Vollständigen Artikel lesen',
  ar: 'اقرأ المقال كاملاً',
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json() as NotifyPayload;
    const { slug, title, excerpt, category, featured_image } = data;

    if (!slug || !title) {
      return new Response(JSON.stringify({ error: 'slug and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const resendKey = runtime?.env?.RESEND_API_KEY as string | undefined;

    if (!db || !resendKey) {
      console.log('[Notify API] Missing DB or RESEND_API_KEY');
      return new Response(JSON.stringify({
        success: true,
        sent: 0,
        message: 'No DB or email config - skipped notifications',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query active subscribers
    const allSubs = await db.prepare(`
      SELECT id, email, name, language, categories, unsubscribe_token
      FROM subscribers
      WHERE status = 'active'
    `).all<{
      id: number;
      email: string;
      name: string | null;
      language: string;
      categories: string;
      unsubscribe_token: string;
    }>();

    if (!allSubs.results?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: 'No active subscribers' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter by category preference
    const filteredSubs = (allSubs.results || []).filter(sub => {
      try {
        const cats = JSON.parse(sub.categories || '[]') as string[];
        // If no category preferences, send all notifications
        if (cats.length === 0) return true;
        // Otherwise, check if blog category matches
        return cats.includes(category);
      } catch {
        return true;
      }
    });

    // Check which subscribers already received this notification
    const alreadyNotified = await db.prepare(
      'SELECT subscriber_id FROM notification_log WHERE blog_post_slug = ?'
    ).bind(slug).all<{ subscriber_id: number }>();
    const notifiedIds = new Set((alreadyNotified.results || []).map(r => r.subscriber_id));

    const toNotify = filteredSubs.filter(sub => !notifiedIds.has(sub.id));

    const baseUrl = new URL(request.url).origin;
    let sentCount = 0;
    let failCount = 0;

    for (const sub of toNotify) {
      const langPrefix = sub.language === 'en' ? '' : `/${sub.language}`;
      const articleUrl = `${baseUrl}${langPrefix}/blog/${slug}`;
      const unsubscribeUrl = `${baseUrl}/api/subscribers/unsubscribe?token=${sub.unsubscribe_token}`;
      const ctaText = LANGUAGE_CTA[sub.language] || LANGUAGE_CTA.en;

      const sent = await sendEmail({
        apiKey: resendKey,
        to: sub.email,
        subject: `[BRITZMEDI] ${title}`,
        html: buildNotificationEmail({
          name: sub.name || 'there',
          title,
          excerpt,
          articleUrl,
          unsubscribeUrl,
          ctaText,
          featured_image,
        }),
      });

      // Log the notification
      await db.prepare(`
        INSERT INTO notification_log (subscriber_id, blog_post_slug, status)
        VALUES (?, ?, ?)
      `).bind(sub.id, slug, sent ? 'sent' : 'failed').run();

      if (sent) {
        sentCount++;
      } else {
        failCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      failed: failCount,
      skipped: notifiedIds.size,
      total: filteredSubs.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Notify API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to send notifications' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function buildNotificationEmail(opts: {
  name: string;
  title: string;
  excerpt: string;
  articleUrl: string;
  unsubscribeUrl: string;
  ctaText: string;
  featured_image?: string;
}): string {
  const { name, title, excerpt, articleUrl, unsubscribeUrl, ctaText, featured_image } = opts;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e293b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">BRITZMEDI</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Medical Aesthetics Technology</p>
      </div>

      <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 32px; border-radius: 0 0 12px 12px; background: #ffffff;">
        <p style="color: #475569; margin: 0 0 20px; font-size: 15px;">Hi ${name},</p>

        <p style="color: #475569; margin: 0 0 20px; line-height: 1.6;">
          We just published a new article that we think you'll find interesting:
        </p>

        ${featured_image ? `
          <img src="${featured_image}" alt="${title}" style="width: 100%; max-height: 240px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;" />
        ` : ''}

        <h2 style="margin: 0 0 12px; color: #1e293b; font-size: 20px; line-height: 1.4;">${title}</h2>

        <p style="color: #64748b; line-height: 1.7; margin: 0 0 24px;">${excerpt}</p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${articleUrl}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ${ctaText}
          </a>
        </div>
      </div>

      <div style="text-align: center; padding: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px;">
          &copy; ${new Date().getFullYear()} BRITZMEDI. All rights reserved.
        </p>
        <a href="${unsubscribeUrl}" style="color: #94a3b8; font-size: 12px; text-decoration: underline;">
          Unsubscribe from these emails
        </a>
      </div>
    </div>
  `;
}
