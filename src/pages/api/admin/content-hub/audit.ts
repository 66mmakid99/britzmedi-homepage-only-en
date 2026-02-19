// Content Audit API - Fact-check all published content
// GET /api/admin/content-hub/audit

export const prerender = false;

import type { APIRoute } from 'astro';
import { factCheckProducts, validateCitations, checkSelfPromotion } from '../../../../lib/content-postprocess';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db = runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all published content items
    const items = await db.prepare(
      `SELECT id, title, slug, content, seo_keyword, research_data, status
       FROM content_items WHERE status = 'published' ORDER BY updated_at DESC`
    ).all();

    const results = [];
    let passed = 0;
    let criticalCount = 0;
    let warningCount = 0;

    for (const item of (items.results || []) as any[]) {
      const content = item.content || '';

      // 1. Product fact-check
      const factCheck = factCheckProducts(content);

      // 2. Citation validation (extract PMIDs from research_data)
      let validPMIDs: string[] = [];
      try {
        const research = item.research_data ? JSON.parse(item.research_data) : null;
        validPMIDs = (research?.pubmed_articles || [])
          .map((a: any) => a.pmid)
          .filter(Boolean);
      } catch { /* ignore parse errors */ }
      const citationCheck = validateCitations(content, validPMIDs);

      // 3. Self-promotion check
      const promoCheck = checkSelfPromotion(content);

      const allIssues = [
        ...factCheck.issues,
        ...promoCheck.issues,
        ...(citationCheck.removed.length > 0
          ? [`${citationCheck.removed.length} unverified citations found`]
          : []),
      ];

      const hasCritical = factCheck.hasCriticalError || promoCheck.hasDedicatedSection;

      if (hasCritical) criticalCount++;
      else if (allIssues.length > 0) warningCount++;
      else passed++;

      results.push({
        id: item.id,
        title: item.title,
        slug: item.slug,
        status: hasCritical ? 'critical' : allIssues.length > 0 ? 'warning' : 'pass',
        issues: allIssues,
        factCheck: {
          hasCriticalError: factCheck.hasCriticalError,
          corrections: factCheck.corrections.length,
        },
        citations: {
          unverified: citationCheck.removed.length,
        },
        selfPromotion: {
          mentions: promoCheck.mentionCount,
          percentage: Math.round(promoCheck.percentage * 10) / 10,
          hasDedicatedSection: promoCheck.hasDedicatedSection,
        },
      });
    }

    return new Response(JSON.stringify({
      total: results.length,
      passed,
      critical: criticalCount,
      warnings: warningCount,
      details: results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Audit API] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Audit failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
