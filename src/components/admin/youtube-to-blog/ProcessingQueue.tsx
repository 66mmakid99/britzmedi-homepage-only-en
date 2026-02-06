import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';
import { QueueItem } from './QueueItem';

interface ProcessingQueueProps {
  jobs: BlogJob[];
  onRefresh: () => void;
  onJobDeleted: (jobId: string) => void;
}

export function ProcessingQueue({ jobs, onRefresh, onJobDeleted }: ProcessingQueueProps) {
  const activeJobs = jobs.filter(j => !['completed', 'failed'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Active ({activeJobs.length})
            </h2>
            <button
              onClick={onRefresh}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <QueueItem key={job.id} job={job} onDelete={onJobDeleted} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Completed ({completedJobs.length})
          </h2>
          <div className="space-y-3">
            {completedJobs.map(job => (
              <QueueItem key={job.id} job={job} onDelete={onJobDeleted} />
            ))}
          </div>
        </section>
      )}

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-700 mb-3">
            Failed ({failedJobs.length})
          </h2>
          <div className="space-y-3">
            {failedJobs.map(job => (
              <QueueItem key={job.id} job={job} onDelete={onJobDeleted} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {jobs.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No jobs in the queue</p>
          <p className="text-xs text-slate-400 mt-1">Submit a YouTube URL to get started</p>
        </div>
      )}
    </div>
  );
}
