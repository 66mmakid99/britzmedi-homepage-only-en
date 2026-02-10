// SEO Brief card — keyword, tier, gap score, priority, generate button

interface SEOBrief {
  id: number;
  keyword: string;
  tier: number;
  category: string;
  target_position: number;
  priority: string;
  content_type: string;
  status: string;
  latest_position: number | null;
  latest_impressions: number | null;
}

interface SEOBriefCardProps {
  brief: SEOBrief;
  onGenerate: (brief: SEOBrief) => void;
}

const TIER_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: 'T1', className: 'bg-red-100 text-red-700 border-red-200' },
  2: { label: 'T2', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  3: { label: 'T3', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  4: { label: 'T4', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-600',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  generated: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function SEOBriefCard({ brief, onGenerate }: SEOBriefCardProps) {
  const tier = TIER_BADGE[brief.tier] || TIER_BADGE[4];
  const priorityStyle = PRIORITY_BADGE[brief.priority] || PRIORITY_BADGE.medium;
  const statusStyle = STATUS_BADGE[brief.status] || STATUS_BADGE.pending;
  const isGenerated = brief.status === 'generated' || brief.status === 'published';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      {/* Top row: tier + keyword + priority */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border ${tier.className}`}>
            {tier.label}
          </span>
          <h4 className="text-sm font-semibold text-slate-900 truncate">{brief.keyword}</h4>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 ${priorityStyle}`}>
          {capitalize(brief.priority)}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
        {/* Category */}
        <span className="inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          {brief.category}
        </span>
        {/* Content type */}
        <span className="inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {capitalize(brief.content_type)}
        </span>
        {/* Target position */}
        <span className="inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Target #{brief.target_position}
        </span>
      </div>

      {/* Metrics row (if available) */}
      {(brief.latest_position !== null || brief.latest_impressions !== null) && (
        <div className="flex items-center gap-4 mb-3 px-3 py-2 bg-slate-50 rounded-lg">
          {brief.latest_position !== null && (
            <div className="text-xs">
              <span className="text-slate-400">Position: </span>
              <span className={`font-semibold ${
                brief.latest_position <= 3 ? 'text-green-600' :
                brief.latest_position <= 10 ? 'text-blue-600' :
                brief.latest_position <= 20 ? 'text-orange-600' : 'text-red-600'
              }`}>
                #{brief.latest_position}
              </span>
            </div>
          )}
          {brief.latest_impressions !== null && (
            <div className="text-xs">
              <span className="text-slate-400">Impressions: </span>
              <span className="font-semibold text-slate-700">{formatNumber(brief.latest_impressions)}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom row: status + action */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${statusStyle}`}>
          {capitalize(brief.status)}
        </span>
        <button
          onClick={() => onGenerate(brief)}
          disabled={isGenerated}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            isGenerated
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerated ? 'Already Generated' : 'Generate Content'}
        </button>
      </div>
    </div>
  );
}
