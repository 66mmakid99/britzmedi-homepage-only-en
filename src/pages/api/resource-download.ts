import type { APIRoute } from 'astro';
import { getResourceById } from '../../content/resources';
import { isDisposableEmail, isFreeEmail } from '../../lib/email-guards';
import { notifyNewLead } from '../../lib/email-notifications';
import { sendSlackNotification } from '../../lib/slack';

export const prerender = false;

interface Env {
  DB: D1Database;
  SLACK_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { name, email, company, resource_id, resource_title } = data;

    // Validate required fields
    if (!name || !email || !company || !resource_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reject disposable/temporary emails server-side
    if (isDisposableEmail(email)) {
      return new Response(JSON.stringify({
        error: 'Temporary or disposable email addresses are not accepted. Please use your business email.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get resource to find download URL
    const resource = getResourceById(resource_id);
    if (!resource) {
      return new Response(JSON.stringify({ error: 'Resource not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Resources without a real file yet (available: false) must not hand out placeholder links
    if (resource.available === false) {
      return new Response(JSON.stringify({
        error: 'This resource is available on request. Please contact us via the contact form.',
        requestUrl: `/contact?resource=${resource.id}`,
      }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Collect server-side data (same as api/resources/track.ts)
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
      || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const referer = request.headers.get('Referer') || '';
    const country = request.headers.get('CF-IPCountry') || '';

    // Calculate a simple lead score for resource downloads
    let score = 10;
    if (!isFreeEmail(email)) {
      score += 15; // Business email
    }
    if (company && company.length > 2) {
      score += 15; // Company provided
    }
    const grade = score >= 30 ? 'C' : 'D';

    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;

    if (db) {
      // Try to insert lead; if email exists, update message with new download
      try {
        await db.prepare(`
          INSERT INTO leads (
            company_name, contact_name, job_title, email, country,
            interested_products, message, lead_score, lead_grade, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          company,
          name,
          'N/A',
          email,
          country || 'N/A',
          '[]',
          `Resource download: ${resource_title || resource_id}`,
          score,
          grade,
          'resource_download',
        ).run();
      } catch (err: any) {
        // If duplicate email, update the existing lead's message
        if (err.message?.includes('UNIQUE constraint failed')) {
          await db.prepare(`
            UPDATE leads SET message = COALESCE(message, '') || ? , updated_at = datetime('now')
            WHERE email = ?
          `).bind(
            ` | Resource download: ${resource_title || resource_id}`,
            email,
          ).run();
        } else {
          throw err;
        }
      }

      // Also track in resource_downloads table (with ip/country like resources/track.ts)
      await db.prepare(`
        INSERT INTO resource_downloads (
          resource_id, resource_title, resource_category, email,
          ip_address, user_agent, referer, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        resource_id,
        resource_title || resource.title,
        resource.category,
        email,
        ip,
        userAgent,
        referer,
        country,
      ).run();
    } else {
      console.log('[Resource Download] Dev mode - would save:', { name, email, company, resource_id });
    }

    // Notify admins (non-blocking, same helpers as the main lead flow)
    notifyNewLead(env, {
      type: 'contact_form',
      company,
      name,
      email,
      country: country || undefined,
      message: `Resource download: ${resource_title || resource.title}`,
      source_url: referer || undefined,
      lead_score: score,
      lead_grade: grade,
    }).catch(err => console.error('[Resource Download API] Admin notification failed:', err));

    if (env?.SLACK_WEBHOOK_URL) {
      sendSlackNotification({
        companyName: company || 'N/A',
        contactName: name || 'N/A',
        email,
        country: country || 'N/A',
        jobTitle: 'N/A',
        interestedProducts: [],
        leadScore: score,
        leadGrade: grade,
        message: `Resource download: ${resource_title || resource.title}`,
      }, env.SLACK_WEBHOOK_URL).catch(err =>
        console.error('[Resource Download API] Slack notification failed:', err)
      );
    }

    return new Response(JSON.stringify({
      success: true,
      downloadUrl: resource.driveUrl,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Resource Download API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process download' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
