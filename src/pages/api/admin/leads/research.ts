import type { APIRoute } from 'astro';
import { logActivity } from '../../../../lib/activity-log';

export const prerender = false;

interface Env {
  DB: D1Database;
  SESSION: KVNamespace;
  ANTHROPIC_API_KEY?: string;
}

interface ResearchResult {
  companySize: string;
  estimatedRevenue: string;
  mainBusiness: string;
  aestheticDeviceRelevance: string;
  competitorEquipment: string;
  decisionMakers: string;
  partnershipFitScore: number;
  summary: string;
  researchedAt: string;
}

const DAILY_LIMIT = 50;
const RATE_LIMIT_KEY_PREFIX = 'research-limit:';

async function getDailyCount(kv: KVNamespace): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${RATE_LIMIT_KEY_PREFIX}${today}`;
  const val = await kv.get(key);
  return val ? parseInt(val, 10) : 0;
}

async function incrementDailyCount(kv: KVNamespace): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${RATE_LIMIT_KEY_PREFIX}${today}`;
  const current = await getDailyCount(kv);
  // TTL 48 hours to auto-cleanup
  await kv.put(key, String(current + 1), { expirationTtl: 172800 });
}

function buildResearchPrompt(companyName: string, website: string | null, country: string): string {
  return `You are a B2B sales intelligence analyst for BRITZMEDI, a Korean medical aesthetic device manufacturer.
Our main products: TORR RF (FDA 510(k) cleared multi-wave RF for clinics), ULBLANC (professional skin rejuvenation), NEWCHAE SHOT (personal home-use beauty device, NOT medical), LUMINO WAVE (LED phototherapy).

Research the following company and provide a structured analysis:

Company: ${companyName}
Website: ${website || 'Not provided'}
Country: ${country}

Provide your analysis in the following JSON format ONLY (no markdown, no explanation, just valid JSON):
{
  "companySize": "Estimated number of employees and company scale (e.g., 'Small clinic, ~5-10 staff' or 'Mid-size distributor, ~50-100 employees')",
  "estimatedRevenue": "Estimated annual revenue range if possible (e.g., '$1M-5M' or 'Unknown')",
  "mainBusiness": "Primary business activities and services",
  "aestheticDeviceRelevance": "How relevant is this company to aesthetic medical devices? Are they a clinic, distributor, or related business?",
  "competitorEquipment": "Known or likely competitor equipment they may be using (based on their market and region)",
  "decisionMakers": "Likely decision-maker roles and any publicly available key contacts",
  "partnershipFitScore": 7,
  "summary": "2-3 sentence executive summary of partnership potential with BRITZMEDI"
}

Important:
- partnershipFitScore must be an integer from 1 to 10
- Base your analysis on the company name, website, and country context
- If information is limited, provide reasonable inferences based on the market
- Focus on actionable sales intelligence`;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;
    const kv = env?.SESSION;
    const apiKey = env?.ANTHROPIC_API_KEY || (import.meta as any).env?.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'leadId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting via KV
    if (kv) {
      const dailyCount = await getDailyCount(kv);
      if (dailyCount >= DAILY_LIMIT) {
        return new Response(JSON.stringify({
          error: `Daily research limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`,
          dailyCount,
          dailyLimit: DAILY_LIMIT,
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (!db) {
      // Dev mode fallback
      return new Response(JSON.stringify({
        success: true,
        research: {
          companySize: 'Mid-size clinic, ~20-30 staff',
          estimatedRevenue: '$2M-5M',
          mainBusiness: 'Aesthetic dermatology clinic offering laser, RF, and injectable treatments',
          aestheticDeviceRelevance: 'Highly relevant — active buyer of aesthetic medical devices',
          competitorEquipment: 'Likely using Thermage, Ultherapy, or similar RF devices',
          decisionMakers: 'Medical Director and Procurement Manager',
          partnershipFitScore: 8,
          summary: 'Strong partnership potential. Active aesthetic clinic with existing RF device usage and budget for new equipment.',
          researchedAt: new Date().toISOString(),
        },
        devMode: true,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch lead from DB
    const lead = await db.prepare(
      'SELECT id, company_name, company_website, country, contact_name, job_title, email FROM leads WHERE id = ?'
    ).bind(leadId).first<{
      id: number;
      company_name: string;
      company_website: string | null;
      country: string;
      contact_name: string;
      job_title: string;
      email: string;
    }>();

    if (!lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Claude API
    const prompt = buildResearchPrompt(lead.company_name, lead.company_website, lead.country);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('[Research API] Claude API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI research failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeResponse.json() as {
      content?: { text?: string }[];
    };
    const rawText = claudeData.content?.[0]?.text || '';

    // Parse JSON from response (handle possible markdown wrapping)
    let research: ResearchResult;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      const parsed = JSON.parse(jsonMatch[0]);
      research = {
        companySize: parsed.companySize || 'Unknown',
        estimatedRevenue: parsed.estimatedRevenue || 'Unknown',
        mainBusiness: parsed.mainBusiness || 'Unknown',
        aestheticDeviceRelevance: parsed.aestheticDeviceRelevance || 'Unknown',
        competitorEquipment: parsed.competitorEquipment || 'Unknown',
        decisionMakers: parsed.decisionMakers || 'Unknown',
        partnershipFitScore: Math.min(10, Math.max(1, parseInt(parsed.partnershipFitScore) || 5)),
        summary: parsed.summary || 'Research completed.',
        researchedAt: new Date().toISOString(),
      };
    } catch (parseErr) {
      console.error('[Research API] Failed to parse Claude response:', rawText);
      return new Response(JSON.stringify({ error: 'Failed to parse research results' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save to D1
    await db.prepare(
      'UPDATE leads SET ai_research = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(JSON.stringify(research), leadId).run();

    // Increment daily counter
    if (kv) {
      await incrementDailyCount(kv);
    }

    console.log(`[Research API] Research completed for lead ${leadId}: fit score ${research.partnershipFitScore}/10`);

    // Log activity
    logActivity(db, { type: 'ai_research', detail: `AI research: ${lead.company_name} — Fit score ${research.partnershipFitScore}/10` }).catch(() => {});

    return new Response(JSON.stringify({ success: true, research }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Research API] Error:', error);
    return new Response(JSON.stringify({ error: 'Research failed', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
