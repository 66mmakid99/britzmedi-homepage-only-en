// Suggest Section API - Generate missing content sections
// POST /api/admin/content-hub/suggest-section

export const prerender = false;

import type { APIRoute } from 'astro';
import { callClaude } from '../../../../lib/claude-api';

const SUGGESTION_TYPES: Record<string, { label: string; prompt: string }> = {
  britzmedi_perspective: {
    label: 'BRITZMEDI Perspective',
    prompt: `Write a "BRITZMEDI Perspective" or "Manufacturer's Insight" section (2-3 paragraphs) that ONLY BRITZMEDI could write.

Connect the research findings in this article to BRITZMEDI's specific technology choices.
BRITZMEDI products:
- TORR RF: Multi-Wave RF workstation with simultaneous multi-frequency, FDA 510(k) cleared
- ULBLANC: Multi-frequency ultrasound workstation with i-Booster technology
- NEWCHAE SHOT: Needle-free mesotherapy device
- LUMINO WAVE: LED phototherapy (coming soon)

Explain WHY BRITZMEDI chose specific technical approaches based on the evidence.
Include specific technical details a manufacturer would know.`,
  },
  clinical_evidence: {
    label: 'Clinical Evidence',
    prompt: `Write a "Clinical Evidence" section with:
1. At least 3 specific PubMed citations with author names, journal, year, and key data points (n=, p<, %, effect sizes)
2. A brief explanation of each study's methodology and findings
3. How the evidence supports the treatment approaches discussed
4. Any limitations or caveats in the current evidence base

Format citations as: (Author et al., Journal, Year)`,
  },
  faq_expansion: {
    label: 'FAQ Expansion',
    prompt: `Generate 5-7 additional FAQ items based on real search queries people ask about this topic.
Each FAQ should:
1. Use a natural question format (how, what, why, when, is, can, does)
2. Provide a comprehensive answer (3-5 sentences)
3. Include specific data or evidence where possible
4. Be suitable for AI search snippet extraction (AEO)

Return as Markdown with ## FAQ heading, each Q as ### and answer as paragraph.`,
  },
  comparison: {
    label: 'Technology Comparison',
    prompt: `Write a "Technology Comparison" section that:
1. Compares 3-5 competing technologies/approaches for this treatment area
2. Uses a comparison table (Markdown table format)
3. Includes objective metrics (efficacy, downtime, treatment parameters, evidence level)
4. Subtly highlights advantages of RF-based or BRITZMEDI's approach where evidence supports it
5. Cites sources for comparison data

Be fair and evidence-based — do NOT make BRITZMEDI's approach seem perfect, but highlight genuine advantages.`,
  },
};

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

    const { content_id, suggestion_type } = await request.json();

    if (!content_id || !suggestion_type) {
      return new Response(JSON.stringify({ error: 'content_id and suggestion_type required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const typeConfig = SUGGESTION_TYPES[suggestion_type];
    if (!typeConfig) {
      return new Response(JSON.stringify({
        error: `Invalid suggestion_type. Valid: ${Object.keys(SUGGESTION_TYPES).join(', ')}`,
      }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const item = await db.prepare(
      'SELECT id, title, content, seo_keyword, research_data FROM content_items WHERE id = ?'
    ).bind(content_id).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    let researchContext = '';
    if (item.research_data) {
      try {
        const research = JSON.parse(item.research_data);
        if (research.pubmed_articles?.length) {
          researchContext = '\n\nAVAILABLE RESEARCH:\n' +
            research.pubmed_articles.slice(0, 5).map((a: any) =>
              `- ${a.title} (${a.authors}, ${a.journal}, ${a.year}) [PMID: ${a.pmid}]`
            ).join('\n');
        }
      } catch { /* ignore */ }
    }

    const userMessage = `${typeConfig.prompt}

ARTICLE TITLE: ${item.title}
KEYWORD: ${item.seo_keyword || 'N/A'}

EXISTING CONTENT (for context):
${(item.content || '').substring(0, 3000)}
${researchContext}

Return ONLY the new section in clean Markdown. Do NOT return JSON. Do NOT return the full article.`;

    const response = await callClaude({
      apiKey,
      maxTokens: 4000,
      system: 'You are a medical content specialist for BRITZMEDI. Generate high-quality, evidence-based content sections. Use Markdown formatting only (no HTML).',
      userMessage,
    });

    return new Response(JSON.stringify({
      suggestion_type,
      label: typeConfig.label,
      content: response.trim(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Suggest Section API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Suggestion failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
