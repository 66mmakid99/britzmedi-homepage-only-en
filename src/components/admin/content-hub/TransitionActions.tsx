// Status transition buttons — shows valid next-states based on current status

import { useState } from 'react';

interface TransitionActionsProps {
  postId: string;
  currentStatus: string;
  qualityScore?: number;
  onTransition: (targetStatus: string, override?: boolean) => Promise<void>;
}

const TRANSITIONS: Record<string, { target: string; label: string; color: string; confirm?: string }[]> = {
  draft: [
    { target: 'review', label: 'Submit for Review', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  ],
  review: [
    { target: 'approved', label: 'Approve', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { target: 'draft', label: 'Send Back to Draft', color: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
  ],
  approved: [
    { target: 'published', label: 'Publish', color: 'bg-green-600 hover:bg-green-700 text-white', confirm: 'Publish this post? It will be committed to GitHub and auto-posted to social media.' },
    { target: 'draft', label: 'Send Back to Draft', color: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
  ],
  published: [
    { target: 'archived', label: 'Archive', color: 'bg-slate-600 hover:bg-slate-700 text-white', confirm: 'Archive this post? It will be removed from the live site.' },
    { target: 'draft', label: 'Unpublish & Edit', color: 'bg-red-100 hover:bg-red-200 text-red-700', confirm: 'Unpublish this post? It will be removed from the live site and moved to draft.' },
  ],
  archived: [
    { target: 'draft', label: 'Reopen as Draft', color: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
  ],
};

export function TransitionActions({ postId, currentStatus, qualityScore, onTransition }: TransitionActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);

  const actions = TRANSITIONS[currentStatus] || [];

  const handleClick = async (target: string, confirm?: string, override?: boolean) => {
    if (confirm && !window.confirm(confirm)) return;

    // Quality gate for approve
    if (target === 'approved' && qualityScore !== undefined && qualityScore < 60 && !override) {
      setShowOverride(true);
      return;
    }

    setLoading(target);
    try {
      await onTransition(target, override);
    } finally {
      setLoading(null);
      setShowOverride(false);
    }
  };

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map(action => (
          <button
            key={action.target}
            onClick={() => handleClick(action.target, action.confirm)}
            disabled={!!loading}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${action.color} ${
              loading === action.target ? 'opacity-50' : ''
            } disabled:opacity-50`}
          >
            {loading === action.target ? 'Processing...' : action.label}
          </button>
        ))}
      </div>

      {showOverride && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
          <p className="text-amber-800 font-medium mb-2">
            Quality score is below 60. Override and approve anyway?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleClick('approved', undefined, true)}
              disabled={!!loading}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading === 'approved' ? 'Processing...' : 'Override & Approve'}
            </button>
            <button
              onClick={() => setShowOverride(false)}
              className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
