# BRITZMEDI 개발 명세서 — Content System 전체 구축
# Claude Code가 순서대로 전부 구현할 것
# 각 Part 완료 후 빌드 확인 → 다음 Part 진행
# 최종적으로 프로덕션 배포까지

---

## Part A: Content Editor 고도화 (DB + API)

### A-1. DB 마이그레이션

파일: `migrations/0015_content_editor_enhance.sql` (번호는 기존 마이그레이션 다음 번호로)

```sql
-- Content Editor 고도화: 리서치/분석/리비전

ALTER TABLE content_items ADD COLUMN research_data TEXT;
ALTER TABLE content_items ADD COLUMN analysis_data TEXT;

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  faqs TEXT,
  change_summary TEXT,
  word_count INTEGER,
  score INTEGER,
  created_by TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revisions_content ON content_revisions(content_id, version);
```

D1 remote에 적용:
```bash
npx wrangler d1 execute britzmedi-db --remote --file=migrations/0015_content_editor_enhance.sql
```

### A-2. API 엔드포인트 5개

#### (1) POST /api/admin/content-hub/analyze

파일: `src/pages/api/admin/content-hub/analyze.ts`

요청:
```json
{ "content_id": 1 }
```

로직:
1. content_items에서 id로 콘텐츠 가져오기 (title, content, keyword, meta_description, faqs)
2. Claude API 호출 (model: claude-sonnet-4-20250514, max_tokens: 4000)
3. 시스템 프롬프트:

```
You are a STRICT content quality auditor for BRITZMEDI, a Korean aesthetic medical device manufacturer.
Your job is to ensure only genuinely valuable, evidence-based content gets published.

DO NOT be lenient. Most AI-generated content is generic garbage.
Only score 85+ if the content genuinely provides unique, evidence-based value.

Score this content on 5 dimensions (total 100 points):

1. EVIDENCE-BASED VALUE (35 pts):
   - How many PubMed/academic sources are cited with specific data?
   - Are the citations recent (within 3 years)?
   - Are there concrete numbers (n=, p<, %, effect sizes)?
   - Is the scientific explanation accurate and deep, not surface-level?
   - Score 0 if there are NO real academic citations.
   - Score 28+ only if 3+ recent papers cited with specific data points.

2. UNIQUE PERSPECTIVE (25 pts):
   - Could ANY company publish this exact content? If yes → max 10 pts
   - Does it contain manufacturer-level technical insight?
   - Is there a section that ONLY BRITZMEDI could write?
   - Does it connect research findings to specific BRITZMEDI technology?
   - BRITZMEDI products: TORR RF (Multi-Wave RF, FDA 510k), ULBLANC (ultrasound), NEWCHAE SHOT (needle-free meso), LUMINO WAVE
   - Score 18+ only if genuinely unique manufacturer perspective present.

3. COMPLETENESS (20 pts):
   - Does it cover all key subtopics a reader would expect?
   - Are FAQs present and based on real search queries?
   - Is there a TL;DR or executive summary?
   - Word count appropriate for topic depth?

4. READABILITY (10 pts):
   - Professional yet accessible?
   - Technical terms explained?
   - Logical structure with clear H2/H3 hierarchy?

5. AEO/GEO/SEO (10 pts):
   - Keyword in title, meta description, first 100 words, H2s?
   - FAQ format suitable for AI search snippet extraction?
   - Internal links to BRITZMEDI pages?

Return ONLY valid JSON:
{
  "scores": {
    "evidence": { "score": 0, "max": 35, "details": ["..."] },
    "uniqueness": { "score": 0, "max": 25, "details": ["..."] },
    "completeness": { "score": 0, "max": 20, "details": ["..."] },
    "readability": { "score": 0, "max": 10, "details": ["..."] },
    "aeo_seo": { "score": 0, "max": 10, "details": ["..."] }
  },
  "overall_score": 0,
  "critical_issues": ["..."],
  "suggestions": [
    { "priority": "high", "title": "...", "description": "...", "auto_fixable": true }
  ],
  "publish_recommendation": "auto_publish|needs_rewrite|manual_review"
}
```

4. 결과를 content_items.analysis_data에 JSON 문자열로 UPDATE
5. 응답으로 분석 결과 반환

#### (2) POST /api/admin/content-hub/rewrite

파일: `src/pages/api/admin/content-hub/rewrite.ts`

