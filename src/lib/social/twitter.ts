// Twitter/X API v2 Client — OAuth 1.0a with Web Crypto API (Cloudflare Workers compatible)

interface TwitterEnv {
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_TOKEN_SECRET: string;
}

interface TwitterPostResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    nonce += chars[byte % chars.length];
  }
  return nonce;
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function generateOAuthHeader(
  method: string,
  url: string,
  env: TwitterEnv,
  body?: Record<string, string>,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: env.TWITTER_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: env.TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  // Combine OAuth params with body params for signature base
  const allParams: Record<string, string> = { ...oauthParams };
  if (body) {
    for (const [k, v] of Object.entries(body)) {
      allParams[k] = v;
    }
  }

  // Sort parameters and build parameter string
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join('&');

  // Build signature base string
  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;

  // Build signing key
  const signingKey = `${percentEncode(env.TWITTER_API_SECRET)}&${percentEncode(env.TWITTER_ACCESS_TOKEN_SECRET)}`;

  // Generate HMAC-SHA1 signature
  const signature = await hmacSha1(signingKey, signatureBase);
  oauthParams['oauth_signature'] = signature;

  // Build Authorization header
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

export async function twitterPost(text: string, env: TwitterEnv): Promise<TwitterPostResult> {
  const url = 'https://api.twitter.com/2/tweets';

  const authHeader = await generateOAuthHeader('POST', url, env);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Twitter] API error ${response.status}:`, errorBody);
    return {
      success: false,
      error: `Twitter API error ${response.status}: ${errorBody}`,
    };
  }

  const data = await response.json() as { data?: { id?: string } };
  return {
    success: true,
    tweetId: data.data?.id,
  };
}

export async function verifyCredentials(env: TwitterEnv): Promise<{ success: boolean; user?: TwitterUser; error?: string }> {
  const url = 'https://api.twitter.com/2/users/me';

  const authHeader = await generateOAuthHeader('GET', url, env);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      success: false,
      error: `Twitter API error ${response.status}: ${errorBody}`,
    };
  }

  const data = await response.json() as { data?: TwitterUser };
  return {
    success: true,
    user: data.data,
  };
}
