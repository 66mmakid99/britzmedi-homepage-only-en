import type { APIRoute } from 'astro';
import { logActivity } from '../../../lib/activity-log';

export const prerender = false;

const LOGIN_SECURITY = {
  maxAttempts: 5,
  lockoutTtl: 900, // 15 minutes in seconds (KV expirationTtl)
  sessionMaxAge: 60 * 60 * 24, // 24 hours in seconds
};

// Helper to get environment variable from Cloudflare runtime or import.meta.env
function getEnv(locals: any, key: string): string | undefined {
  const runtimeEnv = locals?.runtime?.env;
  if (runtimeEnv && runtimeEnv[key]) {
    return runtimeEnv[key];
  }
  return (import.meta.env as any)[key];
}

// Get KV SESSION namespace
function getSessionKV(locals: any): KVNamespace | undefined {
  return locals?.runtime?.env?.SESSION;
}

// Timing-safe string comparison using HMAC
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode('timing-safe-comparison-key');
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigA = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(a)));
  const sigB = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(b)));

  if (sigA.length !== sigB.length) return false;
  let result = 0;
  for (let i = 0; i < sigA.length; i++) {
    result |= sigA[i] ^ sigB[i];
  }
  return result === 0;
}

// Brute-force lockout tracking in KV (shared across isolates).
// Key: lockout:{ip}, value: JSON { count, firstAt }, TTL 15 minutes.
// Fail-open on KV errors so admins are never locked out by a KV blip.
interface LockoutRecord {
  count: number;
  firstAt: number;
}

async function readLockoutRecord(kv: KVNamespace | undefined, ip: string): Promise<LockoutRecord | null> {
  if (!kv) return null;
  try {
    const raw = (await kv.get(`lockout:${ip}`)) as string | null;
    if (!raw) return null;
    const record = JSON.parse(raw) as LockoutRecord;
    if (typeof record?.count !== 'number') return null;
    return record;
  } catch (err) {
    console.error('[Admin Auth] KV lockout lookup failed (fail-open):', err);
    return null;
  }
}

// Check login attempt limit
async function checkLoginAttempts(kv: KVNamespace | undefined, ip: string): Promise<{ allowed: boolean; remainingMs?: number }> {
  const record = await readLockoutRecord(kv, ip);
  if (!record || record.count < LOGIN_SECURITY.maxAttempts) {
    return { allowed: true };
  }
  // Locked. The KV key expires lockoutTtl seconds after the last failed attempt;
  // estimate remaining time from firstAt, clamped to [1min, lockoutTtl].
  const elapsed = Date.now() - (record.firstAt || Date.now());
  const remainingMs = Math.min(
    Math.max(LOGIN_SECURITY.lockoutTtl * 1000 - elapsed, 60 * 1000),
    LOGIN_SECURITY.lockoutTtl * 1000,
  );
  return { allowed: false, remainingMs };
}

// Record a failed attempt; returns the updated failure count (0 = KV unavailable, fail-open)
async function recordFailedAttempt(kv: KVNamespace | undefined, ip: string): Promise<number> {
  if (!kv) return 0;
  try {
    const existing = await readLockoutRecord(kv, ip);
    const record: LockoutRecord = {
      count: (existing?.count || 0) + 1,
      firstAt: existing?.firstAt || Date.now(),
    };
    await kv.put(`lockout:${ip}`, JSON.stringify(record), {
      expirationTtl: LOGIN_SECURITY.lockoutTtl,
    });
    if (record.count >= LOGIN_SECURITY.maxAttempts) {
      console.log(`[Admin Auth] IP ${ip} locked out for 15 minutes after ${record.count} failed attempts`);
    }
    return record.count;
  } catch (err) {
    console.error('[Admin Auth] KV lockout write failed (fail-open):', err);
    return 0;
  }
}

