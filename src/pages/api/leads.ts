// Lead Submission API Endpoint
// POST /api/leads - Submit a new lead
// GET /api/leads - Get leads (admin only)

// Server-side rendering required for API routes
export const prerender = false;

import type { APIRoute } from 'astro';
import { calculateLeadScore, type LeadData } from '../../lib/lead-score';
import { sendSlackNotification, sendUrgentLeadAlert } from '../../lib/slack';

interface Env {
  DB: D1Database;
  SLACK_WEBHOOK_URL?: string;
}

// D1Database interface (Cloudflare Workers)
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: object;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['companyName', 'contactName', 'jobTitle', 'email', 'country', 'interestedProducts'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate lead score
    const leadData: LeadData = {
      companyName: body.companyName,
      companyWebsite: body.companyWebsite,
      contactName: body.contactName,
      jobTitle: body.jobTitle,
      email: body.email,
      country: body.country,
      interestedProducts: Array.isArray(body.interestedProducts)
        ? body.interestedProducts
        : [body.interestedProducts],
      message: body.message
    };

    const scoreResult = calculateLeadScore(leadData);

    // Get runtime environment (Cloudflare)
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;

    // Store in D1 if available
    let leadId: number | null = null;
    if (env?.DB) {
      try {
        const result = await env.DB.prepare(`
          INSERT INTO leads (
            company_name, company_website, contact_name, job_title, email,
            country, interested_products, message, lead_score, lead_grade,
            utm_source, utm_medium, utm_campaign, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          leadData.companyName,
          leadData.companyWebsite || null,
          leadData.contactName,
          leadData.jobTitle,
          leadData.email,
          leadData.country,
          JSON.stringify(leadData.interestedProducts),
          body.message || null,
          scoreResult.total,
          scoreResult.grade,
          body.utmSource || null,
          body.utmMedium || null,
          body.utmCampaign || null,
          request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || null,
          request.headers.get('User-Agent') || null
        ).run();

        if (result.meta) {
          leadId = (result.meta as any).last_row_id || null;
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue without database - lead will still be sent via email/Slack
      }
    }

    // Send Slack notification if webhook is configured
    if (env?.SLACK_WEBHOOK_URL) {
      try {
        await sendSlackNotification({
          companyName: leadData.companyName,
          contactName: leadData.contactName,
          email: leadData.email,
          country: leadData.country,
          jobTitle: leadData.jobTitle,
          interestedProducts: leadData.interestedProducts,
          leadScore: scoreResult.total,
          leadGrade: scoreResult.grade,
          message: body.message,
          companyWebsite: leadData.companyWebsite
        }, env.SLACK_WEBHOOK_URL);

        // Send urgent alert for A-grade leads
        if (scoreResult.grade === 'A') {
          await sendUrgentLeadAlert({
            companyName: leadData.companyName,
            contactName: leadData.contactName,
            email: leadData.email,
            country: leadData.country,
            jobTitle: leadData.jobTitle,
            interestedProducts: leadData.interestedProducts,
            leadScore: scoreResult.total,
            leadGrade: scoreResult.grade
          }, env.SLACK_WEBHOOK_URL);
        }
      } catch (slackError) {
        console.error('Slack notification error:', slackError);
        // Continue - Slack failure shouldn't block the response
      }
    }

    return new Response(JSON.stringify({
      success: true,
      leadId,
      score: {
        total: scoreResult.total,
        grade: scoreResult.grade,
        breakdown: scoreResult.breakdown
      },
      message: 'Lead submitted successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process lead submission',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  // Simple authentication check via header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const runtime = (locals as any).runtime;
  const env = runtime?.env as Env | undefined;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const grade = url.searchParams.get('grade');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (grade) {
      query += ' AND lead_grade = ?';
      params.push(grade);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    // Get total count
    const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM leads').first<{ count: number }>();

    return new Response(JSON.stringify({
      leads: result.results || [],
      total: countResult?.count || 0,
      limit,
      offset
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch leads' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
