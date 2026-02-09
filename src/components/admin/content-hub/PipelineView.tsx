// Horizontal kanban pipeline with 5 status columns

import { ContentCard } from './ContentCard';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string;
  tags: string | null;
  status: string;
  scheduled_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  youtube_url: string | null;
  doctor_name: string | null;
}

interface QualityInfo {
  id: string;
  score: number;
  grade: string;
}

interface PipelineViewProps {
  posts: Post[];
  qualityMap: Record<string, QualityInfo>;
  selectedId: string | null;
  onSelectPost: (post: Post) => void;
}

const COLUMNS = [
  { status: 'draft', label: 'Draft', headerColor: 'bg-slate-500' },
  { status: 'review', label: 'Review', headerColor: 'bg-amber-500' },
  { status: 'approved', label: 'Approved', headerColor: 'bg-indigo-500' },
  { status: 'published', label: 'Published', headerColor: 'bg-green-500' },
  { status: 'archived', label: 'Archived', headerColor: 'bg-slate-400' },
];

export function PipelineView({ posts, qualityMap, selectedId, onSelectPost }: PipelineViewProps) {
  const grouped: Record<string, Post[]> = {};
  for (const col of COLUMNS) {
    grouped[col.status] = [];
  }
  for (const post of posts) {
    const status = grouped[post.status] ? post.status : 'draft';
    grouped[status].push(post);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
      {COLUMNS.map(col => {
        const columnPosts = grouped[col.status] || [];
        return (
          <div key={col.status} className="flex-shrink-0 w-56">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2.5 h-2.5 rounded-full ${col.headerColor}`} />
              <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                {columnPosts.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px] bg-slate-50 rounded-xl p-2 border border-slate-100">
              {columnPosts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No posts</p>
              ) : (
                columnPosts.map(post => {
                  const q = qualityMap[post.id];
                  return (
                    <ContentCard
                      key={post.id}
                      post={post}
                      qualityScore={q?.score}
                      qualityGrade={q?.grade}
                      onClick={() => onSelectPost(post)}
                      isSelected={selectedId === post.id}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
