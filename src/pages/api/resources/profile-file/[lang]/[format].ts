import type { APIRoute } from 'astro';

export const prerender = false;

const HUB_LANGS = new Set(['en', 'ko', 'ja', 'zh']);

const CONTENT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/**
 * Streams the CURRENT published company-profile document for a language straight
 * from the ops.britzmedi.com document hub (shared D1 + KV bindings).
 * The link never goes stale: upload + set-current on the hub → this serves it.
 */
export const GET: APIRoute = async ({ params, request, locals }) => {
  const lang = String(params.lang || '').toLowerCase();
  const format = String(params.format || '').toLowerCase();

  if (!HUB_LANGS.has(lang) || !(format in CONTENT_TYPE)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const env = (locals as any).runtime?.env;
    const opsDb = env?.OPS_DB;
    const docsKv = env?.DOCS_KV;
    if (!opsDb || !docsKv) return new Response('Service unavailable', { status: 503 });

    const doc = await opsDb.prepare(
      `SELECT id, lang, version_label, pdf_key, pptx_key
       FROM profile_documents
       WHERE lang = ? AND is_current = 1 AND status = 'published'`
    ).bind(lang).first();

    if (!doc) return new Response('Not found', { status: 404 });

    const key = format === 'pdf' ? doc.pdf_key : doc.pptx_key;
    if (!key) return new Response('Not found', { status: 404 });

    const stream = await docsKv.get(key as string, 'stream');
    if (!stream) return new Response('Not found', { status: 404 });

    // Fire-and-forget download tracking in the site's own D1
    try {
      const db = env?.DB;
      if (db) {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const country = (request.headers.get('CF-IPCountry') || '').slice(0, 8);
        const track = db.prepare(
          `INSERT INTO resource_downloads (resource_id, resource_title, resource_category, ip_address, country)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          'company-presentation',
          `BRITZMEDI Company Presentation ${String(doc.lang).toUpperCase()} v${doc.version_label} (${format})`,
          'marketing',
          ip,
          country,
        ).run();
        const ctx = (locals as any).runtime?.ctx;
        if (ctx?.waitUntil) ctx.waitUntil(track.catch(() => {}));
        else track.catch(() => {});
      }
    } catch { /* tracking must never block the download */ }

    const filename = `BRITZMEDI_Company_${String(doc.lang).toUpperCase()}_${doc.version_label}.${format}`;
    return new Response(stream, {
      headers: {
        'Content-Type': CONTENT_TYPE[format],
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[Resources Hub] file stream error:', error);
    return new Response('Internal error', { status: 500 });
  }
};
