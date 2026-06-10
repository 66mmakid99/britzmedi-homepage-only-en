# 콘텐츠 파이프라인 품질 개선 v2 — 제품 팩트 검증 + 후처리 강화

이전 CONTENT-QUALITY-FIX.md 대체. 전부 순서대로 실행해. 중간에 멈추지 마.

핵심 문제: 파이프라인이 BRITZMEDI 제품 정보를 모르는 상태에서 Claude가 추측으로 거짓 정보를 생성함.
예시: NEWCHAE SHOT을 "의료용 주사 시스템"으로 설명 → 실제로는 TORR RF 핸드피스 기술 적용한 개인용 미용기기.

---

## Phase 1: BRITZMEDI 공식 제품 데이터 파일

파일: `src/lib/britzmedi-products.ts`

이 파일이 모든 콘텐츠 생성의 유일한 제품 정보 소스.
Claude가 이 파일에 없는 내용을 지어내면 안 됨.

```typescript
export const BRITZMEDI_PRODUCTS = {
  "TORR RF": {
    name: "TORR RF",
    category: "professional_medical_device",
    classification: "FDA 510(k) cleared medical device",
    target_user: "Licensed aesthetic clinics, dermatology clinics, medical spas",
    technology: "Multi-wave radiofrequency (mono-polar, bi-polar, multi-polar switching)",
    indications: [
      "Skin tightening",
      "Body contouring",
      "Cellulite treatment",
      "Wrinkle reduction",
      "Collagen remodeling"
    ],
    key_features: [
      "Multi-wave RF technology (switch between mono/bi/multi-polar modes)",
      "Integrated cooling system",
      "Real-time impedance monitoring",
      "Multiple handpiece options for face and body"
    ],
    certifications: ["FDA 510(k)", "CE", "ISO 13485", "GMP (KGMP)"],
    regulatory_note: "Professional use only. Must be operated by licensed medical professionals.",
    is_medical_device: true,
    is_personal_device: false
  },
  "ULBLANC": {
    name: "ULBLANC",
    category: "professional_medical_device",
    classification: "Professional aesthetic device",
    target_user: "Licensed aesthetic clinics, dermatology clinics",
    technology: "Advanced skin rejuvenation system",
    indications: [
      "Skin rejuvenation",
      "Skin tone improvement"
    ],
    key_features: [
      "Multiple energy modalities for skin rejuvenation"
    ],
    certifications: ["CE", "ISO 13485"],
    regulatory_note: "Professional use only.",
    is_medical_device: true,
    is_personal_device: false
  },
  "NEWCHAE SHOT": {
    name: "NEWCHAE SHOT",
    category: "personal_beauty_device",
    classification: "Personal home-use beauty device (NOT a medical device)",
    target_user: "General consumers, individuals for home use",
    technology: "RF technology adapted from TORR RF handpiece technology for personal use",
    indications: [
      "At-home skin care",
      "Personal beauty treatment"
    ],
    key_features: [
      "TORR RF handpiece technology adapted for consumer use",
      "Safe for home use without medical supervision",
      "Compact personal device"
    ],
    certifications: [],
    regulatory_note: "Personal beauty device. NOT FDA cleared as medical device. NOT for clinical use. Does NOT require medical professional to operate.",
    is_medical_device: false,
    is_personal_device: true,
    CRITICAL_WARNINGS: [
      "NEVER describe as medical device, injection system, or mesotherapy device",
      "NEVER claim FDA clearance for this product",
      "NEVER say it requires medical professional to operate",
      "NEVER list clinical indications (it is NOT a clinical device)",
      "ALWAYS clarify it is a PERSONAL/HOME-USE beauty device based on TORR RF technology"
    ]
  },
  "LUMINO WAVE": {
    name: "LUMINO WAVE",
    category: "professional_device",
    classification: "LED therapy device",
    target_user: "Aesthetic clinics, medical spas",
    technology: "LED phototherapy with multiple wavelengths",
    indications: [
      "Phototherapy treatments",
      "Skin rejuvenation support"
    ],
    key_features: [
      "Multiple LED wavelengths"
    ],
    certifications: [],
    regulatory_note: "Professional LED device.",
    is_medical_device: false,
    is_personal_device: false
  }
};

export const BRITZMEDI_COMPANY = {
  name: "BRITZMEDI Co., Ltd.",
  ceo: "이신재 (Shinjae Lee)",
  cmo: "이성호 (Sungho Lee)",
  cmo_email: "sh.lee@britzmedi.com",
  headquarters: "1211, 388, Dunchon-daero, Jungwon-gu, Seongnam-si, Gyeonggi-do, Republic of Korea",
  website: "https://britzmedi.com",
  phone: "+82-70-4348-7244",
  founded_country: "South Korea",
  certifications: ["ISO 13485", "GMP (KGMP)", "FDA 510(k) (for TORR RF)"],
  speciality: "Radiofrequency (RF) technology for aesthetic medical devices",
  flagship: "TORR RF"
};

// 제품 정보를 프롬프트용 텍스트로 변환
export function getProductContext(): string {
  let context = `BRITZMEDI OFFICIAL PRODUCT INFORMATION (DO NOT DEVIATE FROM THIS):\n\n`;
  context += `Company: ${BRITZMEDI_COMPANY.name}, headquartered in ${BRITZMEDI_COMPANY.headquarters}\n`;
  context += `CEO: ${BRITZMEDI_COMPANY.ceo}\n`;
  context += `Website: ${BRITZMEDI_COMPANY.website}\n`;
  context += `Specialty: ${BRITZMEDI_COMPANY.speciality}\n\n`;
  
  for (const [key, product] of Object.entries(BRITZMEDI_PRODUCTS)) {
    context += `--- ${product.name} ---\n`;
    context += `Category: ${product.classification}\n`;
    context += `Target User: ${product.target_user}\n`;
    context += `Technology: ${product.technology}\n`;
    context += `Is Medical Device: ${product.is_medical_device ? 'YES' : 'NO'}\n`;
    context += `Is Personal Device: ${product.is_personal_device ? 'YES' : 'NO'}\n`;
    if (product.indications.length > 0) {
      context += `Indications: ${product.indications.join(', ')}\n`;
    }
    if (product.certifications.length > 0) {
      context += `Certifications: ${product.certifications.join(', ')}\n`;
    }
    context += `Regulatory: ${product.regulatory_note}\n`;
    if (product.CRITICAL_WARNINGS) {
      context += `⚠️ CRITICAL: ${product.CRITICAL_WARNINGS.join(' | ')}\n`;
    }
    context += `\n`;
  }

  return context;
}

// 특정 제품 정보만 가져오기
export function getProductInfo(productName: string): typeof BRITZMEDI_PRODUCTS[keyof typeof BRITZMEDI_PRODUCTS] | null {
  const normalized = productName.toUpperCase().replace(/\s+/g, ' ').trim();
  for (const [key, product] of Object.entries(BRITZMEDI_PRODUCTS)) {
    if (key.toUpperCase() === normalized || product.name.toUpperCase() === normalized) {
      return product;
    }
  }
  return null;
}
```

