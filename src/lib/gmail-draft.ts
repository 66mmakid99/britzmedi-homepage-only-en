interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface DraftEmail {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
}

async function getAccessToken(creds: GmailCredentials): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${body}`);
  }

  const data = await response.json() as any;
  return data.access_token;
}

// RFC 2047 B-encode a header value when it contains non-ASCII, to prevent mojibake
// in email clients (raw UTF-8 bytes in headers get misread as Latin-1, e.g. "–" → "â€“").
function encodeMimeHeader(value: string): string {
  if (!/[^\x00-\x7F]/.test(value)) return value;
  const bytes = new TextEncoder().encode(value);
  const b64 = btoa(Array.from(bytes, (b) => String.fromCodePoint(b)).join(''));
  return `=?UTF-8?B?${b64}?=`;
}

function buildRawEmail(draft: DraftEmail): string {
  const message = [
    `From: sh.lee@britzmedi.com`,
    `To: ${encodeMimeHeader(draft.toName)} <${draft.to}>`,
    `Subject: ${encodeMimeHeader(draft.subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    '',
    draft.htmlBody,
  ].join('\r\n');

  const bytes = new TextEncoder().encode(message);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join('');
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createGmailDraft(
  creds: GmailCredentials,
  draft: DraftEmail,
): Promise<string> {
  const accessToken = await getAccessToken(creds);
  const raw = buildRawEmail(draft);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw } }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail draft failed: ${response.status} ${error}`);
  }

  const result = await response.json() as any;
  return result.id;
}