요청:
```json
{ 
  "content_id": 1, 
  "mode": "full",
  "instructions": "Add more PubMed citations and BRITZMEDI perspective"
}
```

로직:
1. content_items에서 콘텐츠 가져오기
2. 현재 버전을 content_revisions에 자동 저장 (리라이트 전 백업)
3. Claude API 호출: 기존 콘텐츠 + research_data + analysis_data의 suggestions를 참고해서 개선
4. mode가 'section'이면 section_index 기반으로 해당 섹션만 리라이트
5. 개선된 마크다운 반환 (DB에는 저장하지 않음 — 프론트에서 확인 후 저장)

#### (3) POST /api/admin/content-hub/suggest-section

파일: `src/pages/api/admin/content-hub/suggest-section.ts`

요청:
```json
{ "content_id": 1, "suggestion_type": "britzmedi_perspective" }
```

로직:
1. 콘텐츠 + research_data 가져오기
2. suggestion_type에 따라 부족한 섹션 생성:
   - "britzmedi_perspective": BRITZMEDI 관점 섹션
   - "clinical_evidence": 임상 근거 섹션
   - "faq_expansion": FAQ 추가
   - "comparison": 경쟁 기술 비교 섹션
3. 마크다운으로 반환

#### (4) GET /api/admin/content-hub/items/[id]/revisions

파일: `src/pages/api/admin/content-hub/items/[id]/revisions.ts`

로직:
1. content_id로 content_revisions 조회 (ORDER BY version DESC)
2. 목록 반환: version, change_summary, word_count, score, created_at

#### (5) POST /api/admin/content-hub/items/[id]/revisions

파일: `src/pages/api/admin/content-hub/items/[id]/revisions.ts` (같은 파일, POST 핸들러)

요청:
```json
{ "change_summary": "Added PubMed citations" }
```

로직:
1. content_items에서 현재 콘텐츠 가져오기
2. 최신 version 번호 조회 후 +1
3. content_revisions에 INSERT
4. 새 revision 반환

### A-3. 기존 Save API 수정

기존 콘텐츠 저장 API (PUT /api/admin/content-hub/items/[id] 또는 유사 경로)에서:
- 저장 시 자동으로 content_revisions에 현재 버전 저장
- change_summary는 "Auto-saved" 또는 "Manual save"

---

## Part B: 자동 콘텐츠 파이프라인

### B-1. DB 마이그레이션

파일: `migrations/0016_content_pipeline.sql`

```sql
CREATE TABLE IF NOT EXISTS content_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  search_intent TEXT,
  priority INTEGER DEFAULT 5,
  target_word_count INTEGER DEFAULT 2000,
  status TEXT DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  content_id INTEGER,
  research_data TEXT,
  analysis_data TEXT,
  scheduled_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pipeline_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER,
  queue_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

D1 remote 적용.

### B-2. 파이프라인 핵심 로직

파일: `src/lib/content-pipeline.ts` (또는 적절한 위치)

#### PubMed 리서치 함수

```typescript
async function searchPubMed(keyword: string): Promise<PubMedArticle[]> {
  // 1. 검색
  const searchTerm = encodeURIComponent(
    `${keyword} AND (radiofrequency OR aesthetic OR dermatology OR skin OR collagen)`
  );
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchTerm}&retmax=10&sort=date&retmode=json`;
  const searchResult = await fetch(searchUrl).then(r => r.json());
  const pmids = searchResult.esearchresult?.idlist || [];
  
  if (pmids.length === 0) return [];
  
  // 2. 상세 정보 (초록 포함) — XML로 가져와서 파싱
  const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
  const xmlText = await fetch(fetchUrl).then(r => r.text());
  
  // 3. XML에서 필요한 정보 추출
  // 각 <PubmedArticle>에서:
  // - ArticleTitle
  // - AuthorList → 첫 번째 저자
  // - Journal → Title, Year
  // - AbstractText
  // - PMID
  // - DOI (ELocationID)
  
  return parsedArticles;
}
```

참고: XML 파싱이 복잡하면 rettype=abstract&retmode=text로 텍스트 형태로 가져와서 파싱해도 됨.
또는 간단한 정규식/split으로 처리.

#### 전체 파이프라인 함수

