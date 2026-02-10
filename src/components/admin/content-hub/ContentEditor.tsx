// Content Editor — Markdown textarea + live preview
// Uses marked for rendering, no heavy WYSIWYG dependency

import { useState, useEffect, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import { isHtml, htmlToMarkdown } from '../../../lib/html-to-markdown';

// ─── Types ──────────────────────────────────────────────────────

interface ContentItem {
  id: number;
  title: string;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  category: string | null;
  tags: string | null;
  seo_keyword: string | null;
  seo_secondary_keywords: string | null;
  schema_type: string | null;
  faq: string | null;
  status: string;
  author: string;
  word_count: number | null;
  estimated_read_time: string | null;
  source_type: string;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// ─── Helpers ────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

const STATUS_BADGE: Record<string, string> = {
  brief: 'bg-slate-100 text-slate-600',
  generating: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-blue-100 text-blue-700',
  review: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
};

// ─── Markdown Toolbar ───────────────────────────────────────────

function MarkdownToolbar({ onInsert }: { onInsert: (before: string, after?: string) => void }) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-slate-200 bg-slate-50">
      <button type="button" onClick={() => onInsert('**', '**')} title="Bold" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => onInsert('*', '*')} title="Italic" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        <em>I</em>
      </button>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" onClick={() => onInsert('## ')} title="Heading 2" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        H2
      </button>
      <button type="button" onClick={() => onInsert('### ')} title="Heading 3" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        H3
      </button>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" onClick={() => onInsert('- ')} title="Bullet List" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        &bull; List
      </button>
      <button type="button" onClick={() => onInsert('1. ')} title="Numbered List" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        1. List
      </button>
      <button type="button" onClick={() => onInsert('> ')} title="Blockquote" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        &ldquo; Quote
      </button>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" onClick={() => onInsert('[', '](url)')} title="Link" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        Link
      </button>
      <button type="button" onClick={() => onInsert('![alt](', ')')} title="Image" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        Image
      </button>
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button type="button" onClick={() => onInsert('\n---\n')} title="Horizontal Rule" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
        &#8212;
      </button>
    </div>
  );
}

// ─── FAQ Editor ─────────────────────────────────────────────────

