// Activity Log utility — records system events to D1 activity_log table

export type ActivityType =
  | 'lead_created'
  | 'lead_updated'
  | 'subscriber_added'
  | 'subscriber_unsubscribed'
  | 'blog_published'
  | 'blog_unpublished'
  | 'blog_created'
  | 'social_posted'
  | 'social_failed'
  | 'resource_downloaded'
  | 'admin_login'
  | 'admin_logout'
  | 'ai_research'
  | 'health_check'
  | 'content_transition';

interface ActivityInput {
  type: ActivityType;
  detail: string;
  ip?: string;
  user?: string;
}

export async function logActivity(db: D1Database, input: ActivityInput): Promise<void> {
  try {
    await db.prepare(
      'INSERT INTO activity_log (type, detail, ip, user, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
    ).bind(
      input.type,
      input.detail.slice(0, 500),
      input.ip || null,
      input.user || null,
    ).run();
  } catch (err) {
    console.error('[ActivityLog] Failed to log:', err);
  }
}

export async function getRecentActivities(db: D1Database, limit = 50): Promise<any[]> {
  try {
    const result = await db.prepare(
      'SELECT id, type, detail, ip, user, created_at FROM activity_log ORDER BY created_at DESC LIMIT ?'
    ).bind(limit).all();
    return result.results || [];
  } catch {
    return [];
  }
}