// Clear attempts on successful login
async function clearAttempts(kv: KVNamespace | undefined, ip: string): Promise<void> {
  if (!kv) return;
  try {
    await kv.delete(`lockout:${ip}`);
  } catch (err) {
    console.error('[Admin Auth] KV lockout clear failed:', err);
  }
}

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const clientIP = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';

  const lockoutKV = getSessionKV(locals);

  // Check login attempt limit
  const attemptCheck = await checkLoginAttempts(lockoutKV, clientIP);
  if (!attemptCheck.allowed) {
    const minutes = Math.ceil((attemptCheck.remainingMs || 0) / 60000);
    console.log(`[Admin Auth] Blocked login attempt from locked IP: ${clientIP}`);
    return redirect(`/admin/login?error=locked&minutes=${minutes}`);
  }

  const formData = await request.formData();
  const password = formData.get('password')?.toString();

  if (!password) {
    return redirect('/admin/login?error=required');
  }

  // Get admin password from environment
  const adminPassword = getEnv(locals, 'ADMIN_PASSWORD');

  if (!adminPassword) {
    console.error('[Admin Auth] ADMIN_PASSWORD not configured');
    return redirect('/admin/login?error=invalid');
  }

  // Timing-safe password validation
  const passwordValid = await timingSafeEqual(password, adminPassword);
  if (!passwordValid) {
    const failures = await recordFailedAttempt(lockoutKV, clientIP);
    if (failures >= LOGIN_SECURITY.maxAttempts) {
      return redirect(`/admin/login?error=locked&minutes=${Math.ceil(LOGIN_SECURITY.lockoutTtl / 60)}`);
    }
    const remaining = LOGIN_SECURITY.maxAttempts - failures;
    console.log(`[Admin Auth] Invalid password from ${clientIP} (${remaining} attempts remaining)`);
    return redirect(`/admin/login?error=invalid${failures > 0 && remaining <= 2 ? `&remaining=${remaining}` : ''}`);
  }

  // Password correct - clear failed attempts
  await clearAttempts(lockoutKV, clientIP);

  // Generate random session token
  const sessionToken = crypto.randomUUID();

  // Try to store session in KV for distributed validation
  const sessionKV = getSessionKV(locals);
  if (sessionKV) {
    try {
      await sessionKV.put(`session:${sessionToken}`, JSON.stringify({
        ip: clientIP,
        createdAt: Date.now(),
        userAgent: request.headers.get('user-agent') || 'unknown',
      }), {
        expirationTtl: LOGIN_SECURITY.sessionMaxAge,
      });
    } catch (err) {
      console.error('[Admin Auth] Failed to store session in KV:', err);
      // Static-token fallback is dev-only. In production the middleware
      // rejects the static secret, so issuing it here would only cause a
      // redirect loop — fail closed and surface the KV outage instead.
      if (import.meta.env.DEV) {
        const sessionSecret = getEnv(locals, 'ADMIN_SESSION_SECRET');
        if (sessionSecret) {
          cookies.set('admin_session', sessionSecret, {
            path: '/',
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
            maxAge: LOGIN_SECURITY.sessionMaxAge,
          });
          console.log('[Admin Auth] Login successful (dev fallback static token)');
          return redirect('/admin');
        }
      }
      return redirect('/admin/login?error=session_unavailable');
    }
  } else {
    // Dev mode - no KV available, use static token fallback
    const sessionSecret = getEnv(locals, 'ADMIN_SESSION_SECRET');
    if (!sessionSecret) {
      console.error('[Admin Auth] No SESSION KV and no ADMIN_SESSION_SECRET configured');
      return redirect('/admin/login?error=invalid');
    }
    cookies.set('admin_session', sessionSecret, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: LOGIN_SECURITY.sessionMaxAge,
    });
    console.log('[Admin Auth] Login successful (dev mode, static token)');
    return redirect('/admin');
  }

  // Set session cookie with random token
  cookies.set('admin_session', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: LOGIN_SECURITY.sessionMaxAge,
  });

  console.log('[Admin Auth] Login successful (KV session)');
  const loginDb = locals?.runtime?.env?.DB;
  if (loginDb) logActivity(loginDb, { type: 'admin_login', detail: 'Admin login', ip: clientIP }).catch(() => {});
  return redirect('/admin');
};
