import { useState } from 'react';
import type { BlogJob, JobStatus } from '../../../lib/youtube-to-blog/schemas';

interface QueueItemProps {
  job: BlogJob;
  onDelete: (jobId: string) => void;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-700', icon: 'clock' },
  extracting: { label: 'Extracting transcript...', color: 'bg-blue-100 text-blue-700', icon: 'download' },
  translating: { label: 'Translating...', color: 'bg-indigo-100 text-indigo-700', icon: 'translate' },
  generating: { label: 'Generating blog post...', color: 'bg-purple-100 text-purple-700', icon: 'sparkle' },
  researching: { label: 'Researching doctor info...', color: 'bg-amber-100 text-amber-700', icon: 'search' },
  imaging: { label: 'Generating images...', color: 'bg-pink-100 text-pink-700', icon: 'image' },
  finalizing: { label: 'Finalizing...', color: 'bg-teal-100 text-teal-700', icon: 'check' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: 'check' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: 'x' },
};

export function QueueItem({ job, onDelete }: QueueItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;

  const isActive = !['completed', 'failed', 'pending'].includes(job.status) && processing;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/blog/queue/${job.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(job.id);
    } catch {
      alert('Failed to delete job');
    } finally {
      setDeleting(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!['pending', 'failed'].includes(job.status)) return;
    setProcessing(true);

    const steps = ['extract', 'translate', 'generate', 'research', 'image', 'finalize'];

    for (const step of steps) {
      try {
        const res = await fetch(`/api/blog/queue/${job.id}/step/${step}`, {
          method: 'POST',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: `Step ${step} returned ${res.status}` }));
          console.error(`Step ${step} failed:`, data.error);
          // Mark job as failed in DB so UI can show error and allow retry
          await fetch(`/api/blog/queue/${job.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error_message: `Step "${step}" failed: ${data.error || res.statusText}` }),
          });
          break;
        }
      } catch (err: any) {
        console.error(`Step ${step} failed:`, err);
        await fetch(`/api/blog/queue/${job.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed', error_message: `Step "${step}" error: ${err.message || 'Network error'}` }),
        }).catch(() => {});
        break;
      }
    }

    setProcessing(false);
    // Parent will poll for updates
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <img
          src={`https://img.youtube.com/vi/${job.youtube_id}/mqdefault.jpg`}
          alt={job.video_title || 'Video thumbnail'}
          className="w-28 h-16 rounded-lg object-cover flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-slate-900 truncate">
                {job.video_title || `Video: ${job.youtube_id}`}
              </h3>
              {job.channel_name && (
                <p className="text-xs text-slate-500 mt-0.5">{job.channel_name}</p>
              )}
            </div>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${config.color}`}>
              {config.label}
            </span>
          </div>

          {/* Progress bar */}
          {(isActive || processing) && (
            <div className="mt-3">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{job.progress}% complete</p>
            </div>
          )}

          {/* Error message */}
          {job.status === 'failed' && job.error_message && (
            <p className="text-xs text-red-600 mt-2 bg-red-50 px-3 py-2 rounded-lg">
              {job.error_message}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {job.status === 'pending' && (
              <button
                onClick={handleStartProcessing}
                disabled={processing}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {processing ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Processing
                  </>
                )}
              </button>
            )}

            {job.status === 'completed' && job.blog_post_id && (
              <a
                href={`/admin/youtube-to-blog/${job.blog_post_id}`}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Post
              </a>
            )}

            {job.status === 'failed' && (
              <button
                onClick={handleStartProcessing}
                disabled={processing}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                Retry
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleting || isActive}
              className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>

            <span className="ml-auto text-xs text-slate-400">
              {new Date(job.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
