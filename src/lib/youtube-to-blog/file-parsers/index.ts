// File parser router - routes to correct parser based on file type

import { parsePdf } from './pdf';
import { parseDocx } from './docx';
import { parsePptx } from './pptx';

export interface ParsedDocument {
  title: string;
  text: string;
  sections: DocumentSection[];
  tables: DocumentTable[];
  quotes: string[];
  numericalData: string[];
  images: DocumentImage[];
  metadata: DocumentMetadata;
}

export interface DocumentSection {
  heading: string;
  level: number;
  content: string;
}

export interface DocumentTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface DocumentImage {
  data: ArrayBuffer;
  mimeType: string;
  alt?: string;
  caption?: string;
}

export interface DocumentMetadata {
  pageCount?: number;
  slideCount?: number;
  author?: string;
  createdDate?: string;
  fileType: 'pdf' | 'docx' | 'pptx';
  fileSize: number;
}

const SUPPORTED_TYPES: Record<string, 'pdf' | 'docx' | 'pptx'> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

const EXTENSION_MAP: Record<string, 'pdf' | 'docx' | 'pptx'> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.pptx': 'pptx',
};

/**
 * Detect file type from MIME type or filename extension
 */
export function detectFileType(mimeType?: string, filename?: string): 'pdf' | 'docx' | 'pptx' | null {
  if (mimeType && SUPPORTED_TYPES[mimeType]) {
    return SUPPORTED_TYPES[mimeType];
  }

  if (filename) {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    if (EXTENSION_MAP[ext]) {
      return EXTENSION_MAP[ext];
    }
  }

  return null;
}

/**
 * Parse a document file and extract structured content
 */
export async function parseDocument(
  data: ArrayBuffer,
  fileType: 'pdf' | 'docx' | 'pptx',
  options?: {
    geminiApiKey?: string;
    fileSize?: number;
  }
): Promise<ParsedDocument> {
  const fileSize = options?.fileSize || data.byteLength;

  switch (fileType) {
    case 'pdf':
      return await parsePdf(data, fileSize, options?.geminiApiKey);
    case 'docx':
      return await parseDocx(data, fileSize);
    case 'pptx':
      return await parsePptx(data, fileSize);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Validate uploaded file
 */
export function validateFile(
  file: File
): { valid: true; fileType: 'pdf' | 'docx' | 'pptx' } | { valid: false; error: string } {
  const fileType = detectFileType(file.type, file.name);

  if (!fileType) {
    return {
      valid: false,
      error: 'Unsupported file type. Please upload a PDF, DOCX, or PPTX file.',
    };
  }

  // Max 50MB
  if (file.size > 50 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File too large. Maximum 50MB.',
    };
  }

  return { valid: true, fileType };
}
