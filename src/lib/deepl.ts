// [INACTIVE] 현재 미사용. 향후 실시간 번역 기능 구현 시 활성화 예정.
// 현재 다국어는 빌드타임 정적 번역 JSON으로 처리 중.
//
// DeepL Translation Service
// API Documentation: https://www.deepl.com/docs-api

export interface TranslationRequest {
  text: string | string[];
  targetLang: string;
  sourceLang?: string;
}

export interface TranslationResult {
  translations: {
    detected_source_language: string;
    text: string;
  }[];
}

// DeepL supported language codes mapping
export const DEEPL_LANGUAGES: Record<string, string> = {
  en: 'EN',
  ko: 'KO',
  ja: 'JA',
  zh: 'ZH',
  es: 'ES',
  de: 'DE',
  ar: 'AR',
  'pt-br': 'PT-BR',
};

// Get DeepL language code from our i18n code
export function getDeepLCode(langCode: string): string {
  return DEEPL_LANGUAGES[langCode] || 'EN';
}

// Translate text using DeepL API
export async function translateText(
  text: string | string[],
  targetLang: string,
  sourceLang?: string,
  apiKey?: string
): Promise<TranslationResult | null> {
  const key = apiKey || process.env.DEEPL_API_KEY;

  if (!key) {
    console.warn('[DeepL] API key not configured');
    return null;
  }

  // DeepL API endpoints
  const isFreeKey = key.endsWith(':fx');
  const baseUrl = isFreeKey
    ? 'https://api-free.deepl.com/v2'
    : 'https://api.deepl.com/v2';

  try {
    const texts = Array.isArray(text) ? text : [text];

    const params = new URLSearchParams();
    texts.forEach(t => params.append('text', t));
    params.append('target_lang', getDeepLCode(targetLang));
    if (sourceLang) {
      params.append('source_lang', getDeepLCode(sourceLang));
    }

    const response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[DeepL] API error:', response.status, error);
      return null;
    }

    const data = await response.json() as TranslationResult;
    console.log(`[DeepL] Translated ${texts.length} text(s) to ${targetLang}`);
    return data;
  } catch (error) {
    console.error('[DeepL] Translation failed:', error);
    return null;
  }
}

// Translate a single string (convenience function)
export async function translate(
  text: string,
  targetLang: string,
  sourceLang?: string,
  apiKey?: string
): Promise<string | null> {
  const result = await translateText(text, targetLang, sourceLang, apiKey);
  return result?.translations?.[0]?.text || null;
}

// Translate multiple strings in batch
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang?: string,
  apiKey?: string
): Promise<string[] | null> {
  const result = await translateText(texts, targetLang, sourceLang, apiKey);
  return result?.translations?.map(t => t.text) || null;
}

// Check API usage (DeepL API provides usage info)
export async function getUsage(apiKey?: string): Promise<{
  character_count: number;
  character_limit: number;
} | null> {
  const key = apiKey || process.env.DEEPL_API_KEY;

  if (!key) {
    return null;
  }

  const isFreeKey = key.endsWith(':fx');
  const baseUrl = isFreeKey
    ? 'https://api-free.deepl.com/v2'
    : 'https://api.deepl.com/v2';

  try {
    const response = await fetch(`${baseUrl}/usage`, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
