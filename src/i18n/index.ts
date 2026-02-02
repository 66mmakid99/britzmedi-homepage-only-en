// Main i18n exports
export * from './config';
export * from './translations';

import { defaultLang, type Language, getLangFromUrl } from './config';
import { getTranslations, type TranslationKeys } from './translations';

// Type-safe translation getter with nested key support
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationPath = NestedKeyOf<TranslationKeys>;

// Get a nested value from an object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return path if not found (fallback)
    }
  }

  return typeof result === 'string' ? result : path;
}

// Create a translator function for a specific language
export function useTranslations(lang: Language) {
  const translations = getTranslations(lang);

  return function t(key: TranslationPath, params?: Record<string, string | number>): string {
    let value = getNestedValue(translations as unknown as Record<string, unknown>, key);

    // Replace placeholders like {year} with actual values
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }

    return value;
  };
}

// Create translations for an Astro component
export function createI18n(url: URL) {
  const lang = getLangFromUrl(url);
  const t = useTranslations(lang);
  const translations = getTranslations(lang);

  return { lang, t, translations };
}

// Export default language for convenience
export { defaultLang };
