# AEO Growth Engine — 24시간 자동 순환 콘텐츠 성장 시스템

기존 MEGA-ALL-TASKS.md 대신 이것만 실행. 전부 순서대로. 중간에 멈추지 마.

---

## 핵심 개념

BRITZMEDI.com의 목적: AI 검색 시대에 신뢰할 수 있는 출처로 인식되어 브랜드·제품을 알리고 매출로 연결.

이를 위한 자동 순환 사이클:

```
[1] AEO 진단 → [2] 갭 분석 & 키워드 기획 → [3] 콘텐츠 제작 → [4] 품질 검증 (90점+) 
    → [5] 브랜드 평가 → [6] 배포 → [7] 영향력 추적 → [8] 통계 분석 → [1] 재진단
         ↑                                                                    ↓
         └────────────────── 24시간 자동 반복 ──────────────────────────────────┘
```

관리자는 대시보드에서 성장 현황만 확인. 시스템이 알아서 기획→제작→배포→검증→분석→재기획.

---

## Phase 1: AEO Growth Engine 코어 모듈

파일: `src/lib/aeo-engine.ts`

이 파일이 전체 사이클을 관장하는 오케스트레이터.

```typescript
/**
 * AEO Growth Engine — 자동 순환 콘텐츠 성장 시스템
 * 
 * 사이클:
 * [1] diagnose()     — AI 검색에서 BRITZMEDI 언급 현황 진단
 * [2] plan()         — 미언급 키워드에서 콘텐츠 기획 (앵글, 우선순위)
 * [3] produce()      — 콘텐츠 자동 생성 (리서치→작성→후처리)
 * [4] validate()     — 품질 검증 (90점 이상만 통과)
 * [5] evaluate()     — 브랜드 평가 (BRITZMEDI 인지+설득력 체크)
 * [6] publish()      — 자동 배포 + SNS 포스트 생성
 * [7] track()        — 배포 후 영향력 추적 (페이지뷰, 체류시간)
 * [8] analyze()      — 통계 분석 + 성장 리포트 생성
 * → [1]로 돌아감
 * 
 * 스케줄: Cloudflare Cron Trigger
 * - 매일 09:00 KST: diagnose + plan
 * - 매일 10:00 KST: produce (최대 3개/일)
 * - 매시간: track
 * - 매주 월요일 09:00 KST: analyze + 주간 리포트
 */

import { getProductContext, CONTENT_STRATEGY_RULES } from './britzmedi-products';

// ==========================================
// [1] DIAGNOSE — AEO 진단
// ==========================================

interface AEODiagnosisResult {
  total_queries: number;
  mentioned: number;
  not_mentioned: number;
  mention_rate: number;
  queries: {
    query: string;
    mentioned: boolean;
    position?: string; // 'direct_mention' | 'indirect_reference' | 'not_found'
    competitor_mentioned?: string[];
    snippet?: string;
  }[];
  diagnosed_at: string;
}

export async function diagnose(env: any): Promise<AEODiagnosisResult> {
  // 진단 질문 — 실제 바이어가 AI에게 물어볼 질문들
  const diagnosticQueries = [
    // 제품 직접 질문
    "What is TORR RF device?",
    "TORR RF reviews and specifications",
    // 카테고리 질문 (BRITZMEDI가 답변에 포함되어야 함)
    "Best RF skin tightening machines for clinics 2025",
    "Korean aesthetic medical device manufacturers",
    "What are the best radiofrequency devices for body contouring?",
    "Multi-wave RF technology aesthetic devices",
    "RF device comparison for aesthetic clinics",
    // 구매 의도 질문
    "Where to buy professional RF device for clinic",
    "RF aesthetic device distributor Asia",
    "Korean beauty device manufacturer B2B",
    // 기술 질문
    "How does multi-frequency RF work for skin tightening?",
    "RF vs HIFU vs laser for skin rejuvenation comparison",
    "FDA cleared Korean aesthetic devices",
    // 시장 질문
    "Korean medical device export companies",
    "Aesthetic device market Korea 2025",
  ];

  const results: AEODiagnosisResult['queries'] = [];

  for (const query of diagnosticQueries) {
    try {
      // Claude API + web_search로 각 질문에 대한 AI 답변 확인
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: query }]
        })
      });

      const data = await response.json();
      const fullText = data.content
        ?.filter(b => b.type === 'text')
        ?.map(b => b.text)
        ?.join('\n') || '';

      const mentioned = /britzmedi|torr\s*rf/i.test(fullText);
      
      // 경쟁사 언급 확인
      const competitors = ['Classys', 'Ultraformer', 'InMode', 'Lutronic', 'Wontech', 'Jeisys', 'Alma', 'Syneron', 'Candela', 'Cynosure', 'Venus Concept'];
      const competitorMentioned = competitors.filter(c => new RegExp(c, 'i').test(fullText));

      let position = 'not_found';
      if (/britzmedi/i.test(fullText)) position = 'direct_mention';
      else if (/torr\s*rf/i.test(fullText)) position = 'indirect_reference';

      results.push({
        query,
        mentioned,
        position: mentioned ? position : 'not_found',
        competitor_mentioned: competitorMentioned,
        snippet: fullText.substring(0, 300)
      });

      // Rate limiting — 각 쿼리 사이 2초 대기
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      results.push({ query, mentioned: false, snippet: `Error: ${e.message}` });
    }
  }

  const mentioned = results.filter(r => r.mentioned).length;
  const result: AEODiagnosisResult = {
    total_queries: results.length,
    mentioned,
    not_mentioned: results.length - mentioned,
    mention_rate: Math.round((mentioned / results.length) * 100),
    queries: results,
    diagnosed_at: new Date().toISOString()
  };

  // DB 저장
  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('diagnose', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify(result)).run();

  return result;
}


// ==========================================
// [2] PLAN — 갭 분석 & 키워드 기획
// ==========================================

interface ContentPlan {
  gap_analysis: {
    not_mentioned_queries: string[];
    competitor_dominated_queries: { query: string; competitors: string[] }[];
    weak_mention_queries: string[];
  };
  planned_content: {
    keyword: string;
    angles: string[];
    priority: number;
    rationale: string;
    target_queries: string[]; // 이 콘텐츠가 커버할 진단 질문들
  }[];
  estimated_cost: number;
  estimated_time: string;
}

export async function plan(env: any, diagnosis: AEODiagnosisResult): Promise<ContentPlan> {
  const notMentioned = diagnosis.queries.filter(q => !q.mentioned);
  const competitorDominated = diagnosis.queries.filter(q => !q.mentioned && q.competitor_mentioned && q.competitor_mentioned.length > 0);

  // Claude에게 갭 분석 + 콘텐츠 기획 요청
  const planPrompt = `You are a content strategist for BRITZMEDI (Korean RF aesthetic medical device manufacturer, flagship: TORR RF).

