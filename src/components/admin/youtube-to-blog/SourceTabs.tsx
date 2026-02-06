import { useState } from 'react';
import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';
import { SingleUrlInput } from './SingleUrlInput';
import { MultipleUrlInput } from './MultipleUrlInput';
import { ChannelInput } from './ChannelInput';
import { FileUpload } from './FileUpload';

type SourceType = 'youtube' | 'document';
type YouTubeMode = 'single' | 'multiple' | 'channel';

interface SourceTabsProps {
  onJobCreated: (job: BlogJob) => void;
}

export function SourceTabs({ onJobCreated }: SourceTabsProps) {
  const [sourceType, setSourceType] = useState<SourceType>('youtube');
  const [youtubeMode, setYoutubeMode] = useState<YouTubeMode>('single');

  const sources: { key: SourceType; label: string; icon: string; desc: string }[] = [
    {
      key: 'youtube',
      label: 'YouTube',
      icon: 'M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z',
      desc: 'Convert YouTube videos',
    },
    {
      key: 'document',
      label: 'Document',
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      desc: 'Upload PDF, DOCX, PPTX',
    },
  ];

  const youtubeModes: { key: YouTubeMode; label: string; desc: string }[] = [
    { key: 'single', label: 'Single Video', desc: 'Process one YouTube URL' },
    { key: 'multiple', label: 'Multiple Videos', desc: 'Batch process several URLs' },
    { key: 'channel', label: 'Channel', desc: 'Browse channel videos' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Source Type Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {sources.map(s => (
          <button
            key={s.key}
            onClick={() => setSourceType(s.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
              sourceType === s.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <svg
              className={`w-6 h-6 flex-shrink-0 ${sourceType === s.key ? 'text-blue-600' : 'text-slate-400'}`}
              fill={s.key === 'youtube' ? 'currentColor' : 'none'}
              stroke={s.key === 'document' ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={s.key === 'document' ? 1.5 : undefined}
            >
              <path
                strokeLinecap={s.key === 'document' ? 'round' : undefined}
                strokeLinejoin={s.key === 'document' ? 'round' : undefined}
                d={s.icon}
              />
            </svg>
            <div>
              <span className={`text-sm font-semibold ${sourceType === s.key ? 'text-blue-700' : 'text-slate-900'}`}>
                {s.label}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* YouTube Sub-modes */}
      {sourceType === 'youtube' && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {youtubeModes.map(m => (
            <button
              key={m.key}
              onClick={() => setYoutubeMode(m.key)}
              className={`p-3 rounded-lg border text-left transition-all ${
                youtubeMode === m.key
                  ? 'border-blue-400 bg-blue-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className={`text-xs font-semibold ${youtubeMode === m.key ? 'text-blue-700' : 'text-slate-900'}`}>
                {m.label}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {sourceType === 'youtube' && (
          <>
            {youtubeMode === 'single' && <SingleUrlInput onJobCreated={onJobCreated} />}
            {youtubeMode === 'multiple' && <MultipleUrlInput onJobCreated={onJobCreated} />}
            {youtubeMode === 'channel' && <ChannelInput onJobCreated={onJobCreated} />}
          </>
        )}
        {sourceType === 'document' && (
          <FileUpload onJobCreated={onJobCreated} />
        )}
      </div>
    </div>
  );
}
