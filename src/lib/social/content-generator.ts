import type { SocialChannel, PostToSocialInput } from './types';

const SITE_URL = 'https://britzmedi.com';

function buildPostUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function generateTwitterContent(input: PostToSocialInput): string {
  const url = buildPostUrl(input.slug);
  const maxTextLen = 280 - url.length - 3;
  let text = input.title;
  if (text.length > maxTextLen) {
    text = text.slice(0, maxTextLen - 3) + '...';
  }
  return `${text}\n\n${url}`;
}

export function generateLinkedInContent(input: PostToSocialInput): string {
  const url = buildPostUrl(input.slug);
  const lines = [input.title, ''];
  if (input.excerpt) {
    lines.push(input.excerpt, '');
  }
  if (input.doctorName) {
    lines.push(`Expert insight by ${input.doctorName}`, '');
  }
  lines.push(`Read more: ${url}`, '', '#MedicalDevices #BRITZMEDI #HealthTech');
  return lines.join('\n');
}

export function generateFacebookContent(input: PostToSocialInput): string {
  const url = buildPostUrl(input.slug);
  const lines = [input.title, ''];
  if (input.excerpt) {
    lines.push(input.excerpt, '');
  }
  lines.push(url);
  return lines.join('\n');
}

export function generateContent(channel: SocialChannel, input: PostToSocialInput): string {
  switch (channel) {
    case 'twitter': return generateTwitterContent(input);
    case 'linkedin': return generateLinkedInContent(input);
    case 'facebook': return generateFacebookContent(input);
  }
}
