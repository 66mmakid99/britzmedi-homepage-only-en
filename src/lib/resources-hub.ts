// Shared helpers for the ops.britzmedi.com document hub integration.
// Sources: OPS_DB (D1 ops-britzmedi-db) tables hub_doc_families / hub_doc_versions
// (generic versioned documents) and profile_documents (company-profile system).
// This repo only ever READS from OPS_DB / DOCS_KV — writes belong to the ops admin UI.
import type { Resource } from '../content/resources';

export interface HubDocVersion {
  lang: string;
  version: string;
  /** YYYY-MM-DD derived from the unixepoch updated_at */
  updatedAt: string | null;
  sizeBytes: number | null;
  ext: string;
}

export interface HubDocFamily {
  slug: string;
  title: string;
  description: string | null;
  /** 'torr-rf' | 'ulblanc' | 'newchae-shot' | 'lumino-wave' | null (company-wide) */
  product: string | null;
  category: string;
  gated: boolean;
  /** Current published version per language */
  current: HubDocVersion[];
}

export const unixToDate = (ts: unknown): string | null =>
  typeof ts === 'number' && ts > 0 ? new Date(ts * 1000).toISOString().slice(0, 10) : null;

/**
 * Families visible on britzmedi.com (web_public = 1) joined with their
 * is_current = 1 AND status = 'published' versions, grouped per family.
 */
export async function fetchPublicDocFamilies(opsDb: D1Database): Promise<HubDocFamily[]> {
  const { results } = await opsDb.prepare(
    `SELECT f.slug, f.title, f.description, f.product, f.category, f.web_gated,
            v.lang, v.version_label, v.updated_at, v.file_size_bytes, v.file_ext
     FROM hub_doc_families f
     JOIN hub_doc_versions v
       ON v.family_slug = f.slug AND v.is_current = 1 AND v.status = 'published'
     WHERE f.web_public = 1
     ORDER BY f.sort_order, f.slug, v.lang`
  ).all();

  const bySlug = new Map<string, HubDocFamily>();
  for (const r of (results || []) as any[]) {
    let family = bySlug.get(r.slug);
    if (!family) {
      family = {
        slug: r.slug,
        title: r.title,
        description: r.description ?? null,
        product: r.product ?? null,
        category: r.category,
        gated: r.web_gated === 1,
        current: [],
      };
      bySlug.set(r.slug, family);
    }
    family.current.push({
      lang: r.lang,
      version: r.version_label,
      updatedAt: unixToDate(r.updated_at),
      sizeBytes: r.file_size_bytes ?? null,
      ext: r.file_ext,
    });
  }
  return [...bySlug.values()];
}

/**
 * Map a hub family.product to a resources-page group id.
 * 'lumino-wave' has no section in resourceProductGroups yet, so it lands in
 * the company group for now (same for null / unknown products).
 */
export function hubProductToGroupId(product: string | null): string {
  if (product === 'torr-rf' || product === 'ulblanc' || product === 'newchae-shot') return product;
  return 'company';
}

/** File extension → resources-page row type (drives the tile icon/colour). */
export function hubExtToType(ext: string): Resource['type'] {
  const e = (ext || '').toLowerCase();
  if (e === 'pptx' || e === 'ppt') return 'ppt';
  if (e === 'zip') return 'image';
  return 'pdf'; // pdf, docx, xlsx → pdf icon fallback
}

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  ar: 'العربية',
  pt: 'Português',
};

/** Human label for the languages a family is available in ("English · 한국어"). */
export const hubLangsLabel = (versions: HubDocVersion[]): string =>
  versions.map((v) => LANG_LABELS[v.lang] || v.lang.toUpperCase()).join(' · ');

/** Pick the current version for a lang with the shared fallback chain: lang → 'en' → any. */
export const pickHubVersion = (versions: HubDocVersion[], lang: string): HubDocVersion | undefined =>
  versions.find((v) => v.lang === lang) || versions.find((v) => v.lang === 'en') || versions[0];

/** "v20260610 · 2026-06-10 · 4.2 MB" — same parts as the old client-side badge. */
export function hubVersionBadge(v: HubDocVersion | undefined | null): string | null {
  if (!v) return null;
  const parts = [`v${v.version}`];
  if (v.updatedAt) parts.push(v.updatedAt);
  if (v.sizeBytes) parts.push(`${(v.sizeBytes / 1048576).toFixed(1)} MB`);
  return parts.join(' · ');
}

/**
 * Server-rendered badge text for the company-presentation row (profile system):
 * current published profile_documents row for the lang, falling back to 'en'.
 */
export async function fetchProfileBadge(opsDb: D1Database, lang: string): Promise<string | null> {
  const pick = (l: string) =>
    opsDb.prepare(
      `SELECT version_label, updated_at, pdf_size_bytes
       FROM profile_documents
       WHERE lang = ? AND is_current = 1 AND status = 'published'`
    ).bind(l).first<{ version_label: string; updated_at: number | null; pdf_size_bytes: number | null }>();

  const doc = (await pick(lang)) || (lang !== 'en' ? await pick('en') : null);
  if (!doc) return null;
  return hubVersionBadge({
    lang,
    version: String(doc.version_label),
    updatedAt: unixToDate(doc.updated_at),
    sizeBytes: doc.pdf_size_bytes ?? null,
    ext: 'pdf',
  });
}
