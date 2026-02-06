// PPT -> Blog conversion template

import type { ParsedDocument } from '../file-parsers/index';

/**
 * Generate a Claude prompt for converting a presentation to a blog post.
 * Focuses on visual storytelling, key takeaways per slide, and data visualization.
 */
export function buildPresentationPrompt(
  doc: ParsedDocument,
  options: { tone?: string; wordCount?: number; targetLang?: string }
): { systemPrompt: string; userMessage: string } {
  const { tone = 'professional', wordCount = 1500, targetLang = 'en' } = options;

  const systemPrompt = `You are an expert medical content writer for BRITZMEDI, a Korean medical aesthetics device company.
Your task is to transform a conference/medical presentation into a high-quality, SEO-optimized blog post.

BRITZMEDI products include:
- TORR RF: RF microneedling device for skin rejuvenation
- ULBLANC: Skin brightening/whitening device
- NEWCHAE SHOT: Mesotherapy injection device
- AQUA SHINE: Hydration treatment device

Writing guidelines:
- Tone: ${tone}
- Target word count: approximately ${wordCount} words
- Write in ${targetLang === 'en' ? 'English' : targetLang}
- Use proper medical terminology but remain accessible to distributors and clinic owners
- Convert slide-by-slide content into a narrative flow
- Preserve all data points, statistics, and clinical evidence
- Include relevant headings (H2, H3) for SEO

REQUIRED BLOG STRUCTURE (AEO/GEO optimized):
1. H1: SEO-optimized title (include keywords: RF medical device, aesthetic equipment, etc. as relevant)
2. Intro: Core summary in 2-3 sentences (AI snippet target)
3. H2 sections: Systematic analysis of the presentation content - weave slides into cohesive narrative
4. Data/Numbers highlight: Present tables, statistics, and clinical data from the slides (cite original sources)
5. Key Takeaways section: Bullet points summarizing the most important findings
6. FAQ section: Minimum 3 questions with answers (these will get JSON-LD schema markup)
7. CTA: Link to product page (/products) or Contact (/contact)

- Format output as clean HTML (no <html>, <head>, <body> tags - just the article content)
- Use <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>, <table>, <thead>, <tbody>, <tr>, <th>, <td> tags
- Do NOT use markdown formatting - use proper HTML
- Do NOT include any frontmatter or metadata in the HTML

IMPORTANT: Return your response as a valid JSON object with the following structure:
{
  "title": "SEO-optimized blog post title",
  "slug": "url-friendly-slug",
  "content": "<h2>...</h2><p>...</p>...",
  "excerpt": "2-3 sentence excerpt for previews",
  "metaDescription": "Under 160 characters for SEO",
  "keywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...],
  "category": "medical-devices"
}`;

  // Build slide-by-slide summary
  const slideSummary = doc.sections.map((s, i) => {
    return `Slide ${i + 1}: ${s.heading}\n${s.content}`;
  }).join('\n\n');

  // Format tables
  const tablesSummary = doc.tables.length > 0
    ? '\n\nTables from presentation:\n' + doc.tables.map((t, i) => {
        const header = t.headers.join(' | ');
        const rows = t.rows.map(r => r.join(' | ')).join('\n');
        return `Table ${i + 1}${t.caption ? ` (${t.caption})` : ''}:\n${header}\n${rows}`;
      }).join('\n\n')
    : '';

  // Format quotes
  const quotesSummary = doc.quotes.length > 0
    ? '\n\nNotable quotes:\n' + doc.quotes.map(q => `- "${q}"`).join('\n')
    : '';

  // Format numerical data
  const dataSummary = doc.numericalData.length > 0
    ? '\n\nKey data points:\n' + doc.numericalData.map(d => `- ${d}`).join('\n')
    : '';

  const userMessage = `Transform this medical/aesthetic presentation into a blog post.

Presentation Title: ${doc.title}
Total Slides: ${doc.metadata.slideCount || doc.sections.length}
${doc.metadata.author ? `Author: ${doc.metadata.author}` : ''}

Slide-by-slide content:
${slideSummary.slice(0, 12000)}
${tablesSummary.slice(0, 3000)}
${quotesSummary}
${dataSummary.slice(0, 2000)}

Generate a comprehensive, engaging blog post that weaves the presentation content into a cohesive narrative.
Maintain all clinical data, statistics, and technical specifications.`;

  return { systemPrompt, userMessage };
}
