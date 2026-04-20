/**
 * AEO Growth Engine — 자동 순환 콘텐츠 성장 시스템
 *
 * 사이클:
 * [1] diagnose()     — AI 검색에서 BRITZMEDI 언급 현황 진단
 * [2] plan()         — 미언급 키워드에서 콘텐츠 기획
 * [3] produce()      — 콘텐츠 자동 생성
 * [4] validate()     — 품질 검증 (90점 이상만 통과)
 * [5] evaluate()     — 브랜드 평가 (80점 이상)
 * [6] publish()      — 자동 배포
 * [7] track()        — 배포 후 영향력 추적
 * [8] analyze()      — 통계 분석 + 성장 리포트
 */

import { processKeyword, pipelineStep1_research, pipelineStep2_generate, pipelineStep3_postprocess } from './content-pipeline';
import { sendEmail } from './youtube-to-blog/email';

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY?: string;
}

// ==========================================
// [1] DIAGNOSE — AEO 진단
// ==========================================

export interface AEODiagnosisResult {
  total_queries: number;
  mentioned: number;
  not_mentioned: number;
  mention_rate: number;
  queries: {
    query: string;
    mentioned: boolean;
    position?: string;
    competitor_mentioned?: string[];
    snippet?: string;
  }[];
  diagnosed_at: string;
}

export async function diagnose(env: Env): Promise<AEODiagnosisResult> {
  // 5 core queries — kept small for CF 100s wall-time limit
  // Each Claude web_search call takes 10-20s, 5 in parallel ≈ 20s
  const diagnosticQueries = [
    'Best RF skin tightening machines for clinics 2025',
    'Korean aesthetic medical device manufacturers',
    'RF device comparison for aesthetic clinics',
    'Where to buy professional RF device for clinic',
    'RF vs HIFU vs laser for skin rejuvenation comparison',
  ];

  const results: AEODiagnosisResult['queries'] = [];
  const competitors = ['Classys', 'Ultraformer', 'InMode', 'Lutronic', 'Wontech', 'Jeisys', 'Alma', 'Syneron', 'Candela', 'Cynosure', 'Venus Concept'];

  // Process in parallel batches of 5 to stay within CF timeout
  const BATCH_SIZE = 5;
  for (let i = 0; i < diagnosticQueries.length; i += BATCH_SIZE) {
    const batch = diagnosticQueries.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (query) => {
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

        const data: any = await response.json();
        const fullText = data.content
          ?.filter((b: any) => b.type === 'text')
          ?.map((b: any) => b.text)
          ?.join('\n') || '';

        const mentioned = /britzmedi|torr\s*rf/i.test(fullText);
        const competitorMentioned = competitors.filter(c => new RegExp(c, 'i').test(fullText));

        let position = 'not_found';
        if (/britzmedi/i.test(fullText)) position = 'direct_mention';
        else if (/torr\s*rf/i.test(fullText)) position = 'indirect_reference';

        return {
          query,
          mentioned,
          position: mentioned ? position : 'not_found',
          competitor_mentioned: competitorMentioned,
          snippet: fullText.substring(0, 300)
        };
      })
    );

    for (let j = 0; j < batchResults.length; j++) {
      const r = batchResults[j];
      if (r.status === 'fulfilled') {
        results.push(r.value);
      } else {
        results.push({ query: batch[j], mentioned: false, snippet: `Error: ${r.reason?.message || 'unknown'}` });
      }
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

  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('diagnose', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify(result)).run();

  return result;
}


// ==========================================
// [2] PLAN — 갭 분석 & 키워드 기획
// ==========================================

