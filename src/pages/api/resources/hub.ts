import type { APIRoute } from 'astro';
import { fetchPublicDocFamilies } from '../../../lib/resources-hub';

export const prerender = false;

/**
 * Public metadata for documents synced from the ops.britzmedi.com document hub.
 * - `profile`: current published company-profile version per language.
 * - `documents`: web_public hub_doc_families with their is_current published
 *   versions grouped per family (generic versioned documents).
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    const opsDb = env?.OPS_DB;
    if (!opsDb) {
      return new Response(JSON.stringify({ error: 'hub unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await opsDb.prepare(
      `SELECT d.lang, l.label_en, d.version_label, d.updated_at, d.page_count,
              d.pdf_size_bytes, d.pptx_size_bytes,
              (d.pdf_key IS NOT NULL) AS has_pdf,
              (d.pptx_key IS NOT NULL) AS has_pptx
       FROM profile_documents d
       JOIN profile_languages l ON l.lang = d.lang
       WHERE d.is_current = 1 AND d.status = 'published'
       ORDER BY l.sort_order`
    ).all();

    const documents = (results || []).map((r: any) => ({
      lang: r.lang,
      label: r.label_en,
      version: r.version_label,
      updatedAt: r.updated_at ? new Date(r.updated_at * 1000).toISOString().slice(0, 10) : null,
      pageCount: r.page_count ?? null,
      pdfSizeBytes: r.has_pdf ? r.pdf_size_bytes ?? null : null,
      pptxSizeBytes: r.has_pptx ? r.pptx_size_bytes ?? null : null,
    }));

    // Generic versioned documents (hub_doc_families / hub_doc_versions).
    // Failure here must not break the profile payload — return an empty list.
    let hubDocuments: Array<{
      slug: string;
      title: string;
      description: string | null;
      product: string | null;
      category: string;
      gated: boolean;
      current: Array<{ lang: string; version: string; updatedAt: string | null; sizeBytes: number | null; ext: string }>;
    }> = [];
    try {
      hubDocuments = (await fetchPublicDocFamilies(opsDb)).map((f) => ({
        slug: f.slug,
        title: f.title,
        description: f.description,
        product: f.product,
        category: f.category,
        gated: f.gated,
        current: f.current,
      }));
    } catch (error) {
      console.error('[Resources Hub] documents metadata error:', error);
    }

    return new Response(JSON.stringify({ profile: documents, documents: hubDocuments }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[Resources Hub] metadata error:', error);
    return new Response(JSON.stringify({ error: 'hub error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
