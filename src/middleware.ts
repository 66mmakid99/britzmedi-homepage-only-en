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

  // Fallback: check static secret (dev mode or KV unavailable)
  const validToken = getEnv(context, 'ADMIN_SESSION_SECRET');
  if (validToken && sessionToken === validToken) {
    return true;
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

  // Translate + YouTube channel fetch are admin tooling (AI / external cost).
  if (pathname === '/api/translate') return true;
  if (pathname === '/api/youtube/channel') return true;

  // Blog: management endpoints (queue, upload, approve, publish, generation steps,
  // and PUT/DELETE on posts) are admin. Public reads stay open.
  if (pathname.startsWith('/api/blog/')) {
    if (pathname.startsWith('/api/blog/images/')) return false; // public image serving
    if (pathname === '/api/blog/posts' && method === 'GET') return false; // public list
    if (/^\/api\/blog\/posts\/[^/]+$/.test(pathname) && method === 'GET') return false; // public single post
    return true; // everything else under /api/blog/ requires auth
  }

  return false;
}

// Admin authentication middleware
export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

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
