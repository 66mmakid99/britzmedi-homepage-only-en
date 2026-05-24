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
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.access_token;
}

function buildRawEmail(draft: DraftEmail): string {
  const boundary = '----=_Part_' + Date.now();
  const lines = [
    `From: sh.lee@britzmedi.com`,
    `To: ${draft.toName} <${draft.to}>`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(draft.subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    '',
    btoa(unescape(encodeURIComponent(draft.htmlBody))),
  ];

  const raw = lines.join('\r\n');
  return btoa(unescape(encodeURIComponent(raw)))
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
