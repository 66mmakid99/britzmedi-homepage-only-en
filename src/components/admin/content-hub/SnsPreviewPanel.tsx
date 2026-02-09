// SNS Preview Panel — platform-specific post previews with edit + share

import { useState, useEffect } from 'react';
import { ChannelIcon } from '../social/ChannelIcon';

interface SnsPreviewPanelProps {
  postId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  featuredImage: string | null;
  doctorName: string | null;
  contentType: 'blog' | 'news';
  status: string;
}

interface ChannelPreview {
  enabled: boolean;
  text: string;
  charLimit: number;
}

const CHANNELS = ['twitter', 'linkedin', 'instagram'] as const;
type Channel = typeof CHANNELS[number];

const CHANNEL_CONFIG: Record<Channel, { label: string; charLimit: number; color: string }> = {
  twitter: { label: 'X', charLimit: 280, color: 'bg-slate-900' },
  linkedin: { label: 'LinkedIn', charLimit: 3000, color: 'bg-blue-700' },
  instagram: { label: 'Instagram', charLimit: 2200, color: 'bg-gradient-to-br from-purple-600 to-pink-500' },
};

export function SnsPreviewPanel({
  postId, title, slug, excerpt, category, featuredImage, doctorName, contentType, status,
}: SnsPreviewPanelProps) {
  const [previews, setPreviews] = useState<Record<Channel, ChannelPreview>>({
    twitter: { enabled: true, text: '', charLimit: 280 },
    linkedin: { enabled: true, text: '', charLimit: 3000 },
    instagram: { enabled: !!featuredImage, text: '', charLimit: 2200 },
  });
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<Channel | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Fetch generated previews
  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/content-hub/sns-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug, excerpt, category, featuredImage, doctorName, contentType }),
    })
      .then(r => r.json())
      .then(data => {
        setPreviews(prev => ({
          twitter: { ...prev.twitter, text: data.twitter || '' },
          linkedin: { ...prev.linkedin, text: data.linkedin || '' },
          instagram: { ...prev.instagram, text: data.instagram || '' },
        }));
      })
      .catch(err => console.error('Failed to generate previews:', err))
      .finally(() => setLoading(false));
  }, [title, slug, excerpt, category, featuredImage, doctorName, contentType]);

  const toggleChannel = (ch: Channel) => {
    setPreviews(prev => ({
      ...prev,
      [ch]: { ...prev[ch], enabled: !prev[ch].enabled },
    }));
  };

  const updateText = (ch: Channel, text: string) => {
    setPreviews(prev => ({
      ...prev,
      [ch]: { ...prev[ch], text },
    }));
  };

  const handlePost = async (ch: Channel) => {
    setPosting(ch);
    try {
      const payload: Record<string, string> = {
        channel: ch,
        content: previews[ch].text,
      };
      if (postId && !postId.startsWith('news:')) {
        payload.postId = postId;
      }
      if (ch === 'instagram' && featuredImage) {
        payload.imageUrl = featuredImage.startsWith('http')
          ? featuredImage
          : `https://britzmedi.com${featuredImage}`;
      }

      const res = await fetch('/api/admin/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResults(prev => ({ ...prev, [ch]: { success: true, message: `Posted! ID: ${data.externalId || 'OK'}` } }));
      } else {
        setResults(prev => ({ ...prev, [ch]: { success: false, message: data.error || 'Failed' } }));
      }
    } catch {
      setResults(prev => ({ ...prev, [ch]: { success: false, message: 'Network error' } }));
    } finally {
      setPosting(null);
    }
  };

  const handlePostAll = async () => {
    const enabled = CHANNELS.filter(ch => previews[ch].enabled && previews[ch].text.trim());
    for (const ch of enabled) {
      await handlePost(ch);
    }
  };

  const isPublished = status === 'published';
  const enabledCount = CHANNELS.filter(ch => previews[ch].enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">SNS Preview</h3>
        {isPublished && enabledCount > 0 && (
          <button
            onClick={handlePostAll}
            disabled={!!posting}
            className="px-3 py-1 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {posting ? 'Posting...' : `Post to ${enabledCount} platform${enabledCount > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {!isPublished && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          Publish this content first to enable SNS posting.
        </p>
      )}

      {CHANNELS.map(ch => {
        const config = CHANNEL_CONFIG[ch];
        const preview = previews[ch];
        const charCount = preview.text.length;
        const isOver = charCount > config.charLimit;
        const result = results[ch];

        return (
          <div key={ch} className={`border rounded-lg overflow-hidden ${preview.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            {/* Channel header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ChannelIcon channel={ch} className="w-4 h-4" />
                <span className="text-xs font-medium text-slate-700">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${isOver ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  {charCount}/{config.charLimit}
                </span>
                <button
                  onClick={() => toggleChannel(ch)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    preview.enabled ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                    preview.enabled ? 'left-4' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Preview/edit area */}
            {preview.enabled && (
              <div className="p-3">
                <textarea
                  value={preview.text}
                  onChange={e => updateText(ch, e.target.value)}
                  rows={ch === 'twitter' ? 3 : ch === 'linkedin' ? 6 : 5}
                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Instagram image notice */}
                {ch === 'instagram' && !featuredImage && (
                  <p className="text-[10px] text-red-500 mt-1">Instagram requires a featured image.</p>
                )}

                {/* Post button + result */}
                <div className="flex items-center justify-between mt-2">
                  {result && (
                    <span className={`text-[10px] ${result.success ? 'text-green-600' : 'text-red-500'}`}>
                      {result.message}
                    </span>
                  )}
                  {!result && <span />}
                  {isPublished && (
                    <button
                      onClick={() => handlePost(ch)}
                      disabled={!!posting || isOver || (ch === 'instagram' && !featuredImage)}
                      className="px-2.5 py-1 text-[10px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {posting === ch ? '...' : 'Post'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
