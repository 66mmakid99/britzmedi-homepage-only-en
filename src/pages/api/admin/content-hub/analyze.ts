// Content Analysis API - AI-powered quality scoring
// POST /api/admin/content-hub/analyze

export const prerender = false;

import type { APIRoute } from 'astro';
import { callClaude, extractJson } from '../../../../lib/claude-api';

const ANALYSIS_SYSTEM_PROMPT = `You are a STRICT content quality auditor for BRITZMEDI, a Korean aesthetic medical device manufacturer.
Your job is to ensure only genuinely valuable, evidence-based content gets published.

DO NOT be lenient. Most AI-generated content is generic garbage.
Only score 85+ if the content genuinely provides unique, evidence-based value.

Score this content on 5 dimensions (total 100 points):

1. EVIDENCE-BASED VALUE (35 pts):
   - How many PubMed/academic sources are cited with specific data?
   - Are the citations recent (within 3 years)?
   - Are there concrete numbers (n=, p<, %, effect sizes)?
   - Is the scientific explanation accurate and deep, not surface-level?
   - Score 0 if there are NO real academic citations.
   - Score 28+ only if 3+ recent papers cited with specific data points.

2. UNIQUE PERSPECTIVE (25 pts):
   - Could ANY company publish this exact content? If yes → max 10 pts
   - Does it contain manufacturer-level technical insight?
   - Is there a section that ONLY BRITZMEDI could write?
   - Does it connect research findings to specific BRITZMEDI technology?
   - BRITZMEDI products: TORR RF (Multi-Wave RF, FDA 510k), ULBLANC (skin rejuvenation), NEWCHAE SHOT (personal home-use beauty device, NOT medical), LUMINO WAVE (LED phototherapy)
   - Score 18+ only if genuinely unique manufacturer perspective present.

3. COMPLETENESS (20 pts):
   - Does it cover all key subtopics a reader would expect?
   - Are FAQs present and based on real search queries?
   - Is there a TL;DR or executive summary?
   - Word count appropriate for topic depth?

4. READABILITY (10 pts):
   - Professional yet accessible?
   - Technical terms explained?
   - Logical structure with clear H2/H3 hierarchy?

5. AEO/GEO/SEO (10 pts):
   - Keyword in title, meta description, first 100 words, H2s?
   - FAQ format suitable for AI search snippet extraction?
   - Internal links to BRITZMEDI pages?

Return ONLY valid JSON:
{
  "scores": {
    "evidence": { "score": 0, "max": 35, "details": ["..."] },
    "uniqueness": { "score": 0, "max": 25, "details": ["..."] },
    "completeness": { "score": 0, "max": 20, "details": ["..."] },
    "readability": { "score": 0, "max": 10, "details": ["..."] },
    "aeo_seo": { "score": 0, "max": 10, "details": ["..."] }
  },
  "overall_score": 0,
  "critical_issues": ["..."],
  "suggestions": [
    { "priority": "high", "title": "...", "description": "...", "auto_fixable": true }
  ],
  "publish_recommendation": "auto_publish|needs_rewrite|manual_review"
}`;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const apiKey = runtime?.env?.ANTHROPIC_API_KEY as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI API key not configured' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { content_id } = await request.json();
    if (!content_id) {
      return new Response(JSON.stringify({ error: 'content_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const item = await db.prepare(
      'SELECT id, title, content, seo_keyword, excerpt, faq FROM content_items WHERE id = ?'
    ).bind(content_id).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const userMessage = `Analyze this content:

TITLE: ${item.title}
KEYWORD: ${item.seo_keyword || 'N/A'}
META DESCRIPTION: ${item.excerpt || 'N/A'}

CONTENT:
${item.content || '(empty)'}

FAQs:
${item.faq || '(none)'}`;

    const rawResponse = await callClaude({
      apiKey,
      system: ANALYSIS_SYSTEM_PROMPT,
      userMessage,
      maxTokens: 4000,
    });

    const analysis = extractJson(rawResponse);

    // Save to DB
    await db.prepare(
      'UPDATE content_items SET analysis_data = ?, updated_at = ? WHERE id = ?'
    ).bind(JSON.stringify(analysis), new Date().toISOString(), content_id).run();

    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Analyze API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
