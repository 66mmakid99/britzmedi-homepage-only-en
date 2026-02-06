// Publish blog post to GitHub (triggers Cloudflare Pages rebuild)
// POST /api/blog/posts/[id]/publish

export const prerender = false;

import type { APIRoute } from 'astro';
import { commitFileToGitHub, buildBlogPostJson } from '../../../../../lib/youtube-to-blog/github';
import { generateArticleSchema, generateBreadcrumbSchema } from '../../../../../lib/youtube-to-blog/templates/schema-json-ld';
import type { BlogPost } from '../../../../../lib/youtube-to-blog/schemas';

export const POST: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Post ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;
    const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
    const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!githubToken || !githubRepo) {
      return new Response(JSON.stringify({ error: 'GitHub configuration missing (GITHUB_TOKEN, GITHUB_REPO)' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(id).first<BlogPost>();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['approved', 'unpublished', 'draft'].includes(post.status)) {
      return new Response(JSON.stringify({ error: `Cannot publish a post in "${post.status}" status. Approve it first.` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const keywords = post.keywords ? JSON.parse(post.keywords) : [];
    const tags = post.tags ? JSON.parse(post.tags) : [];

    // Generate Schema.org JSON-LD
    const articleSchema = generateArticleSchema({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      category: post.category,
      tags,
      featuredImage: post.featured_image,
      publishedAt: post.published_at || now,
      updatedAt: now,
      author: 'BRITZMEDI Team',
      doctor: post.doctor_name ? {
        name: post.doctor_name,
        title: post.doctor_title || '',
        credentials: post.doctor_credentials || '',
        image: post.doctor_image || null,
      } : null,
    });

    const schemaJsonLd = JSON.stringify([
      articleSchema,
      generateBreadcrumbSchema({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        category: post.category,
        tags,
        featuredImage: post.featured_image,
        publishedAt: post.published_at || now,
        author: 'BRITZMEDI Team',
      }),
    ]);

    // Build blog post JSON file content
    const postJson = buildBlogPostJson({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      meta_description: post.meta_description || '',
      keywords,
      tags,
      category: post.category,
      featured_image: post.featured_image,
      youtube_embed_url: post.youtube_embed_url,
      youtube_url: post.youtube_url,
      doctor_name: post.doctor_name,
      doctor_title: post.doctor_title,
      doctor_credentials: post.doctor_credentials,
      doctor_image: post.doctor_image,
      doctor_bio: post.doctor_bio,
      published_at: post.published_at || now,
      schema_json_ld: schemaJsonLd,
    });

    // Commit to GitHub
    const result = await commitFileToGitHub(
      githubToken,
      githubRepo,
      `src/content/blog/${post.slug}.json`,
      postJson,
      `feat: publish blog post "${post.title}"`
    );

    // Update database
    await db.prepare(`
      UPDATE blog_posts SET
        status = 'published',
        published_at = ?,
        github_commit_sha = ?,
        schema_json_ld = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      post.published_at || now,
      result.sha,
      schemaJsonLd,
      id
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Blog post published! Cloudflare Pages will rebuild automatically.',
      commit_sha: result.sha,
      slug: post.slug,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Publish] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Publishing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
