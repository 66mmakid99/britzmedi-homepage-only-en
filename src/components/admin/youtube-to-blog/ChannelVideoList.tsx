import { useState } from 'react';
import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';

interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  duration?: string;
  url: string;
}

interface ChannelVideoListProps {
  channelName: string;
  videos: ChannelVideo[];
  onJobCreated: (job: BlogJob) => void;
}

export function ChannelVideoList({ channelName, videos, onJobCreated }: ChannelVideoListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === videos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(videos.map(v => v.id)));
    }
  };

  const handleProcessSelected = async () => {
    if (selected.size === 0) return;
    setProcessing(true);

    const selectedVideos = videos.filter(v => selected.has(v.id));

    for (const video of selectedVideos) {
      try {
        const res = await fetch('/api/blog/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtube_url: video.url }),
        });

        if (res.ok) {
          const data = await res.json();
          onJobCreated(data.job);
        }
      } catch {
        console.error('Failed to create job for:', video.url);
      }
    }

    setSelected(new Set());
    setProcessing(false);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{channelName}</h3>
          <p className="text-xs text-slate-500">{videos.length} videos found</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {selected.size === videos.length ? 'Deselect All' : 'Select All'}
          </button>
          {selected.size > 0 && (
            <button
              onClick={handleProcessSelected}
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {processing ? 'Processing...' : `Generate ${selected.size} Post${selected.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {videos.map(video => (
          <label
            key={video.id}
            className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected.has(video.id)
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(video.id)}
              onChange={() => toggleSelect(video.id)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-24 h-14 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{video.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">
                  {new Date(video.published).toLocaleDateString()}
                </span>
                {video.duration && (
                  <span className="text-xs text-slate-400">{video.duration}</span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
