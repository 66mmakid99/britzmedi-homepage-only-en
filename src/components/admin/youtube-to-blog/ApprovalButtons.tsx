import { useState } from 'react';
import type { BlogPost, PostStatus } from '../../../lib/youtube-to-blog/schemas';

interface ApprovalButtonsProps {
  post: BlogPost;
  onUpdate: (post: BlogPost) => void;
}

export function ApprovalButtons({ post, onUpdate }: ApprovalButtonsProps) {
  const [loading, setLoading] = useState('');

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      let res: Response;

      if (action === 'send-approval') {
        res = await fetch(`/api/blog/posts/${post.id}/send-approval`, {
          method: 'POST',
        });
      } else if (action === 'approve' || action === 'reject') {
        res = await fetch(`/api/blog/posts/${post.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      } else if (action === 'publish') {
        res = await fetch(`/api/blog/posts/${post.id}/publish`, {
          method: 'POST',
        });
      } else if (action === 'unpublish') {
        res = await fetch(`/api/blog/posts/${post.id}/unpublish`, {
          method: 'POST',
        });
      } else {
        return;
      }

      if (res!.ok) {
        const data = await res!.json();
        if (data.post) {
          onUpdate(data.post);
        } else {
          // Refresh post data
          const refreshRes = await fetch(`/api/blog/posts/${post.id}`);
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            onUpdate(refreshData.post);
          }
        }

        if (data.message) {
          alert(data.message);
        }
      } else {
        const data = await res!.json();
        alert(data.error || 'Action failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setLoading('');
    }
  };

  const statusFlow: Record<PostStatus, { label: string; actions: { key: string; label: string; color: string }[] }> = {
    draft: {
      label: 'Draft',
      actions: [
        { key: 'send-approval', label: 'Send for Approval', color: 'bg-amber-600 hover:bg-amber-700' },
        { key: 'approve', label: 'Quick Approve', color: 'bg-green-600 hover:bg-green-700' },
      ],
    },
    review: {
      label: 'In Review',
      actions: [
        { key: 'approve', label: 'Approve', color: 'bg-green-600 hover:bg-green-700' },
        { key: 'reject', label: 'Reject', color: 'bg-red-600 hover:bg-red-700' },
      ],
    },
    approved: {
      label: 'Approved',
      actions: [
        { key: 'publish', label: 'Publish to Site', color: 'bg-blue-600 hover:bg-blue-700' },
        { key: 'reject', label: 'Back to Draft', color: 'bg-slate-600 hover:bg-slate-700' },
      ],
    },
    published: {
      label: 'Published',
      actions: [
        { key: 'unpublish', label: 'Unpublish', color: 'bg-red-600 hover:bg-red-700' },
      ],
    },
    unpublished: {
      label: 'Unpublished',
      actions: [
        { key: 'publish', label: 'Re-publish', color: 'bg-blue-600 hover:bg-blue-700' },
      ],
    },
  };

  const current = statusFlow[post.status] || statusFlow.draft;

  return (
    <div className="flex items-center gap-2">
      {current.actions.map(action => (
        <button
          key={action.key}
          onClick={() => handleAction(action.key)}
          disabled={!!loading}
          className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${action.color}`}
        >
          {loading === action.key ? 'Processing...' : action.label}
        </button>
      ))}
    </div>
  );
}