---

## Phase 2: 모든 생성 프롬프트에 제품 데이터 주입

content-angles.ts (또는 콘텐츠 생성 프롬프트가 있는 파일) 수정.

### 2-1. 기존 BRITZMEDI_CONTEXT를 getProductContext()로 교체

기존:
```typescript
const BRITZMEDI_CONTEXT = `BRITZMEDI is a Korean aesthetic medical device manufacturer...`
```

변경:
```typescript
import { getProductContext } from './britzmedi-products';

// 모든 프롬프트에서 사용
const BRITZMEDI_CONTEXT = getProductContext();
```

### 2-2. 모든 프롬프트 끝에 팩트 강제 규칙 추가

기존 CRITICAL RULES에 추가:

```
PRODUCT FACT RULES (violating = immediate rejection):

9. PRODUCT ACCURACY: ONLY use the product information provided above. If you are unsure about a BRITZMEDI product detail, DO NOT GUESS — omit it entirely.

10. NEWCHAE SHOT: This is a PERSONAL HOME-USE beauty device, NOT a medical device. NEVER describe it as:
   - An injection system
   - A mesotherapy device
   - A micro-injection device
   - A needle-based system
   - FDA cleared
   - Requiring medical professional operation
   It uses RF technology adapted from TORR RF for consumer home use. That's all.

11. MEDICAL DEVICE CLAIMS: Only TORR RF can be described as an FDA 510(k) cleared medical device. Do NOT extend FDA claims to other products.

12. UNKNOWN INFORMATION: If specific details about a BRITZMEDI product are not in the provided product data, write "Details available upon request at britzmedi.com/contact" — NEVER fabricate specifications, clinical data, or capabilities.
```