export async function plan(env: Env, diagnosis: AEODiagnosisResult): Promise<any> {
  const notMentioned = diagnosis.queries.filter(q => !q.mentioned);

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
      "angles": ["clinical_evidence", "tech_comparison", "market_analysis", "clinic_guide", "patient_education", "aeo_response"],
      "priority": 1,
      "rationale": "why this content, which gap it fills",
      "target_queries": ["which diagnosis queries this will cover"]
    }
  ],
  "execution_order": "which content to produce first and why"
}

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

  const data: any = await response.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
  const planData = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');

  // 기획된 콘텐츠를 content_queue에 자동 등록
  // Actual schema: keyword, search_intent, priority, status, created_at
  for (const item of (planData.planned_content || [])) {
    await env.DB.prepare(
      `INSERT INTO content_queue (keyword, search_intent, priority, category, status, created_at)
       VALUES (?, 'informational', ?, ?, 'queued', datetime('now'))`
    ).bind(
      item.keyword,
      item.priority || 5,
      (item.category || 'medical-devices').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    ).run();
  }

  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('plan', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify(planData)).run();

  return planData;
}


// ==========================================
// [3] PRODUCE — 콘텐츠 자동 생성
// ==========================================

/**
 * Step-based produce: processes ONE step per call.
 * Each step fits within CF Workers 100s wall-time limit.
 * Priority order: postprocess > generate > research (finish in-progress items first)
 * Call 3 times per keyword to complete the full pipeline.
 */
export async function produce(env: Env, maxItems: number = 1): Promise<{
  processed: number;
  results: { id: number; keyword: string; step: string; status: string }[];
}> {
  // Find the next item to process (prioritize items further in the pipeline)
  const item = await env.DB.prepare(
    `SELECT id, keyword, search_intent, status FROM content_queue
     WHERE status IN ('queued', 'research_done', 'generated')
     ORDER BY
       CASE status
         WHEN 'generated' THEN 1
         WHEN 'research_done' THEN 2
         WHEN 'queued' THEN 3
       END,
       priority ASC, created_at ASC
     LIMIT 1`
  ).first<any>();

  if (!item) {
    await env.DB.prepare(
      `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('produce', 'completed', ?, datetime('now'))`
    ).bind(JSON.stringify({ processed: 0, message: 'No items to process' })).run();
    return { processed: 0, results: [] };
  }

  let step = '';
  let newStatus = '';
  try {
    switch (item.status) {
      case 'queued':
        step = 'research';
        newStatus = await pipelineStep1_research(item.id, env);
        break;
      case 'research_done':
        step = 'generate';
        newStatus = await pipelineStep2_generate(item.id, env);
        break;
      case 'generated':
        step = 'postprocess';
        newStatus = await pipelineStep3_postprocess(item.id, env);
        break;
    }
  } catch (e: any) {
    newStatus = 'error: ' + e.message;
  }

  const result = { id: item.id, keyword: item.keyword, step, status: newStatus };

  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('produce', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify({ processed: 1, results: [result] })).run();

  return { processed: 1, results: [result] };
}


// ==========================================
// [4] VALIDATE — 품질 검증 (90점 이상)
// ==========================================

export const QUALITY_THRESHOLDS = {
  auto_publish: 90,
  manual_review: 75,
  auto_rewrite: 60,
  reject: 0,
};


// ==========================================
// [5] EVALUATE — 브랜드 평가
// ==========================================

export interface BrandEvaluation {
  brand_awareness: number;
  product_persuasion: number;
  trust_building: number;
  call_to_action: number;
  overall: number;
  issues: string[];
  passed: boolean;
}

