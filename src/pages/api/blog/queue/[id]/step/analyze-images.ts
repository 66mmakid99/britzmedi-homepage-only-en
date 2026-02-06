// Step 1c: Analyze images from uploaded document with Gemini Vision
// POST /api/blog/queue/[id]/step/analyze-images

export const prerender = false;

import type { APIRoute } from 'astro';
import { getJob, updateJobStatus } from '../../../../../../lib/youtube-to-blog/queue';

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
        message: 'Dev mode: analyze-images step simulated',
        images_analyzed: 0,
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

    if (!geminiKey) {
      return new Response(JSON.stringify({
        success: true,
        warning: 'GEMINI_API_KEY not configured, skipping image analysis',
        images_analyzed: 0,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileKey = job.youtube_id;
    if (!r2 || !fileKey) {
      return new Response(JSON.stringify({
        success: true,
        warning: 'File storage not available',
        images_analyzed: 0,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const r2Object = await r2.get(fileKey);
    if (!r2Object) {
      return new Response(JSON.stringify({
        success: true,
        warning: 'File not found in storage',
        images_analyzed: 0,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileData = await r2Object.arrayBuffer();
    const mimeType = r2Object.httpMetadata?.contentType || 'application/pdf';

    // Use Gemini Vision to analyze the document images/charts
    const base64 = btoa(
      new Uint8Array(fileData).reduce((s, b) => s + String.fromCharCode(b), '')
    );

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: { mimeType, data: base64 },
            },
            {
              text: `Analyze the images, charts, graphs, and diagrams in this document.
For each visual element, provide:
1. A description of what it shows
2. Any data/numbers visible
3. Key insights or findings

Focus on clinical data charts, before/after images, technical diagrams, and statistical figures.

Respond as a JSON array:
[{"type":"chart","description":"...","data":"...","insight":"..."}]

If no significant visual elements found, respond with: []`,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        },
      }),
    });

    let imageAnalysis: any[] = [];

    if (res.ok) {
      const data = await res.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        imageAnalysis = JSON.parse(cleaned);
      } catch {
        console.warn('[Analyze Images] Failed to parse Gemini response');
      }
    }

    // Append image analysis to transcript text
    if (imageAnalysis.length > 0 && job.transcript_text) {
      const imageContext = '\n\n--- Visual Analysis ---\n' +
        imageAnalysis.map((img: any, i: number) =>
          `[Figure ${i + 1}] ${img.type}: ${img.description}. Data: ${img.data}. Insight: ${img.insight}`
        ).join('\n');

      const updatedText = job.transcript_text + imageContext;
      await updateJobStatus(db, id, 'extracting', 20, {
        transcript_text: updatedText.slice(0, 50000),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      images_analyzed: imageAnalysis.length,
      analysis: imageAnalysis,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Analyze Images Step] Error:', error);

    return new Response(JSON.stringify({
      success: true,
      warning: error.message || 'Image analysis failed',
      images_analyzed: 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
