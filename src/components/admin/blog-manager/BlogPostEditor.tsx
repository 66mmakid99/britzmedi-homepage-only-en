import { useState, useEffect } from 'react';
import { PublishOptions } from './PublishOptions';
import { BlogStatusBadge } from './BlogStatusBadge';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  meta_description: string | null;
  featured_image: string | null;
  category: string;
  tags: string | null;
  status: string;
  scheduled_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  doctor_name: string | null;
  doctor_title: string | null;
}

const CATEGORIES = [
  { value: 'medical-devices', label: 'Medical Devices' },
  { value: 'industry-news', label: 'Industry News' },
  { value: 'product-updates', label: 'Product Updates' },
  { value: 'technology', label: 'Technology' },
  { value: 'clinical-studies', label: 'Clinical Studies' },
  { value: 'company-news', label: 'Company News' },
  { value: 'education', label: 'Education' },
];

export default function BlogPostEditor({ postId }: { postId: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`);
      const data = await res.json();
      if (data.post) {
        const p = data.post as BlogPost;
        setPost(p);
        setTitle(p.title || '');
        setExcerpt(p.excerpt || '');
        setMetaDescription(p.meta_description || '');
        setCategory(p.category || '');
        setTags(p.tags || '');
        setFeaturedImage(p.featured_image || '');
      }
    } catch (err) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const savePost = async (updates: Record<string, any>) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.post) {
        setPost(data.post);
        setSuccess('Saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFields = () => {
    savePost({
      title,
      excerpt,
      meta_description: metaDescription,
      category,
      tags,
      featured_image: featuredImage,
    });
  };

  const handlePublishNow = () => {
    savePost({ status: 'published' });
  };

  const handleSchedule = (date: string) => {
    savePost({ status: 'scheduled', scheduled_date: date });
  };

  const handleSaveDraft = () => {
    savePost({ status: 'draft' });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-40 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">{error || 'Post not found'}</p>
        <a href="/admin/blog-manager" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          Back to Blog Manager
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/admin/blog-manager"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 truncate">{post.title}</h1>
            <BlogStatusBadge status={post.status} scheduledDate={post.scheduled_date} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">ID: {post.id} | Slug: {post.slug}</p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Edit fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>

          {/* Meta Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={e => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={160}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{metaDescription.length}/160</p>
          </div>

          {/* Category & Tags */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="comma-separated"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Featured Image URL</label>
            <input
              type="text"
              value={featuredImage}
              onChange={e => setFeaturedImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            {featuredImage && (
              <img
                src={featuredImage}
                alt="Preview"
                className="mt-3 w-full max-h-48 object-cover rounded-lg border"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          {/* Doctor info (read-only) */}
          {post.doctor_name && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Author</label>
              <p className="text-sm text-slate-600">
                {post.doctor_name}
                {post.doctor_title && <span className="text-slate-400"> - {post.doctor_title}</span>}
              </p>
            </div>
          )}

          {/* Save fields button */}
          <button
            onClick={handleSaveFields}
            disabled={saving}
            className="w-full py-2.5 px-4 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Right: Publish Options */}
        <div className="space-y-4">
          <PublishOptions
            currentStatus={post.status}
            scheduledDate={post.scheduled_date}
            onPublishNow={handlePublishNow}
            onSchedule={handleSchedule}
            onSaveDraft={handleSaveDraft}
            loading={saving}
          />

          {/* Post Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-700">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Updated</span>
                <span className="text-slate-700">{new Date(post.updated_at).toLocaleDateString()}</span>
              </div>
              {post.published_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Published</span>
                  <span className="text-slate-700">{new Date(post.published_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* View on site */}
          {post.status === 'published' && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Site
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