```typescript
async function processKeyword(queueId: number, env: Env) {
  const queue = await env.DB.prepare('SELECT * FROM content_queue WHERE id = ?').bind(queueId).first();
  if (!queue) throw new Error('Queue item not found');
  
  const keyword = queue.keyword;
  
  try {
    // ═══ Step 1: 리서치 ═══
    await updateQueueStatus(env, queueId, 'researching');
    await logPipeline(env, null, queueId, 'research_start', { keyword });
    
    // 1a. PubMed 검색
    const pubmedArticles = await searchPubMed(keyword);
    
    // 1b. Claude API + web_search로 경쟁자 분석
    const competitorResearch = await claudeWithWebSearch(env, `
      Search for the top 5 Google results for "${keyword}" and analyze:
      - Their titles, estimated word counts
      - Topics they cover
      - Strengths and weaknesses
      - What topics they miss
      
      Also find any recent FDA guidelines or industry news related to this topic.
      
      Return JSON: {
        "competitors": [{ "url", "title", "topics", "strengths", "weaknesses" }],
        "industry_news": [...],
        "fda_updates": [...]
      }
    `);
    
    // 1c. 리서치 데이터 통합
    const researchData = {
      keyword,
      pubmed_articles: pubmedArticles.map(a => ({
        pmid: a.pmid,
        title: a.title,
        authors: a.authors,
        journal: a.journal,
        year: a.year,
        abstract: a.abstract,
        doi: a.doi
      })),
      competitors: competitorResearch.competitors,
      industry_news: competitorResearch.industry_news,
      research_date: new Date().toISOString()
    };
    
    await env.DB.prepare('UPDATE content_queue SET research_data = ? WHERE id = ?')
      .bind(JSON.stringify(researchData), queueId).run();
    
    await logPipeline(env, null, queueId, 'research_complete', { 
      pubmed_count: pubmedArticles.length,
      competitor_count: competitorResearch.competitors?.length || 0
    });
    
    // ═══ Step 2: 콘텐츠 생성 ═══
    await updateQueueStatus(env, queueId, 'generating');
    
    const contentResult = await claudeGenerate(env, keyword, researchData);
    
    // content_items에 draft로 저장
    const contentId = await saveContentDraft(env, contentResult, researchData);
    
    await env.DB.prepare('UPDATE content_queue SET content_id = ? WHERE id = ?')
      .bind(contentId, queueId).run();
    
    await logPipeline(env, contentId, queueId, 'content_generated', {
      word_count: countWords(contentResult.content),
      title: contentResult.title
    });
    
    // ═══ Step 3: AI 분석 ═══
    await updateQueueStatus(env, queueId, 'analyzing');
    
    const analysis = await analyzeContent(env, contentId);
    
    await env.DB.prepare('UPDATE content_queue SET analysis_data = ? WHERE id = ?')
      .bind(JSON.stringify(analysis), queueId).run();
    
    await logPipeline(env, contentId, queueId, 'analysis_complete', {
      overall_score: analysis.overall_score,
      evidence: analysis.scores.evidence.score,
      uniqueness: analysis.scores.uniqueness.score
    });
    
    // ═══ Step 4: Quality Gate ═══
    const decision = qualityGate(analysis, queue.retry_count || 0);
    
    await logPipeline(env, contentId, queueId, 'gate_decision', decision);
    
    if (decision.action === 'AUTO_PUBLISH') {
      // 자동 발행
      await env.DB.prepare('UPDATE content_items SET status = ? WHERE id = ?')
        .bind('published', contentId).run();
      await updateQueueStatus(env, queueId, 'published', contentId);
      
      // Sitemap ping
      try {
        await fetch('https://www.google.com/ping?sitemap=https://britzmedi.com/sitemap-index.xml');
      } catch(e) { /* ignore */ }
      
      await logPipeline(env, contentId, queueId, 'published', {
        score: analysis.overall_score
      });
      
    } else if (decision.action === 'AUTO_REWRITE') {
      // 자동 리라이트
      await updateQueueStatus(env, queueId, 'rewriting');
      
      const rewriteResult = await rewriteContent(env, contentId, analysis);
      
      // 리라이트된 콘텐츠로 업데이트
      await env.DB.prepare('UPDATE content_items SET content = ?, title = ?, meta_description = ? WHERE id = ?')
        .bind(rewriteResult.content, rewriteResult.title, rewriteResult.meta_description, contentId).run();
      
      // retry_count 증가
      await env.DB.prepare('UPDATE content_queue SET retry_count = retry_count + 1 WHERE id = ?')
        .bind(queueId).run();
      
      await logPipeline(env, contentId, queueId, 'rewrite_complete', {
        retry: (queue.retry_count || 0) + 1
      });
      
      // 다시 분석 → 게이트 (재귀 호출 대신 status를 analyzing으로 변경하여 다음 처리에서 이어감)
      // 또는 여기서 재귀적으로 Step 3-4 반복 (최대 3회)
      const updatedQueue = await env.DB.prepare('SELECT * FROM content_queue WHERE id = ?').bind(queueId).first();
      if ((updatedQueue?.retry_count || 0) < 3) {
        // 재분석
        const reanalysis = await analyzeContent(env, contentId);
        const reDecision = qualityGate(reanalysis, updatedQueue?.retry_count || 0);
        
        if (reDecision.action === 'AUTO_PUBLISH') {
          await env.DB.prepare('UPDATE content_items SET status = ? WHERE id = ?')
            .bind('published', contentId).run();
          await updateQueueStatus(env, queueId, 'published', contentId);
          await logPipeline(env, contentId, queueId, 'published_after_rewrite', {
            score: reanalysis.overall_score,
            retries: updatedQueue?.retry_count
          });
        } else if (reDecision.action === 'MANUAL_REVIEW' || (updatedQueue?.retry_count || 0) >= 3) {
          await updateQueueStatus(env, queueId, 'manual_review', contentId);
          await logPipeline(env, contentId, queueId, 'manual_review', {
            reason: reDecision.reason,
            score: reanalysis.overall_score
          });
        }
        // AUTO_REWRITE가 또 나오면 다시 한번 더 리라이트 (retry < 3 동안 반복)
      } else {
        await updateQueueStatus(env, queueId, 'manual_review', contentId);
      }
      
    } else {
      // 수동 검토
      await updateQueueStatus(env, queueId, 'manual_review', contentId);
      await logPipeline(env, contentId, queueId, 'manual_review', {
        reason: decision.reason,
        score: analysis.overall_score
      });
    }
    
  } catch (error) {
    await updateQueueStatus(env, queueId, 'failed');
    await env.DB.prepare('UPDATE content_queue SET error_message = ? WHERE id = ?')
      .bind(error.message, queueId).run();
    await logPipeline(env, null, queueId, 'error', { error: error.message });
    throw error;
  }
}
```

