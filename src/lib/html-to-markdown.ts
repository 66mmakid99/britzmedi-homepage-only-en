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
 * Handles: h1-h6, p, ul, ol, li, strong, b, em, i, a, blockquote, br,
 *          div, img, code, pre, table, hr, span
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let md = html;

  // Remove wrapper divs / spans / sections
  md = md.replace(/<\/?(?:div|span|section|article|header|footer)[^>]*>/gi, '');

  // Headings (h1-h6)
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n');
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');

  // Code blocks (pre > code)
  md = md.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, '\n```\n$1\n```\n');

  // Inline code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Horizontal rules
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    const clean = content.replace(/<\/?p[^>]*>/gi, '').trim();
    return '\n> ' + clean.split('\n').join('\n> ') + '\n';
  });

  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Bold and italic (strong/b/em/i)
  md = md.replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**');
  md = md.replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*');

  // Tables
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows: string[] = [];
    const rowMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    rowMatches.forEach((row: string, ri: number) => {
      const cells: string[] = [];
      const cellMatches = row.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
      cellMatches.forEach((cell: string) => {
        const text = cell.replace(/<[^>]*>/g, '').trim();
        cells.push(text);
      });
      rows.push('| ' + cells.join(' | ') + ' |');
      if (ri === 0) {
        rows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
      }
    });
    return '\n' + rows.join('\n') + '\n';
  });

  // Lists — process ol/ul blocks (handle nested by processing inner content)
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
  md = md.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

  // Clean up excessive blank lines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}
