// GET /api/admin/notifications — list notifications (latest 20, or ?unread=true)
// PUT /api/admin/notifications — mark all as read (body: { action: 'read-all' })

import type { APIRoute } from 'astro';

export const prerender = false;

interface NotificationRow {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: number;
  data: string | null;
  created_at: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ notifications: [], unread_count: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  try {
    const where = unreadOnly ? 'WHERE is_read = 0' : '';
    const notifications = await db.prepare(
      `SELECT * FROM admin_notifications ${where} ORDER BY created_at DESC LIMIT ?`
    ).bind(limit).all<NotificationRow>();

    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0'
    ).first<{ count: number }>();

    return new Response(JSON.stringify({
      notifications: notifications.results || [],
      unread_count: countResult?.count || 0,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[Notifications API] Error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as { action?: string; id?: number };

    if (body.action === 'read-all') {
      await db.prepare('UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0').run();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.id) {
      await db.prepare('UPDATE admin_notifications SET is_read = 1 WHERE id = ?').bind(body.id).run();
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (e: any) {
    console.error('[Notifications API] Error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
