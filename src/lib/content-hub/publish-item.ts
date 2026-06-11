// Content Hub shared publish logic — the single path that publishes a content_item.
// Builds the blog JSON, commits it to GitHub (which triggers the CF Pages rebuild),
// and only then flips D1 status to 'published' and records a revision.
// Used by both POST /api/admin/content-hub/publish and the kanban
// transition 'publish' action so the two admin buttons can never diverge again.

import { marked } from 'marked';
import { commitFileToGitHub } from '../youtube-to-blog/github';
import { logActivity } from '../activity-log';
import { isHtml } from '../html-to-markdown';

export interface PublishItemResult {
  commitSha: string;
  htmlUrl: string;
  slug: string;
  filePath: string;
}

export function countWords(text: string): number {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export async function publishContentItem(
  db: D1Database,
  githubToken: string,
  githubRepo: string,
  item: any,
  changedBy: string = 'admin',
): Promise<PublishItemResult> {
  if (!item?.content) throw new Error('Content item has no content to publish');
  if (!item?.slug) throw new Error('Content item has no slug');

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
  // Strip first H1 heading — the title is shown separately in the hero area
  const rawHtml = isHtml(item.content) ? item.content : await marked(item.content);
  const htmlContent = rawHtml.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '');

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
    category: (item.category || 'medical-devices').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
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
    faqs: faqData || [],
    sourceType: item.source_type,
    seoKeyword: item.seo_keyword,
  }, null, 2);

  // Commit to GitHub first — if this fails, D1 must stay untouched
  const filePath = `src/content/blog/${item.slug}.json`;
  const commitResult = await commitFileToGitHub(
    githubToken,
    githubRepo,
    filePath,
    blogPostJson,
    `feat: publish content "${item.title}"`,
  );

  // Update status to published in D1
  await db.prepare(
    `UPDATE content_items SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?`
  ).bind(now, now, item.id).run();

  // Save revision for the publish event
  try {
    const latestVer = await db.prepare(
      'SELECT MAX(version) as max_ver FROM content_revisions WHERE content_id = ?'
    ).bind(item.id).first<any>();
    const nextVersion = (latestVer?.max_ver || 0) + 1;

    let score: number | null = null;
    if (item.analysis_data) {
      try { score = JSON.parse(item.analysis_data).overall_score || null; } catch {}
    }

    await db.prepare(
      `INSERT INTO content_revisions (content_id, version, content, title, meta_description, faqs, change_summary, word_count, score, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      item.id,
      nextVersion,
      item.content || '',
      item.title,
      item.excerpt || null,
      item.faq || null,
      'Published to GitHub',
      countWords(item.content || ''),
      score,
      changedBy,
    ).run();
  } catch (revErr: any) {
    console.warn('[Content Hub Publish] Failed to save revision:', revErr.message);
  }

  logActivity(db, {
    type: 'blog_published',
    detail: `Content Hub: "${item.title}" published to GitHub (${item.slug})`,
  }).catch(() => {});

  return {
    commitSha: commitResult.sha,
    htmlUrl: commitResult.html_url,
    slug: item.slug,
    filePath,
  };
}
