import { ChannelIcon } from './ChannelIcon';
import { SocialStatusBadge } from './SocialStatusBadge';

interface SocialPost {
  id: number;
  post_id: string;
  channel: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  external_id: string | null;
  error_message: string | null;
  created_at: string;
  blog_title?: string;
  blog_slug?: string;
}

interface SocialPostListProps {
  posts: SocialPost[];
  onRepost: (id: number) => void;
  onDelete: (id: number) => void;
  repostingId: number | null;
}

const CHANNEL_COLORS: Record<string, string> = {
  twitter: 'text-slate-900',
  linkedin: 'text-blue-700',
  facebook: 'text-blue-600',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SocialPostList({ posts, onRepost, onDelete, repostingId }: SocialPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <p>No social posts yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-500">Channel</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Blog Post</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Content</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4">
                <div className={`flex items-center gap-2 ${CHANNEL_COLORS[post.channel] || 'text-slate-600'}`}>
                  <ChannelIcon channel={post.channel} className="w-4 h-4" />
                  <span className="capitalize text-xs font-medium">{post.channel}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-slate-900 font-medium text-xs line-clamp-1">
                  {post.blog_title || post.post_id}
                </span>
              </td>
              <td className="py-3 px-4 max-w-xs">
                <span className="text-slate-600 text-xs line-clamp-2">{post.content}</span>
              </td>
              <td className="py-3 px-4">
                <SocialStatusBadge status={post.status} />
                {post.error_message && (
                  <p className="text-xs text-red-500 mt-1 line-clamp-1" title={post.error_message}>
                    {post.error_message}
                  </p>
                )}
              </td>
              <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                {formatDate(post.published_at || post.created_at)}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onRepost(post.id)}
                    disabled={repostingId === post.id}
                    className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                    title="Re-post"
                  >
                    {repostingId === post.id ? 'Posting...' : 'Repost'}
                  </button>
                  <button
                    onClick={() => onDelete(post.id)}
                    className="px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
