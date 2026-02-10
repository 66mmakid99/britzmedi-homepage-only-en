import type { APIRoute } from 'astro';
import { commitFileToGitHub } from '../../../lib/youtube-to-blog/github';
import defaultConfig from '../../../data/homepage.json';

export const prerender = false;

const KV_KEY = 'homepage-config';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const session = cookies.get('admin_session')?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const kv = runtime?.env?.SESSION as KVNamespace | undefined;

    // Try KV first, fallback to bundled default
    if (kv) {
      const kvData = await kv.get(KV_KEY);
      if (kvData) {
        return new Response(kvData, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Fallback: return the static default from the repo
    return new Response(JSON.stringify(defaultConfig, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Homepage API] Failed to read config:', err);
    return new Response(JSON.stringify({ error: 'Failed to read config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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

    // Validate required sections
    const requiredSections = ['hero', 'trustBadges', 'featuredProducts', 'whyBritzMedi', 'coreTechnologies', 'cta'];
    for (const section of requiredSections) {
      if (!body[section]) {
        return new Response(JSON.stringify({ error: `Missing section: ${section}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const jsonContent = JSON.stringify(body, null, 2);
    const runtime = (locals as any).runtime;
    const kv = runtime?.env?.SESSION as KVNamespace | undefined;
    const githubToken = runtime?.env?.GITHUB_TOKEN as string | undefined;
    const githubRepo = runtime?.env?.GITHUB_REPO as string | undefined;

    // 1. Save to KV for immediate reads
    if (kv) {
      await kv.put(KV_KEY, jsonContent);
      console.log('[Homepage API] Config saved to KV');
    }

    // 2. Commit to GitHub to trigger Cloudflare Pages rebuild
    if (githubToken && githubRepo) {
      try {
        const result = await commitFileToGitHub(
          githubToken,
          githubRepo,
          'src/data/homepage.json',
          jsonContent + '\n',
          'chore: update homepage config via editor'
        );
        console.log('[Homepage API] Committed to GitHub:', result.sha);
      } catch (ghErr) {
        // GitHub commit failure is non-fatal — KV already saved
        console.error('[Homepage API] GitHub commit failed (non-fatal):', ghErr);
      }
    } else {
      console.warn('[Homepage API] GITHUB_TOKEN or GITHUB_REPO not configured — skipping GitHub commit');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Homepage API] Failed to save config:', err);
    return new Response(JSON.stringify({ error: 'Failed to save config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
