# 콘텐츠 전략 규칙 + 블로그 품질 개선

전부 순서대로 실행해. 중간에 멈추지 마.

---

## Phase 1: 콘텐츠 전략 규칙 추가

파일: `src/lib/britzmedi-products.ts`에 전략 규칙 추가:

```typescript
export const CONTENT_STRATEGY_RULES = {
  // BRITZMEDI 핵심 기술
  core_technology: 'radiofrequency (RF)',
  
  // 경쟁 기술 목록 — 이 기술들은 단독 가이드 금지
  competitor_technologies: [
    'ultrasound', 'HIFU', 'laser', 'cryolipolysis', 'coolsculpting',
    'ultrasonic cavitation', 'electromagnetic', 'EMS', 'HIFEM'
  ],

  // 콘텐츠 전략 규칙
  rules: [
    'NEVER publish a standalone guide about a competitor technology on BRITZMEDI blog',
    'Competitor technologies MUST be covered in comparison format: "RF vs [Competitor]"',
    'RF technology must always be presented as a primary option, with fair but favorable comparison',
    'Every article must have a strategic connection to BRITZMEDI products',
    'If an article topic does not relate to RF technology, skin tightening, body contouring, or aesthetic devices — do not write it'
  ],

  // 허용/금지 글 유형
  allowed_topics: [
    'RF skin tightening (any angle)',
    'RF body contouring (any angle)',
    'RF vs [competitor technology] comparison',
    'Multi-wave RF technology deep dive',
    'Aesthetic device buying guide (with RF featured)',
    'Clinical evidence for RF treatments',
    'Korean aesthetic device market (with BRITZMEDI context)',
    'Clinic ROI analysis for RF devices',
    'Patient education about RF treatments',
    'FDA clearance process for aesthetic devices'
  ],
  
  banned_topics: [
    'Standalone ultrasound/HIFU guide (without RF comparison)',
    'Standalone laser treatment guide (without RF comparison)',
    'Standalone cryotherapy guide (without RF comparison)',
    'Any guide that promotes a competitor technology without comparing to RF',
    'Topics unrelated to aesthetic devices or BRITZMEDI market'
  ],

  // 글 길이 규칙
  word_count: {
    min: 1500,
    max: 2500,
    ideal: 2000,
    rule: 'Over 2500 words causes high bounce rate. Keep focused and concise.'
  },

  // CTA 규칙
  cta_rules: {
    minimum_count: 2,
    positions: ['after_first_major_section (around 500 words)', 'end_of_article'],
    format: 'Subtle inline CTA, not aggressive banner. Example: "Learn more about multi-wave RF technology at [britzmedi.com/products/torr-rf](https://britzmedi.com/products/torr-rf)"',
    never: 'Never use aggressive sales language like "Buy now" or "Order today"'
  }
};
```

---

## Phase 2: 파이프라인에 전략 검증 단계 추가

파일: `src/lib/content-postprocess.ts`에 함수 추가:

### 2-1. 주제 적합성 검증

```typescript
import { CONTENT_STRATEGY_RULES } from './britzmedi-products';

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
```

### 2-2. 글 길이 검증 + 자동 트리밍

```typescript
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
```

### 2-3. CTA 위치 검증 + 자동 삽입

```typescript
export function checkAndInsertCTAs(content: string): { content: string; ctaCount: number; inserted: number; } {
  // 기존 CTA 감지
  const ctaPatterns = /britzmedi\.com\/contact|britzmedi\.com\/products|learn more|request a demo|get in touch|contact.*team/gi;
  const existingCTAs = (content.match(ctaPatterns) || []).length;

  if (existingCTAs >= 2) {
    return { content, ctaCount: existingCTAs, inserted: 0 };
  }

  let modified = content;
  let inserted = 0;

  // 중간 CTA 삽입 (첫 번째 H2 섹션 끝에)
  if (existingCTAs < 1) {
    // 두 번째 ## 헤딩 직전에 CTA 삽입
    const h2Positions: number[] = [];
    const h2Regex = /^## /gm;
    let match;
    while ((match = h2Regex.exec(modified)) !== null) {
      h2Positions.push(match.index);
    }
    
    if (h2Positions.length >= 3) {
      const insertPos = h2Positions[2]; // 세 번째 H2 직전
      const midCTA = '\n\n> **Interested in RF technology for your clinic?** [Explore TORR RF specifications and clinical data →](https://britzmedi.com/products/torr-rf)\n\n';
      modified = modified.slice(0, insertPos) + midCTA + modified.slice(insertPos);
      inserted++;
    }
  }

  // 끝 CTA (없으면 추가)
  const hasEndCTA = /britzmedi\.com/.test(modified.slice(-500));
  if (!hasEndCTA) {
    const endCTA = '\n\n---\n\n*Looking for a reliable RF device for your aesthetic clinic? [Contact BRITZMEDI](https://britzmedi.com/contact) to discuss your needs or [explore our product range](https://britzmedi.com/products).*\n';
    // FAQ 전이면 FAQ 직전에, 없으면 맨 끝에
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
```

