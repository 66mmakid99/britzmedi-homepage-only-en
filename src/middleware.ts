import type { MiddlewareHandler } from 'astro';

// Helper to get environment variable from Cloudflare runtime or import.meta.env
function getEnv(context: any, key: string): string | undefined {
  // Try Cloudflare runtime env first
  const runtimeEnv = context.locals?.runtime?.env;
  if (runtimeEnv && runtimeEnv[key]) {
    return runtimeEnv[key];
  }
  // Fallback to import.meta.env for local dev
  return (import.meta.env as any)[key];
}

// Get KV SESSION namespace
function getSessionKV(context: any): KVNamespace | undefined {
  return context.locals?.runtime?.env?.SESSION;
}

// Constant-time string comparison via HMAC (same approach as api/admin/login.ts).
// Direct === comparison leaks length/prefix timing information.
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode('timing-safe-comparison-key');
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const macA = await crypto.subtle.sign('HMAC', key, encoder.encode(a));
  const macB = await crypto.subtle.sign('HMAC', key, encoder.encode(b));
  const viewA = new Uint8Array(macA);
  const viewB = new Uint8Array(macB);
  if (viewA.length !== viewB.length) return false;
  let diff = 0;
  for (let i = 0; i < viewA.length; i++) diff |= viewA[i] ^ viewB[i];
  return diff === 0;
}

// Cron pipeline auth: 'Authorization: Bearer {CRON_SECRET}' is accepted as admin
// auth for /api/blog/** so the internal orchestrator (cron blog pipeline) can
// drive job steps in production, where the static admin_session cookie fallback
// is dev-only. Compared timing-safe against env CRON_SECRET.
async function isValidCronBearer(context: any): Promise<boolean> {
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice('Bearer '.length);
  const cronSecret = getEnv(context, 'CRON_SECRET');
  if (!cronSecret || !token) return false;
  return await timingSafeEqual(token, cronSecret);
}

// Validate session token against KV or static secret
async function isValidSession(context: any, sessionToken: string): Promise<boolean> {
  // Try KV first (production with random tokens)
  const sessionKV = getSessionKV(context);
  if (sessionKV) {
    try {
      const sessionData = await sessionKV.get(`session:${sessionToken}`);
      if (sessionData) return true;
    } catch (err) {
      console.error('[Admin Auth] KV session lookup failed:', err);
    }
  }

  // Fallback: static secret is accepted ONLY in local dev.
  // In production a static env secret must never act as a permanent,
  // non-expiring master session token — sessions must be KV-backed.
  if (import.meta.env.DEV) {
    const validToken = getEnv(context, 'ADMIN_SESSION_SECRET');
    if (validToken && sessionToken === validToken) {
      return true;
    }
  }

  return false;
}

// Non-admin API routes that still require an admin session.
// These live outside /api/admin/ but expose sensitive data, AI cost, or publishing.
// Method-aware so that legitimately public actions (lead intake, subscribe, blog read) stay open.
function requiresAdminAuth(pathname: string, method: string): boolean {
  // Leads: list (GET) / stats / single-record ops are admin-only.
  // POST /api/leads is the public lead-intake form and must stay open.
  if (pathname === '/api/leads' && method !== 'POST') return true;
  if (pathname === '/api/leads/stats') return true;
  if (/^\/api\/leads\/[^/]+$/.test(pathname)) return true; // /api/leads/{id} GET/PUT/DELETE

  // Subscribers: list/export/notify are admin. subscribe/confirm/unsubscribe stay public.
  if (pathname === '/api/subscribers/list') return true;
  if (pathname === '/api/subscribers/export') return true;
  if (pathname === '/api/subscribers/notify') return true;

  // Resource download analytics expose lead/visitor data — admin only.
  if (pathname === '/api/resources/stats') return true;

  // Translate + YouTube channel fetch are admin tooling (AI / external cost).
  if (pathname === '/api/translate') return true;
  if (pathname === '/api/youtube/channel') return true;

  // Blog: management endpoints (queue, upload, approve, publish, generation steps,
  // and PUT/DELETE on posts) are admin. Public reads stay open.
  if (pathname.startsWith('/api/blog/')) {
    if (pathname.startsWith('/api/blog/images/')) return false; // public image serving
    if (pathname === '/api/blog/approve') return false; // email approval link, authenticated by its own approval_token
    if (pathname === '/api/blog/posts' && method === 'GET') return false; // public list
    if (/^\/api\/blog\/posts\/[^/]+$/.test(pathname) && method === 'GET') return false; // public single post
    return true; // everything else under /api/blog/ requires auth
  }

  return false;
}

