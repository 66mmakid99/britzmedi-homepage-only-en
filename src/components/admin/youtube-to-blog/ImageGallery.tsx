import { useState, useRef } from 'react';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';

interface ImageGalleryProps {
  post: BlogPost;
  onUpdate: (post: BlogPost) => void;
}

export function ImageGallery({ post, onUpdate }: ImageGalleryProps) {
  const [regenerating, setRegenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                {regenerating ? 'Generating...' : 'Regenerate with AI'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-white text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Custom'}
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-500 mb-4">No featured image yet</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {regenerating ? 'Generating...' : 'Generate with AI'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
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

      {/* YouTube Thumbnail */}
      {post.youtube_id && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">YouTube Thumbnail</h3>
          <img
            src={`https://img.youtube.com/vi/${post.youtube_id}/maxresdefault.jpg`}
            alt="YouTube thumbnail"
            className="w-full max-h-48 object-cover rounded-lg"
          />
          <p className="text-xs text-slate-400 mt-2">
            You can use this as the featured image if AI generation is unavailable.
          </p>
        </div>
      )}
    </div>
  );
}
