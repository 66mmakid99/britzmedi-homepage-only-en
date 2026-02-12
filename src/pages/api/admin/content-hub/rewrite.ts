// Content Rewrite API - AI-powered content improvement
// POST /api/admin/content-hub/rewrite

export const prerender = false;

import type { APIRoute } from 'astro';
import { callClaude, countWords } from '../../../../lib/claude-api';

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

    const { content_id, mode, instructions, section_index } = await request.json();
    if (!content_id) {
      return new Response(JSON.stringify({ error: 'content_id required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const item = await db.prepare(
      'SELECT id, title, content, seo_keyword, excerpt, faq, research_data, analysis_data FROM content_items WHERE id = ?'
    ).bind(content_id).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save current version as revision before rewrite
    const latestVersion = await db.prepare(
      'SELECT MAX(version) as max_ver FROM content_revisions WHERE content_id = ?'
    ).bind(content_id).first<any>();
    const nextVersion = (latestVersion?.max_ver || 0) + 1;

    await db.prepare(
      `INSERT INTO content_revisions (content_id, version, content, title, meta_description, faqs, change_summary, word_count, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      content_id,
      nextVersion,
      item.content || '',
      item.title,
      item.excerpt || null,
      item.faq || null,
      'Pre-rewrite backup',
      countWords(item.content || ''),
      'system',
    ).run();

    // Build suggestions context from analysis
    let suggestionsContext = '';
    if (item.analysis_data) {
      try {
        const analysis = JSON.parse(item.analysis_data);
        if (analysis.suggestions?.length) {
          suggestionsContext = '\n\nANALYSIS SUGGESTIONS TO ADDRESS:\n' +
            analysis.suggestions.map((s: any) => `- [${s.priority}] ${s.title}: ${s.description}`).join('\n');
        }
        if (analysis.critical_issues?.length) {
          suggestionsContext += '\n\nCRITICAL ISSUES:\n' +
            analysis.critical_issues.map((i: string) => `- ${i}`).join('\n');
        }
      } catch { /* ignore parse errors */ }
    }

    // Research context
    let researchContext = '';
    if (item.research_data) {
      try {
        const research = JSON.parse(item.research_data);
        if (research.pubmed_articles?.length) {
          researchContext = '\n\nAVAILABLE RESEARCH:\n' +
            research.pubmed_articles.map((a: any) =>
              `- ${a.title} (${a.authors}, ${a.journal}, ${a.year}) [PMID: ${a.pmid}]\n  ${a.abstract?.substring(0, 300) || ''}`
            ).join('\n');
        }
      } catch { /* ignore parse errors */ }
    }

    let userMessage: string;

    if (mode === 'section' && section_index !== undefined) {
      // Split content by H2 sections and rewrite specific one
      const sections = (item.content || '').split(/(?=^## )/m);
      const targetSection = sections[section_index] || '';

      userMessage = `Rewrite ONLY this section of a blog article. Keep the same H2 heading but improve the content.

ARTICLE TITLE: ${item.title}
KEYWORD: ${item.seo_keyword || 'N/A'}

SECTION TO REWRITE:
${targetSection}

FULL ARTICLE CONTEXT (for reference only, do NOT rewrite the whole article):
${item.content}
${suggestionsContext}${researchContext}

${instructions ? `ADDITIONAL INSTRUCTIONS: ${instructions}` : ''}

Return ONLY the rewritten section in Markdown. Do NOT return JSON. Do NOT return the full article.`;
    } else {
      userMessage = `Rewrite and improve this blog article. Maintain the same topic and structure but significantly enhance quality.

TITLE: ${item.title}
KEYWORD: ${item.seo_keyword || 'N/A'}

CURRENT CONTENT:
${item.content}

CURRENT FAQs:
${item.faq || '(none)'}
${suggestionsContext}${researchContext}

${instructions ? `ADDITIONAL INSTRUCTIONS: ${instructions}` : ''}

RULES:
1. Every major claim MUST cite a specific study with data
2. Include a BRITZMEDI Perspective section
3. NEVER write generic filler paragraphs
4. Maintain Markdown formatting (## for H2, ### for H3)
5. Include References section at the end

Return ONLY valid JSON:
{
  "title": "improved title",
  "content": "full improved markdown content",
  "meta_description": "improved meta description (max 160 chars)",
  "faqs": [{ "question": "", "answer": "" }]
}`;
    }

    const rawResponse = await callClaude({
      apiKey,
      maxTokens: 8000,
      system: 'You are a content improvement specialist for BRITZMEDI, a Korean aesthetic medical device manufacturer. Improve content quality with evidence-based writing, unique manufacturer perspective, and proper academic citations.',
      userMessage,
    });

    if (mode === 'section') {
      return new Response(JSON.stringify({
        section_content: rawResponse.trim(),
        section_index,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse full rewrite response
    let result;
    try {
      let cleaned = rawResponse.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
      result = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, treat as raw markdown
      result = { content: rawResponse.trim() };
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Rewrite API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Rewrite failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
