import type { MiddlewareHandler } from 'astro';

// Admin authentication middleware for Keystatic
export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);

  // Only protect /keystatic routes
  if (!url.pathname.startsWith('/keystatic')) {
    return next();
  }

  // Skip auth in development mode
  if (import.meta.env.DEV) {
    return next();
  }

  // Get admin credentials from environment variables
  const adminUser = import.meta.env.ADMIN_USERNAME || 'admin';
  const adminPass = import.meta.env.ADMIN_PASSWORD;

  // If no password is set, deny access in production
  if (!adminPass) {
    return new Response('Admin access not configured', { status: 503 });
  }

  // Check for Basic Auth header
  const authHeader = context.request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="BRITZMEDI Admin"',
      },
    });
  }

  // Decode and verify credentials
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
};