---

## Phase 3: 파이프라인 후처리 순서 업데이트

content-pipeline.ts의 후처리 단계에 추가. 기존 순서 앞에 전략 검증 삽입:

```typescript
// === [2.5] 후처리 ===

// 순서 0: 주제 적합성 검증 (NEW — 최우선)
import { checkTopicRelevance, checkWordCount, checkAndInsertCTAs } from './content-postprocess';

const topicCheck = checkTopicRelevance(queue.keyword, generated.content);
if (topicCheck.isCompetitorStandalone) {
  // 경쟁 기술 단독 가이드 → 자동으로 비교 글로 재작성
  await logPipelineStep(env, queueId, null, 'postprocess', 'competitor_standalone_detected', {
    issues: topicCheck.issues,
    suggestion: topicCheck.suggestion
  });
  
  const rewriteResponse = await callClaude(env, {
    messages: [{
      role: 'user',
      content: `This article is a standalone guide about a competitor technology. BRITZMEDI is an RF company — we cannot publish standalone guides about competing technologies.

REWRITE this article as a COMPARISON: "RF vs [This Technology]"
- Keep useful clinical/technical information
- Add substantial RF technology sections (at least 40% of content)
- Include comparison table: RF vs this technology
- Conclusion should fairly favor RF while being objective
- Target word count: 2000 words (current article is too long, trim it)
- Add BRITZMEDI TORR RF as the recommended RF option

${topicCheck.suggestion ? `Suggested new angle: ${topicCheck.suggestion}` : ''}

Original article:
${generated.content}`
    }]
  });
  generated.content = rewriteResponse;
  
  // 제목도 업데이트
  const newTitle = await callClaude(env, {
    messages: [{
      role: 'user',
      content: `Generate a new SEO title for this RF comparison article. Max 60 characters. Return ONLY the title, nothing else.\n\nArticle first 500 chars:\n${generated.content.substring(0, 500)}`
    }]
  });
  generated.title = newTitle.trim();
}

// 순서 0.5: 글 길이 체크 (NEW)
const wordCheck = checkWordCount(generated.content);
if (wordCheck.isTooLong) {
  const trimResponse = await callClaude(env, {
    messages: [{
      role: 'user',
      content: `This article is ${wordCheck.wordCount} words. Trim to 2000-2500 words maximum.
Rules:
- Remove redundant sections and repetitive points
- Merge similar sections
- Keep the most valuable and unique content
- Keep comparison tables, FAQs, and key data points
- Keep all internal links and CTAs
- Maintain article structure (intro, body, FAQ, conclusion)
Return the full trimmed article.

Article:
${generated.content}`
    }]
  });
  generated.content = trimResponse;
  await logPipelineStep(env, queueId, null, 'postprocess', 'trimmed', {
    before: wordCheck.wordCount,
    after: trimResponse.split(/\s+/).length
  });
}

// 순서 1: 제품 팩트체크 (기존)
// 순서 2: 인용 검증 (기존)
// 순서 3: 자사 홍보 체크 (기존)
// 순서 4: 비교표 체크 (기존)
// 순서 5: 첫 문단 체크 (기존)
// 순서 6: 내부 링크 (기존)

// 순서 7: CTA 삽입 (NEW)
const ctaResult = checkAndInsertCTAs(generated.content);
generated.content = ctaResult.content;
if (ctaResult.inserted > 0) {
  await logPipelineStep(env, queueId, null, 'postprocess', 'cta_inserted', {
    existing: ctaResult.ctaCount - ctaResult.inserted,
    inserted: ctaResult.inserted,
    total: ctaResult.ctaCount
  });
}

// 순서 8: 저자 설정 (기존)
```

---

## Phase 4: 생성 프롬프트에 전략 규칙 주입

content-angles.ts 또는 콘텐츠 생성 프롬프트에 추가:

모든 프롬프트의 CRITICAL RULES에 추가:

