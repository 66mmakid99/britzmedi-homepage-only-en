export const prerender = false;

import type { APIRoute } from 'astro';
import type { SocialAccount } from '../../../../lib/social/types';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ accounts: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.prepare(
      'SELECT * FROM social_accounts ORDER BY channel, account_name'
    ).all<SocialAccount>();

    return new Response(JSON.stringify({ accounts: result.results || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Social Accounts API] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch accounts', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { channel, account_name, account_id } = body as {
      channel: string;
      account_name: string;
      account_id?: string;
    };

    if (!channel || !account_name) {
      return new Response(JSON.stringify({ error: 'channel and account_name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['twitter', 'linkedin', 'facebook'].includes(channel)) {
      return new Response(JSON.stringify({ error: 'Invalid channel' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO social_accounts (channel, account_name, account_id, enabled, auto_post, created_at, updated_at)
      VALUES (?, ?, ?, 1, 1, ?, ?)
    `).bind(channel, account_name, account_id || null, now, now).run();

    const account = await db.prepare(
      'SELECT * FROM social_accounts WHERE channel = ? AND account_name = ? ORDER BY id DESC LIMIT 1'
    ).bind(channel, account_name).first<SocialAccount>();

    return new Response(JSON.stringify({ success: true, account }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Social Accounts API] Create error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create account', details: error?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
