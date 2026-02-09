// Color-coded status badges for blog posts

interface BlogStatusBadgeProps {
  status: string;
  scheduledDate?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700' },
  review: { label: 'Review', bg: 'bg-amber-100', text: 'text-amber-700' },
  approved: { label: 'Approved', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-100', text: 'text-blue-700' },
  published: { label: 'Published', bg: 'bg-green-100', text: 'text-green-700' },
  unpublished: { label: 'Unpublished', bg: 'bg-red-100', text: 'text-red-700' },
  archived: { label: 'Archived', bg: 'bg-slate-200', text: 'text-slate-600' },
};

export function BlogStatusBadge({ status, scheduledDate }: BlogStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {status === 'scheduled' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {status === 'published' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {config.label}
      {status === 'scheduled' && scheduledDate && (
        <span className="text-[10px] opacity-75">
          {new Date(scheduledDate).toLocaleDateString()}
        </span>
      )}
    </span>
  );
}
