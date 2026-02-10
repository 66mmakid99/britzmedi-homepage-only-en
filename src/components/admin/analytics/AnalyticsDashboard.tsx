import React, { useState, useEffect, useCallback } from 'react';

// ---------- Types ----------
interface SeoProgress {
  stats?: {
    totalClicks?: number;
    totalImpressions?: number;
    avgCtr?: number;
    avgPosition?: number;
  };
  categories?: Array<{
    category: string;
    total: number;
    ranking: number;
  }>;
  keywords?: Array<{
    id: number;
    keyword: string;
    category: string;
    current_position: number | null;
    previous_position: number | null;
    best_position: number | null;
    tier: number;
  }>;
  milestones?: Array<{
    keyword: string;
    position: number;
    date: string;
  }>;
}

interface WeeklyProgress {
  week?: string;
  totalKeywords?: number;
  ranking?: number;
  top10?: number;
  top50?: number;
  top100?: number;
  avgPosition?: number;
  previousWeek?: {
    ranking?: number;
    avgPosition?: number;
  };
}

interface DiscoveredKeyword {
  id: number;
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// ---------- Main Component ----------
export default function AnalyticsDashboard() {
  const [tab, setTab] = useState<'traffic' | 'search' | 'seo'>('traffic');

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        {(['traffic', 'search', 'seo'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t === 'traffic' ? 'Traffic' : t === 'search' ? 'Search (GSC)' : 'SEO Growth'}
          </button>
        ))}
      </div>

      {tab === 'traffic' && <TrafficTab />}
      {tab === 'search' && <SearchTab />}
      {tab === 'seo' && <SeoGrowthTab />}
    </div>
  );
}

// ---------- Traffic Tab (GA4 placeholder) ----------
function TrafficTab() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Users" value="--" sub="Last 7 days" />
        <KpiCard label="Sessions" value="--" sub="Last 7 days" />
        <KpiCard label="Pageviews" value="--" sub="Last 7 days" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Bounce Rate" value="--" sub="Last 7 days" />
        <KpiCard label="Avg Duration" value="--" sub="Last 7 days" />
        <KpiCard label="Pages/Session" value="--" sub="Last 7 days" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-4xl mb-3">&#x1F4CA;</div>
        <h3 className="text-base font-semibold text-slate-600 mb-2">GA4 Integration Coming Soon</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Connect Google Analytics 4 via service account to see real traffic data here.
          This requires GA4 Data API setup in the SEO Workers.
        </p>
        <p className="text-xs text-slate-300 mt-4">Phase 6 &mdash; requires GA4 Data API + service account permissions</p>
      </div>
    </div>
  );
}