#### Quality Gate 함수

```typescript
function qualityGate(analysis: AnalysisResult, retryCount: number) {
  const { overall_score, scores } = analysis;
  const evidence = scores.evidence.score;
  const uniqueness = scores.uniqueness.score;
  
  // 모든 항목이 최소 기준 이상인지
  const allAboveMin = Object.values(scores).every((s: any) => s.score >= (s.max * 0.5));
  
  // Gate 1: Auto Publish
  if (overall_score >= 85 && evidence >= 28 && uniqueness >= 18 && allAboveMin) {
    return { action: 'AUTO_PUBLISH', reason: `Score ${overall_score}/100 - All criteria met` };
  }
  
  // Gate 2: Auto Rewrite (최대 3회)
  if (overall_score >= 70 && retryCount < 3) {
    const weakest = Object.entries(scores)
      .map(([k, v]: [string, any]) => ({ dimension: k, ratio: v.score / v.max }))
      .sort((a, b) => a.ratio - b.ratio)[0];
    
    return {
      action: 'AUTO_REWRITE',
      reason: `Score ${overall_score}/100 - Weakest: ${weakest.dimension} (${Math.round(weakest.ratio * 100)}%)`,
      focus: weakest.dimension
    };
  }
  
  // Gate 3: Manual Review
  return {
    action: 'MANUAL_REVIEW',
    reason: retryCount >= 3
      ? `3 rewrites attempted, score still ${overall_score}/100`
      : `Score ${overall_score}/100 - Below threshold`
  };
}
```

#### 콘텐츠 생성 프롬프트

```typescript
async function claudeGenerate(env: Env, keyword: string, research: ResearchData) {
  const pubmedSection = research.pubmed_articles.map(a => 
    `- ${a.title} (${a.authors}, ${a.journal}, ${a.year}) [PMID: ${a.pmid}]\n  Abstract: ${a.abstract?.substring(0, 500)}`
  ).join('\n');
  
  const response = await callClaude(env, {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `Write a comprehensive blog article for BRITZMEDI's website.

