import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;

  const envKeys = [
    'ADMIN_PASSWORD',
    'ADMIN_USERNAME',
    'ADMIN_SESSION_SECRET',
    'KEYSTATIC_GITHUB_CLIENT_ID',
    'KEYSTATIC_SECRET',
  ];

  const result: Record<string, string> = {};

  for (const key of envKeys) {
    // Check runtime env
    const runtimeValue = runtime?.env?.[key];
    // Check import.meta.env
    const metaValue = (import.meta.env as any)[key];

    result[key] = runtimeValue ? '✅ runtime.env' : metaValue ? '✅ import.meta.env' : '❌ NOT FOUND';
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
};
