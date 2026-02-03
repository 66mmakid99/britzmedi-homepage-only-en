import type { MiddlewareHandler } from 'astro';

// Admin authentication middleware
export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Public routes - no auth needed
  const publicRoutes = ['/admin/login', '/api/admin/login'];
  if (publicRoutes.some(route => pathname === route)) {
    return next();
  }

  // Admin routes - use cookie session auth
  if (pathname.startsWith('/admin')) {
    // Skip auth in development mode (optional - remove this block to require auth in dev)
    if (import.meta.env.DEV) {
      // Still check auth in dev for testing
      const sessionToken = context.cookies.get('admin_session')?.value;
      const validToken = import.meta.env.ADMIN_SESSION_SECRET;

      if (!sessionToken || sessionToken !== validToken) {
        return context.redirect('/admin/login');
      }
    } else {
      // Production: require valid session
      const sessionToken = context.cookies.get('admin_session')?.value;
      const validToken = import.meta.env.ADMIN_SESSION_SECRET;

      if (!validToken) {
        console.error('[Admin Auth] ADMIN_SESSION_SECRET not configured');
        return new Response('Admin access not configured', { status: 503 });
      }

      if (!sessionToken || sessionToken !== validToken) {
        return context.redirect('/admin/login?error=expired');
      }
    }

    return next();
  }

  // Keystatic routes - use Basic Auth
  if (pathname.startsWith('/keystatic') || pathname.startsWith('/api/keystatic')) {
    // Skip auth in development mode
    if (import.meta.env.DEV) {
      return next();
    }

    const adminUser = import.meta.env.ADMIN_USERNAME || 'admin';
    const adminPass = import.meta.env.ADMIN_PASSWORD;

    if (!adminPass) {
      return new Response('Admin access not configured', { status: 503 });
    }

    const authHeader = context.request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="BRITZMEDI Admin"',
        },
      });
    }

    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = atob(base64Credentials);
      const [username, password] = credentials.split(':');

      if (username === adminUser && password === adminPass) {
        return next();
      }
    } catch {
      // Invalid base64 encoding
    }

    return new Response('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="BRITZMEDI Admin"',
      },
    });
  }

  // All other routes - no auth needed
  return next();
};