COMPANY: BRITZMEDI - Korean aesthetic medical device manufacturer
CEO: 이신재 (Lee Shinjae), Founded: 2017, Seongnam, Gyeonggi-do, South Korea
Products: 
- TORR RF: Multi-Wave RF workstation, FDA 510(k) cleared, simultaneous multi-frequency
- ULBLANC: Multi-frequency ultrasound workstation
- NEWCHAE SHOT: Needle-free mesotherapy device
- LUMINO WAVE: LED phototherapy (coming soon)

TARGET KEYWORD: "${keyword}"

AVAILABLE RESEARCH FROM PUBMED:
${pubmedSection}

COMPETITOR ANALYSIS:
${JSON.stringify(research.competitors, null, 2)}

CRITICAL RULES — FOLLOW ALL OR THE CONTENT WILL BE REJECTED:

1. EVERY major claim MUST cite a specific study: (Author et al., Journal, Year, key finding with numbers)
2. Include AT LEAST 3 PubMed references with concrete data points (n=, p<, %, effect sizes)
3. Go BEYOND surface-level — explain biological mechanisms, not just "it works"
4. Include a "BRITZMEDI Perspective" or "Manufacturer's Insight" section (2-3 paragraphs) that ONLY BRITZMEDI could write — connect research findings to our specific technology choices
5. If you cannot find solid evidence for a claim, DO NOT make the claim
6. Include practical clinical insights (treatment protocols, patient selection, expected outcomes with numbers)
7. NEVER write generic filler paragraphs — every paragraph must add unique value

QUALITY TEST: If a competitor could copy-paste this onto their blog without changing anything, REWRITE IT.

STRUCTURE:
- Title (keyword-optimized)
- TL;DR (3-4 sentences, key takeaway)
- Introduction (why this matters, hook with surprising data point)
- Main sections with H2/H3 (evidence-based, cite studies)
- BRITZMEDI Perspective section
- Clinical Takeaways (practical, actionable)
- FAQ section (5-7 real questions people search for)
- References list

Return ONLY valid JSON:
{
  "title": "",
  "slug": "",
  "meta_description": "(max 160 chars, include keyword)",
  "category": "",
  "tags": [],
  "tldr": "",
  "content": "(full markdown with all sections)",
  "faqs": [{ "question": "", "answer": "" }],
  "references": [{ "pmid": "", "citation": "" }],
  "word_count": 0
}`
    }]
  });
  
  return JSON.parse(response);
}
```

### B-3. API 엔드포인트 7개

#### (1) POST /api/admin/content-pipeline/queue

파일: `src/pages/api/admin/content-pipeline/queue.ts`

```typescript
// POST: 키워드 추가
export const POST: APIRoute = async ({ request, locals }) => {
  const { keyword, search_intent, priority, target_word_count, scheduled_at } = await request.json();
  
  if (!keyword) return new Response(JSON.stringify({ error: 'keyword required' }), { status: 400 });
  
  const result = await locals.runtime.env.DB.prepare(
    'INSERT INTO content_queue (keyword, search_intent, priority, target_word_count, scheduled_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(keyword, search_intent || null, priority || 5, target_word_count || 2000, scheduled_at || null).run();
  
  return new Response(JSON.stringify({ id: result.meta.last_row_id, keyword, status: 'queued' }));
};

// GET: 대기열 목록
export const GET: APIRoute = async ({ url, locals }) => {
  const status = url.searchParams.get('status');
  let query = 'SELECT * FROM content_queue ORDER BY priority ASC, created_at ASC';
  let params: any[] = [];
  
  if (status) {
    query = 'SELECT * FROM content_queue WHERE status = ? ORDER BY priority ASC, created_at ASC';
    params = [status];
  }
  
  const results = await locals.runtime.env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(results.results));
};
```

#### (2) DELETE /api/admin/content-pipeline/queue/[id]

파일: `src/pages/api/admin/content-pipeline/queue/[id].ts`

#### (3) POST /api/admin/content-pipeline/process/[id]

파일: `src/pages/api/admin/content-pipeline/process/[id].ts`

```typescript
export const POST: APIRoute = async ({ params, locals }) => {
  const queueId = parseInt(params.id);
  
  try {
    const result = await processKeyword(queueId, locals.runtime.env);
    return new Response(JSON.stringify({ success: true, result }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
```

주의: 이 API는 시간이 오래 걸릴 수 있음 (PubMed + Claude API 여러 번 호출).
Cloudflare Workers의 CPU 시간 제한 고려 — 필요하면 각 단계를 별도 API로 분리.

