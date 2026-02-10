// Content item card — shows status, source type, title, SEO info, word count

interface ContentItem {
  id: number;
  source_type: 'youtube' | 'file' | 'seo_brief' | 'manual';
  source_id: string | null;
  source_url: string | null;
  title: string;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  category: string | null;
  tags: string | null;
  featured_image: string | null;
  seo_keyword: string | null;
  seo_gap_score: number | null;
  seo_target_position: number | null;
  status: 'brief' | 'generating' | 'draft' | 'review' | 'approved' | 'published' | 'archived';
  author: string;
  word_count: number | null;
  estimated_read_time: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentItemCardProps {
  item: ContentItem;
  selected: boolean;
  onClick: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  brief: 'bg-slate-100 text-slate-600',
  generating: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-blue-100 text-blue-700',
  review: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
};

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  youtube: { label: 'YouTube', className: 'bg-red-100 text-red-700' },
  file: { label: 'File', className: 'bg-sky-100 text-sky-700' },
  seo_brief: { label: 'SEO', className: 'bg-purple-100 text-purple-700' },
  manual: { label: 'Manual', className: 'bg-slate-100 text-slate-600' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ContentItemCard({ item, selected, onClick }: ContentItemCardProps) {
  const statusStyle = STATUS_BADGE[item.status] || STATUS_BADGE.brief;
  const sourceBadge = SOURCE_BADGE[item.source_type] || SOURCE_BADGE.manual;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors ${
        selected ? 'bg-blue-50' : ''
      }`}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
        {item.featured_image ? (
          <img src={item.featured_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            {item.source_type === 'youtube' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            ) : item.source_type === 'seo_brief' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-slate-900 truncate">{item.title}</h4>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Source badge */}
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${sourceBadge.className}`}>
            {sourceBadge.label}
          </span>
          {/* Status badge */}
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${statusStyle}`}>
            {capitalize(item.status)}
          </span>
          {/* SEO keyword */}
          {item.seo_keyword && (
            <span className="inline-flex items-center gap-1 text-[10px] text-purple-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              {item.seo_keyword}
              {item.seo_gap_score !== null && (
                <span className="font-medium">({item.seo_gap_score})</span>
              )}
            </span>
          )}
          {/* Word count */}
          {item.word_count !== null && item.word_count > 0 && (
            <span className="text-[10px] text-slate-400">
              {item.word_count.toLocaleString()} words
            </span>
          )}
          {/* Read time */}
          {item.estimated_read_time && (
            <span className="text-[10px] text-slate-400">
              {item.estimated_read_time}
            </span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="text-xs text-slate-400 flex-shrink-0">
        {formatDate(item.updated_at || item.created_at)}
      </div>
    </button>
  );
}
