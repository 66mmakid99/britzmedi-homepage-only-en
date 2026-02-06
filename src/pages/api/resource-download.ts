import type { APIRoute } from 'astro';
import { getResourceById } from '../../content/resources';

export const prerender = false;

interface Env {
  DB: D1Database;
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

    // Get resource to find download URL
    const resource = getResourceById(resource_id);
    if (!resource) {
      return new Response(JSON.stringify({ error: 'Resource not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate a simple lead score for resource downloads
    let score = 10;
    const freeEmails = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && !freeEmails.includes(domain)) {
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
          'N/A',
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

      // Also track in resource_downloads table
      await db.prepare(`
        INSERT INTO resource_downloads (resource_id, resource_title, resource_category, email)
        VALUES (?, ?, ?, ?)
      `).bind(
        resource_id,
        resource_title || resource.title,
        resource.category,
        email,
      ).run();
    } else {
      console.log('[Resource Download] Dev mode - would save:', { name, email, company, resource_id });
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
