// Content post-processing: product fact-checking, citation validation, quality checks
// Runs after content generation but before AI analysis in the pipeline

import { BRITZMEDI_PRODUCTS, getProductInfo } from './britzmedi-products';
import { callClaude } from './claude-api';

// ── 3-1: Product fact-checking ────────────────────────────

export function factCheckProducts(content: string): {
  issues: string[];
  corrections: { original: string; issue: string; severity: 'critical' | 'warning' }[];
  hasCriticalError: boolean;
} {
  const issues: string[] = [];
  const corrections: { original: string; issue: string; severity: 'critical' | 'warning' }[] = [];

  // --- NEWCHAE SHOT fact-check (highest priority) ---

  const newchaePatterns = [
    {
      pattern: /NEWCHAE\s*SHOT[^.]*(?:injection|inject|needle|micro-injection|mesotherapy|micro.?needl)/gi,
      issue: 'CRITICAL: NEWCHAE SHOT described as injection/needle device — it is a personal RF beauty device',
      severity: 'critical' as const
    },
    {
      pattern: /NEWCHAE\s*SHOT[^.]*(?:medical device|medical.grade|clinical device|professional device)/gi,
      issue: 'CRITICAL: NEWCHAE SHOT described as medical device — it is a personal home-use beauty device',
      severity: 'critical' as const
    },
    {
      pattern: /NEWCHAE\s*SHOT[^.]*(?:FDA|510\(k\)|cleared|approved)/gi,
      issue: 'CRITICAL: NEWCHAE SHOT linked to FDA clearance — it has no FDA clearance',
      severity: 'critical' as const
    },
    {
      pattern: /NEWCHAE\s*SHOT[^.]*(?:physician|doctor|medical professional|licensed|clinic use|clinical use)/gi,
      issue: 'CRITICAL: NEWCHAE SHOT described as requiring medical professional — it is for home use',
      severity: 'critical' as const
    },
    {
      pattern: /NEWCHAE\s*SHOT[^.]*(?:skin booster|filler|botox|hyaluronic)/gi,
      issue: 'CRITICAL: NEWCHAE SHOT linked to injectable treatments — it is an RF device, not injectable',
      severity: 'critical' as const
    }
  ];

  for (const check of newchaePatterns) {
    const matches = content.match(check.pattern);
    if (matches) {
      for (const match of matches) {
        corrections.push({ original: match, issue: check.issue, severity: check.severity });
        issues.push(check.issue);
      }
    }
  }

  // --- TORR RF fact-check ---

  const torrPatterns = [
    {
      pattern: /TORR\s*RF[^.]*(?:home use|personal use|consumer|at-home)/gi,
      issue: 'WARNING: TORR RF described as home-use — it is a professional medical device',
      severity: 'warning' as const
    }
  ];

  for (const check of torrPatterns) {
    const matches = content.match(check.pattern);
    if (matches) {
      for (const match of matches) {
        corrections.push({ original: match, issue: check.issue, severity: check.severity });
        issues.push(check.issue);
      }
    }
  }

  // --- General FDA overclaim check ---

  const fdaOverclaim = /(?:BRITZMEDI|ULBLANC|LUMINO\s*WAVE|NEWCHAE\s*SHOT)[^.]*(?:all|every|entire|full)\s*(?:product|lineup|range)[^.]*FDA/gi;
  const fdaMatches = content.match(fdaOverclaim);
  if (fdaMatches) {
    for (const match of fdaMatches) {
      corrections.push({
        original: match,
        issue: 'CRITICAL: Only TORR RF has FDA 510(k). Do not claim FDA for entire product line.',
        severity: 'critical'
      });
      issues.push('FDA overclaim for product line');
    }
  }

  const hasCriticalError = corrections.some(c => c.severity === 'critical');
  return { issues, corrections, hasCriticalError };
}

// ── 3-2: Auto-correction via Claude ──────────────────────

