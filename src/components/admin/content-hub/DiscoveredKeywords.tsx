// DiscoveredKeywords — shows GSC-discovered keywords not in the target list
// Fetches from /api/admin/content-hub/seo/discovered
// POST to add to targets, PATCH to ignore

import { useState, useEffect, useCallback } from 'react';
import { PositionBadge } from './PositionBadge';

// ─── Types ──────────────────────────────────────────────────────

interface DiscoveredKeyword {
  id: number;
  query: string;
  best_position: number | null;
  impressions: number;
  clicks: number;
  first_seen: string;
  suggested_category: string | null;
  status: string;
}

type SortField = 'impressions' | 'best_position' | 'clicks';

const CATEGORY_OPTIONS = [
  'products',
  'sterilization',
  'medical_devices',
  'packaging',
  'company',
  'industry',
  'compliance',
  'other',
];

// ─── Helpers ────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ─── Add to Targets Form ────────────────────────────────────────

function AddToTargetsForm({
  keyword,
  onSubmit,
  onCancel,
  loading,
}: {
  keyword: DiscoveredKeyword;
  onSubmit: (data: { tier: number; category: string; target_position: number }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [tier, setTier] = useState(3);
  const [category, setCategory] = useState(keyword.suggested_category || 'other');
  const [targetPosition, setTargetPosition] = useState(10);

  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      <p className="text-xs font-medium text-blue-800">
        Add &ldquo;{keyword.query}&rdquo; to targets
      </p>

      <div className="grid grid-cols-3 gap-2">
        {/* Tier */}
        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1">Tier</label>
          <select
            value={tier}
            onChange={e => setTier(Number(e.target.value))}
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value={1}>T1 (Critical)</option>
            <option value={2}>T2 (High)</option>
            <option value={3}>T3 (Medium)</option>
            <option value={4}>T4 (Low)</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Target Position */}
        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1">Target Pos</label>
          <input
            type="number"
            value={targetPosition}
            onChange={e => setTargetPosition(Math.max(1, Math.min(100, Number(e.target.value) || 10)))}
            min={1}
            max={100}
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSubmit({ tier, category, target_position: targetPosition })}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add to Targets'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function DiscoveredKeywords() {
  const [keywords, setKeywords] = useState<DiscoveredKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('impressions');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content-hub/seo/discovered?status=new&sort=${sortBy}`);
      if (!res.ok) throw new Error('Failed to fetch discovered keywords');
      const json = await res.json();
      if (json.connected === false) {
        setError(json.error || 'SEO API unreachable');
        setKeywords([]);
      } else {
        setKeywords(json.data?.keywords || json.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const handleAddToTargets = useCallback(async (
    keyword: DiscoveredKeyword,
    data: { tier: number; category: string; target_position: number },
  ) => {
    setActionLoading(keyword.id);
    try {
      const res = await fetch('/api/admin/content-hub/seo/discovered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: keyword.id, ...data }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to add keyword');
      }
      // Remove from list after successful add
      setKeywords(prev => prev.filter(k => k.id !== keyword.id));
      setExpandedId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add keyword');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleIgnore = useCallback(async (keyword: DiscoveredKeyword) => {
    setActionLoading(keyword.id);
    try {
      const res = await fetch('/api/admin/content-hub/seo/discovered', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: keyword.id, status: 'ignored' }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to ignore keyword');
      }
      // Remove from list
      setKeywords(prev => prev.filter(k => k.id !== keyword.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to ignore keyword');
    } finally {
      setActionLoading(null);
    }
  }, []);

  // Sort client-side for instant feedback on sort change
  const sorted = [...keywords].sort((a, b) => {
    if (sortBy === 'impressions') return b.impressions - a.impressions;
    if (sortBy === 'clicks') return b.clicks - a.clicks;
    if (sortBy === 'best_position') {
      const ap = a.best_position ?? 999;
      const bp = b.best_position ?? 999;
      return ap - bp;
    }
    return 0;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Discovered Keywords
          {!loading && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              {keywords.length} new
            </span>
          )}
        </h3>

        <div className="flex items-center gap-2">
          {/* Sort controls */}
          <span className="text-[10px] text-slate-400">Sort:</span>
          {(['impressions', 'best_position', 'clicks'] as SortField[]).map(field => (
            <button
              key={field}
              onClick={() => setSortBy(field)}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                sortBy === field
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
              }`}
            >
              {field === 'best_position' ? 'Position' : field.charAt(0).toUpperCase() + field.slice(1)}
            </button>
          ))}

          {/* Refresh */}
          <button
            onClick={fetchKeywords}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-3">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && keywords.length === 0 && (
        <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-slate-400">No new discovered keywords</p>
          <p className="text-xs text-slate-400 mt-1">Keywords from GSC not in your target list will appear here</p>
        </div>
      )}

      {/* Table */}
      {!loading && sorted.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-7 gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            <span className="col-span-2">Query</span>
            <span className="text-center">Position</span>
            <span className="text-center">Impressions</span>
            <span className="text-center">Clicks</span>
            <span className="text-center">First Seen</span>
            <span className="text-center">Actions</span>
          </div>

          {/* Rows */}
          {sorted.map(keyword => (
            <div key={keyword.id}>
              <div
                className={`grid grid-cols-7 gap-2 px-4 py-2.5 text-xs border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                  actionLoading === keyword.id ? 'opacity-50' : ''
                }`}
              >
                {/* Query + suggested category */}
                <div className="col-span-2 min-w-0">
                  <p className="text-sm text-slate-800 font-medium truncate">{keyword.query}</p>
                  {keyword.suggested_category && (
                    <span className="text-[10px] text-slate-400">
                      Suggested: {keyword.suggested_category.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                {/* Position */}
                <span className="flex items-center justify-center">
                  <PositionBadge position={keyword.best_position} />
                </span>

                {/* Impressions */}
                <span className="flex items-center justify-center text-slate-600">
                  {formatNumber(keyword.impressions)}
                </span>

                {/* Clicks */}
                <span className="flex items-center justify-center text-slate-600">
                  {formatNumber(keyword.clicks)}
                </span>

                {/* First Seen */}
                <span className="flex items-center justify-center text-slate-500">
                  {formatDate(keyword.first_seen)}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setExpandedId(expandedId === keyword.id ? null : keyword.id)}
                    disabled={actionLoading === keyword.id}
                    className="px-2 py-1 text-[10px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    title="Add to Targets"
                  >
                    + Add
                  </button>
                  <button
                    onClick={() => handleIgnore(keyword)}
                    disabled={actionLoading === keyword.id}
                    className="px-2 py-1 text-[10px] font-medium text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
                    title="Ignore"
                  >
                    Ignore
                  </button>
                </div>
              </div>

              {/* Expanded add-to-targets form */}
              {expandedId === keyword.id && (
                <div className="px-4 pb-3">
                  <AddToTargetsForm
                    keyword={keyword}
                    onSubmit={data => handleAddToTargets(keyword, data)}
                    onCancel={() => setExpandedId(null)}
                    loading={actionLoading === keyword.id}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
