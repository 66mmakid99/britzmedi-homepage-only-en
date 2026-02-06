import { useState } from 'react';
import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';
import { ChannelVideoList } from './ChannelVideoList';

interface ChannelInputProps {
  onJobCreated: (job: BlogJob) => void;
}

interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  duration?: string;
  url: string;
}

export function ChannelInput({ onJobCreated }: ChannelInputProps) {
  const [channelUrl, setChannelUrl] = useState('');
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channelName, setChannelName] = useState('');

  const handleFetchChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setVideos([]);

    try {
      const res = await fetch(`/api/youtube/channel?url=${encodeURIComponent(channelUrl.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch channel');
        return;
      }

      setChannelName(data.channel_name || 'Unknown Channel');
      setVideos(data.videos || []);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleFetchChannel}>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          YouTube Channel URL
        </label>
        <div className="flex gap-3">
          <input
            type="url"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://www.youtube.com/@channelname"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading || !channelUrl.trim()}
            className="px-6 py-3 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Fetching...
              </>
            ) : (
              'Fetch Videos'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {videos.length > 0 && (
        <ChannelVideoList
          channelName={channelName}
          videos={videos}
          onJobCreated={onJobCreated}
        />
      )}
    </div>
  );
}