export async function autoCorrectProducts(apiKey: string, content: string, corrections: any[]): Promise<string> {
  if (corrections.length === 0) return content;

  const criticalIssues = corrections
    .filter((c: any) => c.severity === 'critical')
    .map((c: any) => `- Found: "${c.original}"\n  Issue: ${c.issue}`)
    .join('\n');

  if (!criticalIssues) return content;

  const response = await callClaude({
    apiKey,
    maxTokens: 8000,
    system: 'You are a factual accuracy editor. Fix ONLY the specified errors. Return the full corrected article.',
    userMessage: `This article contains critical factual errors about BRITZMEDI products. Fix them.

CORRECT PRODUCT FACTS:
- TORR RF: Professional medical device, FDA 510(k) cleared, for licensed clinics only, multi-wave RF technology
- ULBLANC: Professional aesthetic device for skin rejuvenation, for clinics
- NEWCHAE SHOT: PERSONAL HOME-USE beauty device (NOT medical, NOT injection, NOT needle, NOT FDA). Uses RF technology adapted from TORR RF handpiece for consumer home use.
- LUMINO WAVE: Professional LED therapy device for clinics

ERRORS FOUND:
${criticalIssues}

Fix ONLY the incorrect sentences. Keep everything else exactly the same.
For NEWCHAE SHOT errors: Replace incorrect descriptions with "NEWCHAE SHOT is a personal home-use beauty device that applies TORR RF handpiece technology for consumer skincare."
Return the full corrected article.

Article:
${content}`
  });

  return response;
}

// ── 3-3: Citation validation ─────────────────────────────

