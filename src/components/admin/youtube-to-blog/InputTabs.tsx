import { useState } from 'react';
import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';
import { SingleUrlInput } from './SingleUrlInput';
import { MultipleUrlInput } from './MultipleUrlInput';
import { ChannelInput } from './ChannelInput';

type InputMode = 'single' | 'multiple' | 'channel';

interface InputTabsProps {
  onJobCreated: (job: BlogJob) => void;
}

export function InputTabs({ onJobCreated }: InputTabsProps) {
  const [mode, setMode] = useState<InputMode>('single');

  const modes: { key: InputMode; label: string; desc: string }[] = [
    { key: 'single', label: 'Single Video', desc: 'Process one YouTube URL' },
    { key: 'multiple', label: 'Multiple Videos', desc: 'Batch process several URLs' },
    { key: 'channel', label: 'Channel', desc: 'Browse channel videos' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {modes.map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              mode === m.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className={`text-sm font-semibold ${mode === m.key ? 'text-blue-700' : 'text-slate-900'}`}>
              {m.label}
            </span>
            <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Input Forms */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {mode === 'single' && <SingleUrlInput onJobCreated={onJobCreated} />}
        {mode === 'multiple' && <MultipleUrlInput onJobCreated={onJobCreated} />}
        {mode === 'channel' && <ChannelInput onJobCreated={onJobCreated} />}
      </div>
    </div>
  );
}