AEO DIAGNOSIS RESULTS:
- Mention rate: ${diagnosis.mention_rate}% (${diagnosis.mentioned}/${diagnosis.total_queries})
- NOT mentioned in these queries:
${notMentioned.map(q => `  - "${q.query}" ${q.competitor_mentioned?.length ? `(competitors mentioned: ${q.competitor_mentioned.join(', ')})` : ''}`).join('\n')}

CONTENT STRATEGY RULES:
- BRITZMEDI's core technology: RF (radiofrequency)
- Competitor technologies (HIFU, laser, cryo) must be in comparison format only
- Every article must connect to BRITZMEDI/TORR RF
- Max 2500 words per article
- Must include comparison tables
- NEWCHAE SHOT is a personal beauty device, NOT medical device

Based on the diagnosis gaps, plan content to maximize AEO mention rate.

Return JSON:
{
  "gap_analysis": {
    "critical_gaps": ["queries where BRITZMEDI MUST appear but doesn't"],
    "competitor_threats": ["queries where competitors dominate"],
    "quick_wins": ["queries that can be won with 1-2 articles"]
  },
  "planned_content": [
    {
      "keyword": "exact keyword to target",
      "angles": ["which of the 6 angles to use: clinical_evidence, tech_comparison, market_analysis, clinic_guide, patient_education, aeo_response"],
      "priority": 1,
      "rationale": "why this content, which gap it fills",
      "target_queries": ["which diagnosis queries this will cover"]
    }
  ],
  "execution_order": "which content to produce first and why"
}

Prioritize:
1. Quick wins (can move from 0% to mentioned with 1 article)
2. High-value queries (purchase intent, distributor searches)
3. Competitor-dominated queries (need to displace them)