function FAQEditor({
  faqs,
  onChange,
}: {
  faqs: FAQItem[];
  onChange: (faqs: FAQItem[]) => void;
}) {
  const addFaq = () => onChange([...faqs, { question: '', answer: '' }]);
  const removeFaq = (i: number) => onChange(faqs.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">FAQ ({faqs.length})</h4>
        <button type="button" onClick={addFaq} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          + Add FAQ
        </button>
      </div>
      {faqs.length === 0 && (
        <p className="text-xs text-slate-400">No FAQs yet. Add questions to improve SEO.</p>
      )}
      {faqs.map((faq, i) => (
        <div key={i} className="bg-slate-50 rounded-lg p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-medium mt-1.5">Q{i + 1}</span>
            <input
              type="text"
              value={faq.question}
              onChange={e => updateFaq(i, 'question', e.target.value)}
              placeholder="Question..."
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button type="button" onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-600 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <textarea
            value={faq.answer}
            onChange={e => updateFaq(i, 'answer', e.target.value)}
            placeholder="Answer..."
            rows={2}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main Editor Component ──────────────────────────────────────

export default function ContentEditor({ contentId }: { contentId: number }) {
  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [seoKeyword, setSeoKeyword] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  // Textarea ref for toolbar insertions
  const textareaRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) (window as any).__editorTextarea = node;
  }, []);

  // Toolbar insert handler
  const handleInsert = useCallback((before: string, after?: string) => {
    const ta = (window as any).__editorTextarea as HTMLTextAreaElement | undefined;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = before + selected + (after || '');
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    // Restore focus and cursor position
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + before.length + selected.length + (after?.length || 0);
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, [content]);

  // Markdown preview (memoized)
  const previewHtml = useMemo(() => {
    try {
      return marked(content || '', { breaks: true }) as string;
    } catch {
      return '<p style="color:red;">Preview error</p>';
    }
  }, [content]);

  // Word count from content
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  // Fetch item
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/content-hub/items/${contentId}`);
        if (!res.ok) throw new Error('Failed to load content');
        const data = await res.json();
        if (cancelled) return;
        const ci = data.item as ContentItem;
        setItem(ci);
        setTitle(ci.title || '');
        const rawContent = ci.content || '';
        setContent(isHtml(rawContent) ? htmlToMarkdown(rawContent) : rawContent);
        setExcerpt(ci.excerpt || '');
        setCategory(ci.category || '');
        setSlug(ci.slug || '');
        setSeoKeyword(ci.seo_keyword || '');
        if (ci.slug) setSlugManual(true);

        if (ci.tags) {
          try {
            const parsed = JSON.parse(ci.tags);
            setTags(Array.isArray(parsed) ? parsed.join(', ') : ci.tags);
          } catch {
            setTags(ci.tags);
          }
        }

        if (ci.faq) {
          try {
            const parsed = JSON.parse(ci.faq);
            if (Array.isArray(parsed)) setFaqs(parsed);
          } catch { /* ignore */ }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [contentId]);

  // Auto-slug from title
  useEffect(() => {
    if (!slugManual && title) setSlug(slugify(title));
  }, [title, slugManual]);

  // ─── Save handler ───────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const wc = content.split(/\s+/).filter(w => w.length > 0).length;
      const readTime = `${Math.max(1, Math.ceil(wc / 200))} min read`;
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

      const res = await fetch(`/api/admin/content-hub/items/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt,
          category,
          tags: tagArray,
          seo_keyword: seoKeyword,
          faq: faqs.filter(f => f.question.trim()),
          word_count: wc,
          estimated_read_time: readTime,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }

      const data = await res.json();
      setItem(data.item);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(null), 2000);
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  }, [contentId, title, slug, content, excerpt, category, tags, seoKeyword, faqs]);

  // ─── Transition handler ─────────────────────────────────────

  const handleTransition = useCallback(async (action: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/content-hub/items/${contentId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Transition failed');
      }
      const itemRes = await fetch(`/api/admin/content-hub/items/${contentId}`);
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItem(data.item);
      }
      setSaveMsg(action === 'unpublish' ? 'Unpublished' : action === 'publish' ? 'Published' : 'Updated');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }, [contentId]);

  // ─── Publish handler ────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    const saved = await handleSave();
    if (!saved) return;
    setActionLoading('publish');
    try {
      const res = await fetch('/api/admin/content-hub/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Publish failed');
      }
      const itemRes = await fetch(`/api/admin/content-hub/items/${contentId}`);
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItem(data.item);
      }
      setSaveMsg('Published!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setActionLoading(null);
    }
  }, [contentId, handleSave]);

  // ─── Save & re-publish ──────────────────────────────────────

  const handleSaveAndRepublish = useCallback(async () => {
    const saved = await handleSave();
    if (!saved) return;
    setActionLoading('republish');
    try {
      const res = await fetch('/api/admin/content-hub/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Re-publish failed');
      }
      const itemRes = await fetch(`/api/admin/content-hub/items/${contentId}`);
      if (itemRes.ok) {
        const data = await itemRes.json();
        setItem(data.item);
      }
      setSaveMsg('Saved & re-published!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Re-publish failed');
    } finally {
      setActionLoading(null);
    }
  }, [contentId, handleSave]);

  // ─── Delete handler ─────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/admin/content-hub/items/${contentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      window.location.href = '/admin/content-hub';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
      setActionLoading(null);
    }
  }, [contentId]);

  // ─── Loading / Error states ─────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-700">{error || 'Content not found'}</p>
          <a href="/admin/content-hub" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Back to Content Hub
          </a>
        </div>
      </div>
    );
  }

  const isPublished = item.status === 'published';
  const isDraft = item.status === 'draft';
  const isApproved = item.status === 'approved';
  const isReview = item.status === 'review';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <a href="/admin/content-hub" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </a>
          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_BADGE[item.status] || ''}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
          {isPublished && item.slug && (
            <a href={`/blog/${item.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1">
              View Post
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-xs text-green-600 font-medium animate-pulse">{saveMsg}</span>}
          <span className="text-xs text-slate-400">{wordCount.toLocaleString()} words</span>

          <button
            onClick={() => window.open(`/admin/content-hub/preview/${contentId}`, '_blank')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Preview
          </button>

          <button onClick={handleSave} disabled={saving || !!actionLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {isDraft && (
            <>
              <button onClick={() => handleTransition('submit_review')} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50">
                {actionLoading === 'submit_review' ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button onClick={handlePublish} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                {actionLoading === 'publish' ? 'Publishing...' : 'Publish'}
              </button>
            </>
          )}

          {isReview && (
            <>
              <button onClick={() => handleTransition('approve')} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
              </button>
              <button onClick={() => handleTransition('reject')} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors disabled:opacity-50">
                Back to Draft
              </button>
            </>
          )}

          {isApproved && (
            <button onClick={handlePublish} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
              {actionLoading === 'publish' ? 'Publishing...' : 'Publish'}
            </button>
          )}

          {isPublished && (
            <button onClick={handleSaveAndRepublish} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
              {actionLoading === 'republish' ? 'Updating...' : 'Save & Re-publish'}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* ─── Main editor area ─── */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Content title..."
            className="w-full text-2xl font-bold text-slate-900 border-0 border-b border-slate-200 pb-3 mb-4 focus:outline-none focus:border-blue-500 bg-transparent"
          />

          {/* Editor / Preview toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${!showPreview ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${showPreview ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Split View
            </button>
          </div>

          {/* Markdown Editor + Preview */}
          <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 ${showPreview ? 'flex' : ''}`}>
            {/* Textarea side */}
            <div className={showPreview ? 'w-1/2 border-r border-slate-200 flex flex-col' : 'flex flex-col'}>
              <MarkdownToolbar onInsert={handleInsert} />
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your content in Markdown..."
                className="flex-1 min-h-[500px] px-4 py-3 text-sm font-mono text-slate-800 resize-none focus:outline-none"
                style={{ tabSize: 2 }}
              />
            </div>

            {/* Preview side */}
            {showPreview && (
              <div className="w-1/2 overflow-y-auto" style={{ maxHeight: '600px' }}>
                <div className="px-2 py-1.5 border-b border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Preview</span>
                </div>
                <div
                  className="prose prose-sm max-w-none px-5 py-4"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>

          {/* FAQ Editor */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <FAQEditor faqs={faqs} onChange={setFaqs} />
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Slug */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {!slugManual && <p className="text-[10px] text-slate-400 mt-1">Auto-generated from title</p>}
            {slugManual && slug && (
              <button type="button" onClick={() => { setSlugManual(false); setSlug(slugify(title)); }} className="text-[10px] text-blue-500 hover:text-blue-700 mt-1">
                Reset to auto
              </button>
            )}
          </div>

          {/* Meta Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Meta Description</label>
              <span className={`text-[10px] font-medium ${excerpt.length > 160 ? 'text-red-500' : excerpt.length > 120 ? 'text-orange-500' : 'text-slate-400'}`}>
                {excerpt.length}/160
              </span>
            </div>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Brief description for search engines..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">SEO</h4>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Primary Keyword</label>
              <input type="text" value={seoKeyword} onChange={e => setSeoKeyword(e.target.value)} placeholder="e.g. rf skin tightening" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                <option value="">Select category</option>
                <option value="aesthetic-technology">Aesthetic Technology</option>
                <option value="rf-devices">RF Devices</option>
                <option value="medical-devices">Medical Devices</option>
                <option value="industry-trends">Industry Trends</option>
                <option value="clinical-studies">Clinical Studies</option>
                <option value="buyer-guides">Buyer Guides</option>
                <option value="company-news">Company News</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tags (comma-separated)</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="RF, skin tightening, FDA" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs text-slate-500">
            <div>Source: <span className="text-slate-700 capitalize">{item.source_type}</span></div>
            <div>Author: <span className="text-slate-700">{item.author}</span></div>
            <div>Created: <span className="text-slate-700">{new Date(item.created_at).toLocaleDateString()}</span></div>
            <div>Updated: <span className="text-slate-700">{new Date(item.updated_at).toLocaleDateString()}</span></div>
            {item.published_at && <div>Published: <span className="text-slate-700">{new Date(item.published_at).toLocaleDateString()}</span></div>}
            {item.word_count !== null && <div>Saved word count: <span className="text-slate-700">{item.word_count?.toLocaleString()}</span></div>}
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-xl border border-red-200 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Danger Zone</h4>
            {isPublished && (
              <button
                onClick={() => handleTransition('unpublish', 'Unpublish this content? It will be removed from the live site and the blog file will be deleted from GitHub.')}
                disabled={!!actionLoading}
                className="w-full px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200 disabled:opacity-50"
              >
                {actionLoading === 'unpublish' ? 'Unpublishing...' : 'Unpublish'}
              </button>
            )}
            <button onClick={() => setDeleteConfirm(true)} disabled={!!actionLoading} className="w-full px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 disabled:opacity-50">
              Delete Content
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Delete Content</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-medium">"{title}"</span>?
              {isPublished && ' The published blog post will also be removed from GitHub.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(false)} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={!!actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
