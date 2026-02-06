// GET /api/subscribers/unsubscribe?token={token}
// Unsubscribe a subscriber using their unsubscribe token

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect('/unsubscribe?status=invalid');
  }

  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB as D1Database | undefined;

    if (!db) {
      console.log('[Unsubscribe API] Dev mode - would unsubscribe token:', token);
      return redirect('/unsubscribe?status=success');
    }

    const subscriber = await db.prepare(
      'SELECT id, status FROM subscribers WHERE unsubscribe_token = ?'
    ).bind(token).first<{ id: number; status: string }>();

    if (!subscriber) {
      return redirect('/unsubscribe?status=invalid');
    }

    if (subscriber.status === 'unsubscribed') {
      return redirect('/unsubscribe?status=already');
    }

    await db.prepare(`
      UPDATE subscribers SET
        status = 'unsubscribed',
        unsubscribed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(subscriber.id).run();

    return redirect('/unsubscribe?status=success');
  } catch (error: any) {
    console.error('[Unsubscribe API] Error:', error);
    return redirect('/unsubscribe?status=error');
  }
};