Plan max 5 content pieces per cycle.`;

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
      messages: [{ role: 'user', content: planPrompt }]
    })
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const planData = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

  // 기획된 콘텐츠를 content_queue에 자동 등록
  for (const item of (planData.planned_content || [])) {
    for (const angle of (item.angles || ['aeo_response'])) {
      await env.DB.prepare(
        `INSERT INTO content_queue (keyword, intent, priority, content_angle, status, metadata, created_at)
         VALUES (?, 'informational', ?, ?, 'queued', ?, datetime('now'))`
      ).bind(
        item.keyword,
        item.priority,
        angle,
        JSON.stringify({ rationale: item.rationale, target_queries: item.target_queries, cycle: 'auto' })
      ).run();
    }
  }

  // DB 저장
  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('plan', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify(planData)).run();

  return planData;
}


// ==========================================
// [3] PRODUCE — 콘텐츠 자동 생성
// ==========================================

// 기존 content-pipeline.ts의 processQueueItem을 호출
// 하루 최대 3개 제한 (API 비용 관리)

export async function produce(env: any, maxItems: number = 3): Promise<{
  processed: number;
  results: { id: number; keyword: string; angle: string; score: number; status: string }[];
}> {
  const queued = await env.DB.prepare(
    `SELECT id, keyword, content_angle FROM content_queue 
     WHERE status = 'queued' ORDER BY priority ASC, created_at ASC LIMIT ?`
  ).bind(maxItems).all();

  const results: any[] = [];

  for (const item of queued.results || []) {
    try {
      // 기존 파이프라인 함수 호출
      // processQueueItem(env, item.id) — 이 함수가 리서치→생성→후처리→품질검증→발행까지 처리
      const result = await processQueueItem(env, item.id);
      results.push({
        id: item.id,
        keyword: item.keyword,
        angle: item.content_angle,
        score: result?.score || 0,
        status: result?.status || 'unknown'
      });

      // 각 아이템 사이 10초 대기 (API 부하 분산)
      await new Promise(r => setTimeout(r, 10000));
    } catch (e) {
      results.push({
        id: item.id,
        keyword: item.keyword,
        angle: item.content_angle,
        score: 0,
        status: 'error: ' + e.message
      });
    }
  }

  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('produce', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify({ processed: results.length, results })).run();

  return { processed: results.length, results };
}


// ==========================================
// [4] VALIDATE — 품질 검증 (90점 이상)
// ==========================================
// 기존 analyzeAndGate에서 처리됨. 여기서는 기준만 강화.

export const QUALITY_THRESHOLDS = {
  auto_publish: 90,    // 90점 이상만 자동 발행 (기존 75에서 상향)
  manual_review: 75,   // 75-89점은 관리자 검토
  auto_rewrite: 60,    // 60-74점은 자동 재작성
  reject: 0,           // 60점 미만은 거부
};


// ==========================================
// [5] EVALUATE — 브랜드 평가
// ==========================================

interface BrandEvaluation {
  brand_awareness: number;     // BRITZMEDI 인지도 적절성 (0-100)
  product_persuasion: number;  // 제품 설득력 (0-100)
  trust_building: number;      // 신뢰 구축도 (0-100)
  call_to_action: number;      // CTA 효과 (0-100)
  overall: number;
  issues: string[];
  passed: boolean;
}

export async function evaluateBrand(env: any, content: string, title: string): Promise<BrandEvaluation> {
  const evalPrompt = `Evaluate this blog article from BRITZMEDI's brand perspective.

BRITZMEDI is a Korean RF aesthetic medical device manufacturer. Flagship: TORR RF.
This article should make readers: (1) aware of BRITZMEDI, (2) trust them as experts, (3) consider TORR RF, (4) take action (contact/inquiry).

EVALUATION CRITERIA:

1. BRAND AWARENESS (0-100): Is BRITZMEDI naturally woven into the article? Not too aggressive (ads), not too subtle (invisible)?
   - 90-100: Perfect balance. Reader knows BRITZMEDI without feeling sold to.
   - 70-89: Good but slightly too much or too little.
   - Below 70: Either invisible or too salesy.

2. PRODUCT PERSUASION (0-100): Does the article make TORR RF look like a strong option?
   - Via comparison tables where TORR RF has clear strengths
   - Via clinical evidence supporting RF technology
   - Via practical benefits (ROI, versatility, patient satisfaction)
   - NOT via direct sales pitches

3. TRUST BUILDING (0-100): Does the article establish BRITZMEDI as a credible authority?
   - Uses real clinical evidence (PubMed citations)
   - Provides genuinely useful information (not just marketing)
   - Acknowledges limitations honestly
   - Professional tone, not hype