---

## Phase 3: 팩트체크 후처리 모듈

파일: `src/lib/content-postprocess.ts` (기존 파일에 추가)

### 3-1. 제품 정보 팩트체크

```typescript
import { BRITZMEDI_PRODUCTS, getProductInfo } from './britzmedi-products';

export function factCheckProducts(content: string): {
  issues: string[];
  corrections: { original: string; issue: string; severity: 'critical' | 'warning' }[];
  hasCriticalError: boolean;
} {
  const issues: string[] = [];
  const corrections: { original: string; issue: string; severity: 'critical' | 'warning' }[] = [];

  // --- NEWCHAE SHOT 팩트체크 (가장 중요) ---
  
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

  // --- TORR RF 팩트체크 ---

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

  // --- 일반 FDA 클레임 체크 ---

  // BRITZMEDI 전체에 대해 FDA 클레임하면 안 됨 (TORR RF만 가능)
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
```

### 3-2. 자동 교정 함수

Critical 에러가 있으면 Claude에게 해당 부분만 교정 요청:

```typescript
export async function autoCorrectProducts(env: any, content: string, corrections: any[]): Promise<string> {
  if (corrections.length === 0) return content;

  const criticalIssues = corrections
    .filter(c => c.severity === 'critical')
    .map(c => `- Found: "${c.original}"\n  Issue: ${c.issue}`)
    .join('\n');

  if (!criticalIssues) return content;

  const response = await callClaude(env, {
    messages: [{
      role: 'user',
      content: `This article contains critical factual errors about BRITZMEDI products. Fix them.

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
    }]
  });

  return response;
}
```

### 3-3. 인용 검증 (기존 유지 + 강화)

```typescript
export function validateCitations(content: string, validPMIDs: string[]): { cleaned: string; removed: string[]; } {
  const removed: string[] = [];
  let cleaned = content;

  // 1. validPMIDs가 비어있으면 모든 특정 인용 제거
  if (validPMIDs.length === 0) {
    // [Author, Year] 형태 제거
    cleaned = cleaned.replace(/\[([A-Z][a-z]+(?:\s+(?:et al\.?|&\s+[A-Z][a-z]+))?),?\s*(\d{4})\]/g, (match) => {
      removed.push(match);
      return '';
    });
    // "According to Author (Year)" 형태 제거
    cleaned = cleaned.replace(/(?:According to|As (?:noted|reported|shown|demonstrated) by)\s+[A-Z][a-z]+(?:\s+et al\.?)?\s*\(\d{4}\),?\s*/g, (match) => {
      removed.push(match);
      return 'Research indicates ';
    });
    // "(Author, Year)" 형태 제거
    cleaned = cleaned.replace(/\(([A-Z][a-z]+(?:\s+(?:et al\.?|&\s+[A-Z][a-z]+))?),?\s*\d{4}\)/g, (match) => {
      removed.push(match);
      return '';
    });
  }

  // 2. validPMIDs가 있으면 목록에 없는 PMID 제거
  if (validPMIDs.length > 0) {
    cleaned = cleaned.replace(/PMID:?\s*(\d+)/g, (match, pmid) => {
      if (validPMIDs.includes(pmid)) return match;
      removed.push(match);
      return '';
    });
  }

  // 3. References 섹션의 가짜 항목 제거
  // 패턴: 1. Author, A. B., ... (Year). Title. Journal, Volume(Issue), Pages.
  // validPMIDs에 매칭 안 되는 reference 항목 제거
  const refSection = cleaned.match(/## References[\s\S]*$/i);
  if (refSection && validPMIDs.length === 0) {
    // PubMed 데이터 없으면 References 섹션 자체를 안전한 버전으로 교체
    cleaned = cleaned.replace(/## References[\s\S]*$/i, 
      '## References\n\n*This article draws on current clinical evidence and industry data. For specific study citations, visit [PubMed](https://pubmed.ncbi.nlm.nih.gov/) or contact us at [britzmedi.com/contact](https://britzmedi.com/contact).*\n');
    removed.push('Entire references section replaced (no verified PMIDs)');
  }

  return { cleaned, removed };
}
```

### 3-4. 자사 홍보 체크 (기존 유지)

```typescript
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
```

### 3-5. 비교표/첫문단/내부링크 체크 (기존 유지)

```typescript
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
  })[angle] || 'BRITZMEDI Research Team';
}
```

---

## Phase 4: 파이프라인 후처리 순서 통합

content-pipeline.ts의 processQueueItem에서 콘텐츠 생성 후, AI 분석 전:

```typescript
import { 
  factCheckProducts, autoCorrectProducts, validateCitations, 
  checkSelfPromotion, checkComparisonTable, checkFirstParagraph,
  insertInternalLinks, getAuthorByAngle
} from './content-postprocess';

