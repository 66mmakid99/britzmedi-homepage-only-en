// Content Pipeline - Automated keyword → research → generate → analyze → publish
// Orchestrates PubMed research, Claude AI generation, quality analysis, and gate decisions

import { callClaude, callClaudeWithWebSearch, extractJson, countWords } from './claude-api';

// ── Types ──────────────────────────────────────────────────

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  doi: string;
}

interface ResearchData {
  keyword: string;
  pubmed_articles: PubMedArticle[];
  competitors: any[];
  industry_news: any[];
  research_date: string;
}

interface AnalysisResult {
  scores: Record<string, { score: number; max: number; details: string[] }>;
  overall_score: number;
  critical_issues: string[];
  suggestions: { priority: string; title: string; description: string; auto_fixable: boolean }[];
  publish_recommendation: string;
}

interface GateDecision {
  action: 'AUTO_PUBLISH' | 'AUTO_REWRITE' | 'MANUAL_REVIEW';
  reason: string;
  focus?: string;
}

// ── Helper functions ───────────────────────────────────────

async function updateQueueStatus(env: Env, queueId: number, status: string, contentId?: number) {
  if (contentId !== undefined) {
    await env.DB.prepare('UPDATE content_queue SET status = ?, content_id = ?, updated_at = ? WHERE id = ?')
      .bind(status, contentId, new Date().toISOString(), queueId).run();
  } else {
    await env.DB.prepare('UPDATE content_queue SET status = ?, updated_at = ? WHERE id = ?')
      .bind(status, new Date().toISOString(), queueId).run();
  }
}

async function logPipeline(env: Env, contentId: number | null, queueId: number, action: string, details: any) {
  await env.DB.prepare(
    'INSERT INTO pipeline_logs (content_id, queue_id, action, details) VALUES (?, ?, ?, ?)'
  ).bind(contentId, queueId, action, JSON.stringify(details)).run();
}

// ── PubMed Research ────────────────────────────────────────

async function searchPubMed(keyword: string): Promise<PubMedArticle[]> {
  const searchTerm = encodeURIComponent(
    `${keyword} AND (radiofrequency OR aesthetic OR dermatology OR skin OR collagen)`
  );
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${searchTerm}&retmax=10&sort=date&retmode=json`;

  let pmids: string[];
  try {
    const searchResult = await fetch(searchUrl).then(r => r.json()) as any;
    pmids = searchResult.esearchresult?.idlist || [];
  } catch (err) {
    console.error('[Pipeline] PubMed search failed:', err);
    return [];
  }

  if (pmids.length === 0) return [];

  // Fetch abstracts as text (simpler than XML parsing)
  const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=abstract&retmode=text`;
  let abstractText: string;
  try {
    abstractText = await fetch(fetchUrl).then(r => r.text());
  } catch {
    return [];
  }

  // Also fetch summary JSON for structured data
  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
  let summaryData: any = {};
  try {
    summaryData = await fetch(summaryUrl).then(r => r.json()) as any;
  } catch { /* use what we have */ }

  const articles: PubMedArticle[] = [];

  // Split abstract text by PMID markers
  const blocks = abstractText.split(/\n\n(?=\d+\.\s)/);

  for (const pmid of pmids) {
    const summary = summaryData.result?.[pmid];
    if (!summary) continue;

    // Find matching abstract block
    const abstractBlock = blocks.find(b => b.includes(pmid)) || '';
    // Extract abstract portion (after "Author information:" or after the title block)
    const abstractMatch = abstractBlock.match(/(?:Author information:.*?\n\n|^\d+\..*?\n\n)([\s\S]*)/);
    const abstract = abstractMatch?.[1]?.trim().substring(0, 1000) || '';

    articles.push({
      pmid,
      title: summary.title || '',
      authors: summary.sortfirstauthor || summary.authors?.[0]?.name || '',
      journal: summary.fulljournalname || summary.source || '',
      year: summary.pubdate?.substring(0, 4) || '',
      abstract,
      doi: summary.elocationid || '',
    });
  }

  return articles;
}

// ── Competitor Research via Claude Web Search ──────────────

