// Post card for pipeline view — thumbnail, title, quality grade, category, date

import { BlogStatusBadge } from '../blog-manager/BlogStatusBadge';
import { QualityGradeBadge } from './QualityPanel';

interface ContentCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    featured_image: string | null;
    category: string;
    status: string;
    created_at: string;
    updated_at: string;
    doctor_name: string | null;
  };
  qualityScore?: number;
  qualityGrade?: string;
  onClick: () => void;
  isSelected?: boolean;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ContentCard({ post, qualityScore, qualityGrade, onClick, isSelected }: ContentCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-lg border transition-all hover:shadow-md cursor-pointer ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Thumbnail */}
      {post.featured_image && (
        <div className="h-24 w-full overflow-hidden rounded-t-lg bg-slate-100">
          <img
            src={post.featured_image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Title */}
        <h4 className="text-sm font-medium text-slate-900 line-clamp-2 leading-tight">
          {post.title}
        </h4>

        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {qualityGrade && qualityScore !== undefined && (
              <QualityGradeBadge grade={qualityGrade} score={qualityScore} />
            )}
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">
            {formatDate(post.updated_at || post.created_at)}
          </span>
        </div>

        {/* Category */}
        {post.category && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
            {post.category}
          </span>
        )}
      </div>
    </button>
  );
}
