// AEO/GEO Monitor API
// POST: Run AEO check against AI engines
// GET: Return historical results

export const prerender = false;
import type { APIRoute } from 'astro';

const AEO_CHECK_QUERIES = [
  'What are the best radiofrequency devices for aesthetic clinics?',
  'TORR RF device reviews and specifications',
  'Korean aesthetic medical device manufacturers',
  'Best RF skin tightening machines for clinics',
  'BRITZMEDI TORR RF vs competitors',
  'FDA cleared radiofrequency devices for body contouring',
  'Multi-wave RF technology for aesthetic treatments',
  'Best aesthetic device distributors for clinics',
  'RF device for cellulite treatment clinical evidence',
  'Korean beauty device manufacturers B2B',
];

export const POST: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB;
  const apiKey = runtime?.env?.ANTHROPIC_API_KEY;

  if (!db || !apiKey) {
    return new Response(JSON.stringify({ error: 'DB or ANTHROPIC_API_KEY not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = [];

  for (const query of AEO_CHECK_QUERIES) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: query }],
        }),
      });

      const data = await res.json();
      const fullText = (data.content || [])
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join(' ');

      const mentioned = /britzmedi|BRITZMEDI|torr\s*rf|TORR\s*RF/i.test(fullText);

      let mentionContext = '';
      if (mentioned) {
        const regex = /.{0,100}(britzmedi|BRITZMEDI|torr\s*rf|TORR\s*RF).{0,100}/gi;
        const matches = fullText.match(regex);
        mentionContext = matches ? matches.slice(0, 3).join(' ... ') : '';
      }

      await db.prepare(
        'INSERT INTO aeo_checks (query, ai_engine, response_text, mentioned, mention_context) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        query,
        'claude',
        fullText.substring(0, 5000),
        mentioned ? 1 : 0,
        mentionContext.substring(0, 1000),
      ).run();

      results.push({ query, mentioned, mentionContext: mentionContext.substring(0, 200) });
    } catch (e: any) {
      results.push({ query, mentioned: false, error: e.message });
    }
  }

  const mentionedCount = results.filter(r => r.mentioned).length;

  return new Response(JSON.stringify({
    total: results.length,
    mentioned: mentionedCount,
    rate: Math.round((mentionedCount / results.length) * 100),
    results,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  const db = runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get latest check per query
  const latest = await db.prepare(`
    SELECT a.* FROM aeo_checks a
    INNER JOIN (
      SELECT query, MAX(id) as max_id FROM aeo_checks GROUP BY query
    ) b ON a.id = b.max_id
    ORDER BY a.mentioned DESC, a.query
  `).all();

  // Get previous check per query for trend
  const previous = await db.prepare(`
    SELECT a.query, a.mentioned FROM aeo_checks a
    INNER JOIN (
      SELECT query, MAX(id) as max_id FROM aeo_checks
      WHERE id NOT IN (SELECT MAX(id) FROM aeo_checks GROUP BY query)
      GROUP BY query
    ) b ON a.id = b.max_id
  `).all();

  const prevMap: Record<string, number> = {};
  for (const p of (previous.results || []) as any[]) {
    prevMap[p.query] = p.mentioned;
  }

  const results = (latest.results || []).map((r: any) => ({
    ...r,
    previous_mentioned: prevMap[r.query] ?? null,
  }));

  const mentionedCount = results.filter((r: any) => r.mentioned).length;

  return new Response(JSON.stringify({
    total: results.length,
    mentioned: mentionedCount,
    rate: results.length > 0 ? Math.round((mentionedCount / results.length) * 100) : 0,
    results,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
