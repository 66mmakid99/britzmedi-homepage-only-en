// Step 2: Translate transcript to English
// POST /api/blog/queue/[id]/step/translate

export const prerender = false;

import type { APIRoute } from 'astro';
import { translateTranscript } from '../../../../../../lib/youtube-to-blog/gemini';
import { getJob, updateJobStatus, failJob } from '../../../../../../lib/youtube-to-blog/queue';
import { detectKoreanNames, romanizeKoreanName, romanizeTitle } from '../../../../../../lib/korean-romanization';
import { callClaude } from '../../../../../../lib/claude-api';

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
    const geminiKey = runtime?.env?.GEMINI_API_KEY as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Dev mode: translate step simulated',
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

    if (!job.transcript_text) {
      return new Response(JSON.stringify({ error: 'No transcript available. Run extract step first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateJobStatus(db, id, 'translating', 25);

    let translatedText: string;

    if (job.transcript_lang === 'en') {
      // Already in English, just clean it up
      translatedText = job.transcript_text;
    } else {
      if (!geminiKey) {
        return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      translatedText = await translateTranscript(
        geminiKey,
        job.transcript_text,
        job.transcript_lang || 'unknown'
      );
    }

    // Post-translation: detect Korean names in original and fix in translation
    const originalTranscript = job.transcript_text || '';
    const detectedNames = detectKoreanNames(originalTranscript);
    let nameMap: { korean: string; romanized: string; title?: string }[] = [];

    if (detectedNames.length > 0 && job.transcript_lang !== 'en') {
      nameMap = detectedNames.map(n => ({
        korean: n.name,
        romanized: romanizeKoreanName(n.name).primary,
        title: n.title ? romanizeTitle(n.title) : undefined
      }));

      // Check if names are already correctly romanized
      const anyMissing = nameMap.some(n =>
        !translatedText.includes(n.romanized)
      );

      if (anyMissing) {
        const anthropicKey = runtime?.env?.ANTHROPIC_API_KEY as string | undefined;
        if (anthropicKey) {
          try {
            const nameFixPrompt = `The following English translation of a Korean video transcript contains incorrectly translated Korean person names. Korean names should be ROMANIZED, not translated.

Here are the correct name mappings:
${nameMap.map(n => `- Korean: ${n.korean} → Correct English: ${n.romanized}${n.title ? ` (${n.title})` : ''}`).join('\n')}

Find and replace ALL incorrect versions of these names in the text below. The translator may have produced bizarre phonetic translations — replace them with the correct romanizations listed above.

On first mention of each person, use format: "Dr. [Name] ([Korean Name])" — e.g., "Dr. ${nameMap[0]?.romanized} (${nameMap[0]?.korean})"

Return ONLY the corrected text, nothing else.

Text to fix:
${translatedText}`;

            const corrected = await callClaude({
              apiKey: anthropicKey,
              system: 'You are a Korean-English translation specialist. Fix incorrectly translated Korean names.',
              userMessage: nameFixPrompt,
              maxTokens: 8192,
            });
            if (corrected && corrected.length > 100) {
              translatedText = corrected;
            }
          } catch (err) {
            console.warn('[Translate] Name correction via Claude failed:', err);
          }
        }
      }
    }

    await updateJobStatus(db, id, 'translating', 40, {
      translated_text: translatedText,
      detected_names: nameMap.length > 0 ? JSON.stringify(nameMap) : null,
    });

    return new Response(JSON.stringify({
      success: true,
      original_lang: job.transcript_lang,
      translated_length: translatedText.length,
      detected_names: nameMap,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Translate Step] Error:', error);

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    if (db && id) await failJob(db, id, error.message || 'Translation failed');

    return new Response(JSON.stringify({ error: error.message || 'Translation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