4. CALL TO ACTION (0-100): Does the article guide readers to take the next step?
   - Has 2+ CTAs (mid-article + end)
   - CTAs are informative not aggressive ("Explore specifications →" not "Buy now!")
   - Links to product page, contact page
   - Reader knows what to do next

Return JSON:
{
  "brand_awareness": { "score": 0-100, "reasoning": "..." },
  "product_persuasion": { "score": 0-100, "reasoning": "..." },
  "trust_building": { "score": 0-100, "reasoning": "..." },
  "call_to_action": { "score": 0-100, "reasoning": "..." },
  "overall": 0-100,
  "issues": ["list of specific issues to fix"],
  "passed": true/false (overall >= 80)
}

Title: ${title}

Article (first 3000 chars):
${content.substring(0, 3000)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: evalPrompt }]
    })
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const evalData = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

  return {
    brand_awareness: evalData.brand_awareness?.score || 0,
    product_persuasion: evalData.product_persuasion?.score || 0,
    trust_building: evalData.trust_building?.score || 0,
    call_to_action: evalData.call_to_action?.score || 0,
    overall: evalData.overall || 0,
    issues: evalData.issues || [],
    passed: (evalData.overall || 0) >= 80
  };
}


// ==========================================
// [6] PUBLISH — 자동 배포 + SNS
// ==========================================
// 기존 autoPublish + social-publisher.ts에서 처리.
// validate 90점 이상 + evaluate 80점 이상일 때만 자동 발행.


// ==========================================
// [7] TRACK — 배포 후 영향력 추적
// ==========================================

export async function track(env: any): Promise<{
  content_performance: {
    id: number;
    title: string;
    slug: string;
    published_at: string;
    page_views: number;
    avg_time_on_page: number;
    bounce_rate: number;
  }[];
}> {
  // page_views 테이블에서 블로그 글별 통계 집계
  const stats = await env.DB.prepare(`
    SELECT 
      ci.id,
      ci.title,
      ci.slug,
      ci.published_at,
      COUNT(pv.id) as page_views,
      COUNT(DISTINCT pv.session_id) as unique_visitors
    FROM content_items ci
    LEFT JOIN page_views pv ON pv.path = '/blog/' || ci.slug
    WHERE ci.status = 'published'
    GROUP BY ci.id
    ORDER BY page_views DESC
  `).all();

  return { content_performance: stats.results || [] };
}


// ==========================================
// [8] ANALYZE — 통계 분석 + 성장 리포트
// ==========================================

