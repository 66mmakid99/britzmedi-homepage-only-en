// PositionBadge — displays search position with color-coded background
// Green: 1-10, Amber: 11-50, Orange: 51-100, Gray: >100 or null

interface PositionBadgeProps {
  position: number | null | undefined;
  size?: 'sm' | 'md';
}

export function PositionBadge({ position, size = 'sm' }: PositionBadgeProps) {
  const isSmall = size === 'sm';
  const base = isSmall
    ? 'inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold rounded-full min-w-[36px]'
    : 'inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full min-w-[44px]';

  if (position == null || position <= 0) {
    return <span className={`${base} bg-slate-100 text-slate-400`}>&mdash;</span>;
  }

  if (position <= 10) {
    return <span className={`${base} bg-green-100 text-green-700`}>#{position}</span>;
  }

  if (position <= 50) {
    return <span className={`${base} bg-amber-100 text-amber-700`}>#{position}</span>;
  }

  if (position <= 100) {
    return <span className={`${base} bg-orange-100 text-orange-700`}>#{position}</span>;
  }

  return <span className={`${base} bg-slate-100 text-slate-400`}>#{position}</span>;
}
