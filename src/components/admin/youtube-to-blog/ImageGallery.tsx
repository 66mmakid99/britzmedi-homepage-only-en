import { useState, useRef } from 'react';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';

interface ImageGalleryProps {
  post: BlogPost;
  onUpdate: (post: BlogPost) => void;
}

export function ImageGallery({ post, onUpdate }: ImageGalleryProps) {
  const [regenerating, setRegenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingThumbnail, setSettingThumbnail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thumbnailUrl = post.youtube_id
    ? `https://img.youtube.com/vi/${post.youtube_id}/maxresdefault.jpg`
    : null;

  const handleRegenerate = async () => {
    if (!confirm('Generate a new AI image for this post?')) return;
    setRegenerating(true);

    try {
      const res = await fetch(`/api/blog/posts/${post.id}/regenerate-image`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate({ ...post, featured_image: data.featured_image });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to regenerate image');
      }
    } catch {
      alert('Network error');
    } finally {
      setRegenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', 'featured');

    try {
      const res = await fetch(`/api/blog/posts/${post.id}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate({ ...post, featured_image: data.url });
      } else {
        const data = await res.json();
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUseThumbnail = async () => {
    if (!thumbnailUrl) return;
    setSettingThumbnail(true);

    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured_image: thumbnailUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.post);
      } else {
        alert('Failed to set thumbnail');
      }
    } catch {
      alert('Network error');
    } finally {
      setSettingThumbnail(false);
    }
  };

  const contentImages = post.images ? JSON.parse(post.images) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Featured Image */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Featured Image</h2>

        {post.featured_image ? (
          <div className="relative group">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full max-h-80 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-4 py-2 bg-white text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                {regenerating ? 'Generating...' : 'Regenerate AI'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-white text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Custom'}
              </button>
              {thumbnailUrl && (
                <button
                  onClick={handleUseThumbnail}
                  disabled={settingThumbnail}
                  className="px-4 py-2 bg-white text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  {settingThumbnail ? 'Setting...' : 'Use Thumbnail'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-500 mb-5">No featured image yet. Choose an option:</p>

            {/* 3 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: YouTube Thumbnail */}
              {thumbnailUrl && (
                <button
                  onClick={handleUseThumbnail}
                  disabled={settingThumbnail}
                  className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 disabled:opacity-50 transition-all"
                >
                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="text-xs font-medium text-slate-700">
                    {settingThumbnail ? 'Setting...' : 'YouTube Thumbnail'}
                  </span>
                </button>
              )}

              {/* Option 2: AI Generate */}
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-purple-300 disabled:opacity-50 transition-all"
              >
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                <span className="text-xs font-medium text-slate-700">
                  {regenerating ? 'Generating...' : 'AI Generate'}
                </span>
              </button>

              {/* Option 3: Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-green-300 disabled:opacity-50 transition-all"
              >
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-xs font-medium text-slate-700">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </span>
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* YouTube Thumbnail Preview */}
      {thumbnailUrl && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">YouTube Thumbnail</h3>
            {post.featured_image !== thumbnailUrl && (
              <button
                onClick={handleUseThumbnail}
                disabled={settingThumbnail}
                className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {settingThumbnail ? 'Setting...' : 'Use as Featured'}
              </button>
            )}
          </div>
          <img
            src={thumbnailUrl}
            alt="YouTube thumbnail"
            className="w-full max-h-48 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Content Images */}
      {contentImages.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Content Images ({contentImages.length})
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {contentImages.map((img: any, i: number) => (
              <div key={i} className="relative group">
                <img
                  src={img.url}
                  alt={img.alt || `Image ${i + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {img.caption && (
                  <p className="text-xs text-slate-500 mt-1 truncate">{img.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
