// Publisher for Content Hub items
// Commits content as Keystatic blog post JSON to GitHub

import { commitFileToGitHub } from '../youtube-to-blog/github';

// ── Interfaces ──────────────────────────────────────────────────

export interface ContentItem {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;              // JSON string
  featured_image: string | null;
  seo_keyword: string | null;
  seo_secondary_keywords: string | null;  // JSON string
  faq: string | null;        // JSON string
  schema_type: string | null;
  author: string;
  published_at: string | null;
}

export interface PublishResult {
  success: boolean;
  commitSha: string;
  htmlUrl: string;
  slug: string;
}

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Parse a JSON string array safely. Returns empty array on failure.
 */
function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
}

/**
 * Parse FAQ JSON string into structured array.
 */
function parseFaqArray(value: string | null | undefined): Array<{ question: string; answer: string }> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((item: Record<string, unknown>) =>
        typeof item.question === 'string' && typeof item.answer === 'string'
      )
      .map((item: Record<string, unknown>) => ({
        question: item.question as string,
        answer: item.answer as string,
      }));
  } catch {
    return null;
  }
}

/**
 * Build FAQ Schema.org JSON-LD from FAQ array.
 */
function buildFaqSchemaJsonLd(
  faqs: Array<{ question: string; answer: string }> | null
): Record<string, unknown> | null {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ── Build blog post JSON ────────────────────────────────────────

/**
 * Build Keystatic-compatible blog post JSON from a ContentItem.
 * Output format matches the structure expected by the blog rendering pages
 * and is consistent with buildBlogPostJson from youtube-to-blog/github.ts.
 */
export function buildContentPostJson(item: ContentItem): string {
  const tags = parseJsonArray(item.tags);
  const keywords = buildKeywordsList(item);
  const faqs = parseFaqArray(item.faq);
  const now = new Date().toISOString();

  // Build schema JSON-LD: prefer FAQ schema if FAQs exist, otherwise Article
  let schemaJsonLd: Record<string, unknown> | null = null;
  if (faqs && faqs.length > 0) {
    schemaJsonLd = buildFaqSchemaJsonLd(faqs);
  } else if (item.schema_type) {
    schemaJsonLd = {
      '@context': 'https://schema.org',
      '@type': item.schema_type,
      headline: item.title,
      description: item.excerpt,
      author: {
        '@type': 'Organization',
        name: 'BRITZMEDI',
      },
      datePublished: item.published_at || now,
      dateModified: now,
    };
  }

  return JSON.stringify({
    title: item.title,
    slug: item.slug,
    status: 'published',
    content: item.content,
    excerpt: item.excerpt,
    metaDescription: item.excerpt.slice(0, 160),
    keywords,
    tags,
    category: item.category || 'uncategorized',
    featuredImage: item.featured_image || null,
    youtubeEmbedUrl: null,
    youtubeUrl: null,
    author: item.author || 'BRITZMEDI Team',
    publishedAt: item.published_at || now,
    updatedAt: now,
    doctor: null,
    schemaJsonLd,
  }, null, 2);
}

/**
 * Combine primary and secondary keywords into a single array.
 */
function buildKeywordsList(item: ContentItem): string[] {
  const keywords: string[] = [];

  if (item.seo_keyword) {
    keywords.push(item.seo_keyword);
  }

  const secondary = parseJsonArray(item.seo_secondary_keywords);
  for (const kw of secondary) {
    if (!keywords.includes(kw)) {
      keywords.push(kw);
    }
  }

  return keywords;
}

// ── Publish to GitHub ───────────────────────────────────────────

/**
 * Publish a content item to GitHub as a Keystatic blog post JSON file.
 *
 * Commits the file to `src/content/blog/{slug}.json` on the main branch.
 * If the file already exists it will be updated (GitHub API handles SHA lookup).
 *
 * @param item - The content item to publish
 * @param githubToken - GitHub personal access token with repo write access
 * @param githubRepo - Repository in "owner/repo" format
 * @returns Publish result with commit SHA and URL
 */
export async function publishContentItem(
  item: ContentItem,
  githubToken: string,
  githubRepo: string
): Promise<PublishResult> {
  // 1. Build the blog post JSON
  const postJson = buildContentPostJson(item);

  // 2. Determine file path in the repository
  const filePath = `src/content/blog/${item.slug}.json`;

  // 3. Commit to GitHub
  const commitMessage = `feat(content): publish "${item.title}"`;

  const { sha, html_url } = await commitFileToGitHub(
    githubToken,
    githubRepo,
    filePath,
    postJson,
    commitMessage
  );

  return {
    success: true,
    commitSha: sha,
    htmlUrl: html_url,
    slug: item.slug,
  };
}
