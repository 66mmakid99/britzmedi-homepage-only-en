import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Public metadata for documents synced from the ops.britzmedi.com document hub.
 * Returns the current published company-profile version per language so the
 * resources page can render live version badges without a rebuild.
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

    return new Response(JSON.stringify({ profile: documents }), {
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
