// i18n Configuration for BRITZMEDI Global Website
// Supports 9 languages: EN, JA, ZH, TH, VI, ES, FR, RU, AR

export const languages = {
  en: { name: 'English', flag: '🇺🇸', dir: 'ltr' },
  ja: { name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  zh: { name: '中文', flag: '🇨🇳', dir: 'ltr' },
  th: { name: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
  vi: { name: 'Tiếng Việt', flag: '🇻🇳', dir: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ru: { name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
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

// Route patterns that have localized ([lang]/...) versions.
// Pages NOT matching these (e.g. /news, /confirm-subscription, /404) are English-only:
// the language switcher must not link to a non-existent /xx/... URL, and SEOHead must
// not emit hreflang alternates pointing at 404s.
const LOCALIZED_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/about$/,
  /^\/blog$/,
  /^\/blog\/[^/]+$/,
  /^\/certifications$/,
  /^\/contact$/,
  /^\/faq$/,
  /^\/privacy$/,
  /^\/products$/,
  /^\/products\/[^/]+$/,
  /^\/resources$/,
  /^\/terms$/,
];

// Whether the given path (with or without a language prefix) has localized versions.
export function isLocalizedRoute(pathname: string): boolean {
  const cleanPath = removeLanguageFromPath(pathname);
  return LOCALIZED_ROUTE_PATTERNS.some((re) => re.test(cleanPath));
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
