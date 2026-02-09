import type { SocialChannel, PostToSocialInput } from './types';

const SITE_URL = 'https://britzmedi.com';

function buildPostUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function generateTwitterContent(input: PostToSocialInput): string {
  const url = buildPostUrl(input.slug);
  const hashtags = '#RF #AestheticMedicine #MedicalDevices';
  // Reserve space for: \n\n + hashtags + \n + url
  const reserved = 2 + hashtags.length + 1 + url.length;
  const maxTextLen = 280 - reserved;

  // Use excerpt if available, otherwise title
  let text = input.excerpt || input.title;
  // Wrap in quotes for a summary feel
  if (text.length > maxTextLen - 2) {
    text = text.slice(0, maxTextLen - 5) + '..."';
  } else {
    text = `"${text}"`;
  }

  // If still too long, truncate
  if (text.length > maxTextLen) {
    text = text.slice(0, maxTextLen - 3) + '...';
  }

  return `${text}\n\n${hashtags}\n${url}`;
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

export function generateInstagramContent(input: PostToSocialInput): string {
  const url = buildPostUrl(input.slug);
  const lines = [input.title, ''];
  if (input.excerpt) {
    lines.push(input.excerpt, '');
  }
  if (input.doctorName) {
    lines.push(`Expert insight by ${input.doctorName}`, '');
  }
  lines.push(`Read more at britzmedi.com (link in bio)`, '');
  lines.push('#BRITZMEDI #MedicalDevices #AestheticMedicine #RF #HealthTech #MedTech');
  return lines.join('\n');
}

export function generateContent(channel: SocialChannel, input: PostToSocialInput): string {
  switch (channel) {
    case 'twitter': return generateTwitterContent(input);
    case 'linkedin': return generateLinkedInContent(input);
    case 'facebook': return generateFacebookContent(input);
    case 'instagram': return generateInstagramContent(input);
  }
}