export async function analyze(env: any): Promise<{
  period: string;
  aeo_growth: { previous_rate: number; current_rate: number; change: number };
  content_stats: { total_published: number; avg_score: number; total_views: number };
  top_performing: { title: string; views: number; score: number }[];
  recommendations: string[];
}> {
  // 최근 2회 AEO 진단 비교
  const aeoCycles = await env.DB.prepare(
    `SELECT data FROM aeo_cycles WHERE phase = 'diagnose' ORDER BY created_at DESC LIMIT 2`
  ).all();

  let currentRate = 0, previousRate = 0;
  if (aeoCycles.results?.[0]) {
    const current = JSON.parse(aeoCycles.results[0].data);
    currentRate = current.mention_rate;
  }
  if (aeoCycles.results?.[1]) {
    const previous = JSON.parse(aeoCycles.results[1].data);
    previousRate = previous.mention_rate;
  }

  // 콘텐츠 통계
  const contentStats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      AVG(CAST(json_extract(score_breakdown, '$.total') AS REAL)) as avg_score
    FROM content_items WHERE status = 'published'
  `).first();

  // 총 페이지뷰
  const totalViews = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM page_views WHERE path LIKE '/blog/%'`
  ).first();

  // 상위 글
  const topPerforming = await env.DB.prepare(`
    SELECT ci.title, COUNT(pv.id) as views, ci.quality_score as score
    FROM content_items ci
    LEFT JOIN page_views pv ON pv.path = '/blog/' || ci.slug
    WHERE ci.status = 'published'
    GROUP BY ci.id
    ORDER BY views DESC
    LIMIT 5
  `).all();

  // Claude에게 분석 + 추천 요청
  const analysisPrompt = `Analyze BRITZMEDI's AEO performance and recommend next actions.

AEO Mention Rate: ${previousRate}% → ${currentRate}% (${currentRate > previousRate ? 'improved' : currentRate < previousRate ? 'declined' : 'unchanged'})
Published articles: ${contentStats?.total || 0}
Average quality score: ${contentStats?.avg_score || 0}
Total blog views: ${totalViews?.total || 0}

Give 3-5 specific, actionable recommendations. Return JSON:
{
  "assessment": "1-2 sentence overall assessment",
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: analysisPrompt }]
    })
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  const analysis = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

  const report = {
    period: `${new Date().toISOString().split('T')[0]}`,
    aeo_growth: { previous_rate: previousRate, current_rate: currentRate, change: currentRate - previousRate },
    content_stats: { 
      total_published: contentStats?.total || 0, 
      avg_score: Math.round(contentStats?.avg_score || 0),
      total_views: totalViews?.total || 0
    },
    top_performing: (topPerforming.results || []).map(r => ({ title: r.title, views: r.views, score: r.score })),
    recommendations: analysis.recommendations || []
  };

  // DB 저장
  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('analyze', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify(report)).run();

  return report;
}


// ==========================================
// 전체 사이클 실행기
// ==========================================

export async function runFullCycle(env: any): Promise<any> {
  const cycleStart = Date.now();
  const results: Record<string, any> = {};

  // [1] 진단
  try {
    results.diagnose = await diagnose(env);
  } catch (e) { results.diagnose = { error: e.message }; }

  // [2] 기획
  try {
    if (results.diagnose && !results.diagnose.error) {
      results.plan = await plan(env, results.diagnose);
    }
  } catch (e) { results.plan = { error: e.message }; }

  // [3] 제작 (최대 3개)
  try {
    results.produce = await produce(env, 3);
  } catch (e) { results.produce = { error: e.message }; }

  // [4]+[5]+[6] validate + evaluate + publish는 produce 내부에서 처리

  // [7] 추적
  try {
    results.track = await track(env);
  } catch (e) { results.track = { error: e.message }; }

  // [8] 분석
  try {
    results.analyze = await analyze(env);
  } catch (e) { results.analyze = { error: e.message }; }

  const cycleTime = Math.round((Date.now() - cycleStart) / 1000);

  // 관리자 알림
  await env.DB.prepare(
    `INSERT INTO admin_notifications (type, title, message, link, data) VALUES (?, ?, ?, ?, ?)`
  ).bind(
    'aeo_cycle_complete',
    `🔄 AEO Growth Cycle Complete`,
    `Mention rate: ${results.diagnose?.mention_rate || '?'}% | Produced: ${results.produce?.processed || 0} articles | Duration: ${cycleTime}s`,
    '/admin/aeo-engine',
    JSON.stringify(results)
  ).run();

  // 주간 리포트 이메일 (월요일에만)
  const today = new Date();
  if (today.getDay() === 1) { // 월요일
    await sendGrowthReportEmail(env, results);
  }

  return results;
}

async function sendGrowthReportEmail(env: any, results: any) {
  const subject = `📊 BRITZMEDI Weekly AEO Growth Report — ${new Date().toISOString().split('T')[0]}`;
  
  const html = `
  <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">📊 Weekly AEO Growth Report</h1>
      <p style="margin: 4px 0 0; opacity: 0.9;">BRITZMEDI AI Search Presence</p>
    </div>
    
    <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">🎯 AEO Mention Rate</h2>
      <div style="font-size: 36px; font-weight: bold; color: ${(results.analyze?.aeo_growth?.change || 0) >= 0 ? '#16a34a' : '#dc2626'};">
        ${results.diagnose?.mention_rate || '?'}%
        <span style="font-size: 16px; margin-left: 8px;">
          ${(results.analyze?.aeo_growth?.change || 0) > 0 ? '↑' : (results.analyze?.aeo_growth?.change || 0) < 0 ? '↓' : '→'} 
          ${Math.abs(results.analyze?.aeo_growth?.change || 0)}%p vs last
        </span>
      </div>
    </div>

    <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">📝 Content Production</h2>
      <p>Articles produced this cycle: <strong>${results.produce?.processed || 0}</strong></p>
      <p>Total published: <strong>${results.analyze?.content_stats?.total_published || '?'}</strong></p>
      <p>Average quality score: <strong>${results.analyze?.content_stats?.avg_score || '?'}/100</strong></p>
      <p>Total blog views: <strong>${results.analyze?.content_stats?.total_views || '?'}</strong></p>
    </div>

    <div style="padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">💡 AI Recommendations</h2>
      <ul style="margin: 0; padding-left: 20px;">
        ${(results.analyze?.recommendations || ['No recommendations available']).map(r => `<li style="margin: 6px 0;">${r}</li>`).join('')}
      </ul>
    </div>

    <div style="padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <a href="https://britzmedi.com/admin/aeo-engine" style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px;">View Full Dashboard →</a>
    </div>
  </div>`;

  await sendEmail(env, { to: 'sh.lee@britzmedi.com', subject, html });
}
```