// === [2.5] 후처리 시작 ===
await updateQueueStatus(env, queueId, 'postprocessing');

// 순서 1: 제품 팩트체크 (최우선)
const factCheck = factCheckProducts(generated.content);
if (factCheck.hasCriticalError) {
  generated.content = await autoCorrectProducts(env, generated.content, factCheck.corrections);
  await logPipelineStep(env, queueId, null, 'postprocess', 'product_facts_corrected', {
    corrections: factCheck.corrections.length,
    issues: factCheck.issues
  });
  
  // 교정 후 재검증
  const recheck = factCheckProducts(generated.content);
  if (recheck.hasCriticalError) {
    // 2번째도 실패하면 해당 콘텐츠 reject
    await updateQueueStatus(env, queueId, 'failed');
    await env.DB.prepare('UPDATE content_queue SET error_message = ? WHERE id = ?')
      .bind('Product fact-check failed after auto-correction. Manual review required.', queueId).run();
    await logPipelineStep(env, queueId, null, 'postprocess', 'fact_check_failed', { issues: recheck.issues });
    return { status: 'failed', reason: 'Product fact-check failed', issues: recheck.issues };
  }
}

// 순서 2: 인용 검증
const validPMIDs = (researchData?.sources || [])
  .filter(s => s.pmid)
  .map(s => s.pmid);
const citationResult = validateCitations(generated.content, validPMIDs);
generated.content = citationResult.cleaned;
if (citationResult.removed.length > 0) {
  await logPipelineStep(env, queueId, null, 'postprocess', 'fake_citations_removed', {
    removed_count: citationResult.removed.length,
    removed: citationResult.removed.slice(0, 10)
  });
}

// 순서 3: 자사 홍보 체크 + 교정
const promoCheck = checkSelfPromotion(generated.content);
if (promoCheck.hasDedicatedSection) {
  const fixResponse = await callClaude(env, {
    messages: [{
      role: 'user',
      content: `Remove any H2/H3 heading containing "BRITZMEDI". Redistribute that content into other sections naturally. BRITZMEDI should only appear in comparison contexts. Return the full revised article.\n\nArticle:\n${generated.content}`
    }]
  });
  generated.content = fixResponse;
  await logPipelineStep(env, queueId, null, 'postprocess', 'promo_section_removed', {});
}

// 순서 4: 비교표 체크 + 자동 추가
if (!checkComparisonTable(generated.content)) {
  const tableResponse = await callClaude(env, {
    messages: [{
      role: 'user',
      content: `Add a markdown comparison table to this article. 4+ rows comparing relevant products/options. BRITZMEDI TORR RF as one row among equals. Columns: Product, Manufacturer, Technology, Key Feature, Target. Insert at logical position. Return full article.\n\nArticle:\n${generated.content}`
    }]
  });
  generated.content = tableResponse;
  await logPipelineStep(env, queueId, null, 'postprocess', 'table_added', {});
}

// 순서 5: 첫 문단 체크 + 수정
const fpCheck = checkFirstParagraph(generated.content);
if (!fpCheck.isAIExtractable) {
  const fixFP = await callClaude(env, {
    messages: [{
      role: 'user',
      content: `Rewrite ONLY the first paragraph. Rules: Start with clear definition + specific number/statistic. Make it AI-extractable as featured snippet. Return full article.\n\nArticle:\n${generated.content}`
    }]
  });
  generated.content = fixFP;
  await logPipelineStep(env, queueId, null, 'postprocess', 'first_para_fixed', {});
}

