import { useState } from 'react';
import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';

interface SingleUrlInputProps {
  onJobCreated: (job: BlogJob) => void;
}

export function SingleUrlInput({ onJobCreated }: SingleUrlInputProps) {
  const [url, setUrl] = useState('');
  const [tone, setTone] = useState('professional');
  const [wordCount, setWordCount] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/blog/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: url.trim(),
          tone,
          word_count: wordCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setError(data.errors.map((e: any) => e.message).join(', '));
        } else {
          setError(data.error || 'Failed to create job');
        }
        return;
      }

      setUrl('');
      onJobCreated(data.job);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Extract video ID for thumbnail preview
  const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch?.[1];

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        YouTube URL
      </label>
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            'Generate Blog Post'
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Video Preview */}
      {videoId && (
        <div className="mt-4 flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt="Video thumbnail"
            className="w-32 h-18 rounded object-cover"
          />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">Video detected</p>
            <p className="text-xs text-slate-500 mt-1">ID: {videoId}</p>
          </div>
        </div>
      )}

      {/* Advanced Options */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          Advanced Options
        </button>

        {showOptions && (
          <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="academic">Academic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Word Count ({wordCount})
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>500</span>
                <span>5000</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
