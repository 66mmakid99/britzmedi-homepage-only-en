// DOCX parser - uses mammoth.js for HTML/text + structure extraction

import mammoth from 'mammoth';
import type { ParsedDocument, DocumentSection, DocumentTable } from './index';

/**
 * Parse a DOCX file and extract structured content.
 * Uses mammoth.js for reliable HTML extraction with structure preservation.
 */
export async function parseDocx(
  data: ArrayBuffer,
  fileSize: number
): Promise<ParsedDocument> {
  // Extract as HTML (preserves structure better)
  const htmlResult = await mammoth.convertToHtml(
    { arrayBuffer: data },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
      ],
    }
  );

  // Also extract raw text
  const textResult = await mammoth.extractRawText({ arrayBuffer: data });
  const rawText = textResult.value || '';
  const html = htmlResult.value || '';

  // Parse structure from HTML
  const sections = extractSectionsFromHtml(html);
  const tables = extractTablesFromHtml(html);
  const quotes = extractQuotesFromHtml(html);
  const numericalData = extractNumericalData(rawText);
  const title = extractTitle(html, rawText);

  return {
    title,
    text: rawText,
    sections,
    tables,
    quotes,
    numericalData,
    images: [],
    metadata: {
      fileType: 'docx',
      fileSize,
    },
  };
}

function extractTitle(html: string, rawText: string): string {
  // Try H1 first
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) return stripHtml(h1Match[1]).trim();

  // Try first non-empty line
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0 && lines[0].trim().length <= 200) {
    return lines[0].trim();
  }

  return 'Untitled Document';
}

function extractSectionsFromHtml(html: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  // Split by headings
  const headingRegex = /<(h[1-3])[^>]*>(.*?)<\/\1>/gi;
  let lastIndex = 0;
  let match;

  const matches: { level: number; heading: string; index: number; endIndex: number }[] = [];

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1].charAt(1));
    matches.push({
      level,
      heading: stripHtml(match[2]).trim(),
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const nextStart = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const contentHtml = html.slice(matches[i].endIndex, nextStart);
    const content = stripHtml(contentHtml).trim();

    sections.push({
      heading: matches[i].heading,
      level: matches[i].level,
      content,
    });
  }

  return sections;
}

function extractTablesFromHtml(html: string): DocumentTable[] {
  const tables: DocumentTable[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;

  while ((match = tableRegex.exec(html)) !== null) {
    const tableHtml = match[1];
    const rows: string[][] = [];

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
        cells.push(stripHtml(cellMatch[1]).trim());
      }
      if (cells.length > 0) rows.push(cells);
    }

    if (rows.length >= 2) {
      tables.push({
        headers: rows[0],
        rows: rows.slice(1),
      });
    }
  }

  return tables;
}

function extractQuotesFromHtml(html: string): string[] {
  const quotes: string[] = [];

  // Extract blockquotes
  const bqRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  let match;
  while ((match = bqRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text.length >= 20 && text.length <= 500) {
      quotes.push(text);
    }
  }

  // Extract inline quotes from raw text
  const rawText = stripHtml(html);
  const quotePatterns = [
    /"([^"]{20,300})"/g,
    /\u201c([^\u201d]{20,300})\u201d/g,
  ];

  for (const pattern of quotePatterns) {
    let qMatch;
    while ((qMatch = pattern.exec(rawText)) !== null) {
      const quote = qMatch[1].trim();
      if (!quotes.includes(quote)) {
        quotes.push(quote);
      }
    }
  }

  return quotes.slice(0, 10);
}

function extractNumericalData(text: string): string[] {
  const data: string[] = [];
  const sentences = text.split(/[.!?\n]+/);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 15 || trimmed.length > 300) continue;

    const hasNumber = /\d+[%$,.]\d*|\d+\s*(?:percent|%|million|billion|patients|subjects|participants|cases|mg|ml|mm|cm|MHz|kHz|W|watts|joules)/i.test(trimmed);
    if (hasNumber) {
      data.push(trimmed);
    }
  }

  return data.slice(0, 20);
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}
