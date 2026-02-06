import { useState } from 'react';
import type { BlogPost, PostStatus } from '../../../lib/youtube-to-blog/schemas';

interface PublishedPostsProps {
  posts: BlogPost[];
  onRefresh: () => void;
  onPostDeleted: (postId: string) => void;
}

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  unpublished: 'bg-red-100 text-red-700',
};

export function PublishedPosts({ posts, onRefresh, onPostDeleted }: PublishedPostsProps) {
  const [filter, setFilter] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filteredPosts = filter
    ? posts.filter(p => p.status === filter)
    : posts;

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setDeleting(postId);
    try {
      const res = await fetch(`/api/blog/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        onPostDeleted(postId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch {
      alert('Network error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-600">Filter:</span>
        {['', 'draft', 'review', 'approved', 'published'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
        <button
          onClick={onRefresh}
          className="ml-auto text-xs text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No blog posts yet</p>
          <p className="text-xs text-slate-400 mt-1">Posts will appear here after processing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Featured Image */}
                {post.featured_image ? (
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-24 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium text-slate-900 line-clamp-1">
                      {post.title}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${STATUS_COLORS[post.status] || STATUS_COLORS.draft}`}>
                      {post.status}
                    </span>
                  </div>

                  {post.excerpt && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{post.excerpt}</p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <a
                      href={`/admin/youtube-to-blog/${post.id}`}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </a>
                    {post.status === 'published' && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        View Live
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === post.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <span className="ml-auto text-xs text-slate-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
