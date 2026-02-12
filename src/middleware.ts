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

  // Keystatic routes - local mode only (development)
  if (pathname.startsWith('/keystatic') || pathname.startsWith('/api/keystatic')) {
    if (import.meta.env.DEV) return next();
    return context.redirect('/admin/login');
  }

  // All other routes - no auth needed
  return next();
};
