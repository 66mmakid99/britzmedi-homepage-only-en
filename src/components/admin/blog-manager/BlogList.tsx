// Filterable blog post list with status tabs

import { BlogStatusBadge } from './BlogStatusBadge';

interface BlogPost {
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
  source?: 'db' | 'file' | 'static';
}

interface BlogListProps {
  posts: BlogPost[];
  loading: boolean;
  onStatusChange: (postId: string, status: string, scheduledDate?: string) => void;
  onDelete: (postId: string) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'medical-devices': 'Medical Devices',
    'industry-news': 'Industry News',
    'product-updates': 'Product Updates',
    'technology': 'Technology',
    'clinical-studies': 'Clinical Studies',
    'company-news': 'Company News',
    'education': 'Education',
  };
  return labels[category] || category;
}

function SourceBadge({ source }: { source?: string }) {
  if (source === 'file') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-600 border border-blue-200">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        File
      </span>
    );
  }
  if (source === 'static') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-50 text-purple-600 border border-purple-200">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Built-in
      </span>
    );
  }
  return null;
}

export function BlogList({ posts, loading, onStatusChange, onDelete }: BlogListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-16 bg-slate-200 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p className="text-slate-500 text-sm">No posts found</p>
      </div>
    );
  }

  const isFilePost = (post: BlogPost) => post.source === 'file' || post.source === 'static';

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <div
          key={post.id}
          className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
        >
          <div className="p-4 flex gap-4">
            {/* Thumbnail */}
            <div className="w-28 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
              {post.featured_image ? (
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {post.title}
                    </h3>
                    <SourceBadge source={post.source} />
                  </div>
                  {post.excerpt && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <BlogStatusBadge status={post.status} scheduledDate={post.scheduled_date} />
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {getCategoryLabel(post.category)}
                </span>
                <span>
                  Created {formatDate(post.created_at)}
                </span>
                {post.status === 'scheduled' && post.scheduled_date && (
                  <span className="text-blue-500">
                    Publishes {formatDateTime(post.scheduled_date)}
                  </span>
                )}
                {post.status === 'published' && post.published_at && (
                  <span className="text-green-500">
                    Published {formatDate(post.published_at)}
                  </span>
                )}
                {post.doctor_name && (
                  <span className="text-slate-400">
                    by {post.doctor_name}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isFilePost(post) ? (
                <>
                  {/* View on site */}
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="View on site"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  {/* Publish/Unpublish toggle (file posts only, not static) */}
                  {post.source === 'file' && post.status === 'published' && (
                    <button
                      onClick={() => onStatusChange(post.id, 'draft')}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Unpublish (set to draft)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  )}
                  {post.source === 'file' && post.status !== 'published' && (
                    <button
                      onClick={() => onStatusChange(post.id, 'published')}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Publish"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* DB post actions — existing behavior */}
                  <a
                    href={`/admin/blog-manager/${post.id}/edit`}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit post"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </a>

                  {post.status !== 'published' && (
                    <button
                      onClick={() => onStatusChange(post.id, 'published')}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Publish now"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}

                  {post.status === 'published' && (
                    <button
                      onClick={() => onStatusChange(post.id, 'draft')}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Unpublish (set to draft)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm('Delete "' + post.title + '"?')) {
                        onDelete(post.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete post"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
