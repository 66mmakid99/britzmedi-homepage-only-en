// Export all translations
import { en } from './en';
import { ko } from './ko';
import { zh } from './zh';
import { ja } from './ja';
import { es } from './es';
import { ptBr } from './pt-br';
import { de } from './de';
import { ar } from './ar';
import type { Language } from '../config';

export const translations = {
  en,
  ko,
  zh,
  ja,
  es,
  'pt-br': ptBr,
  de,
  ar,
} as const;

export function getTranslations(lang: Language) {
  return translations[lang] || translations.en;
}

export type { TranslationKeys } from './en';
