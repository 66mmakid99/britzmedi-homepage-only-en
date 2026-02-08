// Admin API for updating file-based blog post status via GitHub API
// PATCH /api/admin/blog/file-posts/:slug - Update status field in JSON file

export const prerender = false;

import type { APIRoute } from 'astro';
import { commitFileToGitHub } from '../../../../../lib/youtube-to-blog/github';

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
}

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env as Env | undefined;

    const token = env?.GITHUB_TOKEN;
    const repo = env?.GITHUB_REPO;

    if (!token || !repo) {
      return new Response(JSON.stringify({ error: 'GitHub configuration not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const slug = params.slug;
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const newStatus = body.status;

    if (!newStatus || !['published', 'draft'].includes(newStatus)) {
      return new Response(JSON.stringify({ error: 'Invalid status. Must be "published" or "draft".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch current file content from GitHub
    const filePath = `src/content/blog/${slug}.json`;
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    const fileRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BRITZMEDI-Blog-Publisher',
      },
    });

    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: 'Blog post file not found on GitHub' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileData = await fileRes.json();
    const currentContent = JSON.parse(
      decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))))
    );

    // Update status
    currentContent.status = newStatus;

    // Commit updated file
    const result = await commitFileToGitHub(
      token,
      repo,
      filePath,
      JSON.stringify(currentContent, null, 2) + '\n',
      `chore(blog): ${newStatus === 'published' ? 'publish' : 'unpublish'} "${currentContent.title}"`
    );

    return new Response(JSON.stringify({
      success: true,
      slug,
      status: newStatus,
      commit_sha: result.sha,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('File post status update error:', err);
    return new Response(JSON.stringify({
      error: 'Failed to update post status',
      details: err instanceof Error ? err.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
