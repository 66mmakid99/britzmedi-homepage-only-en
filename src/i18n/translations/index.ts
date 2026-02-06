// Export all translations
import { en } from './en';
import { ja } from './ja';
import { zh } from './zh';
import { th } from './th';
import { vi } from './vi';
import { es } from './es';
import { fr } from './fr';
import { ru } from './ru';
import { ar } from './ar';
import type { Language } from '../config';

export const translations = {
  en,
  ja,
  zh,
  th,
  vi,
  es,
  fr,
  ru,
  ar,
} as const;

export function getTranslations(lang: Language) {
  return translations[lang] || translations.en;
}

export type { TranslationKeys } from './en';
