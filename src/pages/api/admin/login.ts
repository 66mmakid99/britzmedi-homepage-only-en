import type { APIRoute } from 'astro';

// Helper to get environment variable from Cloudflare runtime or import.meta.env
function getEnv(locals: any, key: string): string | undefined {
  const runtimeEnv = locals?.runtime?.env;
  if (runtimeEnv && runtimeEnv[key]) {
    return runtimeEnv[key];
  }
  return (import.meta.env as any)[key];
}

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
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

  // Validate password
  if (password !== adminPassword) {
    console.log('[Admin Auth] Invalid password attempt');
    return redirect('/admin/login?error=invalid');
  }

  // Generate session token (in production, use a proper random token)
  const sessionSecret = getEnv(locals, 'ADMIN_SESSION_SECRET');

  if (!sessionSecret) {
    console.error('[Admin Auth] ADMIN_SESSION_SECRET not configured');
    return redirect('/admin/login?error=invalid');
  }

  // Set session cookie
  cookies.set('admin_session', sessionSecret, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  console.log('[Admin Auth] Login successful');
  return redirect('/admin/leads');
};