export async function evaluateBrand(env: Env, content: string, title: string): Promise<BrandEvaluation> {
  const evalPrompt = `Evaluate this blog article from BRITZMEDI's brand perspective.

BRITZMEDI is a Korean RF aesthetic medical device manufacturer. Flagship: TORR RF.
This article should make readers: (1) aware of BRITZMEDI, (2) trust them as experts, (3) consider TORR RF, (4) take action (contact/inquiry).

EVALUATION CRITERIA:

1. BRAND AWARENESS (0-100): Is BRITZMEDI naturally woven into the article? Not too aggressive (ads), not too subtle (invisible)?
2. PRODUCT PERSUASION (0-100): Does the article make TORR RF look like a strong option via comparisons and clinical evidence?
3. TRUST BUILDING (0-100): Does the article establish BRITZMEDI as a credible authority with real evidence?
4. CALL TO ACTION (0-100): Does the article guide readers to take the next step with 2+ CTAs?

Return JSON:
{
  "brand_awareness": { "score": 0, "reasoning": "..." },
  "product_persuasion": { "score": 0, "reasoning": "..." },
  "trust_building": { "score": 0, "reasoning": "..." },
  "call_to_action": { "score": 0, "reasoning": "..." },
  "overall": 0,
  "issues": ["list of specific issues"],
  "passed": true
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

  const data: any = await response.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
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
// [7] TRACK — 배포 후 영향력 추적
// ==========================================

export async function track(env: Env): Promise<{
  content_performance: any[];
}> {
  try {
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
  } catch {
    return { content_performance: [] };
  }
}


// ==========================================
// [8] ANALYZE — 통계 분석 + 성장 리포트
// ==========================================

export async function analyze(env: Env): Promise<{
  period: string;
  aeo_growth: { previous_rate: number; current_rate: number; change: number };
  content_stats: { total_published: number; avg_score: number; total_views: number };
  top_performing: { title: string; views: number; score: number }[];
  recommendations: string[];
}> {
  const aeoCycles = await env.DB.prepare(
    `SELECT data FROM aeo_cycles WHERE phase = 'diagnose' ORDER BY created_at DESC LIMIT 2`
  ).all<any>();

  let currentRate = 0, previousRate = 0;
  if (aeoCycles.results?.[0]) {
    try { currentRate = JSON.parse(aeoCycles.results[0].data).mention_rate; } catch {}
  }
  if (aeoCycles.results?.[1]) {
    try { previousRate = JSON.parse(aeoCycles.results[1].data).mention_rate; } catch {}
  }

  const contentStats = await env.DB.prepare(`
    SELECT COUNT(*) as total, AVG(quality_score) as avg_score
    FROM content_items WHERE status = 'published'
  `).first<any>().catch(() => null);

  let totalViews = 0;
  try {
    const pvResult = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM page_views WHERE path LIKE '/blog/%'`
    ).first<any>();
    totalViews = pvResult?.total || 0;
  } catch {}

  let topPerforming: any[] = [];
  try {
    const topResult = await env.DB.prepare(`
      SELECT ci.title, COUNT(pv.id) as views, ci.quality_score as score
      FROM content_items ci
      LEFT JOIN page_views pv ON pv.path = '/blog/' || ci.slug
      WHERE ci.status = 'published'
      GROUP BY ci.id
      ORDER BY views DESC LIMIT 5
    `).all<any>();
    topPerforming = topResult.results || [];
  } catch {}

  // Claude analysis
  let recommendations: string[] = [];
  try {
    const analysisPrompt = `Analyze BRITZMEDI's AEO performance and give 3-5 actionable recommendations.

AEO Mention Rate: ${previousRate}% → ${currentRate}%
Published articles: ${contentStats?.total || 0}
Average quality score: ${contentStats?.avg_score || 0}
Total blog views: ${totalViews}

Return JSON: { "recommendations": ["Specific recommendation 1", ...] }`;

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

    const data: any = await response.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
    const analysis = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    recommendations = analysis.recommendations || [];
  } catch {}

  const report = {
    period: new Date().toISOString().split('T')[0],
    aeo_growth: { previous_rate: previousRate, current_rate: currentRate, change: currentRate - previousRate },
    content_stats: {
      total_published: contentStats?.total || 0,
      avg_score: Math.round(contentStats?.avg_score || 0),
      total_views: totalViews
    },
    top_performing: topPerforming.map((r: any) => ({ title: r.title, views: r.views, score: r.score })),
    recommendations
  };

  await env.DB.prepare(
    `INSERT INTO aeo_cycles (phase, status, data, created_at) VALUES ('analyze', 'completed', ?, datetime('now'))`
  ).bind(JSON.stringify(report)).run();

  return report;
}


