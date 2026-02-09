// Platform-specific SNS post formatter
// Generates optimized content for each social media platform

const SITE_URL = 'https://britzmedi.com';

interface FormatInput {
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  featuredImage?: string | null;
  doctorName?: string | null;
  contentType?: 'blog' | 'news';
}

function buildUrl(input: FormatInput): string {
  const base = input.contentType === 'news' ? '/news/' : '/blog/';
  return `${SITE_URL}${base}${input.slug}`;
}

function pickHashtags(category: string, count: number): string[] {
  const base = ['#BRITZMEDI', '#MedicalDevices'];
  const byCategory: Record<string, string[]> = {
    'rf-technology': ['#RF', '#RadioFrequency', '#SkinTightening', '#AestheticMedicine', '#BodyContouring'],
    'medical-devices': ['#MedTech', '#AestheticMedicine', '#HealthTech', '#FDA', '#Innovation'],
    'aesthetic-medicine': ['#AestheticMedicine', '#BeautyTech', '#SkinCare', '#AntiAging', '#Dermatology'],
    event: ['#MedicalEvent', '#HealthcareExpo', '#MedTech', '#Conference', '#Networking'],
    product: ['#ProductLaunch', '#Innovation', '#MedTech', '#HealthTech', '#NewProduct'],
    partnership: ['#Partnership', '#GlobalExpansion', '#Distribution', '#B2B', '#HealthTech'],
    award: ['#Achievement', '#FDA', '#QualityManagement', '#ISO13485', '#Certification'],
    media: ['#MediaCoverage', '#Press', '#KoreanMedTech', '#Innovation', '#HealthTech'],
  };
  const pool = [...base, ...(byCategory[category] || byCategory['medical-devices'])];
  return [...new Set(pool)].slice(0, count);
}

export function generateTwitterPost(input: FormatInput): string {
  const url = buildUrl(input);
  const hashtags = pickHashtags(input.category, 3).join(' ');
  const reserved = 2 + hashtags.length + 1 + url.length;
  const maxText = 280 - reserved;

  let text = input.excerpt || input.title;
  if (text.length > maxText - 1) {
    text = text.slice(0, maxText - 4) + '...';
  }

  return `${text}\n\n${hashtags}\n${url}`;
}

export function generateLinkedInPost(input: FormatInput): string {
  const url = buildUrl(input);
  const hashtags = pickHashtags(input.category, 5).join(' ');

  const lines: string[] = [];

  // Title with emoji
  const emoji = input.contentType === 'news' ? '📰' : '🔬';
  lines.push(`${emoji} ${input.title}`, '');

  // Body paragraphs
  if (input.excerpt) {
    lines.push(input.excerpt, '');
  }

  // Key points
  if (input.doctorName) {
    lines.push(`🏆 Expert insight by ${input.doctorName}`, '');
  }

  // Category context
  const categoryLabels: Record<string, string> = {
    event: '📊 Join us at this upcoming event',
    product: '🔬 Discover our latest innovation',
    partnership: '🤝 Expanding our global reach',
    award: '🏆 A milestone in quality and compliance',
    media: '📰 Featured in the press',
  };
  if (categoryLabels[input.category]) {
    lines.push(categoryLabels[input.category], '');
  }

  // CTA
  lines.push(`👉 Read more: ${url}`, '');

  // Hashtags
  lines.push(hashtags);

  return lines.join('\n');
}

export function generateInstagramPost(input: FormatInput): string {
  const hashtags = pickHashtags(input.category, 18);

  const lines: string[] = [];

  // Storytelling opener
  lines.push(`✨ ${input.title}`, '');

  // Body
  if (input.excerpt) {
    lines.push(input.excerpt, '');
  }

  if (input.doctorName) {
    lines.push(`💡 Expert insight by ${input.doctorName}`, '');
  }

  // CTA
  lines.push('📲 Link in bio for full details', '');

  // Separator
  lines.push('·', '·', '·', '');

  // Hashtags block
  lines.push(hashtags.join(' '));

  return lines.join('\n');
}

export function generateAllPreviews(input: FormatInput): Record<string, string> {
  return {
    twitter: generateTwitterPost(input),
    linkedin: generateLinkedInPost(input),
    instagram: generateInstagramPost(input),
  };
}
