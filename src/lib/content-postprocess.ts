// Content post-processing: product fact-checking, citation validation, quality checks
// Runs after content generation but before AI analysis in the pipeline

import { BRITZMEDI_PRODUCTS, getProductInfo, CONTENT_STRATEGY_RULES } from './britzmedi-products';
import { callClaude } from './claude-api';

// ── 0-1: Topic relevance check ────────────────────────────

export function checkTopicRelevance(keyword: string, content: string): {
  isRelevant: boolean;
  isCompetitorStandalone: boolean;
  issues: string[];
  suggestion?: string;
} {
  const keywordLower = keyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const issues: string[] = [];

  // 경쟁 기술 단독 가이드 감지
  const competitorTech = CONTENT_STRATEGY_RULES.competitor_technologies.find(tech =>
    keywordLower.includes(tech.toLowerCase())
  );

  const hasRFComparison = /\brf\b|radiofrequency|radio.frequency/i.test(keywordLower) ||
    /\bvs\b|\bversus\b|\bcompared?\b|\bcomparison\b/i.test(keywordLower);

  let isCompetitorStandalone = false;
  let suggestion: string | undefined;

  if (competitorTech && !hasRFComparison) {
    isCompetitorStandalone = true;
    issues.push(`BLOCKING: Standalone ${competitorTech} guide without RF comparison. BRITZMEDI is an RF company.`);
    suggestion = `Rewrite as: "RF vs ${competitorTech.charAt(0).toUpperCase() + competitorTech.slice(1)}: Which Technology Delivers Better Results for [Indication]?"`;
  }

  // 콘텐츠 내에서 RF 언급 비율 체크
  const rfMentions = (contentLower.match(/\brf\b|radiofrequency|radio.frequency|torr/g) || []).length;
  const totalWords = content.split(/\s+/).length;
  const rfDensity = rfMentions / totalWords;

  if (competitorTech && rfDensity < 0.005) {
    issues.push(`WARNING: Article about ${competitorTech} barely mentions RF (${rfMentions} times in ${totalWords} words). Must include substantial RF comparison.`);
  }

  // BRITZMEDI 연관성 체크
  const hasBritzContext = /britzmedi|torr\s*rf|aesthetic\s*device|skin\s*tightening|body\s*contouring|rf\s*device/i.test(contentLower);
  if (!hasBritzContext) {
    issues.push('WARNING: Article has no connection to BRITZMEDI products or market');
  }

  return {
    isRelevant: !isCompetitorStandalone && issues.filter(i => i.startsWith('BLOCKING')).length === 0,
    isCompetitorStandalone,
    issues,
    suggestion
  };
}

// ── 0-2: Word count check ────────────────────────────────

export function checkWordCount(content: string): {
  wordCount: number;
  isTooLong: boolean;
  isTooShort: boolean;
  issues: string[];
} {
  const wordCount = content.split(/\s+/).length;
  const issues: string[] = [];

  if (wordCount > 2500) {
    issues.push(`WARNING: Article is ${wordCount} words (max 2500). High bounce rate risk. Needs trimming.`);
  }
  if (wordCount < 1500) {
    issues.push(`WARNING: Article is ${wordCount} words (min 1500). Too thin for SEO authority.`);
  }

  return {
    wordCount,
    isTooLong: wordCount > 2500,
    isTooShort: wordCount < 1500,
    issues
  };
}

// ── 0-3: CTA check + auto-insert ─────────────────────────

export function checkAndInsertCTAs(content: string): { content: string; ctaCount: number; inserted: number; } {
  // 기존 CTA 감지
  const ctaPatterns = /britzmedi\.com\/contact|britzmedi\.com\/products|learn more|request a demo|get in touch|contact.*team/gi;
  const existingCTAs = (content.match(ctaPatterns) || []).length;

  if (existingCTAs >= 2) {
    return { content, ctaCount: existingCTAs, inserted: 0 };
  }

  let modified = content;
  let inserted = 0;

  // 중간 CTA 삽입 (세 번째 H2 직전)
  if (existingCTAs < 1) {
    const h2Positions: number[] = [];
    const h2Regex = /^## /gm;
    let match;
    while ((match = h2Regex.exec(modified)) !== null) {
      h2Positions.push(match.index);
    }

    if (h2Positions.length >= 3) {
      const insertPos = h2Positions[2];
      const midCTA = '\n\n> **Interested in RF technology for your clinic?** [Explore TORR RF specifications and clinical data →](https://britzmedi.com/products/torr-rf)\n\n';
      modified = modified.slice(0, insertPos) + midCTA + modified.slice(insertPos);
      inserted++;
    }
  }

  // 끝 CTA (없으면 추가)
  const hasEndCTA = /britzmedi\.com/.test(modified.slice(-500));
  if (!hasEndCTA) {
    const endCTA = '\n\n---\n\n*Looking for a reliable RF device for your aesthetic clinic? [Contact BRITZMEDI](https://britzmedi.com/contact) to discuss your needs or [explore our product range](https://britzmedi.com/products).*\n';
    const faqIndex = modified.search(/^## (?:FAQ|Frequently Asked)/mi);
    if (faqIndex > 0) {
      modified = modified.slice(0, faqIndex) + endCTA + '\n' + modified.slice(faqIndex);
    } else {
      modified += endCTA;
    }
    inserted++;
  }

  return { content: modified, ctaCount: existingCTAs + inserted, inserted };
}

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

// ── Citation quality check ────────────────────────────────

export function checkCitations(content: string): {
  hasReferences: boolean;
  inlineCitations: number;
  referenceEntries: number;
  issues: string[];
} {
  const issues: string[] = [];

  // Count inline citations: "Author et al. (Year)" or "(Author et al., Year)"
  const inlinePatterns = content.match(/\b[A-Z][a-z]+\s+et\s+al\.?\s*[\(,]\s*\d{4}/g) || [];
  const inlineCitations = inlinePatterns.length;

  // Check for References section
  const refMatch = content.match(/^##\s*References/mi);
  const hasReferences = !!refMatch;

  // Count reference entries (numbered or bulleted lines after References heading)
  let referenceEntries = 0;
  if (hasReferences) {
    const refSection = content.slice(content.search(/^##\s*References/mi));
    const entries = refSection.match(/^\s*(?:\d+\.|[-*])\s+.+/gm) || [];
    referenceEntries = entries.length;
  }

  if (!hasReferences && inlineCitations > 0) {
    issues.push('BLOCKING: Inline citations found but no References section');
  }

  if (inlineCitations === 0) {
    issues.push('WARNING: No inline citations found — article lacks evidence attribution');
  }

  if (hasReferences && referenceEntries < 3) {
    issues.push(`WARNING: Only ${referenceEntries} references (minimum 3 recommended)`);
  }

  if (inlineCitations > 0 && hasReferences && Math.abs(inlineCitations - referenceEntries) > 3) {
    issues.push(`WARNING: Mismatch between inline citations (${inlineCitations}) and references (${referenceEntries})`);
  }

  return { hasReferences, inlineCitations, referenceEntries, issues };
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
