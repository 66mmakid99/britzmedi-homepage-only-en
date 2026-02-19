// Whitepaper/Report -> Blog conversion template

import type { ParsedDocument } from '../file-parsers/index';

/**
 * Generate a Claude prompt for converting a whitepaper/report to a blog post.
 * Focuses on industry insights, market data, and actionable takeaways.
 */
export function buildWhitepaperPrompt(
  doc: ParsedDocument,
  options: { tone?: string; wordCount?: number; targetLang?: string }
): { systemPrompt: string; userMessage: string } {
  const { tone = 'professional', wordCount = 1500, targetLang = 'en' } = options;

  const systemPrompt = `You are an expert medical content writer for BRITZMEDI, a Korean medical aesthetics device company.
Your task is to transform a whitepaper or industry report into a high-quality, SEO-optimized blog post.

BRITZMEDI products include:
- TORR RF: RF microneedling device for skin rejuvenation
- ULBLANC: Skin brightening/whitening device
- NEWCHAE SHOT: Personal home-use beauty device (RF technology from TORR RF, NOT a medical device)
- LUMINO WAVE: LED phototherapy device for clinics

Writing guidelines:
- Tone: ${tone}
- Target word count: approximately ${wordCount} words
- Write in ${targetLang === 'en' ? 'English' : targetLang}
- Extract key insights and actionable information
- Preserve market data, projections, and industry statistics
- Position BRITZMEDI as an industry thought leader
- Target audience: medical device distributors, clinic owners, industry professionals

REQUIRED BLOG STRUCTURE (AEO/GEO optimized):
1. H1: SEO-optimized title (include industry keywords)
2. Intro: Executive summary in 2-3 sentences (AI snippet target)
3. H2 sections: Key sections covering major themes from the report
4. Market Data / Industry Numbers: Highlight statistics, projections, market size data
5. Industry Trends: What the data means for the aesthetic/medical device industry
6. Key Takeaways section: Actionable bullet points for the reader
7. FAQ section: Minimum 3 questions with answers (JSON-LD schema markup)
8. CTA: Link to product page (/products) or Contact (/contact)

- Format output as clean HTML (no <html>, <head>, <body> tags - just the article content)
- Use <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <table>, <thead>, <tbody>, <tr>, <th>, <td> tags
- Do NOT use markdown formatting - use proper HTML

IMPORTANT: Return your response as a valid JSON object:
{
  "title": "SEO-optimized blog post title",
  "slug": "url-friendly-slug",
  "content": "<h2>...</h2><p>...</p>...",
  "excerpt": "2-3 sentence excerpt for previews",
  "metaDescription": "Under 160 characters for SEO",
  "keywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...],
  "category": "industry-insights"
}`;

  const sectionsSummary = doc.sections.map(s => {
    return `## ${s.heading}\n${s.content}`;
  }).join('\n\n');

  const tablesSummary = doc.tables.length > 0
    ? '\n\nData tables from report:\n' + doc.tables.map((t, i) => {
        const header = t.headers.join(' | ');
        const rows = t.rows.map(r => r.join(' | ')).join('\n');
        return `Table ${i + 1}${t.caption ? ` (${t.caption})` : ''}:\n${header}\n${rows}`;
      }).join('\n\n')
    : '';

  const quotesSummary = doc.quotes.length > 0
    ? '\n\nNotable quotes/statements:\n' + doc.quotes.map(q => `- "${q}"`).join('\n')
    : '';

  const dataSummary = doc.numericalData.length > 0
    ? '\n\nKey data points and statistics:\n' + doc.numericalData.map(d => `- ${d}`).join('\n')
    : '';

  const userMessage = `Transform this whitepaper/industry report into an engaging blog post.

Report Title: ${doc.title}
${doc.metadata.author ? `Author(s): ${doc.metadata.author}` : ''}
Pages: ${doc.metadata.pageCount || 'Unknown'}

Report content:
${sectionsSummary.slice(0, 12000)}
${tablesSummary.slice(0, 3000)}
${quotesSummary}
${dataSummary.slice(0, 2000)}

Generate a comprehensive blog post that extracts the most valuable insights and data for our audience of medical device distributors and clinic owners.`;

  return { systemPrompt, userMessage };
}
