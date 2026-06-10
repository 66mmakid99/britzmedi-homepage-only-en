import type { APIRoute } from 'astro';

export const prerender = false;

const CONTENT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Streams the CURRENT published version of a hub document family straight from
 * the ops.britzmedi.com document hub (shared D1 OPS_DB + KV DOCS_KV bindings).
 * Serving condition: family.web_public = 1 AND version.is_current = 1 AND
 * version.status = 'published'. Lang fallback: ?lang= → 'en' → any current row.
 * The link never goes stale: upload + set-current on the hub → this serves it.
 */
export const GET: APIRoute = async ({ params, request, url, locals }) => {
  const slug = String(params.slug || '').toLowerCase();
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return new Response('Not found', { status: 404 });
  }

  const requestedLang = (url.searchParams.get('lang') || 'en').toLowerCase().slice(0, 5);

  try {
    const env = (locals as any).runtime?.env;
    const opsDb = env?.OPS_DB;
    const docsKv = env?.DOCS_KV;
    if (!opsDb || !docsKv) return new Response('Service unavailable', { status: 503 });

    const family = await opsDb.prepare(
      `SELECT slug, title, category
       FROM hub_doc_families
       WHERE slug = ? AND web_public = 1`
    ).bind(slug).first();

    if (!family) return new Response('Not found', { status: 404 });

    const { results } = await opsDb.prepare(
      `SELECT lang, version_label, file_key, file_ext, content_type
       FROM hub_doc_versions
       WHERE family_slug = ? AND is_current = 1 AND status = 'published'
       ORDER BY lang`
    ).bind(slug).all();

    const versions = (results || []) as any[];
    const doc =
      versions.find((v) => v.lang === requestedLang) ||
      versions.find((v) => v.lang === 'en') ||
      versions[0];

    if (!doc) return new Response('Not found', { status: 404 });

    const stream = await docsKv.get(doc.file_key as string, 'stream');
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
          slug,
          `${family.title} ${String(doc.lang).toUpperCase()} v${doc.version_label} (${doc.file_ext})`,
          family.category,
          ip,
          country,
        ).run();
        const ctx = (locals as any).runtime?.ctx;
        if (ctx?.waitUntil) ctx.waitUntil(track.catch(() => {}));
        else track.catch(() => {});
      }
    } catch { /* tracking must never block the download */ }

    const ext = String(doc.file_ext).toLowerCase();
    const filename = `BRITZMEDI_${slug}_${doc.version_label}.${ext}`;
    return new Response(stream, {
      headers: {
        'Content-Type': CONTENT_TYPE[ext] || (doc.content_type as string) || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[Resources Hub] doc-file stream error:', error);
    return new Response('Internal error', { status: 500 });
  }
};