#### (4) POST /api/admin/content-pipeline/process-next

파일: `src/pages/api/admin/content-pipeline/process-next.ts`

```typescript
export const POST: APIRoute = async ({ locals }) => {
  const next = await locals.runtime.env.DB.prepare(
    'SELECT * FROM content_queue WHERE status = ? ORDER BY priority ASC, created_at ASC LIMIT 1'
  ).bind('queued').first();
  
  if (!next) return new Response(JSON.stringify({ message: 'No items in queue' }));
  
  const result = await processKeyword(next.id, locals.runtime.env);
  return new Response(JSON.stringify({ success: true, queue_id: next.id, result }));
};
```

#### (5) GET /api/admin/content-pipeline/logs

파일: `src/pages/api/admin/content-pipeline/logs.ts`

```typescript
export const GET: APIRoute = async ({ url, locals }) => {
  const queue_id = url.searchParams.get('queue_id');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  let query = 'SELECT * FROM pipeline_logs ORDER BY created_at DESC LIMIT ?';
  let params: any[] = [limit];
  
  if (queue_id) {
    query = 'SELECT * FROM pipeline_logs WHERE queue_id = ? ORDER BY created_at DESC LIMIT ?';
    params = [parseInt(queue_id), limit];
  }
  
  const results = await locals.runtime.env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(results.results));
};
```

#### (6) GET /api/admin/content-pipeline/stats

파일: `src/pages/api/admin/content-pipeline/stats.ts`

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.DB;
  
  const total = await db.prepare('SELECT COUNT(*) as count FROM content_queue').first();
  const published = await db.prepare("SELECT COUNT(*) as count FROM content_queue WHERE status = 'published'").first();
  const manual = await db.prepare("SELECT COUNT(*) as count FROM content_queue WHERE status = 'manual_review'").first();
  const failed = await db.prepare("SELECT COUNT(*) as count FROM content_queue WHERE status = 'failed'").first();
  const avgScore = await db.prepare("SELECT AVG(json_extract(analysis_data, '$.overall_score')) as avg FROM content_queue WHERE analysis_data IS NOT NULL").first();
  const avgRetries = await db.prepare("SELECT AVG(retry_count) as avg FROM content_queue WHERE status = 'published'").first();
  
  return new Response(JSON.stringify({
    total: total?.count || 0,
    published: published?.count || 0,
    manual_review: manual?.count || 0,
    failed: failed?.count || 0,
    auto_publish_rate: total?.count ? ((published?.count || 0) / (total?.count as number) * 100).toFixed(1) + '%' : '0%',
    avg_score: avgScore?.avg ? Math.round(avgScore.avg as number) : 0,
    avg_retries: avgRetries?.avg ? (avgRetries.avg as number).toFixed(1) : '0'
  }));
};
```

---

## Part C: Hero 동영상 지원

### C-1. 업로드 허용 타입 수정

Hero 이미지 업로드 부분에서 허용 타입 수정:
- 기존: `image/webp, image/jpeg, image/png`
- 변경: `image/webp, image/jpeg, image/png, video/mp4`
- 파일 크기 제한: 이미지 5MB, 영상 50MB

### C-2. 영상 최적화

FFmpeg.wasm 사용:
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

파일: `src/components/admin/VideoOptimizer.tsx` (또는 기존 이미지 최적화 컴포넌트에 통합)

```typescript
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

