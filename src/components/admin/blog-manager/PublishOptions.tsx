// Publish options panel: Publish Now / Schedule / Save Draft

import { useState } from 'react';
import { DateTimePicker } from './DateTimePicker';

interface PublishOptionsProps {
  currentStatus: string;
  scheduledDate: string | null;
  onPublishNow: () => void;
  onSchedule: (date: string) => void;
  onSaveDraft: () => void;
  loading?: boolean;
}

export function PublishOptions({
  currentStatus,
  scheduledDate,
  onPublishNow,
  onSchedule,
  onSaveDraft,
  loading = false,
}: PublishOptionsProps) {
  const [mode, setMode] = useState<'now' | 'schedule' | 'draft'>(
    currentStatus === 'scheduled' ? 'schedule' : currentStatus === 'published' ? 'now' : 'draft'
  );
  const [selectedDate, setSelectedDate] = useState(scheduledDate || '');

  const handleAction = () => {
    if (mode === 'now') {
      onPublishNow();
    } else if (mode === 'schedule') {
      if (!selectedDate) return;
      onSchedule(selectedDate);
    } else {
      onSaveDraft();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
        Publishing
      </h3>

      {/* Mode selector */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="radio"
            name="publish-mode"
            checked={mode === 'now'}
            onChange={() => setMode('now')}
            className="text-primary-600 focus:ring-primary-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Publish Now</p>
            <p className="text-xs text-slate-500">Immediately visible on the blog</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="radio"
            name="publish-mode"
            checked={mode === 'schedule'}
            onChange={() => setMode('schedule')}
            className="text-primary-600 focus:ring-primary-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Schedule</p>
            <p className="text-xs text-slate-500">Auto-publish at a specific date/time</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
          <input
            type="radio"
            name="publish-mode"
            checked={mode === 'draft'}
            onChange={() => setMode('draft')}
            className="text-primary-600 focus:ring-primary-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-900">Save as Draft</p>
            <p className="text-xs text-slate-500">Not visible, can edit later</p>
          </div>
        </label>
      </div>

      {/* Date picker for schedule mode */}
      {mode === 'schedule' && (
        <div className="pl-7">
          <DateTimePicker
            value={selectedDate}
            onChange={setSelectedDate}
            label="Publish Date & Time"
          />
        </div>
      )}

      {/* Countdown for scheduled posts */}
      {currentStatus === 'scheduled' && scheduledDate && (
        <ScheduleCountdown date={scheduledDate} />
      )}

      {/* Action button */}
      <button
        onClick={handleAction}
        disabled={loading || (mode === 'schedule' && !selectedDate)}
        className={`w-full py-2.5 px-4 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          mode === 'now'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : mode === 'schedule'
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-slate-600 hover:bg-slate-700 text-white'
        }`}
      >
        {loading ? 'Saving...' : mode === 'now' ? 'Publish Now' : mode === 'schedule' ? 'Schedule Post' : 'Save Draft'}
      </button>

      {/* Quick publish shortcut for scheduled posts */}
      {currentStatus === 'scheduled' && mode !== 'now' && (
        <button
          onClick={onPublishNow}
          disabled={loading}
          className="w-full py-2 px-4 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
        >
          Publish Now Instead
        </button>
      )}
    </div>
  );
}

function ScheduleCountdown({ date }: { date: string }) {
  const target = new Date(date).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
        Scheduled time has passed. The post will be published on the next cron check.
      </div>
    );
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let timeStr: string;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    timeStr = `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    timeStr = `${hours}h ${minutes}m`;
  } else {
    timeStr = `${minutes}m`;
  }

  return (
    <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Publishing in {timeStr}
    </div>
  );
}
