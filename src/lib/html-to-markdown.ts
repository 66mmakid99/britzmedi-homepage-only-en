// Lightweight regex-based HTML → Markdown converter
// Supports common tags used in Content Hub generated content

/**
 * Check if a string contains HTML tags (beyond simple inline formatting).
 */
export function isHtml(text: string): boolean {
  if (!text) return false;
  return /<(?:h[1-6]|p|ul|ol|li|div|blockquote|br)\b[^>]*>/i.test(text);
}

/**
 * Convert HTML content to Markdown using regex replacements.
 * Handles: h2, h3, h4, p, ul, ol, li, strong, em, a, blockquote, br, div
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let md = html;

  // Remove wrapper divs
  md = md.replace(/<\/?div[^>]*>/gi, '');

  // Headings
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    const clean = content.replace(/<\/?p[^>]*>/gi, '').trim();
    return '\n> ' + clean.split('\n').join('\n> ') + '\n';
  });

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Bold and italic
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');

  // Lists — process ol/ul blocks
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, items) => {
    let i = 0;
    return '\n' + items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, text: string) => {
      i++;
      return `${i}. ${text.replace(/<[^>]*>/g, '').trim()}\n`;
    }) + '\n';
  });

  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, items) => {
    return '\n' + items.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_: string, text: string) => {
      return `- ${text.replace(/<[^>]*>/g, '').trim()}\n`;
    }) + '\n';
  });

  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining HTML tags
  md = md.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, ' ');

  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}