async function researchCompetitors(apiKey: string, keyword: string): Promise<any> {
  const prompt = `Search for the top 5 Google results for "${keyword}" and analyze:
- Their titles, estimated word counts
- Topics they cover
- Strengths and weaknesses
- What topics they miss

Also find any recent FDA guidelines or industry news related to this topic.

Return JSON: {
  "competitors": [{ "url": "", "title": "", "topics": [], "strengths": [], "weaknesses": [] }],
  "industry_news": [{ "title": "", "summary": "" }],
  "fda_updates": [{ "title": "", "summary": "" }]
}`;

  try {
    const text = await callClaudeWithWebSearch({
      apiKey,
      system: 'You are a competitive analysis researcher. Return structured JSON.',
      userMessage: prompt,
      maxTokens: 4000,
    });

    try {
      return extractJson(text);
    } catch {
      return { competitors: [], industry_news: [], fda_updates: [] };
    }
  } catch (err) {
    console.error('[Pipeline] Competitor research failed:', err);
    return { competitors: [], industry_news: [], fda_updates: [] };
  }
}

// ── Content Generation ─────────────────────────────────────

async function claudeGenerate(apiKey: string, keyword: string, research: ResearchData): Promise<any> {
  const pubmedSection = research.pubmed_articles.map(a =>
    `- ${a.title} (${a.authors}, ${a.journal}, ${a.year}) [PMID: ${a.pmid}]\n  Abstract: ${a.abstract?.substring(0, 500)}`
  ).join('\n');

  const response = await callClaude({
    apiKey,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8000,
    system: 'You are a medical content writer for BRITZMEDI. Write evidence-based, high-quality content. Return ONLY valid JSON.',
    userMessage: `Write a comprehensive blog article for BRITZMEDI's website.

COMPANY: BRITZMEDI - Korean aesthetic medical device manufacturer
CEO: Lee Shinjae, Founded: 2017, Seongnam, Gyeonggi-do, South Korea
Products:
- TORR RF: Multi-Wave RF workstation, FDA 510(k) cleared, simultaneous multi-frequency
- ULBLANC: Multi-frequency ultrasound workstation
- NEWCHAE SHOT: Needle-free mesotherapy device
- LUMINO WAVE: LED phototherapy (coming soon)

TARGET KEYWORD: "${keyword}"

AVAILABLE RESEARCH FROM PUBMED:
${pubmedSection || '(No PubMed results found - use your knowledge)'}

COMPETITOR ANALYSIS:
${JSON.stringify(research.competitors || [], null, 2)}

CRITICAL RULES:
1. EVERY major claim MUST cite a specific study: (Author et al., Journal, Year, key finding with numbers)
2. Include AT LEAST 3 PubMed references with concrete data points
3. Go BEYOND surface-level — explain biological mechanisms
4. Include a "BRITZMEDI Perspective" section that ONLY BRITZMEDI could write
5. If you cannot find solid evidence for a claim, DO NOT make the claim
6. Include practical clinical insights
7. NEVER write generic filler paragraphs

STRUCTURE:
- Title (keyword-optimized)
- TL;DR (3-4 sentences)
- Introduction (hook with data point)
- Main sections with H2/H3 (evidence-based)
- BRITZMEDI Perspective section
- Clinical Takeaways
- FAQ section (5-7 questions)
- References list

Return ONLY valid JSON:
{
  "title": "",
  "slug": "",
  "meta_description": "(max 160 chars, include keyword)",
  "category": "",
  "tags": [],
  "tldr": "",
  "content": "(full markdown)",
  "faqs": [{ "question": "", "answer": "" }],
  "references": [{ "pmid": "", "citation": "" }],
  "word_count": 0
}`,
  });

  return extractJson(response);
}

// ── Content Analysis ───────────────────────────────────────

async function analyzeContent(apiKey: string, db: D1Database, contentId: number): Promise<AnalysisResult> {
  const item = await db.prepare(
    'SELECT title, content, seo_keyword, excerpt, faq FROM content_items WHERE id = ?'
  ).bind(contentId).first<any>();

  if (!item) throw new Error('Content item not found for analysis');

  const response = await callClaude({
    apiKey,
    maxTokens: 4000,
    system: `You are a STRICT content quality auditor for BRITZMEDI. Score content on 5 dimensions (total 100 points):
1. EVIDENCE-BASED VALUE (35 pts)
2. UNIQUE PERSPECTIVE (25 pts)
3. COMPLETENESS (20 pts)
4. READABILITY (10 pts)
5. AEO/GEO/SEO (10 pts)

Return ONLY valid JSON with scores, overall_score, critical_issues, suggestions, publish_recommendation.`,
    userMessage: `Analyze:\nTITLE: ${item.title}\nKEYWORD: ${item.seo_keyword || 'N/A'}\nCONTENT:\n${item.content}\nFAQs:\n${item.faq || '(none)'}`,
  });

  const analysis = extractJson(response);

  await db.prepare('UPDATE content_items SET analysis_data = ?, updated_at = ? WHERE id = ?')
    .bind(JSON.stringify(analysis), new Date().toISOString(), contentId).run();

  return analysis;
}

