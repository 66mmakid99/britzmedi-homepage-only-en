import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Clear session cookie
  cookies.delete('admin_session', {
    path: '/',
  });

  console.log('[Admin Auth] Logout successful');
  return redirect('/admin/login');
};

// Also support GET for simple logout links
export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('admin_session', {
    path: '/',
  });

  console.log('[Admin Auth] Logout successful');
  return redirect('/admin/login');
};