// 순서 6: 내부 링크 삽입
generated.content = insertInternalLinks(generated.content);

// 순서 7: 저자 설정
const author = getAuthorByAngle(queue.content_angle || 'general');
// → content_items INSERT 시 author 포함

// === [3] AI 분석으로 진행 ===
```

---

## Phase 5: Quality Gate 강화

analyzeAndGate 함수의 분석 프롬프트에 추가:

```
Additional blocking criteria:

- If NEWCHAE SHOT is described as a medical device, injection system, or needle device → blocking_issue
- If FDA clearance is claimed for any product other than TORR RF → blocking_issue
- If there is a dedicated H2/H3 about BRITZMEDI → blocking_issue
- If BRITZMEDI/TORR RF mentioned more than 8 times → blocking_issue
- If no comparison table → completeness -15 points
- If first paragraph lacks definition + number → aeo_readiness -20 points
- If fake citations detected (references without matching PMIDs) → blocking_issue
```

---

## Phase 6: content_items 테이블 author 컬럼 (없으면)

```sql
ALTER TABLE content_items ADD COLUMN author TEXT DEFAULT 'BRITZMEDI Research Team';
ALTER TABLE content_items ADD COLUMN source_references TEXT;
```

D1 remote 적용. content_items INSERT 시 author, source_references 포함.

---

## Phase 7: 챗봇에도 제품 정보 주입

기존 챗봇 시스템 프롬프트에도 정확한 제품 정보 포함.

챗봇 프롬프트가 있는 파일 찾기:
```bash
grep -rn "NEWCHAE\|TORR RF\|ULBLANC\|LUMINO" src/lib/*chat* src/pages/api/chat* src/components/*chat* 2>/dev/null
```

찾은 파일에서 제품 설명을 britzmedi-products.ts의 정확한 정보로 교체.
특히 NEWCHAE SHOT 부분을 반드시 수정:
"NEWCHAE SHOT: Personal home-use beauty device (NOT medical device). Uses RF technology adapted from TORR RF handpiece for consumer skincare."

---

## Phase 8: 기존 발행글 일괄 팩트체크

```typescript
// GET /api/admin/content-hub/audit
// published 상태인 모든 글에 대해:
// 1. factCheckProducts 실행
// 2. validateCitations 실행
// 3. checkSelfPromotion 실행
// 결과 반환: { total, passed, critical_issues, warnings, details: [...] }
```

Admin 대시보드 또는 Content Hub에서 [Audit Published Content] 버튼으로 실행 가능.

---

## Phase 9: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "fix: Product fact-checking system - accurate BRITZMEDI data, NEWCHAE SHOT correction, citation validation, quality gates"
git push
```

---

## Phase 10: 테스트

1. Pipeline에서 "Korean aesthetic device" 키워드로 글 생성
2. 생성된 글에서 NEWCHAE SHOT 설명이 정확한지 확인
3. TORR RF만 FDA 510(k) 언급되는지 확인
4. 가짜 인용 없는지 확인
5. BRITZMEDI 전용 섹션 없는지 확인
6. 기존 발행글 audit 실행 → 문제 있는 글 목록 확인

---

## 핵심 규칙

1. 제품 정보는 britzmedi-products.ts가 유일한 진실의 소스 (Single Source of Truth)
2. NEWCHAE SHOT = 개인용 미용기기. 의료기기 아님. 이거 틀리면 전부 reject.
3. FDA 510(k)는 TORR RF만. 다른 제품에 확장 불가.
4. 팩트체크는 후처리 최우선 순서. 팩트 틀리면 나머지 다 의미 없음.
5. 가짜 인용 발견되면 제거. 검증된 PubMed만 유지.
6. 모든 교정 실패(2회) → reject. 사람이 직접 확인.
7. 챗봇도 같은 제품 정보 사용.
8. 안 되는 부분은 보고하고 나머지 계속 진행.
9. 빌드 + 배포까지 완료해야 끝.
