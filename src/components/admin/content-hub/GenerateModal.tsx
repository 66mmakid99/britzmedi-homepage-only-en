// AI content generation modal — form for keyword, content type, tone, etc.

import { useState } from 'react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (contentId: number) => void;
  prefill?: {
    keyword?: string;
    title?: string;
    content_type?: string;
    tier?: number;
  };
}

const CONTENT_TYPES = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'faq', label: 'FAQ' },
  { value: 'guide', label: 'Guide' },
  { value: 'product_page', label: 'Product Page' },
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'technical', label: 'Technical' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'educational', label: 'Educational' },
];

export function GenerateModal({ isOpen, onClose, onGenerated, prefill }: GenerateModalProps) {
  const [title, setTitle] = useState(prefill?.title || '');
  const [keyword, setKeyword] = useState(prefill?.keyword || '');
  const [contentType, setContentType] = useState(prefill?.content_type || 'blog');
  const [additionalKeywords, setAdditionalKeywords] = useState('');
  const [wordCount, setWordCount] = useState(1500);
  const [tone, setTone] = useState('professional');
  const [includeFaq, setIncludeFaq] = useState(true);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      setError('Primary keyword is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim() || undefined,
        keyword: keyword.trim(),
        content_type: contentType,
        additional_keywords: additionalKeywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean),
        word_count: wordCount,
        tone,
        include_faq: includeFaq,
        instructions: instructions.trim() || undefined,
      };

      const res = await fetch('/api/admin/content-hub/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      onGenerated(data.content_id || data.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() && !keyword.trim()) {
      setError('Title or keyword is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        source_type: 'manual',
        title: title.trim() || keyword.trim(),
        seo_keyword: keyword.trim() || null,
        category: contentType,
        status: 'brief',
        author: 'admin',
      };

      const res = await fetch('/api/admin/content-hub/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save draft');
      }

      onGenerated(data.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle(prefill?.title || '');
      setKeyword(prefill?.keyword || '');
      setContentType(prefill?.content_type || 'blog');
      setAdditionalKeywords('');
      setWordCount(1500);
      setTone('professional');
      setIncludeFaq(true);
      setInstructions('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {prefill?.keyword ? 'Generate from SEO Brief' : 'New Content'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate content with AI or save as a draft
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 rounded-2xl">
            <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mb-3" />
            <p className="text-sm font-medium text-slate-700">Generating content with AI...</p>
            <p className="text-xs text-slate-400 mt-1">This may take a minute</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tier indicator for SEO briefs */}
          {prefill?.tier && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generating from Tier {prefill.tier} SEO brief
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Title
              <span className="text-slate-400 ml-1">(optional, AI will generate if blank)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter title or leave blank for AI to generate"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Primary Keyword */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Primary Keyword <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="e.g., medical device sterilization"
              required
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Content Type</label>
            <select
              value={contentType}
              onChange={e => setContentType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {CONTENT_TYPES.map(ct => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>

          {/* Additional Keywords */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Additional Keywords
              <span className="text-slate-400 ml-1">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={additionalKeywords}
              onChange={e => setAdditionalKeywords(e.target.value)}
              placeholder="e.g., EtO sterilization, gamma radiation, ISO 11135"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Word Count + Tone in row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Word Count</label>
              <input
                type="number"
                value={wordCount}
                onChange={e => setWordCount(Math.max(300, Math.min(5000, parseInt(e.target.value) || 1500)))}
                min={300}
                max={5000}
                step={100}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tone</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {TONE_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Include FAQ checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="include-faq"
              type="checkbox"
              checked={includeFaq}
              onChange={e => setIncludeFaq(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="include-faq" className="text-sm text-slate-700 cursor-pointer">
              Include FAQ section
            </label>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Special Instructions
              <span className="text-slate-400 ml-1">(optional)</span>
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={3}
              placeholder="Any specific requirements, angles, or points to cover..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate with AI
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
