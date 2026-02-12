import type { APIRoute } from 'astro';
import { commitFileToGitHub } from '../../../../lib/youtube-to-blog/github';

export const prerender = false;

const VALID_PRODUCT_IDS = ['torr-rf', 'ulblanc', 'newchae-shot', 'lumino-wave'];

// GET: Return current product images from GitHub
export const GET: APIRoute = async ({ cookies, locals }) => {
  const session = cookies.get('admin_session')?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const runtime = (locals as any).runtime;
  const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
  const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

  if (!githubToken || !githubRepo) {
    return new Response(JSON.stringify({ error: 'GitHub not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const products = [];

  for (const id of VALID_PRODUCT_IDS) {
    const filePath = `src/content/products/${id}/index.json`;
    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    try {
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BRITZMEDI-Admin',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const content = atob(data.content.replace(/\n/g, ''));
        const json = JSON.parse(content);

        products.push({
          id,
          name: json.name || id,
          mainImage: json.mainImage || null,
          mainImageUrl: json.mainImage ? `/images/products/${json.mainImage}` : null,
          status: json.status || 'available',
        });
      } else {
        products.push({ id, name: id, mainImage: null, mainImageUrl: null, status: 'unknown' });
      }
    } catch (err) {
      console.error(`[Products] Failed to fetch ${id}:`, err);
      products.push({ id, name: id, mainImage: null, mainImageUrl: null, status: 'unknown' });
    }
  }

  return new Response(JSON.stringify({ products }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Update product mainImage in GitHub JSON
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const session = cookies.get('admin_session')?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { productId, imageUrl } = body as { productId: string; imageUrl: string };

    if (!productId || !imageUrl) {
      return new Response(JSON.stringify({ error: 'Missing productId or imageUrl' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_PRODUCT_IDS.includes(productId)) {
      return new Response(JSON.stringify({ error: 'Invalid product ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = (locals as any).runtime;
    const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
    const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

    if (!githubToken || !githubRepo) {
      return new Response(JSON.stringify({ error: 'GitHub not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch current JSON from GitHub
    const filePath = `src/content/products/${productId}/index.json`;
    const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    const checkRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BRITZMEDI-Admin',
      },
    });

    if (!checkRes.ok) {
      return new Response(JSON.stringify({ error: 'Product JSON not found on GitHub' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileData = await checkRes.json();
    const currentContent = atob(fileData.content.replace(/\n/g, ''));
    const productJson = JSON.parse(currentContent);

    // Extract filename from URL: /images/products/torr-rf-1234.webp → torr-rf-1234.webp
    const filename = imageUrl.split('/').pop()?.split('?')[0] || imageUrl;
    productJson.mainImage = filename;

    // Commit updated JSON
    const result = await commitFileToGitHub(
      githubToken,
      githubRepo,
      filePath,
      JSON.stringify(productJson, null, 2),
      `chore: update ${productId} main image via site editor`
    );

    return new Response(JSON.stringify({
      success: true,
      mainImage: filename,
      sha: result.sha,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Products] Image update failed:', err);
    return new Response(JSON.stringify({ error: err.message || 'Update failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
