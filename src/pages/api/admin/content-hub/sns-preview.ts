// SNS Preview API — generates platform-specific post previews
// POST /api/admin/content-hub/sns-preview

export const prerender = false;

import type { APIRoute } from 'astro';
import { generateAllPreviews } from '../../../../lib/social/formatter';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, slug, excerpt, category, featuredImage, doctorName, contentType } = body;

    if (!title || !slug) {
      return new Response(JSON.stringify({ error: 'title and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const previews = generateAllPreviews({
      title,
      slug,
      excerpt: excerpt || '',
      category: category || 'medical-devices',
      featuredImage,
      doctorName,
      contentType: contentType || 'blog',
    });

    return new Response(JSON.stringify(previews), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate previews' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
