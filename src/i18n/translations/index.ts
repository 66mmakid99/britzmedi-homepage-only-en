// Export all translations
import { en } from './en';
import { ko } from './ko';
import { ja } from './ja';
import { zh } from './zh';
import { th } from './th';
import { vi } from './vi';
import { es } from './es';
import { ar } from './ar';
import type { Language } from '../config';

export const translations = {
  en,
  ko,
  ja,
  zh,
  th,
  vi,
  es,
  ar,
} as const;

export function getTranslations(lang: Language) {
  return translations[lang] || translations.en;
}

export type { TranslationKeys } from './en';
