// Step 1b: Extract text/structure from uploaded document file
// POST /api/blog/queue/[id]/step/extract-file

export const prerender = false;

import type { APIRoute } from 'astro';
import { parseDocument, type ParsedDocument } from '../../../../../../lib/youtube-to-blog/file-parsers/index';
import { detectContentType, type ContentType } from '../../../../../../lib/youtube-to-blog/content-types/index';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const r2 = runtime?.env?.BLOG_IMAGES as R2Bucket | undefined;
    const geminiKey = runtime?.env?.GEMINI_API_KEY as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Dev mode: extract-file step simulated',
        content_type: 'whitepaper',
        text_length: 5000,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const job = await getJob(db, id);
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify this is a document job
    if (!job.youtube_url?.startsWith('doc://')) {
      return new Response(JSON.stringify({
        error: 'This job is not a document upload. Use the extract step for YouTube videos.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateJobStatus(db, id, 'extracting', 5);

    // Retrieve file from R2
    const fileKey = job.youtube_id; // R2 key stored in youtube_id field
    if (!r2 || !fileKey) {
      return new Response(JSON.stringify({ error: 'File storage not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const r2Object = await r2.get(fileKey);
    if (!r2Object) {
      return new Response(JSON.stringify({ error: 'Uploaded file not found in storage' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileData = await r2Object.arrayBuffer();

    // Determine file type from job metadata
    const stepMeta = job.current_step || '';
    const fileTypeMatch = stepMeta.match(/file_type:(\w+)/);
    const contentTypeOverride = stepMeta.match(/content_type:(\w+)/);
    const fileType = (fileTypeMatch?.[1] || 'pdf') as 'pdf' | 'docx' | 'pptx';

    await updateJobStatus(db, id, 'extracting', 10);

    // Parse document
    const doc: ParsedDocument = await parseDocument(fileData, fileType, {
      geminiApiKey: geminiKey,
      fileSize: fileData.byteLength,
    });

    await updateJobStatus(db, id, 'extracting', 15);

    // Detect or use provided content type
    let contentType: ContentType;
    if (contentTypeOverride?.[1] && contentTypeOverride[1] !== 'auto') {
      contentType = contentTypeOverride[1] as ContentType;
    } else {
      contentType = detectContentType(fileType, doc);
    }

    // Store extracted text in transcript fields (reuse existing schema)
    const fileName = job.youtube_url.replace('doc://', '');
    await updateJobStatus(db, id, 'extracting', 20, {
      transcript_text: doc.text.slice(0, 50000),
      transcript_lang: 'en',
      video_title: doc.title || fileName,
      channel_name: doc.metadata.author || 'Document Upload',
      current_step: `content_type:${contentType}|tables:${doc.tables.length}|quotes:${doc.quotes.length}|sections:${doc.sections.length}`,
    });

    return new Response(JSON.stringify({
      success: true,
      title: doc.title,
      file_type: fileType,
      content_type: contentType,
      text_length: doc.text.length,
      sections: doc.sections.length,
      tables: doc.tables.length,
      quotes: doc.quotes.length,
      numerical_data: doc.numericalData.length,
      images: doc.images.length,
      metadata: doc.metadata,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Extract File Step] Error:', error);

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) await failJob(db, id, error.message || 'File extraction failed');

    return new Response(JSON.stringify({ error: error.message || 'File extraction failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
