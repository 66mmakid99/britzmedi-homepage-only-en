import { useState } from 'react';
import type { BlogPost } from '../../../lib/youtube-to-blog/schemas';

interface MetadataPanelProps {
  post: BlogPost;
  onUpdate: (post: BlogPost) => void;
}

export function MetadataPanel({ post, onUpdate }: MetadataPanelProps) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt || '');
  const [metaDescription, setMetaDescription] = useState(post.meta_description || '');
  const [category, setCategory] = useState(post.category || 'medical-devices');
  const [keywords, setKeywords] = useState(
    post.keywords ? JSON.parse(post.keywords).join(', ') : ''
  );
  const [tags, setTags] = useState(
    post.tags ? JSON.parse(post.tags).join(', ') : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          meta_description: metaDescription,
          category,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.post);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">SEO & Metadata</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">{title.length}/70 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">/blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="2-3 sentence summary..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={160}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Under 160 characters for SEO..."
            />
            <p className="text-xs text-slate-400 mt-1">{metaDescription.length}/160 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="medical-devices">Medical Devices</option>
              <option value="aesthetics">Aesthetics</option>
              <option value="dermatology">Dermatology</option>
              <option value="technology">Technology</option>
              <option value="industry-news">Industry News</option>
              <option value="case-studies">Case Studies</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Keywords</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="keyword1, keyword2, keyword3..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tag1, tag2, tag3..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Metadata'}
          </button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </div>

      {/* SEO Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Google Search Preview</h3>
        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50">
          <p className="text-blue-800 text-lg font-medium truncate">{title || 'Blog Post Title'}</p>
          <p className="text-green-700 text-sm mt-1">britzmedi.com/blog/{slug || 'post-slug'}</p>
          <p className="text-slate-600 text-sm mt-1 line-clamp-2">
            {metaDescription || excerpt || 'Meta description will appear here...'}
          </p>
        </div>
      </div>
    </div>
  );
}
