// ProgressTracker — main Progress tab content for the Content Hub
// Shows SEO overview, movement, milestones, category breakdown, keyword table, discovered keywords

import { useState, useEffect, useCallback } from 'react';
import { PositionBadge } from './PositionBadge';
import { KeywordDetailModal } from './KeywordDetailModal';
import { DiscoveredKeywords } from './DiscoveredKeywords';

// ─── Types ──────────────────────────────────────────────────────

interface ProgressStats {
  totalKeywords: number;
  withRanking: number;
  inTop50: number;
  inTop10: number;
  avgPosition: number | null;
}

interface ProgressMovement {
  improved: number;
  declined: number;
  noChange: number;
  newEntries: number;
}

interface Milestone {
  keyword: string;
  type: string;
  message: string;
  position: number | null;
  week: string;
}

interface CategoryProgress {
  category: string;
  total: number;
  withRanking: number;
  inTop10: number;
  inTop50: number;
  avgPosition: number | null;
}

interface KeywordEntry {
  id: number;
  keyword: string;
  category: string;
  position: number | null;
  previous_position: number | null;
  change: number | null;
  impressions: number;
  clicks: number;
  tier: number;
}

interface ProgressData {
  week: string;
  stats: ProgressStats;
  movement: ProgressMovement;
  milestones: Milestone[];
  categories: CategoryProgress[];
  keywords: KeywordEntry[];
}

type KeywordSortField = 'position' | 'category' | 'impressions' | 'clicks' | 'change';
type KeywordSortDir = 'asc' | 'desc';

// ─── Helpers ────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const TIER_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: 'T1', className: 'bg-red-100 text-red-700' },
  2: { label: 'T2', className: 'bg-orange-100 text-orange-700' },
  3: { label: 'T3', className: 'bg-blue-100 text-blue-700' },
  4: { label: 'T4', className: 'bg-purple-100 text-purple-700' },
};

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent || 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Movement Card ──────────────────────────────────────────────

function MovementCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3`}>
      <span className={`text-lg ${color}`}>{icon}</span>
      <div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Category Row ───────────────────────────────────────────────

function CategoryRow({ cat }: { cat: CategoryProgress }) {
  const pct = cat.total > 0 ? Math.round((cat.withRanking / cat.total) * 100) : 0;
  const top10Pct = cat.total > 0 ? Math.round((cat.inTop10 / cat.total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 py-2.5 px-4 hover:bg-slate-50 transition-colors">
      {/* Category name */}
      <div className="w-32 flex-shrink-0">
        <p className="text-sm font-medium text-slate-700 truncate">{capitalize(cat.category)}</p>
        <p className="text-[10px] text-slate-400">{cat.total} keywords</p>
      </div>

      {/* Ranking progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-slate-500">Ranked: {cat.withRanking}/{cat.total}</span>
          <span className="text-[10px] text-slate-400">({pct}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Top 10 */}
      <div className="w-20 flex-shrink-0 text-right">
        <p className="text-xs font-medium text-green-600">{cat.inTop10} in Top 10</p>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
          <div
            className="h-full rounded-full bg-green-400 transition-all"
            style={{ width: `${top10Pct}%` }}
          />
        </div>
      </div>

      {/* Avg position */}
      <div className="w-16 flex-shrink-0 text-right">
        {cat.avgPosition != null ? (
          <span className="text-xs font-semibold text-slate-700">
            #{Math.round(cat.avgPosition)}
          </span>
        ) : (
          <span className="text-xs text-slate-300">--</span>
        )}
        <p className="text-[10px] text-slate-400">Avg pos</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function ProgressTracker() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailKeywordId, setDetailKeywordId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<KeywordSortField>('position');
  const [sortDir, setSortDir] = useState<KeywordSortDir>('asc');

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/content-hub/seo/progress');
      if (!res.ok) throw new Error('Failed to fetch SEO progress data');
      const json = await res.json();
      if (json.connected === false) {
        setError(json.error || 'SEO API unreachable');
      } else {
        setData(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Keyword sorting
  const handleSort = useCallback((field: KeywordSortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return field;
      }
      setSortDir(field === 'position' ? 'asc' : 'desc');
      return field;
    });
  }, []);

  const sortedKeywords = data?.keywords ? [...data.keywords].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'position': {
        const ap = a.position ?? 999;
        const bp = b.position ?? 999;
        return (ap - bp) * dir;
      }
      case 'category':
        return a.category.localeCompare(b.category) * dir;
      case 'impressions':
        return (a.impressions - b.impressions) * dir;
      case 'clicks':
        return (a.clicks - b.clicks) * dir;
      case 'change': {
        const ac = a.change ?? 0;
        const bc = b.change ?? 0;
        return (ac - bc) * dir;
      }
      default:
        return 0;
    }
  }) : [];

  // Sort indicator
  function SortIcon({ field }: { field: KeywordSortField }) {
    if (sortField !== field) {
      return <span className="text-slate-300 ml-0.5">&#x2195;</span>;
    }
    return <span className="text-slate-600 ml-0.5">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  }

  // ─── Loading State ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────

  if (error && !data) {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProgress} className="text-red-600 hover:text-red-800 text-xs font-medium">
            Retry
          </button>
        </div>

        {/* Still show discovered keywords even if progress API fails */}
        <DiscoveredKeywords />
      </div>
    );
  }

  if (!data) return null;

  // ─── Main Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Week indicator + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-700">
            SEO Progress
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600">
            {data.week}
          </span>
        </div>
        <button
          onClick={fetchProgress}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* ─── Overview Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Total Keywords"
          value={data.stats.totalKeywords}
        />
        <StatCard
          label="With Ranking"
          value={data.stats.withRanking}
          sub={data.stats.totalKeywords > 0
            ? `${Math.round((data.stats.withRanking / data.stats.totalKeywords) * 100)}% ranked`
            : undefined}
        />
        <StatCard
          label="In Top 50"
          value={data.stats.inTop50}
          accent="text-amber-600"
        />
        <StatCard
          label="In Top 10"
          value={data.stats.inTop10}
          accent="text-green-600"
        />
        <StatCard
          label="Avg Position"
          value={data.stats.avgPosition != null ? `#${Math.round(data.stats.avgPosition)}` : '--'}
          accent="text-blue-600"
        />
      </div>

      {/* ─── This Week's Movement ─── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">This Week&apos;s Movement</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MovementCard label="Improved" value={data.movement.improved} color="text-green-600" icon={'\u25B2'} />
          <MovementCard label="Declined" value={data.movement.declined} color="text-red-500" icon={'\u25BC'} />
          <MovementCard label="No Change" value={data.movement.noChange} color="text-slate-500" icon={'\u25CF'} />
          <MovementCard label="New Entries" value={data.movement.newEntries} color="text-blue-600" icon={'\u2605'} />
        </div>
      </div>

      {/* ─── Milestones ─── */}
      {data.milestones && data.milestones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Milestones</h3>
          <div className="space-y-2">
            {data.milestones.map((ms, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3"
              >
                <span className="text-yellow-600 text-lg flex-shrink-0">{'\u2605'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{ms.message}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                    <span className="font-medium text-slate-700">{ms.keyword}</span>
                    {ms.position != null && (
                      <>
                        <span>&middot;</span>
                        <PositionBadge position={ms.position} />
                      </>
                    )}
                    <span>&middot;</span>
                    <span>{ms.week}</span>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-yellow-100 text-yellow-700 flex-shrink-0">
                  {ms.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Category Breakdown ─── */}
      {data.categories && data.categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Category Breakdown</h3>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
            {data.categories.map(cat => (
              <CategoryRow key={cat.category} cat={cat} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Keyword Rankings Table ─── */}
      {sortedKeywords.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Keyword Rankings
            <span className="ml-2 text-xs font-normal text-slate-400">
              {sortedKeywords.length} keywords
            </span>
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-8 gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              <span className="col-span-2">Keyword</span>
              <button
                onClick={() => handleSort('category')}
                className="text-center flex items-center justify-center gap-0.5 hover:text-slate-700 cursor-pointer"
              >
                Category <SortIcon field="category" />
              </button>
              <button
                onClick={() => handleSort('position')}
                className="text-center flex items-center justify-center gap-0.5 hover:text-slate-700 cursor-pointer"
              >
                Position <SortIcon field="position" />
              </button>
              <button
                onClick={() => handleSort('change')}
                className="text-center flex items-center justify-center gap-0.5 hover:text-slate-700 cursor-pointer"
              >
                Change <SortIcon field="change" />
              </button>
              <button
                onClick={() => handleSort('impressions')}
                className="text-center flex items-center justify-center gap-0.5 hover:text-slate-700 cursor-pointer"
              >
                Impr. <SortIcon field="impressions" />
              </button>
              <button
                onClick={() => handleSort('clicks')}
                className="text-center flex items-center justify-center gap-0.5 hover:text-slate-700 cursor-pointer"
              >
                Clicks <SortIcon field="clicks" />
              </button>
              <span className="text-center">Tier</span>
            </div>

            {/* Rows */}
            {sortedKeywords.map(kw => {
              const change = kw.change;
              const isUp = change != null && change > 0;
              const isDown = change != null && change < 0;

              return (
                <button
                  key={kw.id}
                  onClick={() => setDetailKeywordId(kw.id)}
                  className="grid grid-cols-8 gap-2 px-4 py-2.5 text-xs w-full text-left border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {/* Keyword */}
                  <div className="col-span-2 min-w-0">
                    <p className="text-sm text-slate-800 font-medium truncate">{kw.keyword}</p>
                  </div>

                  {/* Category badge */}
                  <span className="flex items-center justify-center">
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-600 truncate max-w-full">
                      {capitalize(kw.category)}
                    </span>
                  </span>

                  {/* Position */}
                  <span className="flex items-center justify-center">
                    <PositionBadge position={kw.position} />
                  </span>

                  {/* Change */}
                  <span className="flex items-center justify-center">
                    {change == null ? (
                      <span className="text-slate-300">--</span>
                    ) : change === 0 ? (
                      <span className="text-slate-400">0</span>
                    ) : isUp ? (
                      <span className="text-green-600 font-semibold">
                        {'\u25B2'} {change}
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold">
                        {'\u25BC'} {Math.abs(change)}
                      </span>
                    )}
                  </span>

                  {/* Impressions */}
                  <span className="flex items-center justify-center text-slate-600">
                    {formatNumber(kw.impressions)}
                  </span>

                  {/* Clicks */}
                  <span className="flex items-center justify-center text-slate-600">
                    {formatNumber(kw.clicks)}
                  </span>

                  {/* Tier */}
                  <span className="flex items-center justify-center">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      TIER_BADGE[kw.tier]?.className || 'bg-slate-100 text-slate-600'
                    }`}>
                      {TIER_BADGE[kw.tier]?.label || `T${kw.tier}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Discovered Keywords ─── */}
      <div className="pt-4 border-t border-slate-200">
        <DiscoveredKeywords />
      </div>

      {/* ─── Keyword Detail Modal ─── */}
      {detailKeywordId != null && (
        <KeywordDetailModal
          keywordId={detailKeywordId}
          onClose={() => setDetailKeywordId(null)}
        />
      )}
    </div>
  );
}