export function validateCitations(content: string, validPMIDs: string[]): { cleaned: string; removed: string[] } {
  const removed: string[] = [];
  let cleaned = content;

  // 1. If no valid PMIDs, remove all specific citations
  if (validPMIDs.length === 0) {
    // [Author, Year] format
    cleaned = cleaned.replace(/\[([A-Z][a-z]+(?:\s+(?:et al\.?|&\s+[A-Z][a-z]+))?),?\s*(\d{4})\]/g, (match) => {
      removed.push(match);
      return '';
    });
    // "According to Author (Year)" format
    cleaned = cleaned.replace(/(?:According to|As (?:noted|reported|shown|demonstrated) by)\s+[A-Z][a-z]+(?:\s+et al\.?)?\s*\(\d{4}\),?\s*/g, (match) => {
      removed.push(match);
      return 'Research indicates ';
    });
    // "(Author, Year)" format
    cleaned = cleaned.replace(/\(([A-Z][a-z]+(?:\s+(?:et al\.?|&\s+[A-Z][a-z]+))?),?\s*\d{4}\)/g, (match) => {
      removed.push(match);
      return '';
    });
  }

  // 2. If valid PMIDs exist, remove unmatched ones
  if (validPMIDs.length > 0) {
    cleaned = cleaned.replace(/PMID:?\s*(\d+)/g, (match, pmid) => {
      if (validPMIDs.includes(pmid)) return match;
      removed.push(match);
      return '';
    });
  }

  // 3. Replace fake references section
  const refSection = cleaned.match(/## References[\s\S]*$/i);
  if (refSection && validPMIDs.length === 0) {
    cleaned = cleaned.replace(/## References[\s\S]*$/i,
      '## References\n\n*This article draws on current clinical evidence and industry data. For specific study citations, visit [PubMed](https://pubmed.ncbi.nlm.nih.gov/) or contact us at [britzmedi.com/contact](https://britzmedi.com/contact).*\n');
    removed.push('Entire references section replaced (no verified PMIDs)');
  }

  return { cleaned, removed };
}

// ── 3-4: Self-promotion check ────────────────────────────

export function checkSelfPromotion(content: string): {
  mentionCount: number;
  percentage: number;
  hasDedicatedSection: boolean;
  issues: string[];
} {
  const wordCount = content.split(/\s+/).length;
  const britzmediCount = (content.match(/BRITZMEDI|britzmedi/gi) || []).length;
  const torrRFCount = (content.match(/TORR\s*RF/gi) || []).length;
  const totalMentions = britzmediCount + torrRFCount;
  const percentage = (totalMentions / wordCount) * 100;
  const hasDedicatedSection = /^#{2,3}\s+.*BRITZMEDI/mi.test(content);

  const issues: string[] = [];
  if (hasDedicatedSection) issues.push('BLOCKING: Dedicated BRITZMEDI section in headings');
  if (totalMentions > 8) issues.push(`WARNING: ${totalMentions} mentions (max 8)`);
  if (percentage > 2) issues.push(`WARNING: ${percentage.toFixed(1)}% self-promotion (max 2%)`);

  return { mentionCount: totalMentions, percentage, hasDedicatedSection, issues };
}

// ── 3-5: Comparison table / first paragraph / internal links ─

export function checkComparisonTable(content: string): boolean {
  return /\|.+\|.+\|[\s\S]*?\|[-:]+\|[-:]+\|/.test(content);
}

export function checkFirstParagraph(content: string): {
  hasDefinition: boolean; hasNumber: boolean; isAIExtractable: boolean; issues: string[];
} {
  const firstPara = content.split(/\n\n|^## /m)[0].replace(/^#.*\n/, '').trim();
  const first150 = firstPara.split(/\s+/).slice(0, 150).join(' ');
  const hasDefinition = /\bis\b|\bare\b|\brefers to\b|\bdefined as\b/i.test(first150);
  const hasNumber = /\d+[%$€£¥]|\d+\.\d+|\$\d|billion|million|\d+,\d+/i.test(first150);
  const startsVague = /^(In recent|Over the|The.*industry has|As we|Today)/i.test(first150);
  const issues: string[] = [];
  if (!hasDefinition) issues.push('Missing definition in first paragraph');
  if (!hasNumber) issues.push('Missing numbers in first paragraph');
  if (startsVague) issues.push('Vague opening — not AI-extractable');
  return { hasDefinition, hasNumber, isAIExtractable: hasDefinition && hasNumber && !startsVague, issues };
}

export function insertInternalLinks(content: string): string {
  const existing = (content.match(/https?:\/\/britzmedi\.com/g) || []).length;
  if (existing >= 3) return content;
  const links = [
    { kw: ['skin tightening', 'body contouring', 'cellulite', 'RF device'], url: 'https://britzmedi.com/products/torr-rf' },
    { kw: ['FDA', '510(k)', 'certification', 'ISO 13485'], url: 'https://britzmedi.com/certifications' },
    { kw: ['BRITZMEDI', 'Korean manufacturer'], url: 'https://britzmedi.com/about' },
    { kw: ['contact', 'inquiry', 'demo', 'quote'], url: 'https://britzmedi.com/contact' },
  ];
  let modified = content; let count = existing;
  for (const l of links) {
    if (count >= 5) break;
    for (const k of l.kw) {
      const re = new RegExp(`(?<!\\[)\\b(${k})\\b(?!\\])(?!.*\\]\\()`, 'i');
      if (re.test(modified) && !modified.includes(l.url)) {
        modified = modified.replace(re, `[$1](${l.url})`);
        count++; break;
      }
    }
  }
  return modified;
}

export function getAuthorByAngle(angle: string): string {
  return ({
    'clinical_evidence': 'BRITZMEDI Clinical Advisory',
    'tech_comparison': 'BRITZMEDI Engineering Insights',
    'market_analysis': 'BRITZMEDI Market Intelligence',
    'clinic_guide': 'BRITZMEDI Clinical Education',
    'patient_education': 'BRITZMEDI Patient Resources',
    'aeo_response': 'BRITZMEDI Research',
  } as Record<string, string>)[angle] || 'BRITZMEDI Research Team';
}