// ── Rewrite ────────────────────────────────────────────────

async function rewriteContent(apiKey: string, db: D1Database, contentId: number, analysis: AnalysisResult): Promise<any> {
  const item = await db.prepare(
    'SELECT title, content, seo_keyword, research_data FROM content_items WHERE id = ?'
  ).bind(contentId).first<any>();

  if (!item) throw new Error('Content item not found for rewrite');

  const weakAreas = analysis.suggestions
    ?.filter((s: any) => s.priority === 'high')
    .map((s: any) => `- ${s.title}: ${s.description}`)
    .join('\n') || '';

  const response = await callClaude({
    apiKey,
    maxTokens: 8000,
    system: 'You are a content improvement specialist for BRITZMEDI. Return ONLY valid JSON.',
    userMessage: `Rewrite and improve this article. Focus on the weak areas.

TITLE: ${item.title}
KEYWORD: ${item.seo_keyword || 'N/A'}
CURRENT SCORE: ${analysis.overall_score}/100

WEAK AREAS TO FIX:
${weakAreas}

CRITICAL ISSUES:
${analysis.critical_issues?.join('\n') || 'None'}

CURRENT CONTENT:
${item.content}

Return ONLY valid JSON:
{ "title": "", "content": "", "meta_description": "" }`,
  });

  return extractJson(response);
}

// ── Quality Gate ───────────────────────────────────────────

function qualityGate(analysis: AnalysisResult, retryCount: number): GateDecision {
  const { overall_score, scores } = analysis;
  const evidence = scores.evidence?.score || 0;
  const uniqueness = scores.uniqueness?.score || 0;

  const allAboveMin = Object.values(scores).every((s: any) => s.score >= (s.max * 0.5));

  if (overall_score >= 85 && evidence >= 28 && uniqueness >= 18 && allAboveMin) {
    return { action: 'AUTO_PUBLISH', reason: `Score ${overall_score}/100 - All criteria met` };
  }

  if (overall_score >= 70 && retryCount < 3) {
    const weakest = Object.entries(scores)
      .map(([k, v]: [string, any]) => ({ dimension: k, ratio: v.score / v.max }))
      .sort((a, b) => a.ratio - b.ratio)[0];

    return {
      action: 'AUTO_REWRITE',
      reason: `Score ${overall_score}/100 - Weakest: ${weakest.dimension} (${Math.round(weakest.ratio * 100)}%)`,
      focus: weakest.dimension,
    };
  }

  return {
    action: 'MANUAL_REVIEW',
    reason: retryCount >= 3
      ? `3 rewrites attempted, score still ${overall_score}/100`
      : `Score ${overall_score}/100 - Below threshold`,
  };
}

// ── Save Content Draft ─────────────────────────────────────