// ==========================================
// 전체 사이클 실행기
// ==========================================

export async function runFullCycle(env: Env): Promise<any> {
  const cycleStart = Date.now();
  const results: Record<string, any> = {};

  try { results.diagnose = await diagnose(env); }
  catch (e: any) { results.diagnose = { error: e.message }; }

  try {
    if (results.diagnose && !results.diagnose.error) {
      results.plan = await plan(env, results.diagnose);
    }
  } catch (e: any) { results.plan = { error: e.message }; }

  try { results.produce = await produce(env, 3); }
  catch (e: any) { results.produce = { error: e.message }; }

  try { results.track = await track(env); }
  catch (e: any) { results.track = { error: e.message }; }

  try { results.analyze = await analyze(env); }
  catch (e: any) { results.analyze = { error: e.message }; }

  const cycleTime = Math.round((Date.now() - cycleStart) / 1000);

  try {
    await env.DB.prepare(
      `INSERT INTO admin_notifications (type, title, message, link, data) VALUES (?, ?, ?, ?, ?)`
    ).bind(
      'aeo_cycle_complete',
      'AEO Growth Cycle Complete',
      `Mention rate: ${results.diagnose?.mention_rate || '?'}% | Produced: ${results.produce?.processed || 0} articles | Duration: ${cycleTime}s`,
      '/admin/aeo-engine',
      JSON.stringify(results)
    ).run();
  } catch {}

  // Weekly report email on Mondays
  const today = new Date();
  if (today.getDay() === 1 && env.RESEND_API_KEY) {
    await sendGrowthReportEmail(env, results);
  }

  return results;
}

async function sendGrowthReportEmail(env: Env, results: any) {
  const subject = `BRITZMEDI Weekly AEO Growth Report — ${new Date().toISOString().split('T')[0]}`;

  const html = `
  <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 20px;">Weekly AEO Growth Report</h1>
      <p style="margin: 4px 0 0; opacity: 0.9;">BRITZMEDI AI Search Presence</p>
    </div>
    <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">AEO Mention Rate</h2>
      <div style="font-size: 36px; font-weight: bold; color: ${(results.analyze?.aeo_growth?.change || 0) >= 0 ? '#16a34a' : '#dc2626'};">
        ${results.diagnose?.mention_rate || '?'}%
        <span style="font-size: 16px; margin-left: 8px;">
          ${(results.analyze?.aeo_growth?.change || 0) > 0 ? '+' : ''}${results.analyze?.aeo_growth?.change || 0}%p vs last
        </span>
      </div>
    </div>
    <div style="padding: 20px; background: white; border: 1px solid #e2e8f0; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">Content Production</h2>
      <p>Articles produced: <strong>${results.produce?.processed || 0}</strong></p>
      <p>Total published: <strong>${results.analyze?.content_stats?.total_published || '?'}</strong></p>
      <p>Average quality: <strong>${results.analyze?.content_stats?.avg_score || '?'}/100</strong></p>
      <p>Total views: <strong>${results.analyze?.content_stats?.total_views || '?'}</strong></p>
    </div>
    <div style="padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-top: none;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">AI Recommendations</h2>
      <ul style="margin: 0; padding-left: 20px;">
        ${(results.analyze?.recommendations || ['No recommendations']).map((r: string) => `<li style="margin: 6px 0;">${r}</li>`).join('')}
      </ul>
    </div>
    <div style="padding: 20px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
      <a href="https://britzmedi.com/admin/aeo-engine" style="display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px;">View Dashboard</a>
    </div>
  </div>`;

  try {
    await sendEmail({
      apiKey: env.RESEND_API_KEY!,
      to: 'sh.lee@britzmedi.com',
      from: 'BRITZMEDI Global <noreply@britzmedi.com>',
      subject,
      html
    });
  } catch (e) {
    console.error('[AEO Email] Failed:', e);
  }
}
