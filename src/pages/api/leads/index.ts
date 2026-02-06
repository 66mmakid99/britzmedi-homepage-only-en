import type { APIRoute } from 'astro';

export const prerender = false;

interface Env {
  DB: D1Database;
}

// GET /api/leads - List leads with filtering
export const GET: APIRoute = async (context) => {
  const { request, locals } = context;

  // Debug mode - return locals structure
  const debugParam = new URL(request.url).searchParams.get('debug');
  if (debugParam === '1') {
    const runtime = (locals as any).runtime;
    return new Response(JSON.stringify({
      debug: true,
      localsKeys: Object.keys(locals || {}),
      runtimeKeys: runtime ? Object.keys(runtime) : null,
      envKeys: runtime?.env ? Object.keys(runtime.env) : null,
      hasDB: !!runtime?.env?.DB,
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Access Cloudflare runtime
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;

    if (!db) {
      // Return sample data if DB not available (dev mode)
      return new Response(JSON.stringify({ leads: getSampleLeads(), total: 3 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const grade = url.searchParams.get('grade');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params: (string | number)[] = [];

    if (grade) {
      query += ' AND lead_grade = ?';
      params.push(grade);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (company_name LIKE ? OR contact_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const countParams: string[] = [];

    if (grade) {
      countQuery += ' AND lead_grade = ?';
      countParams.push(grade);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (search) {
      countQuery += ' AND (company_name LIKE ? OR contact_name LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const countResult = await db.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return new Response(JSON.stringify({
      leads: result.results,
      total: countResult?.total || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Leads API] Error fetching leads:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch leads',
      details: error?.message || String(error),
      stack: error?.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/leads - Create new lead
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const source = data.source || 'website';

    // Validate required fields based on source
    let required: string[];
    if (source === 'resource_download') {
      required = ['email', 'contact_name', 'company_name'];
    } else if (source === 'newsletter') {
      required = ['email'];
    } else {
      required = ['company_name', 'contact_name', 'job_title', 'email', 'country', 'interested_products'];
    }

    for (const field of required) {
      if (!data[field]) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Build enrichment_data with referral_source if provided
    let enrichmentData = null;
    if (data.referral_source) {
      enrichmentData = JSON.stringify({ referral_source: data.referral_source });
    }

    // Calculate lead score
    const { score, grade } = calculateLeadScore(data);

    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;
    if (!db) {
      // Dev mode - just return success
      console.log('[Leads API] Would create lead:', { ...data, lead_score: score, lead_grade: grade });
      return new Response(JSON.stringify({
        success: true,
        lead: { id: Date.now(), ...data, lead_score: score, lead_grade: grade },
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(`
      INSERT INTO leads (
        company_name, company_website, contact_name, job_title, email, country,
        interested_products, message, lead_score, lead_grade,
        source, utm_source, utm_medium, utm_campaign, enrichment_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.company_name || 'N/A',
      data.company_website || null,
      data.contact_name || 'N/A',
      data.job_title || 'N/A',
      data.email,
      data.country || 'N/A',
      JSON.stringify(data.interested_products || []),
      data.message || null,
      score,
      grade,
      source,
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null,
      enrichmentData,
    ).run();

    console.log('[Leads API] Lead created:', result.meta?.last_row_id);

    return new Response(JSON.stringify({
      success: true,
      lead: { id: result.meta?.last_row_id, ...data, lead_score: score, lead_grade: grade },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Leads API] Error creating lead:', error);

    // Handle duplicate email
    if (error.message?.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ error: 'A lead with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Lead scoring algorithm
function calculateLeadScore(data: any): { score: number; grade: string } {
  let score = 0;

  // Company website provided (+15)
  if (data.company_website) score += 15;

  // Job title scoring
  const jobTitle = (data.job_title || '').toLowerCase();
  if (jobTitle.includes('director') || jobTitle.includes('ceo') || jobTitle.includes('owner') || jobTitle.includes('president')) {
    score += 25;
  } else if (jobTitle.includes('manager') || jobTitle.includes('head')) {
    score += 15;
  } else if (jobTitle.includes('doctor') || jobTitle.includes('dr.') || jobTitle.includes('physician')) {
    score += 20;
  } else {
    score += 5;
  }

  // Business email domain (+15)
  const email = data.email || '';
  const freeEmails = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && !freeEmails.includes(domain)) {
    score += 15;
  }

  // Country scoring (key markets)
  const country = (data.country || '').toUpperCase();
  const tier1Countries = ['US', 'DE', 'GB', 'JP', 'FR', 'AU', 'CA'];
  const tier2Countries = ['KR', 'CN', 'BR', 'MX', 'IT', 'ES', 'NL'];
  if (tier1Countries.includes(country)) {
    score += 20;
  } else if (tier2Countries.includes(country)) {
    score += 15;
  } else {
    score += 10;
  }

  // Number of interested products
  const products = data.interested_products || [];
  if (products.length >= 3) {
    score += 15;
  } else if (products.length >= 2) {
    score += 10;
  } else {
    score += 5;
  }

  // Message provided (+10)
  if (data.message && data.message.length > 50) {
    score += 10;
  }

  // Determine grade
  let grade = 'D';
  if (score >= 80) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';

  return { score: Math.min(score, 100), grade };
}

// Sample data for development
function getSampleLeads() {
  return [
    {
      id: 1,
      company_name: 'Beauty Clinic NYC',
      company_website: 'https://beautyclinicnyc.com',
      contact_name: 'Dr. Sarah Johnson',
      job_title: 'Medical Director',
      email: 'sarah@beautyclinicnyc.com',
      country: 'US',
      interested_products: '["TORR RF", "ULBLANC"]',
      message: 'Interested in becoming a distributor for the East Coast region.',
      lead_score: 85,
      lead_grade: 'A',
      status: 'new',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      company_name: 'Derma Solutions GmbH',
      company_website: 'https://derma-solutions.de',
      contact_name: 'Klaus Mueller',
      job_title: 'Procurement Manager',
      email: 'k.mueller@derma-solutions.de',
      country: 'DE',
      interested_products: '["TORR RF"]',
      message: 'Looking for RF devices for our clinic chain.',
      lead_score: 68,
      lead_grade: 'B',
      status: 'contacted',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      company_name: 'Aesthetic Brazil',
      company_website: null,
      contact_name: 'Ana Costa',
      job_title: 'Owner',
      email: 'ana@aesthetic-brazil.com.br',
      country: 'BR',
      interested_products: '["NEWCHAE SHOT"]',
      message: null,
      lead_score: 52,
      lead_grade: 'C',
      status: 'new',
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}
