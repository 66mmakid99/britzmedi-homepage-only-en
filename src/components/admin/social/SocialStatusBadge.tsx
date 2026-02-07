interface SocialStatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  posted: { label: 'Posted', bg: 'bg-green-100', text: 'text-green-700' },
  failed: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-700' },
  skipped: { label: 'Skipped', bg: 'bg-slate-100', text: 'text-slate-500' },
};

export function SocialStatusBadge({ status }: SocialStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
