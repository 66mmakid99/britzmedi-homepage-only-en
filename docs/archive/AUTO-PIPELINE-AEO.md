# 자동 콘텐츠 파이프라인 + AI 검색 노출 확인

전부 순서대로 실행해. 중간에 멈추지 마.

---

# PART A: 자동 콘텐츠 파이프라인

## Phase 0: 현재 상태 확인

```bash
# content_queue 테이블 존재 여부
npx wrangler d1 execute britzmedi-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%queue%' OR name LIKE '%pipeline%'" 2>&1

# 파이프라인 관련 API 존재 여부
ls -la src/pages/api/admin/content-pipeline/ 2>/dev/null
find src -name "*pipeline*" -o -name "*queue*" | head -20

# generate.ts에서 research 단계가 있는지
grep -n "research\|pubmed\|PubMed\|web_search" src/lib/*generate* src/lib/*content* 2>/dev/null | head -20

# 기존 Content Hub 콘텐츠 발행 로직
grep -rn "publish\|status.*published\|draft" src/pages/api/admin/content-hub/ 2>/dev/null | head -20
```

결과 먼저 보여줘. 이미 있는 건 건너뛰고 없는 것만 구현해.

---

## Phase 1: DB (없으면 생성)

```sql
CREATE TABLE IF NOT EXISTS content_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  search_intent TEXT DEFAULT 'informational',
  priority INTEGER DEFAULT 5,
  target_word_count INTEGER DEFAULT 2000,
  status TEXT DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  content_id INTEGER,
  research_data TEXT,
  analysis_data TEXT,
  quality_score INTEGER,
  quality_gate_passed INTEGER DEFAULT 0,
  auto_published INTEGER DEFAULT 0,
  scheduled_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON content_queue(priority, created_at);

CREATE TABLE IF NOT EXISTS pipeline_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_id INTEGER,
  content_id INTEGER,
  stage TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  duration_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pipeline_logs_queue ON pipeline_logs(queue_id);
```

D1 remote 적용.

---

## Phase 2: 파이프라인 핵심 로직

파일: `src/lib/content-pipeline.ts`

### 전체 흐름

```
키워드 등록 → [1] 리서치 → [2] 콘텐츠 작성 → [3] AI 분석 → [4] Quality Gate 판정 → [5] 자동 발행 or 수동 검토 대기
```

### 2-1. 리서치 단계

```typescript
async function runResearch(env: any, queueItem: QueueItem): Promise<ResearchData> {
  const startTime = Date.now();
  
  // 1. Claude API로 키워드 분석 + 콘텐츠 전략
  const keywordAnalysis = await callClaude(env, {
    model: 'claude-sonnet-4-20250514',
    messages: [{
      role: 'user',
      content: `You are an SEO content strategist for BRITZMEDI, a Korean aesthetic medical device manufacturer specializing in RF technology (TORR RF device).

Target keyword: "${queueItem.keyword}"
Search intent: ${queueItem.search_intent}

