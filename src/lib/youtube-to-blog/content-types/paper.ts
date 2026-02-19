// Academic paper -> Blog conversion template

import type { ParsedDocument } from '../file-parsers/index';

/**
 * Generate a Claude prompt for converting an academic paper to a blog post.
 * Focuses on methodology, findings, evidence-based insights.
 */
export function buildPaperPrompt(
  doc: ParsedDocument,
  options: { tone?: string; wordCount?: number; targetLang?: string }
): { systemPrompt: string; userMessage: string } {
  const { tone = 'professional', wordCount = 1500, targetLang = 'en' } = options;

  const systemPrompt = `You are an expert medical content writer for BRITZMEDI, a Korean medical aesthetics device company.
Your task is to transform an academic/clinical paper into a high-quality, SEO-optimized blog post that makes the findings accessible to medical professionals and device distributors.

BRITZMEDI products include:
- TORR RF: RF microneedling device for skin rejuvenation
- ULBLANC: Skin brightening/whitening device
- NEWCHAE SHOT: Personal home-use beauty device (RF technology from TORR RF, NOT a medical device)
- LUMINO WAVE: LED phototherapy device for clinics

Writing guidelines:
- Tone: ${tone}
- Target word count: approximately ${wordCount} words
- Write in ${targetLang === 'en' ? 'English' : targetLang}
- Translate academic language into accessible but still professional prose
- ALWAYS cite the original paper and methodology
- Preserve all statistical data and p-values
- Highlight clinical significance, not just statistical significance
- Target audience: medical device distributors, clinic owners, dermatologists

REQUIRED BLOG STRUCTURE (AEO/GEO optimized):
1. H1: SEO-optimized title (include relevant keywords for the technology/treatment studied)
2. Intro: Core finding summary in 2-3 sentences (AI snippet target - this is what ChatGPT/Perplexity will cite)
3. Study Overview: Study design, sample size, methodology (brief)
4. Key Findings: H2 sections covering major results with data
5. Clinical Implications: What this means for practitioners
6. Data/Numbers highlight: Tables with key results (cite original paper)
7. Key Takeaways section: Bullet points
8. FAQ section: Minimum 3 questions with answers (JSON-LD schema markup)
9. CTA: Link to relevant product page or Contact (/contact)

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
  "category": "clinical-studies"
}`;

  // Build structured summary
  const sectionsSummary = doc.sections.map(s => {
    return `## ${s.heading}\n${s.content}`;
  }).join('\n\n');

  const tablesSummary = doc.tables.length > 0
    ? '\n\nTables from paper:\n' + doc.tables.map((t, i) => {
        const header = t.headers.join(' | ');
        const rows = t.rows.map(r => r.join(' | ')).join('\n');
        return `Table ${i + 1}${t.caption ? ` (${t.caption})` : ''}:\n${header}\n${rows}`;
      }).join('\n\n')
    : '';

  const quotesSummary = doc.quotes.length > 0
    ? '\n\nKey statements from paper:\n' + doc.quotes.map(q => `- "${q}"`).join('\n')
    : '';

  const dataSummary = doc.numericalData.length > 0
    ? '\n\nStatistical data and findings:\n' + doc.numericalData.map(d => `- ${d}`).join('\n')
    : '';

  const userMessage = `Transform this academic/clinical paper into an accessible blog post.

Paper Title: ${doc.title}
${doc.metadata.author ? `Author(s): ${doc.metadata.author}` : ''}
Pages: ${doc.metadata.pageCount || 'Unknown'}

Paper content:
${sectionsSummary.slice(0, 12000)}
${tablesSummary.slice(0, 3000)}
${quotesSummary}
${dataSummary.slice(0, 2000)}

Generate a comprehensive blog post that makes the paper's findings accessible while maintaining scientific accuracy.
Cite the original paper appropriately and preserve all key data.`;

  return { systemPrompt, userMessage };
}
