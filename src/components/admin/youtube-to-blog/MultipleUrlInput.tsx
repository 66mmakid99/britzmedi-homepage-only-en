import { useState } from 'react';
import type { BlogJob } from '../../../lib/youtube-to-blog/schemas';

interface MultipleUrlInputProps {
  onJobCreated: (job: BlogJob) => void;
}

export function MultipleUrlInput({ onJobCreated }: MultipleUrlInputProps) {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ url: string; success: boolean; error?: string }[]>([]);

  const parseUrls = (text: string): string[] => {
    return text
      .split(/[\n,]/)
      .map(u => u.trim())
      .filter(u => u.length > 0);
  };

  const urlCount = parseUrls(urls).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlList = parseUrls(urls);
    if (urlList.length === 0) return;

    setLoading(true);
    setResults([]);

    const newResults: typeof results = [];

    for (const url of urlList) {
      try {
        const res = await fetch('/api/blog/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtube_url: url }),
        });

        const data = await res.json();

        if (res.ok) {
          newResults.push({ url, success: true });
          onJobCreated(data.job);
        } else {
          newResults.push({ url, success: false, error: data.error || 'Unknown error' });
        }
      } catch {
        newResults.push({ url, success: false, error: 'Network error' });
      }
    }

    setResults(newResults);
    setLoading(false);

    // Clear successful URLs from input
    const failedUrls = newResults.filter(r => !r.success).map(r => r.url);
    setUrls(failedUrls.join('\n'));
  };

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        YouTube URLs (one per line)
      </label>
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder={`https://www.youtube.com/watch?v=abc123\nhttps://www.youtube.com/watch?v=def456\nhttps://youtu.be/ghi789`}
        rows={6}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-slate-500">
          {urlCount} URL{urlCount !== 1 ? 's' : ''} detected
        </span>
        <button
          type="submit"
          disabled={loading || urlCount === 0}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
            `Generate ${urlCount} Post${urlCount !== 1 ? 's' : ''}`
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                r.success
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {r.success ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="truncate">{r.url}</span>
              {r.error && <span className="ml-auto text-xs flex-shrink-0">({r.error})</span>}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
