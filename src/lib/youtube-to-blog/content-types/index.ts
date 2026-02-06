// Content type template router

import type { ParsedDocument } from '../file-parsers/index';
import { buildPresentationPrompt } from './presentation';
import { buildPaperPrompt } from './paper';
import { buildWhitepaperPrompt } from './whitepaper';

export type ContentType = 'presentation' | 'paper' | 'whitepaper';

/**
 * Auto-detect content type from file type and document structure
 */
export function detectContentType(
  fileType: 'pdf' | 'docx' | 'pptx',
  doc: ParsedDocument
): ContentType {
  if (fileType === 'pptx') return 'presentation';

  // Check for academic paper indicators
  const text = doc.text.toLowerCase();
  const isPaper = (
    text.includes('abstract') ||
    text.includes('methodology') ||
    text.includes('methods and materials') ||
    text.includes('randomized') ||
    text.includes('p-value') ||
    text.includes('statistical significance') ||
    text.includes('conclusion') && text.includes('results') && text.includes('introduction')
  );

  if (isPaper) return 'paper';

  return 'whitepaper';
}

/**
 * Build Claude prompt based on content type
 */
export function buildPromptForContentType(
  contentType: ContentType,
  doc: ParsedDocument,
  options: { tone?: string; wordCount?: number; targetLang?: string }
): { systemPrompt: string; userMessage: string } {
  switch (contentType) {
    case 'presentation':
      return buildPresentationPrompt(doc, options);
    case 'paper':
      return buildPaperPrompt(doc, options);
    case 'whitepaper':
      return buildWhitepaperPrompt(doc, options);
  }
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  presentation: 'Presentation / Conference Slides',
  paper: 'Academic / Clinical Paper',
  whitepaper: 'Whitepaper / Industry Report',
};
