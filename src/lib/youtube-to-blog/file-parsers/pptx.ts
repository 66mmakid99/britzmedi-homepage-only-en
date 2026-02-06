// PPTX parser - uses JSZip for per-slide text/images/notes extraction

import JSZip from 'jszip';
import type { ParsedDocument, DocumentSection, DocumentTable, DocumentImage } from './index';

interface SlideContent {
  slideNumber: number;
  title: string;
  body: string;
  notes: string;
  images: DocumentImage[];
}

/**
 * Parse a PPTX file and extract structured content per slide.
 * Uses JSZip to unpack the OOXML structure.
 */
export async function parsePptx(
  data: ArrayBuffer,
  fileSize: number
): Promise<ParsedDocument> {
  const zip = await JSZip.loadAsync(data);

  // Find all slide XML files
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  const slides: SlideContent[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const slideXml = await zip.file(slideFiles[i])?.async('text');
    if (!slideXml) continue;

    // Extract text from slide
    const { title, body } = extractSlideText(slideXml);

    // Extract slide notes
    const noteFile = `ppt/notesSlides/notesSlide${i + 1}.xml`;
    let notes = '';
    if (zip.files[noteFile]) {
      const notesXml = await zip.file(noteFile)?.async('text');
      if (notesXml) {
        notes = extractNotesText(notesXml);
      }
    }

    // Extract images from slide relationships
    const images = await extractSlideImages(zip, i + 1);

    slides.push({
      slideNumber: i + 1,
      title: title || `Slide ${i + 1}`,
      body,
      notes,
      images,
    });
  }

  // Build combined text
  const fullText = slides.map(s => {
    let slideText = `[Slide ${s.slideNumber}] ${s.title}\n${s.body}`;
    if (s.notes) slideText += `\nSpeaker Notes: ${s.notes}`;
    return slideText;
  }).join('\n\n');

  // Convert slides to sections
  const sections: DocumentSection[] = slides.map(s => ({
    heading: s.title,
    level: 2,
    content: [s.body, s.notes ? `Speaker Notes: ${s.notes}` : ''].filter(Boolean).join('\n'),
  }));

  // Extract tables from all slides
  const tables: DocumentTable[] = [];
  for (const slideFile of slideFiles) {
    const xml = await zip.file(slideFile)?.async('text');
    if (xml) {
      const slideTables = extractTablesFromXml(xml);
      tables.push(...slideTables);
    }
  }

  // Collect all images
  const allImages: DocumentImage[] = slides.flatMap(s => s.images);

  // Extract quotes and numerical data
  const quotes = extractQuotes(fullText);
  const numericalData = extractNumericalData(fullText);

  // Title from first slide or presentation metadata
  const title = slides[0]?.title || await extractPresentationTitle(zip) || 'Untitled Presentation';

  return {
    title,
    text: fullText,
    sections,
    tables,
    quotes,
    numericalData,
    images: allImages,
    metadata: {
      slideCount: slides.length,
      fileType: 'pptx',
      fileSize,
    },
  };
}

/**
 * Extract text content from a slide XML
 */
function extractSlideText(xml: string): { title: string; body: string } {
  // Extract all text runs
  const textRuns: string[] = [];
  const runRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
  let match;

  while ((match = runRegex.exec(xml)) !== null) {
    textRuns.push(decodeXml(match[1]));
  }

  if (textRuns.length === 0) return { title: '', body: '' };

  // First text shape is usually the title
  // Look for title placeholder
  const titleMatch = xml.match(/<p:sp>[\s\S]*?<p:nvSpPr>[\s\S]*?type="title"[\s\S]*?<\/p:nvSpPr>[\s\S]*?<p:txBody>([\s\S]*?)<\/p:txBody>/i)
    || xml.match(/<p:sp>[\s\S]*?<p:nvSpPr>[\s\S]*?type="ctrTitle"[\s\S]*?<\/p:nvSpPr>[\s\S]*?<p:txBody>([\s\S]*?)<\/p:txBody>/i);

  let title = '';
  if (titleMatch) {
    const titleRuns: string[] = [];
    const titleRunRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
    let tMatch;
    while ((tMatch = titleRunRegex.exec(titleMatch[1])) !== null) {
      titleRuns.push(decodeXml(tMatch[1]));
    }
    title = titleRuns.join('').trim();
  }

  // Body is all text minus the title
  const allText = textRuns.join(' ').trim();
  const body = title ? allText.replace(title, '').trim() : allText;

  return { title, body };
}

/**
 * Extract text from notes XML
 */
function extractNotesText(xml: string): string {
  const textRuns: string[] = [];
  const runRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
  let match;

  while ((match = runRegex.exec(xml)) !== null) {
    const text = decodeXml(match[1]).trim();
    // Filter out slide number placeholder
    if (text && !/^\d+$/.test(text)) {
      textRuns.push(text);
    }
  }

  return textRuns.join(' ').trim();
}

/**
 * Extract images from a slide
 */
async function extractSlideImages(zip: JSZip, slideNumber: number): Promise<DocumentImage[]> {
  const images: DocumentImage[] = [];
  const relsFile = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;

  if (!zip.files[relsFile]) return images;

  const relsXml = await zip.file(relsFile)?.async('text');
  if (!relsXml) return images;

  // Find image relationships
  const relRegex = /Relationship[^>]*Type="[^"]*image"[^>]*Target="([^"]+)"/g;
  let match;

  while ((match = relRegex.exec(relsXml)) !== null) {
    const target = match[1].replace('..', 'ppt');
    const imageFile = zip.file(target);
    if (imageFile) {
      try {
        const imageData = await imageFile.async('arraybuffer');
        const ext = target.split('.').pop()?.toLowerCase() || 'png';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
          ext === 'png' ? 'image/png' :
          ext === 'gif' ? 'image/gif' :
          ext === 'svg' ? 'image/svg+xml' : 'image/png';

        images.push({
          data: imageData,
          mimeType,
        });
      } catch {
        // Skip unreadable images
      }
    }
  }

  return images;
}

/**
 * Extract tables from slide XML
 */
function extractTablesFromXml(xml: string): DocumentTable[] {
  const tables: DocumentTable[] = [];
  const tableRegex = /<a:tbl>([\s\S]*?)<\/a:tbl>/g;
  let match;

  while ((match = tableRegex.exec(xml)) !== null) {
    const tableXml = match[1];
    const rows: string[][] = [];
    const trRegex = /<a:tr[^>]*>([\s\S]*?)<\/a:tr>/g;
    let trMatch;

    while ((trMatch = trRegex.exec(tableXml)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<a:tc[^>]*>([\s\S]*?)<\/a:tc>/g;
      let cellMatch;

      while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
        const textRuns: string[] = [];
        const runRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
        let runMatch;
        while ((runMatch = runRegex.exec(cellMatch[1])) !== null) {
          textRuns.push(decodeXml(runMatch[1]));
        }
        cells.push(textRuns.join('').trim());
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

/**
 * Extract presentation title from core properties
 */
async function extractPresentationTitle(zip: JSZip): Promise<string | null> {
  const coreProps = zip.file('docProps/core.xml');
  if (!coreProps) return null;

  const xml = await coreProps.async('text');
  const titleMatch = xml.match(/<dc:title>([\s\S]*?)<\/dc:title>/);
  return titleMatch ? decodeXml(titleMatch[1]).trim() || null : null;
}

function extractQuotes(text: string): string[] {
  const quotes: string[] = [];
  const patterns = [
    /"([^"]{20,300})"/g,
    /\u201c([^\u201d]{20,300})\u201d/g,
  ];

  for (const pattern of patterns) {
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

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
