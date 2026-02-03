// DeepL Translation API Endpoint
// POST /api/translate - Translate text to target language

export const prerender = false;

import type { APIRoute } from 'astro';
import { translate, translateBatch, getUsage, DEEPL_LANGUAGES } from '../../lib/deepl';

interface Env {
  DEEPL_API_KEY?: string;
}

interface TranslateRequest {
  text: string | string[];
  targetLang: string;
  sourceLang?: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as TranslateRequest;

    // Validate request
    if (!body.text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body.targetLang) {
      return new Response(JSON.stringify({ error: 'Target language is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if target language is supported
    if (!DEEPL_LANGUAGES[body.targetLang]) {
      return new Response(JSON.stringify({
        error: 'Unsupported target language',
        supportedLanguages: Object.keys(DEEPL_LANGUAGES)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get API key from environment
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const apiKey = env?.DEEPL_API_KEY || import.meta.env.DEEPL_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'Translation service not configured',
        message: 'DeepL API key is not set'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Translate
    let result: string | string[] | null;

    if (Array.isArray(body.text)) {
      // Batch translation
      result = await translateBatch(body.text, body.targetLang, body.sourceLang, apiKey);
    } else {
      // Single text translation
      result = await translate(body.text, body.targetLang, body.sourceLang, apiKey);
    }

    if (result === null) {
      return new Response(JSON.stringify({
        error: 'Translation failed',
        message: 'Could not translate the provided text'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      translated: result,
      targetLang: body.targetLang,
      sourceLang: body.sourceLang || 'auto'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Translate API] Error:', error);
    return new Response(JSON.stringify({
      error: 'Translation service error',
      message: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET /api/translate - Get translation service status and usage
export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const env = runtime?.env as Env | undefined;
  const apiKey = env?.DEEPL_API_KEY || import.meta.env.DEEPL_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({
      configured: false,
      message: 'DeepL API key not configured',
      supportedLanguages: Object.keys(DEEPL_LANGUAGES)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get usage stats
  const usage = await getUsage(apiKey);

  return new Response(JSON.stringify({
    configured: true,
    usage: usage ? {
      characterCount: usage.character_count,
      characterLimit: usage.character_limit,
      usagePercent: Math.round((usage.character_count / usage.character_limit) * 100)
    } : null,
    supportedLanguages: Object.keys(DEEPL_LANGUAGES)
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