// Security headers for SSR responses. public/_headers only covers static assets
// on Cloudflare Pages, so SSR pages/APIs must set these here (values mirror
// public/_headers). CSP intentionally omitted — too risky without testing.
function applySecurityHeaders(response: Response): Response {
  try {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return response;
  } catch {
    // Immutable headers (e.g. some passthrough responses) — clone and retry.
    const cloned = new Response(response.body, response);
    cloned.headers.set('X-Frame-Options', 'DENY');
    cloned.headers.set('X-Content-Type-Options', 'nosniff');
    cloned.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    cloned.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    return cloned;
  }
}

// Admin authentication middleware
export const onRequest: MiddlewareHandler = async (context, next) => {
  const response = await handleRequest(context, next);
  return applySecurityHeaders(response);
};

const handleRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Korean default for visitors from Korea (2026-06-10, co.kr consolidation).
  // Only SSR routes reach this middleware (prerendered pages are served as static
  // assets), so the redirect applies to the two SSR public entry points.
  // Respect an explicit language choice (lang_pref cookie set by the switcher)
  // and skip crawlers so SEO sees the canonical EN root with hreflang alternates.
  if (
    context.request.method === 'GET' &&
    (pathname === '/' || pathname === '/resources' || pathname === '/resources/') &&
    context.request.headers.get('CF-IPCountry') === 'KR' &&
    !context.cookies.get('lang_pref')?.value &&
    !/bot|crawler|spider|slurp|bingpreview|facebookexternalhit/i.test(context.request.headers.get('User-Agent') || '')
  ) {
    const target = pathname === '/' ? '/ko/' : '/ko/resources/';
    return new Response(null, {
      status: 302,
      headers: { Location: target, 'Cache-Control': 'no-store', Vary: 'Cookie' },
    });
  }

  // Public routes - no auth needed
  const publicRoutes = ['/admin/login', '/api/admin/login'];
  if (publicRoutes.some(route => pathname === route)) {
    return next();
  }

  // Admin page routes - use cookie session auth
  if (pathname.startsWith('/admin')) {
    const sessionToken = context.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return context.redirect('/admin/login?error=expired');
    }

    const valid = await isValidSession(context, sessionToken);
    if (!valid) {
      context.cookies.delete('admin_session', { path: '/' });
      return context.redirect('/admin/login?error=expired');
    }

    return next();
  }

  // Admin API routes - cookie auth (returns 401 JSON instead of redirect)
  if (pathname.startsWith('/api/admin/')) {
    const sessionToken = context.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const valid = await isValidSession(context, sessionToken);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  }

  // Protected non-admin API routes - sensitive data / AI cost / publishing.
  // Same cookie-session check as /api/admin/, method-aware allowlist above.
  if (pathname.startsWith('/api/') && requiresAdminAuth(pathname, context.request.method)) {
    // Blog pipeline routes additionally accept the cron Bearer token so the
    // production cron orchestrator (lib/youtube-to-blog/orchestrator.ts) can
    // run internal step fetches without a KV-backed cookie session.
    if (pathname.startsWith('/api/blog/') && (await isValidCronBearer(context))) {
      return next();
    }

    const sessionToken = context.cookies.get('admin_session')?.value;

    if (!sessionToken || !(await isValidSession(context, sessionToken))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return next();
  }

  // Keystatic routes - local mode only (development)
  if (pathname.startsWith('/keystatic') || pathname.startsWith('/api/keystatic')) {
    if (import.meta.env.DEV) return next();
    return context.redirect('/admin/login');
  }

  // All other routes - no auth needed
  return next();
};
