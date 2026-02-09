import type { APIRoute } from 'astro';
import { logActivity } from '../../../lib/activity-log';

export const prerender = false;

interface CheckResult {
  name: string;
  category: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  duration?: number;
}

const ENV_KEYS = [
  'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GITHUB_TOKEN', 'GITHUB_REPO',
  'RESEND_API_KEY', 'SLACK_WEBHOOK_URL',
  'TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET',
  'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET',
  'INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_USER_ID',
];

const REQUIRED_TABLES = [
  'leads', 'lead_activities', 'lead_score_history', 'resource_downloads',
  'blog_jobs', 'blog_posts', 'youtube_channels', 'youtube_videos',
  'name_mappings', 'subscribers', 'notification_log',
  'social_accounts', 'social_posts', 'activity_log',
];

export const POST: APIRoute = async ({ request, locals }) => {
  const start = Date.now();
  const runtime = (locals as any).runtime;
  const env = runtime?.env || {};
  const db = env.DB as D1Database | undefined;
  const kv = env.SESSION as KVNamespace | undefined;
  const r2 = env.BLOG_IMAGES;
  const results: CheckResult[] = [];

  // ── Infrastructure ──
  // D1
  const d1Start = Date.now();
  try {
    if (db) {
      await db.prepare('SELECT 1').first();
      results.push({ name: 'D1 Database', category: 'Infrastructure', status: 'pass', detail: 'Connected', duration: Date.now() - d1Start });
    } else {
      results.push({ name: 'D1 Database', category: 'Infrastructure', status: 'fail', detail: 'Not bound' });
    }
  } catch (e: any) {
    results.push({ name: 'D1 Database', category: 'Infrastructure', status: 'fail', detail: e.message, duration: Date.now() - d1Start });
  }

  // KV
  const kvStart = Date.now();
  try {
    if (kv) {
      const testKey = '__health_check_test__';
      await kv.put(testKey, 'ok', { expirationTtl: 60 });
      const val = await kv.get(testKey);
      results.push({ name: 'KV Namespace', category: 'Infrastructure', status: val === 'ok' ? 'pass' : 'warn', detail: val === 'ok' ? 'Read/Write OK' : 'Write succeeded but read mismatch', duration: Date.now() - kvStart });
    } else {
      results.push({ name: 'KV Namespace', category: 'Infrastructure', status: 'fail', detail: 'Not bound' });
    }
  } catch (e: any) {
    results.push({ name: 'KV Namespace', category: 'Infrastructure', status: 'fail', detail: e.message, duration: Date.now() - kvStart });
  }

  // R2
  const r2Start = Date.now();
  try {
    if (r2) {
      await r2.list({ limit: 1 });
      results.push({ name: 'R2 Bucket', category: 'Infrastructure', status: 'pass', detail: 'List OK', duration: Date.now() - r2Start });
    } else {
      results.push({ name: 'R2 Bucket', category: 'Infrastructure', status: 'warn', detail: 'Not bound (optional)' });
    }
  } catch (e: any) {
    results.push({ name: 'R2 Bucket', category: 'Infrastructure', status: 'fail', detail: e.message, duration: Date.now() - r2Start });
  }

  // ── Environment Variables ──
  for (const key of ENV_KEYS) {
    const val = env[key] || (import.meta as any).env?.[key];
    results.push({
      name: key,
      category: 'Environment',
      status: val ? 'pass' : 'warn',
      detail: val ? `Set (${val.length} chars)` : 'Not set',
    });
  }

  // ── Data Integrity ──
  if (db) {
    try {
      const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
      const existingTables = (tables.results || []).map((r: any) => r.name);

      for (const table of REQUIRED_TABLES) {
        if (existingTables.includes(table)) {
          try {
            const count = await db.prepare(`SELECT COUNT(*) as c FROM ${table}`).first<{ c: number }>();
            results.push({ name: `Table: ${table}`, category: 'Data', status: 'pass', detail: `${count?.c ?? 0} rows` });
          } catch (e: any) {
            results.push({ name: `Table: ${table}`, category: 'Data', status: 'fail', detail: e.message });
          }
        } else {
          results.push({ name: `Table: ${table}`, category: 'Data', status: 'fail', detail: 'Table missing' });
        }
      }
    } catch (e: any) {
      results.push({ name: 'Table Check', category: 'Data', status: 'fail', detail: e.message });
    }
  }

  // ── External Services ──
  // Claude API
  const claudeKey = env.ANTHROPIC_API_KEY || (import.meta as any).env?.ANTHROPIC_API_KEY;
  if (claudeKey) {
    const s = Date.now();
    try {
      const r = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01' },
      });
      results.push({ name: 'Claude API', category: 'External', status: r.ok ? 'pass' : 'warn', detail: r.ok ? 'Connected' : `Status ${r.status}`, duration: Date.now() - s });
    } catch (e: any) {
      results.push({ name: 'Claude API', category: 'External', status: 'fail', detail: e.message, duration: Date.now() - s });
    }
  } else {
    results.push({ name: 'Claude API', category: 'External', status: 'warn', detail: 'No API key' });
  }

  // GitHub API
  const ghToken = env.GITHUB_TOKEN || (import.meta as any).env?.GITHUB_TOKEN;
  const ghRepo = env.GITHUB_REPO || (import.meta as any).env?.GITHUB_REPO;
  if (ghToken && ghRepo) {
    const s = Date.now();
    try {
      const r = await fetch(`https://api.github.com/repos/${ghRepo}`, {
        headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github+json' },
      });
      results.push({ name: 'GitHub API', category: 'External', status: r.ok ? 'pass' : 'warn', detail: r.ok ? 'Connected' : `Status ${r.status}`, duration: Date.now() - s });
    } catch (e: any) {
      results.push({ name: 'GitHub API', category: 'External', status: 'fail', detail: e.message, duration: Date.now() - s });
    }
  } else {
    results.push({ name: 'GitHub API', category: 'External', status: 'warn', detail: 'Token or repo not set' });
  }

  // Resend API
  const resendKey = env.RESEND_API_KEY || (import.meta as any).env?.RESEND_API_KEY;
  if (resendKey) {
    const s = Date.now();
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${resendKey}` },
      });
      results.push({ name: 'Resend API', category: 'External', status: r.ok ? 'pass' : 'warn', detail: r.ok ? 'Connected' : `Status ${r.status}`, duration: Date.now() - s });
    } catch (e: any) {
      results.push({ name: 'Resend API', category: 'External', status: 'fail', detail: e.message, duration: Date.now() - s });
    }
  } else {
    results.push({ name: 'Resend API', category: 'External', status: 'warn', detail: 'No API key' });
  }

  // ── Summary ──
  const passCount = results.filter(r => r.status === 'pass').length;
  const warnCount = results.filter(r => r.status === 'warn').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const overallStatus = failCount > 0 ? 'issues' : warnCount > 0 ? 'warning' : 'healthy';

  const report = {
    status: overallStatus,
    checkedAt: new Date().toISOString(),
    duration: Date.now() - start,
    summary: { pass: passCount, warn: warnCount, fail: failCount, total: results.length },
    results,
  };

  // Save to KV
  if (kv) {
    try {
      await kv.put('last-health-check', JSON.stringify({ status: overallStatus, checkedAt: report.checkedAt }), { expirationTtl: 86400 });
      await kv.put('last-health-report', JSON.stringify(report), { expirationTtl: 86400 });
    } catch {}
  }

  // Log activity
  if (db) {
    await logActivity(db, { type: 'health_check', detail: `Health check: ${passCount} pass, ${warnCount} warn, ${failCount} fail` });
  }

  return new Response(JSON.stringify(report), { headers: { 'Content-Type': 'application/json' } });
};

// GET returns last saved report
export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const kv = runtime?.env?.SESSION as KVNamespace | undefined;

  if (kv) {
    try {
      const report = await kv.get('last-health-report');
      if (report) {
        return new Response(report, { headers: { 'Content-Type': 'application/json' } });
      }
    } catch {}
  }

  return new Response(JSON.stringify({ status: null, message: 'No health check has been run yet.' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
