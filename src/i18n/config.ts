// i18n Configuration for BRITZMEDI Global Website
// Supports 8 languages: EN, KO, ZH, JA, ES, PT-BR, DE, AR

export const languages = {
  en: { name: 'English', flag: '🇺🇸', dir: 'ltr' },
  ko: { name: '한국어', flag: '🇰🇷', dir: 'ltr' },
  zh: { name: '中文', flag: '🇨🇳', dir: 'ltr' },
  ja: { name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  'pt-br': { name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  de: { name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
} as const;

export type Language = keyof typeof languages;

export const defaultLang: Language = 'en';

export const supportedLanguages = Object.keys(languages) as Language[];

// Get language info
export function getLanguageInfo(lang: Language) {
  return languages[lang] || languages[defaultLang];
}

// Check if a language is RTL
export function isRTL(lang: Language): boolean {
  return languages[lang]?.dir === 'rtl';
}

// Get language from URL path
export function getLangFromUrl(url: URL): Language {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) {
    return lang as Language;
  }
  return defaultLang;
}

// Remove language prefix from path
export function removeLanguageFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] && parts[0] in languages) {
    parts.shift();
  }
  return '/' + parts.join('/');
}

// Add language prefix to path
export function addLanguageToPath(pathname: string, lang: Language): string {
  const cleanPath = removeLanguageFromPath(pathname);
  if (lang === defaultLang) {
    return cleanPath;
  }
  return `/${lang}${cleanPath}`;
}

// Generate alternate URLs for hreflang tags
export function getAlternateUrls(pathname: string, baseUrl: string): Record<Language, string> {
  const cleanPath = removeLanguageFromPath(pathname);
  const urls = {} as Record<Language, string>;

  for (const lang of supportedLanguages) {
    const langPath = lang === defaultLang ? cleanPath : `/${lang}${cleanPath}`;
    urls[lang] = `${baseUrl}${langPath}`;
  }

  return urls;
}
