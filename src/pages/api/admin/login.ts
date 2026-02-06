import type { APIRoute } from 'astro';

export const prerender = false;

// Login attempt tracking (in-memory, per-worker)
const loginAttempts = new Map<string, {
  failures: number;
  lockedUntil: number;
}>();

const LOGIN_SECURITY = {
  maxAttempts: 5,
  lockoutMs: 15 * 60 * 1000, // 15 minutes
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

// Check login attempt limit
function checkLoginAttempts(ip: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) return { allowed: true };

  // Check if locked out
  if (record.lockedUntil > now) {
    return { allowed: false, remainingMs: record.lockedUntil - now };
  }

  // Reset if lockout expired
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

// Record a failed attempt
function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { failures: 0, lockedUntil: 0 };
  record.failures++;

  if (record.failures >= LOGIN_SECURITY.maxAttempts) {
    record.lockedUntil = now + LOGIN_SECURITY.lockoutMs;
    console.log(`[Admin Auth] IP ${ip} locked out for 15 minutes after ${record.failures} failed attempts`);
  }

  loginAttempts.set(ip, record);
}

// Clear attempts on successful login
function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const clientIP = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';

  // Check login attempt limit
  const attemptCheck = checkLoginAttempts(clientIP);
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
    recordFailedAttempt(clientIP);
    const record = loginAttempts.get(clientIP);
    const remaining = LOGIN_SECURITY.maxAttempts - (record?.failures || 0);
    console.log(`[Admin Auth] Invalid password from ${clientIP} (${remaining} attempts remaining)`);
    return redirect(`/admin/login?error=invalid${remaining <= 2 ? `&remaining=${remaining}` : ''}`);
  }

  // Password correct - clear failed attempts
  clearAttempts(clientIP);

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
      // Fall back to static token
      const sessionSecret = getEnv(locals, 'ADMIN_SESSION_SECRET');
      if (sessionSecret) {
        cookies.set('admin_session', sessionSecret, {
          path: '/',
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: 'lax',
          maxAge: LOGIN_SECURITY.sessionMaxAge,
        });
        console.log('[Admin Auth] Login successful (fallback static token)');
        return redirect('/admin/leads');
      }
      return redirect('/admin/login?error=invalid');
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
    return redirect('/admin/leads');
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
  return redirect('/admin/leads');
};