---

## Phase 2: DB 스키마

```sql
-- AEO 사이클 기록
CREATE TABLE IF NOT EXISTS aeo_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  data TEXT,
  error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aeo_cycles_phase ON aeo_cycles(phase);

-- 페이지뷰 트래킹
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  device TEXT,
  session_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);

-- SNS 포스트
CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_item_id INTEGER,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT,
  url TEXT,
  status TEXT DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

한 줄씩 D1 remote로 실행.

---

## Phase 3: Cron Trigger 스케줄러

파일: `src/pages/api/cron/aeo-engine.ts`

Cloudflare Cron Trigger로 자동 실행:

```typescript
// Cron API — 외부에서 호출하여 사이클 실행
// 보안: Bearer token 검증

export async function POST({ request, locals }: any) {
  const env = locals.runtime.env;
  
  // Cron secret 검증
  const authHeader = request.headers.get('Authorization');
  const cronSecret = env.CRON_SECRET;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.mode || 'full'; // 'full' | 'diagnose' | 'produce' | 'analyze'

  try {
    let result;
    
    switch (mode) {
      case 'diagnose':
        result = await diagnose(env);
        break;
      case 'plan':
        const latestDiagnosis = await env.DB.prepare(
          `SELECT data FROM aeo_cycles WHERE phase='diagnose' ORDER BY created_at DESC LIMIT 1`
        ).first();
        result = await plan(env, JSON.parse(latestDiagnosis?.data || '{}'));
        break;
      case 'produce':
        result = await produce(env, body.max_items || 3);
        break;
      case 'analyze':
        result = await analyze(env);
        break;
      case 'full':
      default:
        result = await runFullCycle(env);
        break;
    }

    return new Response(JSON.stringify({ success: true, mode, result }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

wrangler.toml에 cron trigger 추가:

```toml
[triggers]
crons = [
  "0 0 * * *",    # 매일 09:00 KST (00:00 UTC) — Full cycle
  "0 12 * * 1"    # 매주 월요일 21:00 KST — Weekly report
]
```

Astro + Cloudflare Pages에서 cron이 안 되면, 외부 cron 서비스(cron-job.org 무료) 또는 Cloudflare Workers scheduled handler로 대체:

```
# cron-job.org에서 설정:
URL: https://britzmedi.com/api/cron/aeo-engine
Method: POST
Headers: Authorization: Bearer {CRON_SECRET}
Body: {"mode": "full"}
Schedule: Every day at 00:00 UTC
```

CRON_SECRET은 Cloudflare Pages 환경변수에 등록:
```bash
npx wrangler pages secret put CRON_SECRET
# 랜덤 문자열 입력 (예: aeo-engine-secret-2026-xxxx)
```

---

## Phase 4: 페이지뷰 트래킹

### 4-1. 트래킹 API

파일: `src/pages/api/analytics/pageview.ts`

```typescript
export async function POST({ request, locals }: any) {
  const env = locals.runtime.env;
  
  try {
    const body = await request.json();
    const { path, referrer, sessionId } = body;
    
    if (!path) return new Response('path required', { status: 400 });

    // Cloudflare 헤더에서 정보 추출
    const country = request.headers.get('CF-IPCountry') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const device = /Mobile|Android|iPhone/i.test(userAgent) ? 'mobile' : 'desktop';

    await env.DB.prepare(
      `INSERT INTO page_views (path, referrer, country, device, session_id, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(path, referrer || '', country, device, sessionId || '').run();

    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response('error', { status: 500 });
  }
}
```

### 4-2. 트래킹 스크립트 (모든 페이지에 삽입)

파일: `src/components/PageTracker.astro`

```astro
<script>
(function() {
  // Session ID (30분 만료)
  let sid = sessionStorage.getItem('_bm_sid');
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('_bm_sid', sid);
  }

  // 페이지뷰 전송
  function trackView() {
    const data = {
      path: window.location.pathname,
      referrer: document.referrer || '',
      sessionId: sid
    };
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/pageview', JSON.stringify(data));
    } else {
      fetch('/api/analytics/pageview', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(() => {});
    }
  }

  // 페이지 로드 시
  trackView();

  // SPA 네비게이션 감지
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackView();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
</script>
```

이 컴포넌트를 BaseLayout.astro (또는 메인 레이아웃)에 추가:
```astro
<PageTracker />
```

Admin 페이지(/admin/*)에서는 제외.

---

## Phase 5: 파이프라인에 브랜드 평가 단계 추가

content-pipeline.ts의 processQueueItem에서, Quality Gate 통과 후 + 발행 전에 브랜드 평가 삽입:

```typescript
// 기존: Quality Gate 통과 (90점 이상) → 발행
// 변경: Quality Gate 통과 (90점 이상) → 브랜드 평가 (80점 이상) → 발행

import { evaluateBrand, QUALITY_THRESHOLDS } from './aeo-engine';

// Quality Gate 후:
if (qualityScore >= QUALITY_THRESHOLDS.auto_publish) {
  // 브랜드 평가
  const brandEval = await evaluateBrand(env, generated.content, generated.title);
  
  await logPipelineStep(env, queueId, contentId, 'evaluate', 'brand_evaluation', {
    brand_awareness: brandEval.brand_awareness,
    product_persuasion: brandEval.product_persuasion,
    trust_building: brandEval.trust_building,
    call_to_action: brandEval.call_to_action,
    overall: brandEval.overall,
    passed: brandEval.passed
  });

  if (brandEval.passed) {
    // 자동 발행
    await autoPublish(env, queueId, contentId);
  } else {
    // 브랜드 평가 실패 → 수동 검토
    await updateContentStatus(env, contentId, 'review');
    await env.DB.prepare(
      `INSERT INTO admin_notifications (type, title, message, link) VALUES (?, ?, ?, ?)`
    ).bind(
      'brand_review_needed',
      `📝 Brand Review: ${generated.title}`,
      `Quality ${qualityScore}/100 passed, but brand evaluation ${brandEval.overall}/100 needs review. Issues: ${brandEval.issues.join('; ')}`,
      `/admin/content-hub`
    ).run();
  }
} else if (qualityScore >= QUALITY_THRESHOLDS.manual_review) {
  // 수동 검토
  await updateContentStatus(env, contentId, 'review');
} else if (qualityScore >= QUALITY_THRESHOLDS.auto_rewrite) {
  // 자동 재작성 (최대 2회)
  // ... 기존 로직
} else {
  // 거부
  await updateQueueStatus(env, queueId, 'failed');
}
```

Quality Gate 기준 변경:
```
기존: 75점 이상 → 자동 발행
변경: 90점 이상 + 브랜드 평가 80점 이상 → 자동 발행
      75-89점 → 수동 검토
      60-74점 → 자동 재작성
      60점 미만 → 거부
```

---

## Phase 6: AEO Engine 대시보드

`/admin/aeo-engine` 페이지 — 전체 사이클 현황을 한눈에.

```
AEO Growth Engine 대시보드:
┌─────────────────────────────────────────────────────┐
│  🎯 AEO Mention Rate                               │
│  ┌─────────────────────────────────────┐            │
│  │  27% ────→ 40% ────→ ?%            │            │
│  │  Feb 19    Feb 20    Next cycle     │            │
│  └─────────────────────────────────────┘            │
│                                                     │
│  📊 Cycle Status                                    │
│  Last run: Feb 20, 09:00 KST                       │
│  Next run: Feb 21, 09:00 KST                       │
│  [Run Now] [Run Diagnose Only] [Run Produce Only]  │
│                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │ Diagnose │  Plan    │ Produce  │ Analyze  │     │
│  │   ✅     │   ✅     │   ✅     │   ✅     │     │
│  │ 15 query │ 5 planned│ 3 made   │ report   │     │
│  └──────────┴──────────┴──────────┴──────────┘     │
│                                                     │
│  📝 Content Pipeline                                │
│  Queued: 12 | Processing: 0 | Published: 6         │
│  Avg Score: 91 | Brand Eval Avg: 84                 │
│                                                     │
│  🔍 Query Results (expandable)                      │
│  ✅ "TORR RF reviews" — mentioned                   │
│  ✅ "Best RF machines" — mentioned                  │
│  ❌ "RF device distributor Asia" — not mentioned    │
│  ❌ "Korean beauty device B2B" — not mentioned      │
│                                                     │
│  📈 Growth Timeline (chart)                         │
│  Week 1: 25% → Week 2: 40% → Week 3: ?%           │
│                                                     │
│  💡 AI Recommendations                              │
│  1. Focus on distributor-focused content            │
│  2. Create RF vs HIFU comparison                    │
│  3. Add more clinical evidence articles             │
└─────────────────────────────────────────────────────┘
```

API:
- GET /api/admin/aeo-engine/status — 최신 사이클 결과
- GET /api/admin/aeo-engine/history — 사이클 이력 (성장 추이)
- POST /api/admin/aeo-engine/run — 수동 사이클 실행 (mode: full|diagnose|produce|analyze)

Admin 사이드바에 "AEO Engine" 메뉴 추가 (기존 AEO Monitor 대체 또는 상위).

---

## Phase 7: SNS 포스트 + Social Media 페이지

기존 MEGA-ALL-TASKS.md의 TASK 4 내용 그대로 구현:
- social_posts 테이블 (Phase 2에서 이미 생성)
- social-publisher.ts 모듈
- 파이프라인 autoPublish에서 SNS 포스트 자동 생성
- /admin/social-media 페이지 (Copy to Clipboard 방식)
- API: GET/PUT/DELETE /api/admin/social-media

---

## Phase 8: Analytics 대시보드

기존 MEGA-ALL-TASKS.md의 TASK 5 내용:
- page_views 테이블 (Phase 2에서 이미 생성)
- PageTracker.astro (Phase 4에서 이미 구현)
- GET /api/admin/analytics/overview?period=7d
- /admin/analytics 페이지
  - KPI: Total Views, Unique Visitors, Top Country
  - 일별 차트 (CSS bar chart, 외부 라이브러리 X)
  - Top Pages, Countries, Referrers 테이블
  - Content Performance (블로그 글별 조회수)

---

## Phase 9: 빌드 + 배포

```bash
npm run build
git add -A
git commit -m "feat: AEO Growth Engine - automated 24/7 content cycle with diagnose-plan-produce-validate-evaluate-publish-track-analyze"
git push
```

---

## Phase 10: CRON_SECRET 등록 + 첫 사이클 실행

```bash
# Cloudflare Pages 시크릿 등록
npx wrangler pages secret put CRON_SECRET
# 값: aeo-engine-2026-랜덤문자열

# 첫 사이클 수동 실행 (테스트)
curl -X POST https://britzmedi.com/api/cron/aeo-engine \
  -H "Authorization: Bearer [CRON_SECRET값]" \
  -H "Content-Type: application/json" \
  -d '{"mode": "diagnose"}'
```

diagnose만 먼저 테스트. 성공하면:
```bash
curl -X POST https://britzmedi.com/api/cron/aeo-engine \
  -H "Authorization: Bearer [CRON_SECRET값]" \
  -d '{"mode": "full"}'
```

결과 보고해줘.

---

## Phase 11: 외부 Cron 설정

Cloudflare Pages는 자체 cron을 지원하지 않으므로, 무료 외부 cron 서비스 사용:

https://cron-job.org 에서:
- URL: https://britzmedi.com/api/cron/aeo-engine
- Method: POST
- Headers: Authorization: Bearer [CRON_SECRET], Content-Type: application/json
- Body: {"mode": "full"}
- Schedule: Every day at 00:00 UTC (09:00 KST)

이건 사람이 직접 설정해야 하므로, 설정 방법을 admin 대시보드에 안내 표시.
또는 README에 기록.

---

## 핵심 규칙

1. 전체 사이클: 진단 → 기획 → 제작 → 검증(90+) → 브랜드평가(80+) → 배포 → 추적 → 분석 → 재진단
2. 품질 기준 상향: 자동 발행은 Quality 90 + Brand 80 이상만
3. 하루 최대 3개 콘텐츠 생산 (API 비용 관리)
4. 모든 사이클 결과는 aeo_cycles 테이블에 기록
5. 주간 리포트 이메일 자동 발송 (월요일)
6. 관리자는 대시보드에서 성장 추이만 확인
7. 안 되는 부분은 보고하고 다음으로 넘어가
8. 빌드 + 배포까지 완료해야 끝
