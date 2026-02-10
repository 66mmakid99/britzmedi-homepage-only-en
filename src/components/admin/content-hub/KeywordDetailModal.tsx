// KeywordDetailModal — shows 12-week ranking history for a single keyword
// Fetches from /api/admin/content-hub/seo/history/:id

import { useState, useEffect } from 'react';
import { PositionBadge } from './PositionBadge';

// ─── Types ──────────────────────────────────────────────────────

interface HistoryEntry {
  week: string;
  position: number | null;
  impressions: number;
  clicks: number;
  ctr: number;
  milestone?: string | null;
}

interface ProgressEntry {
  week: string;
  position: number | null;
  change: number | null;
}

interface KeywordDetail {
  keyword: string;
  category: string;
  tier: number;
  target_position: number;
  current_position: number | null;
  content_status: string | null;
  history: HistoryEntry[];
  progress: ProgressEntry[];
}

interface KeywordDetailModalProps {
  keywordId: number;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatCtr(ctr: number): string {
  return (ctr * 100).toFixed(1) + '%';
}

const TIER_LABEL: Record<number, { text: string; className: string }> = {
  1: { text: 'Tier 1', className: 'bg-red-100 text-red-700' },
  2: { text: 'Tier 2', className: 'bg-orange-100 text-orange-700' },
  3: { text: 'Tier 3', className: 'bg-blue-100 text-blue-700' },
  4: { text: 'Tier 4', className: 'bg-purple-100 text-purple-700' },
};

const CONTENT_STATUS_BADGE: Record<string, string> = {
  brief: 'bg-slate-100 text-slate-600',
  generating: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-blue-100 text-blue-700',
  review: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
};

// ─── Component ──────────────────────────────────────────────────

export function KeywordDetailModal({ keywordId, onClose }: KeywordDetailModalProps) {
  const [data, setData] = useState<KeywordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/content-hub/seo/history/${keywordId}?limit=12`);
        if (!res.ok) throw new Error('Failed to fetch keyword history');
        const json = await res.json();
        if (!cancelled) {
          if (json.connected === false) {
            setError(json.error || 'SEO API unreachable');
          } else {
            setData(json.data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [keywordId]);

  // Compute position range for the trend visualization
  const positions = data?.progress
    ?.map(p => p.position)
    .filter((p): p is number => p != null) || [];
  const maxPos = positions.length > 0 ? Math.max(...positions) : 100;
  const minPos = positions.length > 0 ? Math.min(...positions) : 1;
  const range = Math.max(maxPos - minPos, 10); // minimum 10 range for visual clarity

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {loading ? 'Loading...' : data?.keyword || 'Keyword Detail'}
            </h2>
            {data && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${
                  TIER_LABEL[data.tier]?.className || 'bg-slate-100 text-slate-600'
                }`}>
                  {TIER_LABEL[data.tier]?.text || `Tier ${data.tier}`}
                </span>
                <span className="text-xs text-slate-400">{data.category}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Data */}
          {data && !loading && (
            <>
              {/* Position Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Current Position</p>
                  <PositionBadge position={data.current_position} size="md" />
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Target Position</p>
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 min-w-[44px]">
                    #{data.target_position}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Content Status</p>
                  {data.content_status ? (
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                      CONTENT_STATUS_BADGE[data.content_status] || 'bg-slate-100 text-slate-600'
                    }`}>
                      {data.content_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">No content</span>
                  )}
                </div>
              </div>

              {/* Position Trend (CSS bar chart) */}
              {data.progress && data.progress.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Position Trend</h3>
                  <div className="bg-slate-50 rounded-xl p-4">
                    {/* Target line label */}
                    <div className="flex items-center gap-2 mb-2 text-[10px] text-blue-500">
                      <span className="w-3 h-px bg-blue-400 inline-block" />
                      Target: #{data.target_position}
                    </div>

                    {/* Chart */}
                    <div className="flex items-end gap-1" style={{ height: '120px' }}>
                      {data.progress.map((entry, i) => {
                        const pos = entry.position;
                        // Invert: lower position = taller bar (better ranking)
                        const barHeight = pos != null
                          ? Math.max(8, ((maxPos - pos) / range) * 100)
                          : 0;
                        const isGood = pos != null && pos <= 10;
                        const isMid = pos != null && pos > 10 && pos <= 50;

                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            {pos != null ? (
                              <>
                                <span className="text-[9px] text-slate-500 mb-1">#{pos}</span>
                                <div
                                  className={`w-full rounded-t transition-all ${
                                    isGood ? 'bg-green-400' : isMid ? 'bg-amber-400' : 'bg-orange-400'
                                  }`}
                                  style={{ height: `${barHeight}%`, minHeight: '4px' }}
                                  title={`${entry.week}: #${pos}`}
                                />
                              </>
                            ) : (
                              <div className="w-full h-1 bg-slate-200 rounded" title={`${entry.week}: no data`} />
                            )}
                            <span className="text-[8px] text-slate-400 mt-1 truncate w-full text-center">
                              {entry.week.replace('2026-', '')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly History Table */}
              {data.history && data.history.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Weekly History</h3>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      <span>Week</span>
                      <span className="text-center">Position</span>
                      <span className="text-center">Impressions</span>
                      <span className="text-center">Clicks</span>
                      <span className="text-center">CTR</span>
                      <span className="text-center">Milestone</span>
                    </div>

                    {/* Rows */}
                    {data.history.map((entry, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-6 gap-2 px-4 py-2.5 text-xs ${
                          i < data.history.length - 1 ? 'border-b border-slate-50' : ''
                        } hover:bg-slate-50`}
                      >
                        <span className="text-slate-600 font-medium">{entry.week}</span>
                        <span className="text-center">
                          <PositionBadge position={entry.position} />
                        </span>
                        <span className="text-center text-slate-600">
                          {formatNumber(entry.impressions)}
                        </span>
                        <span className="text-center text-slate-600">
                          {formatNumber(entry.clicks)}
                        </span>
                        <span className="text-center text-slate-600">
                          {entry.ctr != null ? formatCtr(entry.ctr) : '--'}
                        </span>
                        <span className="text-center">
                          {entry.milestone ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-yellow-100 text-yellow-700">
                              {entry.milestone}
                            </span>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
