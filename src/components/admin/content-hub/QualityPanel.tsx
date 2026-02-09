// Quality check results panel — shows 10 checks with pass/warn/fail status

import type { QualityCheck, QualityResult } from '../../../lib/content/quality-checker';

interface QualityPanelProps {
  quality: QualityResult;
  compact?: boolean;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700 border-green-300',
  B: 'bg-blue-100 text-blue-700 border-blue-300',
  C: 'bg-amber-100 text-amber-700 border-amber-300',
  D: 'bg-red-100 text-red-700 border-red-300',
};

const STATUS_ICON: Record<string, { icon: string; color: string }> = {
  pass: { icon: '✓', color: 'text-green-600' },
  warn: { icon: '!', color: 'text-amber-600' },
  fail: { icon: '✗', color: 'text-red-500' },
};

export function QualityGradeBadge({ grade, score }: { grade: string; score: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full border ${GRADE_COLORS[grade] || GRADE_COLORS.D}`}>
      {grade} · {score}
    </span>
  );
}

export function QualityPanel({ quality, compact }: QualityPanelProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <QualityGradeBadge grade={quality.grade} score={quality.score} />
        <div className="flex gap-0.5">
          {quality.checks.map((c, i) => (
            <span
              key={i}
              title={`${c.name}: ${c.detail}`}
              className={`w-2 h-2 rounded-full ${
                c.status === 'pass' ? 'bg-green-400' :
                c.status === 'warn' ? 'bg-amber-400' : 'bg-red-400'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Quality Score</h3>
        <QualityGradeBadge grade={quality.grade} score={quality.score} />
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            quality.score >= 90 ? 'bg-green-500' :
            quality.score >= 70 ? 'bg-blue-500' :
            quality.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${quality.score}%` }}
        />
      </div>

      {/* Checks list */}
      <div className="space-y-1.5">
        {quality.checks.map((check, i) => {
          const { icon, color } = STATUS_ICON[check.status];
          return (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${color}`}>{icon}</span>
                <span className="text-slate-700">{check.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{check.detail}</span>
                <span className="text-slate-500 font-medium w-8 text-right">
                  {check.points}/{check.maxPoints}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
