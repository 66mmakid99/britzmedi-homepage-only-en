// Shared publish logic for blog posts.
// Used by:
//   - POST /api/blog/posts/[id]/publish        (explicit publish)
//   - GET  /api/blog/approve                    (email 1-click approve => publish)
//   - POST /api/blog/posts/[id]/approve         (admin panel 1-click approve => publish)
//
// Commits the post JSON to GitHub (triggers Cloudflare Pages rebuild),
// updates blog_posts.status='published', and fires social auto-post (non-blocking).

import { commitFileToGitHub, buildBlogPostJson } from './github';
import { generateArticleSchema, generateBreadcrumbSchema } from './templates/schema-json-ld';
import type { BlogPost } from './schemas';
import { logActivity } from '../activity-log';

export interface PublishResult {
  ok: boolean;
  status?: number;
  error?: string;
  commit_sha?: string;
  slug?: string;
}

/**
 * Publish a blog post: commit JSON to GitHub + mark published in D1.
 * env must expose DB, GITHUB_TOKEN, GITHUB_REPO (and optionally social keys).
 */
export async function publishPost(post: BlogPost, env: any): Promise<PublishResult> {
  const db = env?.DB as D1Database | undefined;
  const githubToken = env?.GITHUB_TOKEN as string | undefined;
  const githubRepo = env?.GITHUB_REPO as string | undefined;

  if (!db) {
    return { ok: false, status: 503, error: 'Database not available' };
  }
  if (!githubToken || !githubRepo) {
    return { ok: false, status: 503, error: 'GitHub configuration missing (GITHUB_TOKEN, GITHUB_REPO)' };
  }

  if (!['approved', 'unpublished', 'draft'].includes(post.status)) {
    return { ok: false, status: 400, error: `Cannot publish a post in "${post.status}" status. Approve it first.` };
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
    post.id
  ).run();

  // Auto-post to social media (non-blocking)
  try {
    const { triggerAutoPost } = await import('../social/auto-post');
    await triggerAutoPost({
      postId: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      category: post.category,
      featuredImage: post.featured_image,
      doctorName: post.doctor_name,
    }, { db, ...env });
  } catch (socialError) {
    console.error('[Publish] Social auto-post error (non-blocking):', socialError);
  }

  logActivity(db, { type: 'blog_published', detail: `Blog published: "${post.title}" (${post.slug})` }).catch(() => {});

  return { ok: true, commit_sha: result.sha, slug: post.slug };
}