async function saveContentDraft(db: D1Database, content: any, research: ResearchData): Promise<number> {
  const now = new Date().toISOString();
  const wc = countWords(content.content || '');
  const readTime = `${Math.max(1, Math.ceil(wc / 200))} min read`;

  const slug = content.slug || content.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  const result = await db.prepare(
    `INSERT INTO content_items (
      source_type, title, slug, content, excerpt, category, tags,
      seo_keyword, faq, status, word_count, estimated_read_time,
      research_data, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    'seo_brief',
    content.title,
    slug,
    content.content,
    content.meta_description || content.tldr || '',
    content.category || 'uncategorized',
    JSON.stringify(content.tags || []),
    research.keyword,
    JSON.stringify(content.faqs || []),
    'draft',
    wc,
    readTime,
    JSON.stringify(research),
    now,
    now,
  ).run();

  return result.meta?.last_row_id as number;
}

// ── Main Pipeline Process ──────────────────────────────────

export async function processKeyword(queueId: number, env: Env): Promise<{ contentId: number; status: string; score: number }> {
  const queue = await env.DB.prepare('SELECT * FROM content_queue WHERE id = ?').bind(queueId).first<any>();
  if (!queue) throw new Error('Queue item not found');

  const keyword = queue.keyword;
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  try {
    // ═══ Step 1: Research ═══
    await updateQueueStatus(env, queueId, 'researching');
    await logPipeline(env, null, queueId, 'research_start', { keyword });

    const pubmedArticles = await searchPubMed(keyword);
    const competitorResearch = await researchCompetitors(apiKey, keyword);

    const researchData: ResearchData = {
      keyword,
      pubmed_articles: pubmedArticles,
      competitors: competitorResearch.competitors || [],
      industry_news: competitorResearch.industry_news || [],
      research_date: new Date().toISOString(),
    };

    await env.DB.prepare('UPDATE content_queue SET research_data = ? WHERE id = ?')
      .bind(JSON.stringify(researchData), queueId).run();

    await logPipeline(env, null, queueId, 'research_complete', {
      pubmed_count: pubmedArticles.length,
      competitor_count: competitorResearch.competitors?.length || 0,
    });

    // ═══ Step 2: Generate Content ═══
    await updateQueueStatus(env, queueId, 'generating');

    const contentResult = await claudeGenerate(apiKey, keyword, researchData);
    const contentId = await saveContentDraft(env.DB, contentResult, researchData);

    await env.DB.prepare('UPDATE content_queue SET content_id = ? WHERE id = ?')
      .bind(contentId, queueId).run();

    await logPipeline(env, contentId, queueId, 'content_generated', {
      word_count: countWords(contentResult.content || ''),
      title: contentResult.title,
    });

    // ═══ Step 3: AI Analysis ═══
    await updateQueueStatus(env, queueId, 'analyzing');

    const analysis = await analyzeContent(apiKey, env.DB, contentId);

    await env.DB.prepare('UPDATE content_queue SET analysis_data = ? WHERE id = ?')
      .bind(JSON.stringify(analysis), queueId).run();

    await logPipeline(env, contentId, queueId, 'analysis_complete', {
      overall_score: analysis.overall_score,
      evidence: analysis.scores.evidence?.score,
      uniqueness: analysis.scores.uniqueness?.score,
    });

    // ═══ Step 4: Quality Gate ═══
    let decision = qualityGate(analysis, queue.retry_count || 0);
    let finalScore = analysis.overall_score;

    await logPipeline(env, contentId, queueId, 'gate_decision', decision);

    if (decision.action === 'AUTO_PUBLISH') {
      await env.DB.prepare('UPDATE content_items SET status = ? WHERE id = ?')
        .bind('approved', contentId).run();
      await updateQueueStatus(env, queueId, 'published', contentId);
      await logPipeline(env, contentId, queueId, 'published', { score: analysis.overall_score });

      // Sitemap ping
      try { await fetch('https://www.google.com/ping?sitemap=https://britzmedi.com/sitemap-index.xml'); } catch {}

    } else if (decision.action === 'AUTO_REWRITE') {
      // Rewrite loop (max 3 retries)
      let currentRetry = (queue.retry_count || 0) + 1;
      await updateQueueStatus(env, queueId, 'rewriting');

      const rewriteResult = await rewriteContent(apiKey, env.DB, contentId, analysis);

      await env.DB.prepare('UPDATE content_items SET content = ?, title = ?, updated_at = ? WHERE id = ?')
        .bind(rewriteResult.content, rewriteResult.title, new Date().toISOString(), contentId).run();

      await env.DB.prepare('UPDATE content_queue SET retry_count = ? WHERE id = ?')
        .bind(currentRetry, queueId).run();

      await logPipeline(env, contentId, queueId, 'rewrite_complete', { retry: currentRetry });

      // Re-analyze after rewrite
      if (currentRetry < 3) {
        const reanalysis = await analyzeContent(apiKey, env.DB, contentId);
        finalScore = reanalysis.overall_score;
        const reDecision = qualityGate(reanalysis, currentRetry);

        if (reDecision.action === 'AUTO_PUBLISH') {
          await env.DB.prepare('UPDATE content_items SET status = ? WHERE id = ?')
            .bind('approved', contentId).run();
          await updateQueueStatus(env, queueId, 'published', contentId);
          await logPipeline(env, contentId, queueId, 'published_after_rewrite', {
            score: reanalysis.overall_score, retries: currentRetry,
          });
        } else {
          await updateQueueStatus(env, queueId, 'manual_review', contentId);
          await logPipeline(env, contentId, queueId, 'manual_review', {
            reason: reDecision.reason, score: reanalysis.overall_score,
          });
        }
      } else {
        await updateQueueStatus(env, queueId, 'manual_review', contentId);
      }
    } else {
      await updateQueueStatus(env, queueId, 'manual_review', contentId);
      await logPipeline(env, contentId, queueId, 'manual_review', {
        reason: decision.reason, score: analysis.overall_score,
      });
    }

    const finalQueue = await env.DB.prepare('SELECT status FROM content_queue WHERE id = ?').bind(queueId).first<any>();
    return { contentId, status: finalQueue?.status || 'unknown', score: finalScore };

  } catch (error: any) {
    await updateQueueStatus(env, queueId, 'failed');
    await env.DB.prepare('UPDATE content_queue SET error_message = ? WHERE id = ?')
      .bind(error.message, queueId).run();
    await logPipeline(env, null, queueId, 'error', { error: error.message });
    throw error;
  }
}