// ---------- Search Tab (GSC via SEO Workers) ----------
function SearchTab() {
  const [data, setData] = useState<SeoProgress | null>(null);
  const [discovered, setDiscovered] = useState<DiscoveredKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [progressRes, discoveredRes] = await Promise.all([
          fetch('/api/admin/content-hub/seo/progress'),
          fetch('/api/admin/content-hub/seo/discovered').catch(() => null),
        ]);

        if (progressRes.ok) {
          const pData = await progressRes.json();
          setData(pData.data || pData);
          setConnected(pData.connected !== false);
        }

        if (discoveredRes?.ok) {
          const dData = await discoveredRes.json();
          setDiscovered(dData.data?.keywords || dData.keywords || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const stats = data?.stats;

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Clicks"
          value={stats?.totalClicks?.toLocaleString() || '0'}
          color={connected ? undefined : 'slate'}
        />
        <KpiCard
          label="Impressions"
          value={stats?.totalImpressions?.toLocaleString() || '0'}
          color={connected ? undefined : 'slate'}
        />
        <KpiCard
          label="Avg CTR"
          value={stats?.avgCtr ? `${stats.avgCtr.toFixed(1)}%` : '--'}
          color={connected ? undefined : 'slate'}
        />
        <KpiCard
          label="Avg Position"
          value={stats?.avgPosition ? `#${stats.avgPosition.toFixed(1)}` : '--'}
          color={connected ? undefined : 'slate'}
        />
      </div>

      {!connected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
          SEO Workers API is not reachable. Data shown may be cached or unavailable.
        </div>
      )}

      {/* Discovered Keywords / Top Queries */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Top Search Queries (GSC)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Keywords where your site appears in Google search results</p>
        </div>
        {discovered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Query</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500">Position</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500">Impressions</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500">Clicks</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discovered.slice(0, 20).map(kw => (
                  <tr key={kw.id || kw.keyword} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-sm text-slate-800">{kw.keyword}</td>
                    <td className="px-5 py-2.5 text-sm text-right">
                      <PositionBadge position={kw.position} />
                    </td>
                    <td className="px-5 py-2.5 text-sm text-right text-slate-600">{kw.impressions?.toLocaleString() || 0}</td>
                    <td className="px-5 py-2.5 text-sm text-right text-slate-600">{kw.clicks || 0}</td>
                    <td className="px-5 py-2.5 text-sm text-right text-slate-600">{kw.ctr ? `${(kw.ctr * 100).toFixed(1)}%` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            <p>No query-level data available yet.</p>
            <p className="text-xs mt-1">GSC data appears as your site gains more search impressions.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- SEO Growth Tab ----------
function SeoGrowthTab() {
  const [data, setData] = useState<SeoProgress | null>(null);
  const [weekly, setWeekly] = useState<WeeklyProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [progressRes, weeklyRes] = await Promise.all([
          fetch('/api/admin/content-hub/seo/progress'),
          fetch('/api/admin/content-hub/seo/progress?type=weekly'),
        ]);

        if (progressRes.ok) {
          const pData = await progressRes.json();
          setData(pData.data || pData);
        }
        if (weeklyRes.ok) {
          const wData = await weeklyRes.json();
          setWeekly(wData.data || wData);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const categories = data?.categories || [];
  const keywords = data?.keywords || [];

  // Weekly comparison
  const weeklyRankingChange = weekly?.previousWeek?.ranking != null && weekly?.ranking != null
    ? weekly.ranking - weekly.previousWeek.ranking : null;
  const weeklyPositionChange = weekly?.previousWeek?.avgPosition != null && weekly?.avgPosition != null
    ? weekly.previousWeek.avgPosition - weekly.avgPosition : null;

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      {weekly && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Keywords Ranking"
            value={`${weekly.ranking || 0}/${weekly.totalKeywords || 0}`}
            change={weeklyRankingChange}
          />
          <KpiCard
            label="Top 10"
            value={String(weekly.top10 || 0)}
          />
          <KpiCard
            label="Top 50"
            value={String(weekly.top50 || 0)}
          />
          <KpiCard
            label="Top 100"
            value={String(weekly.top100 || 0)}
          />
          <KpiCard
            label="Avg Position"
            value={weekly.avgPosition ? `#${weekly.avgPosition.toFixed(0)}` : '--'}
            change={weeklyPositionChange ? Number(weeklyPositionChange.toFixed(1)) : null}
          />
        </div>
      )}

      {/* Category Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Keyword Progress by Category</h3>
        {categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map(cat => {
              const pct = cat.total > 0 ? Math.round((cat.ranking / cat.total) * 100) : 0;
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium text-slate-700 capitalize truncate">{cat.category}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-24 text-right">
                    {cat.ranking}/{cat.total} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">No category data available yet.</p>
        )}
      </div>

      {/* Keywords Table */}
      {keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Target Keywords</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Keyword</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500">Category</th>
                  <th className="text-center px-5 py-2.5 text-xs font-semibold text-slate-500">Tier</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500">Position</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500">Best</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-500">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keywords.slice(0, 30).map(kw => {
                  const change = kw.previous_position && kw.current_position
                    ? kw.previous_position - kw.current_position : null;
                  return (
                    <tr key={kw.id || kw.keyword} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-sm text-slate-800">{kw.keyword}</td>
                      <td className="px-5 py-2.5 text-xs text-slate-500 capitalize">{kw.category}</td>
                      <td className="px-5 py-2.5 text-xs text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          kw.tier === 1 ? 'bg-red-100 text-red-700' :
                          kw.tier === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>T{kw.tier}</span>
                      </td>
                      <td className="px-5 py-2.5 text-sm text-right">
                        {kw.current_position ? <PositionBadge position={kw.current_position} /> : <span className="text-slate-300">--</span>}
                      </td>
                      <td className="px-5 py-2.5 text-sm text-right text-slate-500">
                        {kw.best_position ? `#${kw.best_position}` : '--'}
                      </td>
                      <td className="px-5 py-2.5 text-sm text-right">
                        {change != null ? (
                          <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-slate-400'}>
                            {change > 0 ? `+${change}` : change === 0 ? '-' : String(change)}
                          </span>
                        ) : <span className="text-slate-300">--</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Shared Components ----------
function KpiCard({ label, value, sub, color, change }: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  change?: number | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {change != null && change !== 0 && (
          <span className={`text-xs font-medium ${change > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change > 0 ? `+${change}` : String(change)}
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  const color = position <= 10 ? 'bg-green-100 text-green-700'
    : position <= 30 ? 'bg-blue-100 text-blue-700'
    : position <= 50 ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600';
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>
      #{Math.round(position)}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      Loading data...
    </div>
  );
}
