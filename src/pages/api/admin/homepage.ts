import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

const HOMEPAGE_JSON_PATH = path.join(process.cwd(), 'src', 'data', 'homepage.json');

export const GET: APIRoute = async ({ cookies }) => {
  // Auth check
  const session = cookies.get('admin_session')?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = fs.readFileSync(HOMEPAGE_JSON_PATH, 'utf-8');
    return new Response(data, {
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

export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth check
  const session = cookies.get('admin_session')?.value;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    // Basic validation - ensure required sections exist
    const requiredSections = ['hero', 'trustBadges', 'featuredProducts', 'whyBritzMedi', 'coreTechnologies', 'cta'];
    for (const section of requiredSections) {
      if (!body[section]) {
        return new Response(JSON.stringify({ error: `Missing section: ${section}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Write to file with pretty formatting
    fs.writeFileSync(HOMEPAGE_JSON_PATH, JSON.stringify(body, null, 2), 'utf-8');

    console.log('[Homepage API] Config saved successfully');
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
