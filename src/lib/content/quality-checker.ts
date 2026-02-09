// Content quality checker - pure function, no API calls
// Scores blog posts on 10 criteria for editorial readiness

export interface QualityCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  points: number;
  maxPoints: number;
  detail: string;
}

export interface QualityResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  checks: QualityCheck[];
}

interface QualityInput {
  title?: string | null;
  meta_description?: string | null;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  keywords?: string | null; // JSON array string
  category?: string | null;
  tags?: string | null; // JSON array string
  doctor_name?: string | null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  const stripped = stripHtml(text);
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(w => w.length > 0).length;
}

function countHeadings(html: string): number {
  const matches = html.match(/<h[23][^>]*>/gi);
  return matches ? matches.length : 0;
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Might be comma-separated
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
}

export function checkContentQuality(post: QualityInput): QualityResult {
  const checks: QualityCheck[] = [];

  // 1. Title length (30-70 chars) — 10 pts
  const titleLen = (post.title || '').length;
  checks.push({
    name: 'Title length',
    status: titleLen >= 30 && titleLen <= 70 ? 'pass' : titleLen > 0 ? 'warn' : 'fail',
    points: titleLen >= 30 && titleLen <= 70 ? 10 : titleLen > 0 ? 5 : 0,
    maxPoints: 10,
    detail: titleLen > 0 ? `${titleLen} chars (ideal: 30-70)` : 'Missing title',
  });

  // 2. Meta description (120-160 chars) — 10 pts
  const metaLen = (post.meta_description || '').length;
  checks.push({
    name: 'Meta description',
    status: metaLen >= 120 && metaLen <= 160 ? 'pass' : metaLen > 0 ? 'warn' : 'fail',
    points: metaLen >= 120 && metaLen <= 160 ? 10 : metaLen > 0 ? 5 : 0,
    maxPoints: 10,
    detail: metaLen > 0 ? `${metaLen} chars (ideal: 120-160)` : 'Missing meta description',
  });

  // 3. Excerpt exists (50+ chars) — 10 pts
  const excerptLen = (post.excerpt || '').length;
  checks.push({
    name: 'Excerpt',
    status: excerptLen >= 50 ? 'pass' : excerptLen > 0 ? 'warn' : 'fail',
    points: excerptLen >= 50 ? 10 : excerptLen > 0 ? 5 : 0,
    maxPoints: 10,
    detail: excerptLen > 0 ? `${excerptLen} chars (min: 50)` : 'Missing excerpt',
  });

  // 4. Content word count (500+) — 15 pts
  const wordCount = countWords(post.content || '');
  checks.push({
    name: 'Word count',
    status: wordCount >= 500 ? 'pass' : wordCount > 0 ? 'warn' : 'fail',
    points: wordCount >= 500 ? 15 : wordCount >= 200 ? 8 : wordCount > 0 ? 3 : 0,
    maxPoints: 15,
    detail: `${wordCount} words (min: 500)`,
  });

  // 5. Content has H2/H3 headings — 10 pts
  const headingCount = countHeadings(post.content || '');
  checks.push({
    name: 'Headings (H2/H3)',
    status: headingCount >= 2 ? 'pass' : headingCount >= 1 ? 'warn' : 'fail',
    points: headingCount >= 2 ? 10 : headingCount >= 1 ? 5 : 0,
    maxPoints: 10,
    detail: `${headingCount} headings found (min: 2)`,
  });

  // 6. Featured image exists — 15 pts
  const hasImage = !!post.featured_image;
  checks.push({
    name: 'Featured image',
    status: hasImage ? 'pass' : 'fail',
    points: hasImage ? 15 : 0,
    maxPoints: 15,
    detail: hasImage ? 'Image set' : 'No featured image',
  });

  // 7. Keywords (3+) — 10 pts
  const keywords = parseJsonArray(post.keywords);
  checks.push({
    name: 'Keywords',
    status: keywords.length >= 3 ? 'pass' : keywords.length > 0 ? 'warn' : 'fail',
    points: keywords.length >= 3 ? 10 : keywords.length > 0 ? 5 : 0,
    maxPoints: 10,
    detail: `${keywords.length} keywords (min: 3)`,
  });

  // 8. Category set (not default) — 5 pts
  const category = post.category || '';
  const isDefault = !category || category === 'medical-devices' || category === 'uncategorized';
  checks.push({
    name: 'Category',
    status: !isDefault ? 'pass' : category ? 'warn' : 'fail',
    points: !isDefault ? 5 : category ? 3 : 0,
    maxPoints: 5,
    detail: category ? `"${category}"` : 'No category set',
  });

  // 9. Tags (2+) — 5 pts
  const tags = parseJsonArray(post.tags);
  checks.push({
    name: 'Tags',
    status: tags.length >= 2 ? 'pass' : tags.length > 0 ? 'warn' : 'fail',
    points: tags.length >= 2 ? 5 : tags.length > 0 ? 3 : 0,
    maxPoints: 5,
    detail: `${tags.length} tags (min: 2)`,
  });

  // 10. Doctor/expert attribution — 10 pts
  const hasDoctor = !!(post.doctor_name && post.doctor_name.trim());
  checks.push({
    name: 'Expert attribution',
    status: hasDoctor ? 'pass' : 'fail',
    points: hasDoctor ? 10 : 0,
    maxPoints: 10,
    detail: hasDoctor ? post.doctor_name! : 'No expert/doctor attributed',
  });

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';

  return { score, grade, checks };
}
