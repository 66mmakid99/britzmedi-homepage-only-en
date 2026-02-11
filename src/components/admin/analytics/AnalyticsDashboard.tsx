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

// ---------- Traffic Tab (GA4 real data) ----------
interface TrafficData {
  summary: {
    activeUsers: number;
    sessions: number;
    pageviews: number;
    bounceRate: number;
    avgDuration: number;
    pagesPerSession: number;
  };
  daily: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
    pageviews: number;
  }>;
  topPages: Array<{
    path: string;
    pageviews: number;
    activeUsers: number;
    avgDuration: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
    activeUsers: number;
  }>;
}

function TrafficTab() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchTraffic = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics/traffic?days=${d}`);
      if (!res.ok) throw new Error(`Failed to load traffic data (${res.status})`);
      const json = await res.json();
      setConnected(json.connected !== false);
      if (json.data?.success) {
        setData(json.data);
        setNotConfigured(false);
      } else if (json.data?.notConfigured) {
        setNotConfigured(true);
        setData(null);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traffic data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTraffic(days); }, [days, fetchTraffic]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <button onClick={() => fetchTraffic(days)} className="px-4 py-2 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  // Not configured state
  if (notConfigured || !connected) {
    return (
      <div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KpiCard label="Users" value="--" sub={`Last ${days} days`} />
          <KpiCard label="Sessions" value="--" sub={`Last ${days} days`} />
          <KpiCard label="Pageviews" value="--" sub={`Last ${days} days`} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">&#x1F4CA;</div>
          <h3 className="text-base font-semibold text-slate-600 mb-2">
            {notConfigured ? 'GA4 Not Configured' : 'Analytics API Unreachable'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {notConfigured
              ? 'Set GA4_PROPERTY_ID in SEO Workers and grant the service account Viewer access to your GA4 property.'
              : 'The SEO Workers API is not reachable. Check that britzmedi-seo is deployed.'}
          </p>
          <div className="mt-6 text-left max-w-lg mx-auto bg-slate-50 rounded-lg p-4 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">Setup Steps:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Enable Analytics Data API in Google Cloud Console</li>
              <li>Add service account as Viewer in GA4 Admin &rarr; Property Access</li>
              <li>Find your GA4 Property ID in Admin &rarr; Property Settings</li>
              <li>Set <code className="bg-slate-200 px-1 rounded">GA4_PROPERTY_ID=properties/XXXXXXXXX</code> in wrangler.toml</li>
              <li>Deploy: <code className="bg-slate-200 px-1 rounded">wrangler deploy</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const s = data?.summary;
  const formatDuration = (sec: number) => {
    if (!sec) return '0s';
    const m = Math.floor(sec / 60);
    const ss = Math.round(sec % 60);
    return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
  };

  return (
    <div>
      {/* Period selector */}
      <div className="flex items-center gap-2 mb-4">
        {[7, 14, 30].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              days === d ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Active Users" value={s?.activeUsers?.toLocaleString() || '0'} sub={`Last ${days} days`} />
        <KpiCard label="Sessions" value={s?.sessions?.toLocaleString() || '0'} sub={`Last ${days} days`} />
        <KpiCard label="Pageviews" value={s?.pageviews?.toLocaleString() || '0'} sub={`Last ${days} days`} />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Bounce Rate" value={s?.bounceRate ? `${(s.bounceRate * 100).toFixed(1)}%` : '--'} sub={`Last ${days} days`} />
        <KpiCard label="Avg Duration" value={formatDuration(s?.avgDuration || 0)} sub={`Last ${days} days`} />
        <KpiCard label="Pages/Session" value={s?.pagesPerSession?.toFixed(1) || '--'} sub={`Last ${days} days`} />
      </div>

      {/* Daily Trend */}
      {data?.daily && data.daily.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Daily Trend</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1" style={{ minHeight: 120 }}>
              {data.daily.map(d => {
                const maxPV = Math.max(...data.daily.map(x => x.pageviews), 1);
                const h = Math.max(4, (d.pageviews / maxPV) * 100);
                const dateStr = d.date.length === 8
                  ? `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}`
                  : d.date.slice(5);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-[32px]" title={`${dateStr}: ${d.pageviews} PV, ${d.activeUsers} users`}>
                    <span className="text-[9px] text-slate-400">{d.pageviews}</span>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${h}px` }} />
                    <span className="text-[9px] text-slate-400">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        {data?.topPages && data.topPages.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Top Pages</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {data.topPages.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{p.path}</p>
                    <p className="text-[10px] text-slate-400">{p.activeUsers} users &middot; {formatDuration(p.avgDuration / Math.max(p.activeUsers, 1))}/user</p>
                  </div>
                  <span className="text-sm font-medium text-slate-700 ml-3">{p.pageviews.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traffic Sources */}
        {data?.trafficSources && data.trafficSources.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Traffic Sources</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {data.trafficSources.map((s, i) => {
                const maxSessions = Math.max(...data.trafficSources.map(x => x.sessions), 1);
                const pct = (s.sessions / maxSessions) * 100;
                return (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-800">{s.source}</span>
                      <span className="text-sm font-medium text-slate-700">{s.sessions.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, discoveredRes] = await Promise.all([
        fetch('/api/admin/content-hub/seo/progress'),
        fetch('/api/admin/content-hub/seo/discovered').catch(() => null),
      ]);

      if (progressRes.ok) {
        const pData = await progressRes.json();
        setData(pData.data || pData);
        setConnected(pData.connected !== false);
      } else {
        throw new Error(`Failed to load search data (${progressRes.status})`);
      }

      if (discoveredRes?.ok) {
        const dData = await discoveredRes.json();
        setDiscovered(dData.data?.keywords || dData.keywords || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load search data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">
          Retry
        </button>
      </div>
    );
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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, weeklyRes] = await Promise.all([
        fetch('/api/admin/content-hub/seo/progress'),
        fetch('/api/admin/content-hub/seo/progress?type=weekly'),
      ]);

      if (!progressRes.ok) throw new Error(`Failed to load SEO data (${progressRes.status})`);

      const pData = await progressRes.json();
      setData(pData.data || pData);

      if (weeklyRes.ok) {
        const wData = await weeklyRes.json();
        setWeekly(wData.data || wData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SEO data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm text-red-700 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg">
          Retry
        </button>
      </div>
    );
  }

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