async function optimizeVideo(file: File): Promise<Blob> {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  
  await ffmpeg.writeFile('input.mp4', await fetchFile(file));
  
  // 최적화: H.264, CRF 23, 1920px 이하, 오디오 제거, fast start
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-vf', "scale='min(1920,iw)':-2",
    '-an',                    // 오디오 제거 (muted 배경영상)
    '-movflags', '+faststart', // 프로그레시브 로딩
    '-y',
    'output.mp4'
  ]);
  
  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data], { type: 'video/mp4' });
}
```

주의: FFmpeg.wasm이 너무 무거우면 (25MB+) 대안 고려:
- 서버사이드 최적화 (Cloudflare Workers에서는 FFmpeg 사용 불가)
- 클라이언트에서 Canvas + MediaRecorder (품질 제한적)
- 또는 FFmpeg.wasm 없이 원본 그대로 업로드하되 크기 제한만 적용 (10MB)

실용적 대안: FFmpeg.wasm이 번들 크기 문제면, 그냥 영상 크기 제한(10MB)만 걸고 최적화는 스킵.
사용자에게 "10MB 이하 MP4만 가능" 안내.

### C-3. 렌더링

Site Editor 프리뷰:
```tsx
{isVideo(heroMedia) ? (
  <video autoPlay muted loop playsInline className="...">
    <source src={heroMedia} type="video/mp4" />
  </video>
) : (
  <img src={heroMedia} alt="..." className="..." />
)}
```

프로덕션 Hero (홈페이지):
```astro
{heroConfig.backgroundType === 'video' || heroConfig.heroImage?.endsWith('.mp4') ? (
  <video autoplay muted loop playsinline class="...">
    <source src={heroConfig.heroImage} type="video/mp4" />
  </video>
) : (
  <img src={heroConfig.heroImage} alt="..." class="..." />
)}
```

모바일 대응:
- poster 속성 추가 (첫 프레임 이미지 또는 기본 이미지)
- preload="metadata"

### C-4. KV 저장

Hero 설정 저장 시 미디어 타입 정보도 함께 저장:
```json
{
  "heroImage": "/hero/hero-video.mp4",
  "heroMediaType": "video",
  "backgroundType": "model"
}
```

---

## Part D: 빌드 + 배포 + 테스트

### D-1. 빌드 확인
```bash
npm run build
```
에러 없이 빌드 통과해야 함.

### D-2. D1 마이그레이션 확인
```bash
npx wrangler d1 execute britzmedi-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```
content_revisions, content_queue, pipeline_logs 테이블 존재 확인.

### D-3. 배포
```bash
npx wrangler pages deploy dist/
```
또는 git push → 자동 배포.

### D-4. API 테스트

```bash
# Content Editor 고도화
# 분석 테스트 (기존 content_items에 글이 있어야 함)
curl -X POST https://britzmedi.com/api/admin/content-hub/analyze \
  -H "Content-Type: application/json" \
  -d '{"content_id": 1}'

# 리비전 목록
curl https://britzmedi.com/api/admin/content-hub/items/1/revisions

# 파이프라인
# 키워드 등록
curl -X POST https://britzmedi.com/api/admin/content-pipeline/queue \
  -H "Content-Type: application/json" \
  -d '{"keyword": "radiofrequency skin tightening clinical evidence", "priority": 1}'

# 대기열 확인
curl https://britzmedi.com/api/admin/content-pipeline/queue

# 실행 (이건 시간 걸림)
curl -X POST https://britzmedi.com/api/admin/content-pipeline/process/1

# 로그 확인
curl https://britzmedi.com/api/admin/content-pipeline/logs?queue_id=1

# 통계
curl https://britzmedi.com/api/admin/content-pipeline/stats
```

### D-5. 검증 체크리스트

```
□ content_revisions 테이블 생성됨
□ content_queue 테이블 생성됨
□ pipeline_logs 테이블 생성됨
□ content_items에 research_data, analysis_data 컬럼 추가됨
□ POST /api/admin/content-hub/analyze 정상 응답
□ POST /api/admin/content-hub/rewrite 정상 응답
□ GET /api/admin/content-hub/items/[id]/revisions 정상 응답
□ POST /api/admin/content-pipeline/queue 키워드 등록됨
□ GET /api/admin/content-pipeline/queue 목록 반환
□ POST /api/admin/content-pipeline/process/[id] 실행됨
□ PubMed API 호출 성공 (Cloudflare Workers에서)
□ 리서치 데이터에 논문 포함
□ 생성된 콘텐츠에 논문 인용 존재
□ AI 분석 점수 반환
□ Quality Gate 판정 작동
□ Hero에 MP4 업로드 가능
□ Hero 프리뷰에서 영상 재생
□ 프로덕션 Hero에서 영상 자동재생
□ 빌드 에러 없음
□ 프로덕션 배포 완료
```

---

## 우선순위

1. Part A (Content Editor 고도화) — 가장 먼저
2. Part B (파이프라인) — A 완료 후
3. Part C (Hero 영상) — B 완료 후
4. Part D (테스트) — 전부 끝나면

각 Part 완료될 때마다 빌드 확인하고, 에러 있으면 수정 후 다음 진행.
전부 끝나면 CHANGELOG.md, ARCHITECTURE.md, TODO.md 업데이트.

안 되는 부분 있으면 그 부분만 보고하고 나머지는 계속 진행.