Analyze and return JSON only (no markdown):
{
  "keyword_analysis": {
    "primary": "${queueItem.keyword}",
    "secondary": ["related keyword 1", "related keyword 2", ...],
    "search_intent": "informational|commercial|transactional",
    "difficulty": "low|medium|high",
    "recommended_word_count": 2000
  },
  "content_strategy": {
    "title_suggestions": ["Title option 1", "Title option 2", "Title option 3"],
    "angle": "What unique perspective BRITZMEDI can offer",
    "differentiator": "Why BRITZMEDI's content will be better than competitors",
    "target_audience": "Who this content is for",
    "cta_strategy": "What action readers should take"
  },
  "outline": [
    { "h2": "Section title", "key_points": ["point 1", "point 2"], "word_count": 300 }
  ],
  "topics_to_cover": [
    { "topic": "Topic name", "importance": "must|should|nice" }
  ]
}`
    }]
  });

  // 2. PubMed 검색 (의료 기기 관련 키워드면)
  let pubmedSources = [];
  const medicalKeywords = ['rf', 'radiofrequency', 'skin tightening', 'collagen', 'aesthetic', 'clinical', 'dermatology', 'fda'];
  const isMedical = medicalKeywords.some(k => queueItem.keyword.toLowerCase().includes(k));
  
  if (isMedical) {
    try {
      // PubMed E-utilities API (무료, 키 불필요)
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(queueItem.keyword)}&retmax=5&sort=relevance&retmode=json`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const pmids = searchData?.esearchresult?.idlist || [];
      
      if (pmids.length > 0) {
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
        const summaryRes = await fetch(summaryUrl);
        const summaryData = await summaryRes.json();
        
        pubmedSources = pmids.map(id => {
          const article = summaryData?.result?.[id];
          return {
            title: article?.title || '',
            authors: article?.authors?.map(a => a.name).slice(0, 3).join(', ') || '',
            journal: article?.source || '',
            year: article?.pubdate?.split(' ')[0] || '',
            pmid: id,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            type: 'pubmed'
          };
        });
      }
    } catch (e) {
      console.error('PubMed search failed:', e);
    }
  }

  const researchData = {
    ...JSON.parse(keywordAnalysis),
    sources: pubmedSources,
    researched_at: new Date().toISOString()
  };

  // 로그 기록
  await logPipelineStep(env, queueItem.id, null, 'research', 'completed', {
    pubmed_articles: pubmedSources.length,
    duration_ms: Date.now() - startTime
  });

  return researchData;
}
```

### 2-2. 콘텐츠 작성 단계

```typescript
async function generateContent(env: any, queueItem: QueueItem, researchData: ResearchData): Promise<GeneratedContent> {
  const startTime = Date.now();
  
  const pubmedContext = researchData.sources?.length > 0
    ? `\n\nRelevant PubMed articles to reference:\n${researchData.sources.map(s => `- "${s.title}" (${s.journal}, ${s.year}) PMID: ${s.pmid}`).join('\n')}`
    : '';

  const response = await callClaude(env, {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are a professional medical device industry content writer for BRITZMEDI.

BRITZMEDI is a Korean aesthetic medical device manufacturer, specializing in:
- TORR RF: Multi-wave radiofrequency device for skin tightening, body contouring, cellulite treatment
- ULBLANC: Advanced skin rejuvenation system
- NEWCHAE SHOT: Precision injection system
- LUMINO WAVE: LED therapy device

Write a comprehensive, authoritative blog post optimized for AI search engines (AEO/GEO).

Keyword: "${queueItem.keyword}"
Target word count: ${queueItem.target_word_count || 2000}
Content strategy: ${JSON.stringify(researchData.content_strategy)}
Outline: ${JSON.stringify(researchData.outline)}
${pubmedContext}

Requirements:
1. Write in markdown format
2. Include H2 and H3 headings following the outline
3. Cite PubMed articles where relevant (use inline citations like [Author, Year])
4. Include a "Key Takeaways" section at the top
5. Include an FAQ section at the bottom (3-5 questions)
6. Naturally mention BRITZMEDI products where relevant (don't force it)
7. Use professional but accessible language
8. Include specific data, statistics, and clinical evidence
9. End with a clear CTA directing to BRITZMEDI's contact page
10. Optimize for featured snippets: use definition paragraphs, comparison tables, step-by-step lists

Return ONLY the markdown content, no additional commentary.`
    }]
  });

  // 메타 정보 생성
  const metaResponse = await callClaude(env, {
    model: 'claude-sonnet-4-20250514',
    messages: [{
      role: 'user',
      content: `Based on this blog post, generate SEO metadata.

Title of post: (extract from the content below)
Keyword: "${queueItem.keyword}"

Content (first 500 chars): ${response.substring(0, 500)}

Return JSON only:
{
  "title": "SEO optimized title (50-60 chars)",
  "slug": "url-friendly-slug",
  "meta_description": "Compelling meta description (150-160 chars)",
  "excerpt": "2-3 sentence excerpt for listings",
  "tags": ["tag1", "tag2", "tag3"],
  "faqs": [
    { "question": "...", "answer": "..." }
  ]
}`
    }]
  });

  const meta = JSON.parse(metaResponse);
  const wordCount = response.split(/\s+/).length;

  await logPipelineStep(env, queueItem.id, null, 'generate', 'completed', {
    word_count: wordCount,
    duration_ms: Date.now() - startTime
  });

  return {
    content: response,
    title: meta.title,
    slug: meta.slug,
    meta_description: meta.meta_description,
    excerpt: meta.excerpt,
    tags: meta.tags,
    faqs: JSON.stringify(meta.faqs),
    word_count: wordCount
  };
}
```

### 2-3. AI 분석 + Quality Gate 단계

```typescript
async function analyzeAndGate(env: any, queueItem: QueueItem, content: string, keyword: string): Promise<QualityResult> {
  const startTime = Date.now();

  const analysisResponse = await callClaude(env, {
    model: 'claude-sonnet-4-20250514',
    messages: [{
      role: 'user',
      content: `You are a strict content quality analyst. Score this blog post on 5 dimensions (0-100).
Be harsh but fair. Only content that is genuinely excellent should score above 80.

Keyword: "${keyword}"
Content:
${content}

Scoring criteria:
- SEO (0-100): Keyword in title, H2s, first paragraph, meta description potential, internal link opportunities, schema markup potential
- Readability (0-100): Sentence variety, paragraph length, jargon explained, logical flow, transitions
- Completeness (0-100): Topic fully covered, all outline points addressed, word count adequate, no gaps
- Originality (0-100): Unique insights, not generic, BRITZMEDI-specific perspective, original analysis
- Structure (0-100): Clear hierarchy, intro/conclusion, FAQ section, key takeaways, scannable

Return JSON only:
{
  "scores": {
    "seo": 0,
    "readability": 0, 
    "completeness": 0,
    "originality": 0,
    "structure": 0,
    "overall": 0
  },
  "quality_gate": {
    "passed": true/false,
    "reason": "Why it passed or failed",
    "blocking_issues": ["Issue that must be fixed before publishing"],
    "recommendations": ["Nice to have improvements"]
  },
  "aeo_readiness": {
    "has_featured_snippet_content": true/false,
    "has_faq_schema": true/false,
    "has_definition_paragraphs": true/false,
    "has_comparison_tables": true/false,
    "has_clinical_citations": true/false,
    "score": 0
  }
}

Quality Gate rules:
- PASS (auto-publish): overall >= 75 AND no blocking_issues AND aeo_readiness.score >= 60
- REVIEW (manual check): overall 60-74 OR has blocking_issues
- REJECT (rewrite needed): overall < 60`
    }]
  });

  const analysis = JSON.parse(analysisResponse);
  
  await logPipelineStep(env, queueItem.id, null, 'analyze', 'completed', {
    overall_score: analysis.scores.overall,
    gate_passed: analysis.quality_gate.passed,
    aeo_score: analysis.aeo_readiness.score,
    duration_ms: Date.now() - startTime
  });

  return analysis;
}
```

### 2-4. 자동 발행

```typescript
async function autoPublish(env: any, contentId: number, queueId: number): Promise<void> {
  // content_items status를 published로 변경
  await env.DB.prepare(
    'UPDATE content_items SET status = ?, published_at = ? WHERE id = ?'
  ).bind('published', new Date().toISOString(), contentId).run();

  // content_queue 업데이트
  await env.DB.prepare(
    'UPDATE content_queue SET auto_published = 1, status = ?, completed_at = ? WHERE id = ?'
  ).bind('published', new Date().toISOString(), queueId).run();

  // 알림 발송
  const { notifyNewLead } = await import('./email-notifications');
  // notifyNewLead 대신 별도 함수 사용하거나, 간단히 admin_notifications에 INSERT
  await env.DB.prepare(
    'INSERT INTO admin_notifications (type, title, message, link, data) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    'content_published',
    '✅ Content auto-published',
    `Quality Gate passed. Content published automatically.`,
    `/admin/content-hub`,
    JSON.stringify({ content_id: contentId, queue_id: queueId })
  ).run();

  await logPipelineStep(env, queueId, contentId, 'publish', 'auto_published', {});
}
```

### 2-5. 전체 파이프라인 오케스트레이터

```typescript
export async function processQueueItem(env: any, queueId: number): Promise<PipelineResult> {
  const queue = await env.DB.prepare('SELECT * FROM content_queue WHERE id = ?').bind(queueId).first();
  if (!queue) throw new Error('Queue item not found');
  
  // 상태 업데이트: processing
  await env.DB.prepare('UPDATE content_queue SET status = ?, started_at = ? WHERE id = ?')
    .bind('processing', new Date().toISOString(), queueId).run();

  try {
    // [1] 리서치
    await updateQueueStatus(env, queueId, 'researching');
    const researchData = await runResearch(env, queue);
    await env.DB.prepare('UPDATE content_queue SET research_data = ? WHERE id = ?')
      .bind(JSON.stringify(researchData), queueId).run();

    // [2] 콘텐츠 작성
    await updateQueueStatus(env, queueId, 'generating');
    const generated = await generateContent(env, queue, researchData);

    // content_items에 저장
    const result = await env.DB.prepare(
      `INSERT INTO content_items (title, slug, keyword, content, meta_description, excerpt, tags, faqs, word_count, status, research_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
    ).bind(
      generated.title,
      generated.slug,
      queue.keyword,
      generated.content,
      generated.meta_description,
      generated.excerpt,
      JSON.stringify(generated.tags),
      generated.faqs,
      generated.word_count,
      JSON.stringify(researchData),
      new Date().toISOString()
    ).run();
    
    const contentId = result.meta.last_row_id;
    await env.DB.prepare('UPDATE content_queue SET content_id = ? WHERE id = ?')
      .bind(contentId, queueId).run();

    // [3] AI 분석 + Quality Gate
    await updateQueueStatus(env, queueId, 'analyzing');
    const analysis = await analyzeAndGate(env, queue, generated.content, queue.keyword);
    
    await env.DB.prepare('UPDATE content_queue SET analysis_data = ?, quality_score = ? WHERE id = ?')
      .bind(JSON.stringify(analysis), analysis.scores.overall, queueId).run();
    
    await env.DB.prepare('UPDATE content_items SET analysis_data = ? WHERE id = ?')
      .bind(JSON.stringify(analysis), contentId).run();

    // [4] Quality Gate 판정
    if (analysis.quality_gate.passed && analysis.scores.overall >= 75 && analysis.aeo_readiness.score >= 60) {
      // 자동 발행
      await autoPublish(env, contentId, queueId);
      return { status: 'published', contentId, score: analysis.scores.overall, queueId };
    } else if (analysis.scores.overall >= 60) {
      // 수동 검토 대기
      await updateQueueStatus(env, queueId, 'review');
      await env.DB.prepare(
        'INSERT INTO admin_notifications (type, title, message, link) VALUES (?, ?, ?, ?)'
      ).bind('content_review', '⚠️ Content needs review', 
        `Score: ${analysis.scores.overall}/100. ${analysis.quality_gate.reason}`,
        `/admin/content-hub/edit/${contentId}`
      ).run();
      return { status: 'review', contentId, score: analysis.scores.overall, queueId };
    } else {
      // 리라이트 필요 → 자동 리트라이 (최대 3회)
      if (queue.retry_count < (queue.max_retries || 3)) {
        await env.DB.prepare('UPDATE content_queue SET status = ?, retry_count = retry_count + 1 WHERE id = ?')
          .bind('queued', queueId).run();
        await logPipelineStep(env, queueId, contentId, 'gate', 'retry', { 
          score: analysis.scores.overall, reason: analysis.quality_gate.reason 
        });
        // 재귀 호출 대신 queued 상태로 되돌려서 다음 process에서 재시도
        return { status: 'retry', contentId, score: analysis.scores.overall, queueId, retryCount: queue.retry_count + 1 };
      } else {
        await updateQueueStatus(env, queueId, 'failed');
        return { status: 'failed', contentId, score: analysis.scores.overall, queueId };
      }
    }
  } catch (error: any) {
    await env.DB.prepare('UPDATE content_queue SET status = ?, error_message = ? WHERE id = ?')
      .bind('error', error.message, queueId).run();
    await logPipelineStep(env, queueId, null, 'error', error.message, {});
    throw error;
  }
}
```

### 2-6. 유틸 함수

```typescript
async function callClaude(env: any, params: any): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: params.model || 'claude-sonnet-4-20250514',
      max_tokens: params.max_tokens || 4096,
      messages: params.messages
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Claude API error: ${data?.error?.message || response.status}`);
  return data.content[0].text;
}

async function updateQueueStatus(env: any, queueId: number, status: string) {
  await env.DB.prepare('UPDATE content_queue SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, new Date().toISOString(), queueId).run();
}

async function logPipelineStep(env: any, queueId: number, contentId: number | null, stage: string, action: string, details: any) {
  await env.DB.prepare(
    'INSERT INTO pipeline_logs (queue_id, content_id, stage, action, details, duration_ms) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(queueId, contentId, stage, action, JSON.stringify(details), details.duration_ms || 0).run();
}
```

---

## Phase 3: API 엔드포인트

### POST /api/admin/content-pipeline/queue
키워드 등록.

```typescript
// body: { keyword, search_intent?, priority?, target_word_count? }
// → content_queue에 INSERT
// → 응답: { id, keyword, status: 'queued' }
```

### GET /api/admin/content-pipeline/queue
대기열 목록.

```typescript
// query: ?status=queued|processing|review|published|failed|all
// → content_queue 목록 반환 (최신순)
```

### POST /api/admin/content-pipeline/process/:id
특정 큐 아이템 실행.

```typescript
// → processQueueItem(env, id) 호출
// → 결과 반환: { status, contentId, score }
// 주의: 시간 오래 걸림 (30초-2분). Cloudflare Workers 타임아웃 주의.
```

### POST /api/admin/content-pipeline/process-next
대기열에서 가장 높은 우선순위 아이템 처리.

```typescript
// → status='queued'인 것 중 priority 높은 것 선택
// → processQueueItem 실행
```

### POST /api/admin/content-pipeline/batch
여러 키워드 한 번에 등록.

```typescript
// body: { keywords: [{ keyword, search_intent?, priority? }, ...] }
// → 전부 content_queue에 INSERT
// → 응답: { queued: 5, ids: [1,2,3,4,5] }
```

### GET /api/admin/content-pipeline/logs
파이프라인 실행 로그.

```typescript
// query: ?queue_id=1 또는 ?content_id=1
// → pipeline_logs 반환
```

### GET /api/admin/content-pipeline/stats
파이프라인 통계.

```typescript
// → { total_queued, processing, published, review, failed, avg_score, avg_duration }
```

---

## Phase 4: Admin UI — Pipeline 대시보드

Admin 사이드바 CONTENT 그룹에 "Pipeline" 메뉴 추가.
페이지: /admin/content-pipeline

### 4-1. 상단 KPI 카드
- Queued (대기 중)
- Processing (처리 중)
- Published (자동 발행)
- Review (검토 대기)
- Failed (실패)
- Avg Score (평균 점수)

### 4-2. 키워드 등록 폼
```
[ 키워드 입력                    ] [intent ▼] [priority ▼] [+ Add]
[ 또는 여러 키워드 (한 줄에 하나) ] [Batch Add]
```

### 4-3. 큐 목록 테이블
```
| # | Keyword | Status | Score | Content | Created | Actions |
|---|---------|--------|-------|---------|---------|---------|
| 1 | rf skin tightening | ✅ published | 82 | View | 2h ago | Logs |
| 2 | collagen therapy | ⚠️ review | 68 | Edit | 1h ago | Retry / Logs |
| 3 | aesthetic device FDA | ⏳ queued | - | - | 5m ago | Process / Delete |
```

- Status 배지: queued=회색, processing=파랑, published=초록, review=노랑, failed=빨강
- Process 버튼: 해당 아이템 즉시 실행
- Retry 버튼: 실패한 아이템 재시도
- View: 발행된 콘텐츠로 이동
- Edit: Content Editor로 이동
- Logs: 파이프라인 로그 모달

### 4-4. Process All 버튼
queued 상태인 아이템 전부 순차 처리 (한 번에 하나씩).

---

## Phase 5: 빌드 + 배포 + 테스트

```bash
npm run build
git add -A
git commit -m "feat: Auto content pipeline - research, generate, quality gate, auto-publish"
git push
```

배포 후 테스트:

```bash
# 키워드 등록
curl -X POST https://britzmedi.com/api/admin/content-pipeline/queue \
  -H "Content-Type: application/json" \
  -H "Cookie: [admin session]" \
  -d '{"keyword": "radiofrequency skin tightening benefits", "search_intent": "informational", "priority": 1}'

# 실행
curl -X POST https://britzmedi.com/api/admin/content-pipeline/process/1 \
  -H "Cookie: [admin session]"

# 결과 확인
curl https://britzmedi.com/api/admin/content-pipeline/queue?status=all \
  -H "Cookie: [admin session]"
```

Admin 로그인 후 /admin/content-pipeline에서 UI 확인.

---

---

# PART B: AI 검색 노출 확인 시스템

## Phase 6: AEO/GEO 모니터링

britzmedi.com이 AI 검색 엔진에서 언급되는지 확인하는 시스템.

### 6-1. 수동 체크 API

POST /api/admin/aeo-check

```typescript
// AI 검색 엔진에 BRITZMEDI 관련 질문을 보내고 응답에 britzmedi.com이 언급되는지 확인
// 
// 체크할 질문 목록 (하드코딩):
const AEO_CHECK_QUERIES = [
  "What are the best radiofrequency devices for aesthetic clinics?",
  "TORR RF device reviews and specifications",
  "Korean aesthetic medical device manufacturers",
  "Best RF skin tightening machines for clinics",
  "BRITZMEDI TORR RF vs competitors",
  "FDA cleared radiofrequency devices for body contouring",
  "Multi-wave RF technology for aesthetic treatments",
  "Best aesthetic device distributors for clinics",
  "RF device for cellulite treatment clinical evidence",
  "Korean beauty device manufacturers B2B"
];
//
// 각 질문에 대해:
// 1. Claude API에 web_search tool 활성화해서 질문
// 2. 응답에서 "britzmedi" 또는 "BRITZMEDI" 또는 "britzmedi.com" 또는 "TORR RF" 언급 체크
// 3. 결과 저장
```

### 6-2. DB 테이블

```sql
CREATE TABLE IF NOT EXISTS aeo_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  ai_engine TEXT DEFAULT 'claude',
  response_text TEXT,
  mentioned INTEGER DEFAULT 0,
  mention_context TEXT,
  source_urls TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 6-3. Claude API with web_search

```typescript
async function checkAEO(env: any, query: string): Promise<AEOResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: query
      }]
    })
  });

  const data = await response.json();
  const fullText = data.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join(' ');

  const mentioned = /britzmedi|BRITZMEDI|torr\s*rf|TORR\s*RF/i.test(fullText);
  
  // 언급된 컨텍스트 추출
  let mentionContext = '';
  if (mentioned) {
    const regex = /.{0,100}(britzmedi|BRITZMEDI|torr\s*rf|TORR\s*RF).{0,100}/gi;
    const matches = fullText.match(regex);
    mentionContext = matches ? matches.join(' ... ') : '';
  }

  return { query, mentioned, mentionContext, fullText, ai_engine: 'claude' };
}
```

### 6-4. Admin AEO 대시보드

Admin 사이드바 MARKETING 그룹에 "AEO Monitor" 메뉴 추가.
페이지: /admin/aeo-monitor

- 상단: [Run AEO Check] 버튼 → 10개 질문 전부 체크 (시간 소요 안내)
- 결과 테이블:
```
| Query | Mentioned | Context | Checked |
|-------|-----------|---------|---------|
| Best RF devices... | ✅ Yes | "...BRITZMEDI's TORR RF is..." | 2h ago |
| Korean device mfg... | ❌ No | - | 2h ago |
```
- 멘션율: 3/10 (30%) — 큰 숫자로 표시
- 트렌드: 이전 체크 대비 변화 (↑↓)
- 미언급 질문에 대한 조치: "이 키워드로 콘텐츠를 만들면 노출 가능성이 높아집니다" + [Add to Pipeline] 버튼

### 6-5. [Add to Pipeline] 연동

AEO 체크에서 미언급 질문 → 클릭 한 번으로 content_queue에 키워드 등록.
```
미언급 질문: "Best RF skin tightening machines for clinics"
→ [Add to Pipeline] 클릭
→ content_queue에 keyword 등록 (priority: 1, search_intent 자동 판별)
```

---

## Phase 7: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "feat: AEO/GEO monitor - AI search exposure tracking + pipeline integration"
git push
```

---

## Phase 8: 문서 업데이트

CHANGELOG.md, ARCHITECTURE.md, TODO.md 전부 업데이트.

---

## 핵심 규칙

1. Phase 0에서 이미 있는 건 건너뛰기
2. Claude API 모델: claude-sonnet-4-20250514
3. PubMed API는 무료 E-utilities 사용 (API 키 불필요)
4. Quality Gate 기준: overall >= 75 AND aeo_readiness >= 60 → 자동 발행
5. Cloudflare Workers 타임아웃 주의: 개별 Claude API 호출이 오래 걸릴 수 있으니 에러 핸들링 철저히
6. 안 되는 부분은 보고하고 나머지 계속 진행
7. 빌드 성공 + 배포까지 완료해야 끝