```
CONTENT STRATEGY RULES:

13. COMPETITOR TECHNOLOGY: If the topic involves ultrasound, HIFU, laser, cryolipolysis, or any non-RF technology, you MUST write it as a COMPARISON with RF. Never write a standalone guide for a competing technology. BRITZMEDI is an RF company.

14. WORD COUNT: Keep articles between 1500-2500 words. Over 2500 causes high bounce rates. Be focused and concise — depth on fewer points beats shallow coverage of many points.

15. CTA PLACEMENT: Include at least 2 CTAs:
    - One after the first major section (~500 words in): subtle inline link to britzmedi.com/products/torr-rf
    - One before FAQ or at article end: contact link to britzmedi.com/contact
    Format: Informative, not salesy. "Explore specifications →" not "Buy now!"

16. STRATEGIC RELEVANCE: Every article must connect to BRITZMEDI's core business (RF aesthetic devices). If a topic cannot be connected to RF technology, skin tightening, body contouring, or aesthetic device market — do not write about it.
```

---

## Phase 5: Quality Gate에 전략 체크 추가

analyzeAndGate 함수의 분석 프롬프트에 추가:

```
Strategic checks:
- If article is a standalone guide for a competitor technology (ultrasound, HIFU, laser, cryo) without RF comparison → blocking_issue: "Competitor standalone guide — must include RF comparison"
- If article exceeds 2500 words → reduce readability by 10 points  
- If article has fewer than 2 CTAs → reduce structure by 5 points
- If article has no connection to RF technology or BRITZMEDI market → blocking_issue: "No strategic relevance to BRITZMEDI"
```

---

## Phase 6: 기존 문제 글 처리

### 6-1. id:2 "Ultrasound Body Contouring" 삭제 또는 재작성

이 글은 경쟁 기술 단독 가이드. 두 가지 중 하나:

**옵션 A (추천): 재작성**
```sql
-- content_items id=2의 상태를 draft로 변경
UPDATE content_items SET status = 'draft' WHERE id = 2;
```
그리고 Pipeline에 새 키워드 등록:
"RF vs Ultrasound body contouring comparison" (P1, informational)
→ Process → 비교 글 생성 → 발행되면 id:2 삭제

**옵션 B: 즉시 삭제**
```sql
UPDATE content_items SET status = 'archived' WHERE id = 2;
```

**옵션 A로 진행해.**

### 6-2. 기존 발행글 전체 감사 재실행

```bash
curl https://britzmedi.com/api/admin/content-hub/audit
```
→ 전략 체크(경쟁 기술 단독, 글 길이, CTA) 결과도 포함되는지 확인.

---

## Phase 7: Related Articles 썸네일 확인

블로그 하단 Related Articles 이미지가 깨져 보임.

```bash
# 블로그 관련 컴포넌트 찾기
grep -rn "Related\|related.*article\|related.*post" src/components/ src/layouts/ 2>/dev/null | head -20

# 이미지 경로 확인
grep -rn "thumbnail\|featured.*image\|cover.*image\|og.*image" src/components/*blog* src/layouts/*blog* 2>/dev/null | head -20
```

이미지 경로가 잘못되었거나, content_items에 thumbnail이 없는 경우 기본 이미지(placeholder) 표시하도록 수정.

---

## Phase 8: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "feat: Content strategy rules - competitor comparison enforcement, word count limits, CTA auto-insert, topic relevance check"
git push
```

---

## Phase 9: 테스트

1. Pipeline에서 "ultrasound body contouring" 키워드 등록 + Process
   → 자동으로 "RF vs Ultrasound" 비교 글로 재작성되는지 확인
2. 기존 id:2 draft 상태 확인
3. 새 비교 글의 길이가 2500단어 이내인지 확인
4. CTA가 2개 이상 있는지 확인
5. Quality Gate 통과하는지 확인
6. "RF vs Ultrasound body contouring comparison" 글 발행 후 블로그에서 확인

---

## 핵심 규칙

1. BRITZMEDI 블로그에 경쟁 기술 단독 가이드 절대 금지
2. 경쟁 기술은 반드시 RF와 비교 형식으로만 작성
3. 글 길이 2500단어 초과 금지 (이탈률 방지)
4. CTA 최소 2개 (중간 1개 + 끝 1개)
5. 모든 글은 BRITZMEDI 핵심 사업(RF 미용 기기)과 연결되어야 함
6. id:2 초음파 단독 글은 draft로 변경 + 비교 글로 대체
7. 안 되는 부분은 보고하고 나머지 계속 진행
8. 빌드 + 배포까지 완료해야 끝
