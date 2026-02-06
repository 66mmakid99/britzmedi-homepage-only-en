// PDF parser - text extraction with Gemini OCR fallback for image-heavy PDFs

import type { ParsedDocument, DocumentSection, DocumentTable, DocumentImage } from './index';

/**
 * Parse a PDF file and extract structured content.
 * Uses pdf-parse for text extraction.
 * Falls back to Gemini Flash for OCR on image-heavy PDFs.
 */
export async function parsePdf(
  data: ArrayBuffer,
  fileSize: number,
  geminiApiKey?: string
): Promise<ParsedDocument> {
  // Dynamic import for pdf-parse (Node.js module)
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = Buffer.from(data);

  const pdf = await pdfParse(buffer);
  const rawText = pdf.text || '';

  // Detect if PDF is image-heavy (low text-to-page ratio)
  const isImageHeavy = rawText.length < (pdf.numpages * 100);

  let text = rawText;
  let ocrUsed = false;

  // If image-heavy and Gemini API key available, use OCR
  if (isImageHeavy && geminiApiKey) {
    try {
      text = await ocrWithGemini(data, geminiApiKey);
      ocrUsed = true;
    } catch (err) {
      console.warn('[PDF Parser] Gemini OCR failed, using raw text:', err);
    }
  }

  // Extract structure from text
  const sections = extractSections(text);
  const tables = extractTables(text);
  const quotes = extractQuotes(text);
  const numericalData = extractNumericalData(text);

  // Try to extract title from first heading or first line
  const title = extractTitle(text, pdf.info?.Title);

  return {
    title,
    text,
    sections,
    tables,
    quotes,
    numericalData,
    images: [],
    metadata: {
      pageCount: pdf.numpages,
      author: pdf.info?.Author || undefined,
      createdDate: pdf.info?.CreationDate || undefined,
      fileType: 'pdf',
      fileSize,
    },
  };
}

/**
 * Use Gemini Flash for OCR on image-heavy PDFs
 */
async function ocrWithGemini(data: ArrayBuffer, apiKey: string): Promise<string> {
  const base64 = btoa(
    new Uint8Array(data).reduce((s, b) => s + String.fromCharCode(b), '')
  );

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64,
            },
          },
          {
            text: `Extract ALL text from this PDF document. Preserve the structure including:
- Headings and subheadings
- Tables (format as markdown tables)
- Bullet points and numbered lists
- Quotes
- All numerical data, statistics, and figures

Output the full extracted text with structure preserved. Do NOT summarize.`,
          },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini OCR failed: ${res.status}`);
  }

  const result = await res.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function extractTitle(text: string, pdfTitle?: string): string {
  if (pdfTitle && pdfTitle.trim()) return pdfTitle.trim();

  // Try first non-empty line
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length <= 200) return firstLine;
  }

  return 'Untitled Document';
}

function extractSections(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = text.split('\n');
  let currentSection: DocumentSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect headings: all caps lines, lines ending with colon, numbered sections
    const isHeading = (
      (trimmed.length < 100 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
      /^\d+\.\s+[A-Z]/.test(trimmed) ||
      /^#{1,3}\s+/.test(trimmed)
    );

    if (isHeading) {
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        sections.push(currentSection);
      }
      const level = /^#{3}/.test(trimmed) ? 3 : /^#{2}/.test(trimmed) ? 2 : /^#{1}/.test(trimmed) ? 1 :
        /^\d+\.\d+/.test(trimmed) ? 3 : /^\d+\./.test(trimmed) ? 2 : 1;
      currentSection = {
        heading: trimmed.replace(/^#+\s*/, '').replace(/^\d+\.\d*\s*/, ''),
        level,
        content: '',
      };
      contentLines = [];
    } else {
      contentLines.push(trimmed);
    }
  }

  // Push last section
  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

function extractTables(text: string): DocumentTable[] {
  const tables: DocumentTable[] = [];
  const lines = text.split('\n');

  // Look for markdown-style tables or tab/pipe-separated data
  let tableLines: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isPipeRow = trimmed.includes('|') && trimmed.split('|').length >= 3;
    const isTabRow = trimmed.includes('\t') && trimmed.split('\t').length >= 3;

    if (isPipeRow || isTabRow) {
      if (!inTable) inTable = true;
      // Skip separator rows (---|---|---)
      if (!/^[\s|:-]+$/.test(trimmed)) {
        tableLines.push(trimmed);
      }
    } else if (inTable) {
      // End of table
      if (tableLines.length >= 2) {
        const separator = tableLines[0].includes('|') ? '|' : '\t';
        const rows = tableLines.map(l =>
          l.split(separator).map(cell => cell.trim()).filter(cell => cell)
        );
        if (rows.length >= 2) {
          tables.push({
            headers: rows[0],
            rows: rows.slice(1),
          });
        }
      }
      tableLines = [];
      inTable = false;
    }
  }

  // Handle trailing table
  if (tableLines.length >= 2) {
    const separator = tableLines[0].includes('|') ? '|' : '\t';
    const rows = tableLines.map(l =>
      l.split(separator).map(cell => cell.trim()).filter(cell => cell)
    );
    if (rows.length >= 2) {
      tables.push({
        headers: rows[0],
        rows: rows.slice(1),
      });
    }
  }

  return tables;
}

function extractQuotes(text: string): string[] {
  const quotes: string[] = [];

  // Match quoted text
  const quotePatterns = [
    /"([^"]{20,300})"/g,
    /\u201c([^\u201d]{20,300})\u201d/g, // smart quotes
    /^>\s+(.{20,300})$/gm, // blockquote style
  ];

  for (const pattern of quotePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const quote = match[1].trim();
      if (!quotes.includes(quote)) {
        quotes.push(quote);
      }
    }
  }

  return quotes.slice(0, 10);
}

function extractNumericalData(text: string): string[] {
  const data: string[] = [];

  // Match sentences with significant numbers/percentages/statistics
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
