// File Upload API for Document to Blog
// POST /api/blog/upload - Accept multipart form upload, validate, and create a job

export const prerender = false;

import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';
import { detectFileType } from '../../../lib/youtube-to-blog/file-parsers/index';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tone = (formData.get('tone') as string) || 'professional';
    const wordCount = parseInt(formData.get('word_count') as string) || 1500;
    const contentType = (formData.get('content_type') as string) || 'auto';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const fileType = detectFileType(file.type, file.name);
    if (!fileType) {
      return new Response(JSON.stringify({
        error: 'Unsupported file type. Please upload a PDF, DOCX, or PPTX file.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum 50MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;

    const id = nanoid(12);

    if (!db) {
      // Dev mode
      return new Response(JSON.stringify({
        success: true,
        job: {
          id,
          source_type: 'document',
          file_name: file.name,
          file_type: fileType,
          status: 'pending',
          progress: 0,
          tone,
          word_count: wordCount,
          content_type: contentType,
          created_at: new Date().toISOString(),
        },
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store file in R2 for processing
    const fileKey = `uploads/${id}/${file.name}`;
    if (r2) {
      const arrayBuffer = await file.arrayBuffer();
      await r2.put(fileKey, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          originalName: file.name,
          fileType,
        },
      });
    }

    // Create job in database
    // Reuse blog_jobs table with source_type = 'document'
    await db.prepare(`
      INSERT INTO blog_jobs (
        id, youtube_url, youtube_id, status, progress,
        target_lang, tone, word_count,
        current_step
      ) VALUES (?, ?, ?, 'pending', 0, 'en', ?, ?, ?)
    `).bind(
      id,
      `doc://${file.name}`,  // Use doc:// scheme to indicate document source
      fileKey,               // Store R2 key in youtube_id field for retrieval
      tone,
      wordCount,
      `file_type:${fileType}|content_type:${contentType}`
    ).run();

    const job = await db.prepare('SELECT * FROM blog_jobs WHERE id = ?').bind(id).first();

    return new Response(JSON.stringify({
      success: true,
      job,
      file_info: {
        name: file.name,
        type: fileType,
        size: file.size,
        r2_key: fileKey,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Upload API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
