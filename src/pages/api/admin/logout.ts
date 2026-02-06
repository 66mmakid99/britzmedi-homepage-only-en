import type { APIRoute } from 'astro';

export const prerender = false;

// Get KV SESSION namespace
function getSessionKV(locals: any): KVNamespace | undefined {
  return locals?.runtime?.env?.SESSION;
}

async function handleLogout(cookies: any, locals: any, redirect: any) {
  const sessionToken = cookies.get('admin_session')?.value;

  // Delete session from KV if available
  if (sessionToken) {
    const sessionKV = getSessionKV(locals);
    if (sessionKV) {
      try {
        await sessionKV.delete(`session:${sessionToken}`);
      } catch (err) {
        console.error('[Admin Auth] Failed to delete KV session:', err);
      }
    }
  }

  // Clear session cookie
  cookies.delete('admin_session', { path: '/' });

  console.log('[Admin Auth] Logout successful');
  return redirect('/admin/login');
}

export const POST: APIRoute = async ({ cookies, redirect, locals }) => {
  return handleLogout(cookies, locals, redirect);
};

// Also support GET for simple logout links
export const GET: APIRoute = async ({ cookies, redirect, locals }) => {
  return handleLogout(cookies, locals, redirect);
};
