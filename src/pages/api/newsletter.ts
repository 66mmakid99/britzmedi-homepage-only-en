import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  DB: D1Database;
}

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

    if (db) {
      // Check if email already exists
      const existing = await db.prepare('SELECT id, source FROM leads WHERE email = ?').bind(email).first();

      if (existing) {
        return new Response(JSON.stringify({
          success: true,
          message: "You're already subscribed! Thank you for your interest.",
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

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
    } else {
      console.log('[Newsletter API] Dev mode - would save:', { email });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for subscribing! You\'ll receive our latest updates.',
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
