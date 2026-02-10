// Content Hub Publish API - Publish content item to GitHub (Keystatic blog)
// POST /api/admin/content-hub/publish

export const prerender = false;

import type { APIRoute } from 'astro';
import { marked } from 'marked';
import { commitFileToGitHub } from '../../../../lib/youtube-to-blog/github';
import { logActivity } from '../../../../lib/activity-log';
import { isHtml } from '../../../../lib/html-to-markdown';

interface Env {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;
    const db = env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const githubToken = env?.GITHUB_TOKEN;
    const githubRepo = env?.GITHUB_REPO;

    if (!githubToken || !githubRepo) {
      return new Response(JSON.stringify({ error: 'GitHub credentials not configured (GITHUB_TOKEN, GITHUB_REPO)' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { content_id } = body;

    if (!content_id) {
      return new Response(JSON.stringify({ error: 'content_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load content item from D1
    const item = await db.prepare(
      'SELECT * FROM content_items WHERE id = ?'
    ).bind(content_id).first<any>();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Content item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only approved, draft, or published (re-publish) items can be published
    if (!['approved', 'draft', 'published'].includes(item.status)) {
      return new Response(JSON.stringify({
        error: `Cannot publish item with status "${item.status}". Must be "approved", "draft", or "published".`,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!item.content) {
      return new Response(JSON.stringify({ error: 'Content item has no content to publish' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!item.slug) {
      return new Response(JSON.stringify({ error: 'Content item has no slug' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // Parse JSON fields safely
    let tags: string[] = [];
    let keywords: string[] = [];
    let faqData: any = null;

    try {
      tags = item.tags ? JSON.parse(item.tags) : [];
    } catch { tags = []; }

    try {
      keywords = item.seo_secondary_keywords ? JSON.parse(item.seo_secondary_keywords) : [];
    } catch { keywords = []; }

    // Include the primary keyword
    if (item.seo_keyword && !keywords.includes(item.seo_keyword)) {
      keywords.unshift(item.seo_keyword);
    }

    try {
      faqData = item.faq ? JSON.parse(item.faq) : null;
    } catch { faqData = null; }

    // Convert markdown to HTML for blog rendering (blog pages use set:html)
    const htmlContent = isHtml(item.content) ? item.content : await marked(item.content);

    // Build blog post JSON (compatible with existing blog system)
    const blogPostJson = JSON.stringify({
      title: item.title,
      slug: item.slug,
      status: 'published',
      content: htmlContent,
      excerpt: item.excerpt || '',
      metaDescription: item.excerpt || '',
      keywords,
      tags: Array.isArray(tags) ? tags : [],
      category: item.category || 'medical-devices',
      featuredImage: item.featured_image || null,
      youtubeEmbedUrl: null,
      youtubeUrl: item.source_url || null,
      author: item.author || 'BRITZMEDI Research Team',
      publishedAt: now,
      updatedAt: now,
      doctor: null,
      schemaJsonLd: item.schema_type ? {
        '@context': 'https://schema.org',
        '@type': item.schema_type || 'Article',
        headline: item.title,
        description: item.excerpt || '',
        keywords: keywords.join(', '),
        datePublished: now,
        dateModified: now,
        author: {
          '@type': 'Organization',
          name: item.author || 'BRITZMEDI Research Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'BRITZMEDI',
          url: 'https://britzmedi.com',
        },
      } : null,
      faq: faqData,
      sourceType: item.source_type,
      seoKeyword: item.seo_keyword,
    }, null, 2);

    // Commit to GitHub
    const filePath = `src/content/blog/${item.slug}.json`;
    const commitMessage = `feat: publish content "${item.title}"`;

    const commitResult = await commitFileToGitHub(
      githubToken,
      githubRepo,
      filePath,
      blogPostJson,
      commitMessage,
    );

    // Update status to published in D1
    await db.prepare(
      `UPDATE content_items SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?`
    ).bind(now, now, content_id).run();

    // Save revision for the publish event
    try {
      await db.prepare(
        `INSERT INTO content_revisions (
          content_id, title, content, excerpt, status, changed_by, change_note, created_at
        ) VALUES (?, ?, NULL, NULL, 'published', 'admin', 'Published to GitHub', ?)`
      ).bind(content_id, item.title, now).run();
    } catch (revErr: any) {
      console.warn('[Content Hub Publish] Failed to save revision:', revErr.message);
    }

    logActivity(db, {
      type: 'blog_published',
      detail: `Content Hub: "${item.title}" published to GitHub (${item.slug})`,
    }).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      commitSha: commitResult.sha,
      htmlUrl: commitResult.html_url,
      slug: item.slug,
      message: `Content published successfully to ${filePath}`,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Content Hub Publish API] Error:', error);

    const isGitHubError = error?.message?.includes('GitHub');
    return new Response(JSON.stringify({
      error: isGitHubError ? 'GitHub publishing failed' : 'Failed to publish content',
      details: error?.message,
    }), {
      status: isGitHubError ? 502 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
