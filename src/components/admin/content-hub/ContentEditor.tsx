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
  research_data: string | null;
  analysis_data: string | null;
}

type EditorTab = 'write' | 'research' | 'analysis' | 'revisions';

interface AnalysisData {
  scores: Record<string, { score: number; max: number; details: string[] }>;
  overall_score: number;
  critical_issues: string[];
  suggestions: Array<{ priority: string; title: string; description: string; auto_fixable: boolean }>;
  publish_recommendation: string;
}

interface RevisionItem {
  id: number;
  version: number;
  content: string;
  title: string | null;
  meta_description: string | null;
  faqs: string | null;
  change_summary: string | null;
  word_count: number | null;
  score: number | null;
  created_by: string;
  created_at: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ContentImage {
  id: number;
  content_item_id: number;
  filename: string;
  original_name: string;
  alt_text: string;
  caption: string;
  type: string;
  size_bytes: number;
  r2_key: string;
  url: string;
  created_at: string;
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

// ─── Thumbnail suggestion rules ──────────────────────────────
const PRODUCT_IMAGES = [
  { src: '/images/products/torr-rf/torrrf.webp', label: 'TORR RF' },
  { src: '/images/products/torr-rf/torrrf-01.webp', label: 'TORR RF Front' },
  { src: '/images/products/torr-rf/torrrf-handpiece-set.webp', label: 'Handpiece Set' },
  { src: '/images/products/torr-rf/face-handpiece-deep.webp', label: 'Face Deep' },
  { src: '/images/products/torr-rf/body-handpiece-deep.webp', label: 'Body Deep' },
  { src: '/images/products/newchae-shot/newchae-01-1.webp', label: 'Newchae Shot' },
  { src: '/images/products/newchae-shot/newchae-pack-1.webp', label: 'Newchae Pack' },
  { src: '/images/products/ulblanc/ulblanc-01.webp', label: 'Ulblanc' },
  { src: '/images/products/ulblanc/ulblanc-02.webp', label: 'Ulblanc 02' },
  { src: '/images/products/torr-rf.webp', label: 'TORR RF Hero' },
  { src: '/images/products/newchae-shot.webp', label: 'Newchae Hero' },
  { src: '/images/products/ulblanc.webp', label: 'Ulblanc Hero' },
];

function getThumbnailSuggestion(title: string, _category: string | null, _tags: string | null): string {
  const t = (title || '').toLowerCase();
  if (/\bvs\b|comparison/i.test(t))
    return '💡 Suggested: Product comparison diagram, side-by-side device photos, or technology comparison table screenshot';
  if (/torr\s*rf/i.test(t))
    return '💡 Suggested: TORR RF product photo from /images/products/, clinical result photo, or FDA clearance certificate';
  if (/\b(buy|guide|how.to)\b/i.test(t))
    return '💡 Suggested: Product lineup photo, pricing comparison chart, or clinic setup photo';
  if (/cellulite|body\s*(contour|sculpt)/i.test(t))
    return '💡 Suggested: Body contouring treatment area diagram, RF handpiece close-up, or clinical workflow photo';
  if (/fda|certifi|510\(k\)|regulatory/i.test(t))
    return '💡 Suggested: FDA 510(k) clearance document, CE marking certificate, or regulatory compliance badge';
  if (/microneedling|skin\s*(tight|rejuv|treat)/i.test(t))
    return '💡 Suggested: RF microneedling handpiece photo, skin layer cross-section diagram, or treatment protocol chart';
  if (/ultrasound|sonophoresis|iontophoresis/i.test(t))
    return '💡 Suggested: Ultrasound device photo, transdermal delivery diagram, or treatment comparison infographic';
  if (/roi|calculator|pricing|cost/i.test(t))
    return '💡 Suggested: ROI chart graphic, cost comparison table screenshot, or clinic revenue dashboard mockup';
  return '💡 Suggested: TORR RF product photo, relevant clinical diagram, or BRITZMEDI branded graphic';
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

function MarkdownToolbar({ onInsert, onImageClick }: { onInsert: (before: string, after?: string) => void; onImageClick?: () => void }) {
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
      <button type="button" onClick={onImageClick || (() => onInsert('![alt](', ')'))} title="Image" className="px-2 py-1.5 text-xs font-medium rounded text-slate-600 hover:bg-slate-100">
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

// ─── Image Upload Modal ─────────────────────────────────────────

function ImageUploadModal({
  open,
  onClose,
  contentId,
  gallery,
  galleryLoading,
  onUploadComplete,
  onInsertImage,
  onDeleteImage,
  onSetThumbnail,
}: {
  open: boolean;
  onClose: () => void;
  contentId: number;
  gallery: ContentImage[];
  galleryLoading: boolean;
  onUploadComplete: (img: ContentImage) => void;
  onInsertImage: (alt: string, url: string) => void;
  onDeleteImage: (id: number) => void;
  onSetThumbnail: (url: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [imageType, setImageType] = useState<string>('inline');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setAltText('');
    setCaption('');
    setImageType('inline');
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum: 5MB');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(selected.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF');
      return;
    }

    setFile(selected);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!altText.trim()) {
      setError('Alt text is required');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content_item_id', String(contentId));
      formData.append('alt_text', altText.trim());
      formData.append('caption', caption.trim());
      formData.append('type', imageType);

      const res = await fetch('/api/admin/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      onUploadComplete({
        id: data.id,
        content_item_id: contentId,
        filename: data.filename,
        original_name: data.original_name,
        alt_text: data.alt_text,
        caption: caption.trim(),
        type: imageType,
        size_bytes: data.size_bytes,
        r2_key: data.r2_key,
        url: data.url,
        created_at: new Date().toISOString(),
      });

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this image?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      onDeleteImage(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Image Manager</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Upload Section */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Upload New Image</h4>

            {/* File input + Preview */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block">
                  <span className="text-xs text-slate-500 mb-1 block">File (JPEG, PNG, WebP, GIF — max 5MB)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:font-medium file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"
                  />
                </label>
              </div>
              {preview && (
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Alt text */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Alt Text <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={altText}
                onChange={e => setAltText(e.target.value)}
                placeholder="Describe the image for accessibility..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Caption (optional)</label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Optional caption..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Image Type</label>
              <select
                value={imageType}
                onChange={e => setImageType(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="inline">Inline</option>
                <option value="thumbnail">Thumbnail</option>
                <option value="hero">Hero</option>
              </select>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* Gallery Section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Gallery ({gallery.length})
            </h4>
            {galleryLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full" />
              </div>
            ) : gallery.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No images uploaded yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {gallery.map(img => (
                  <div key={img.id} className="group relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <div className="aspect-square">
                      <img
                        src={img.url}
                        alt={img.alt_text || img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => onInsertImage(img.alt_text || img.filename, img.url)}
                        className="px-2 py-1 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                        title="Insert into editor"
                      >
                        Insert
                      </button>
                      <button
                        onClick={() => onSetThumbnail(img.url)}
                        className="px-2 py-1 text-[10px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                        title="Set as thumbnail"
                      >
                        Thumb
                      </button>
                      <button
                        onClick={() => handleDelete(img.id)}
                        disabled={deletingId === img.id}
                        className="px-2 py-1 text-[10px] font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === img.id ? '...' : 'Del'}
                      </button>
                    </div>
                    {/* Meta */}
                    <div className="px-2 py-1.5 border-t border-slate-200">
                      <p className="text-[10px] text-slate-600 truncate">{img.original_name || img.filename}</p>
                      <p className="text-[10px] text-slate-400">{(img.size_bytes / 1024).toFixed(0)} KB &middot; {img.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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

  // Tab state
  const [activeTab, setActiveTab] = useState<EditorTab>('write');

  // Analysis tab
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);
  const [suggestType, setSuggestType] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestResult, setSuggestResult] = useState<string | null>(null);

  // Revisions tab
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [viewingRevision, setViewingRevision] = useState<RevisionItem | null>(null);

  // Image management
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageGallery, setImageGallery] = useState<ContentImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [savedCursorPos, setSavedCursorPos] = useState<number | null>(null);

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

  // Image gallery loader
  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/admin/images?content_item_id=${contentId}`);
      if (res.ok) {
        const data = await res.json();
        setImageGallery(data.images || []);
      }
    } catch { /* silent */ }
    finally { setGalleryLoading(false); }
  }, [contentId]);

  // Open image modal
  const handleImageClick = useCallback(() => {
    const ta = (window as any).__editorTextarea as HTMLTextAreaElement | undefined;
    if (ta) setSavedCursorPos(ta.selectionStart);
    setImageModalOpen(true);
    loadGallery();
  }, [loadGallery]);

  // Insert image markdown at cursor
  const insertImageMarkdown = useCallback((alt: string, url: string) => {
    const md = `![${alt}](${url})`;
    const pos = savedCursorPos ?? content.length;
    const newContent = content.substring(0, pos) + md + content.substring(pos);
    setContent(newContent);
    setImageModalOpen(false);
  }, [content, savedCursorPos]);

  // Markdown preview (memoized)
  const previewHtml = useMemo(() => {
    try {
      const html = marked(content || '', { breaks: true }) as string;
      // Strip first H1 to avoid duplication (title shown separately above)
      return html.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '');
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
        setFeaturedImage(ci.featured_image || null);
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

        if (ci.analysis_data) {
          try { setAnalysisData(JSON.parse(ci.analysis_data)); } catch { /* ignore */ }
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
          featured_image: featuredImage,
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
  }, [contentId, title, slug, content, excerpt, category, tags, seoKeyword, faqs, featuredImage]);

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

  // ─── Tab handlers ─────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/admin/content-hub/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Analysis failed');
      }
      const data = await res.json();
      setAnalysisData(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [contentId]);

  const handleRewrite = useCallback(async (instructions?: string) => {
    setRewriting(true);
    setRewriteResult(null);
    try {
      const res = await fetch('/api/admin/content-hub/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId, mode: 'full', instructions }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Rewrite failed');
      }
      setRewriteResult(await res.json());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rewrite failed');
    } finally {
      setRewriting(false);
    }
  }, [contentId]);

  const applyRewrite = useCallback((result: any) => {
    if (result.content) setContent(result.content);
    if (result.title) setTitle(result.title);
    if (result.meta_description) setExcerpt(result.meta_description);
    if (result.faqs && Array.isArray(result.faqs)) setFaqs(result.faqs);
    setRewriteResult(null);
    setActiveTab('write');
  }, []);

  const handleSuggestSection = useCallback(async (type: string) => {
    setSuggesting(true);
    setSuggestResult(null);
    try {
      const res = await fetch('/api/admin/content-hub/suggest-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId, suggestion_type: type }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Suggestion failed');
      }
      const data = await res.json();
      setSuggestResult(data.section || data.content || '');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Suggestion failed');
    } finally {
      setSuggesting(false);
    }
  }, [contentId]);

  const applySuggest = useCallback((markdown: string) => {
    setContent(prev => prev + '\n\n' + markdown);
    setSuggestResult(null);
    setActiveTab('write');
  }, []);

  const loadRevisions = useCallback(async () => {
    setRevisionsLoading(true);
    try {
      const res = await fetch(`/api/admin/content-hub/items/${contentId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch { /* silent */ }
    finally { setRevisionsLoading(false); }
  }, [contentId]);

  const handleRestoreRevision = useCallback(async (rev: RevisionItem) => {
    if (!window.confirm(`Restore version ${rev.version}? Current content will be saved as a new revision first.`)) return;
    // Save current as revision
    await fetch(`/api/admin/content-hub/items/${contentId}/revisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ change_summary: `Before restore to v${rev.version}` }),
    });
    // Apply revision content
    if (rev.content) setContent(rev.content);
    if (rev.title) setTitle(rev.title);
    if (rev.meta_description) setExcerpt(rev.meta_description);
    if (rev.faqs) {
      try {
        const parsed = JSON.parse(rev.faqs);
        if (Array.isArray(parsed)) setFaqs(parsed);
      } catch { /* ignore */ }
    }
    setActiveTab('write');
    loadRevisions();
  }, [contentId, loadRevisions]);

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

          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-3 border-b border-slate-200 pb-0">
            {(['write', 'research', 'analysis', 'revisions'] as EditorTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'revisions') loadRevisions();
                }}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab === 'write' ? 'Write' : tab === 'research' ? 'Research' : tab === 'analysis' ? 'AI Analysis' : 'Revisions'}
                {tab === 'analysis' && analysisData && (
                  <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${
                    analysisData.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                    analysisData.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{analysisData.overall_score}</span>
                )}
              </button>
            ))}
            {activeTab === 'write' && (
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="ml-auto px-3 py-1.5 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            )}
          </div>

          {/* ═══ Write Tab ═══ */}
          {activeTab === 'write' && (
            <>
              <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 ${showPreview ? 'flex' : ''}`}>
                <div className={showPreview ? 'w-1/2 border-r border-slate-200 flex flex-col' : 'flex flex-col'}>
                  <MarkdownToolbar onInsert={handleInsert} onImageClick={handleImageClick} />
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Write your content in Markdown..."
                    className="flex-1 min-h-[500px] px-4 py-3 text-sm font-mono text-slate-800 resize-none focus:outline-none"
                    style={{ tabSize: 2 }}
                  />
                </div>
                {showPreview && (
                  <div className="w-1/2 overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <div className="px-2 py-1.5 border-b border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Preview</span>
                    </div>
                    <div className="prose prose-sm max-w-none px-5 py-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <FAQEditor faqs={faqs} onChange={setFaqs} />
              </div>
            </>
          )}

          {/* ═══ Research Tab ═══ */}
          {activeTab === 'research' && <ResearchTab item={item} />}

          {/* ═══ AI Analysis Tab ═══ */}
          {activeTab === 'analysis' && (
            <AnalysisTab
              contentId={contentId}
              analysisData={analysisData}
              analyzing={analyzing}
              onAnalyze={handleAnalyze}
              onRewrite={handleRewrite}
              onSuggestSection={handleSuggestSection}
              rewriting={rewriting}
              rewriteResult={rewriteResult}
              onApplyRewrite={applyRewrite}
              onCloseRewrite={() => setRewriteResult(null)}
              suggestType={suggestType}
              setSuggestType={setSuggestType}
              suggesting={suggesting}
              suggestResult={suggestResult}
              onApplySuggest={applySuggest}
              onCloseSuggest={() => setSuggestResult(null)}
            />
          )}

          {/* ═══ Revisions Tab ═══ */}
          {activeTab === 'revisions' && (
            <RevisionsTab
              revisions={revisions}
              loading={revisionsLoading}
              onRestore={handleRestoreRevision}
              onView={setViewingRevision}
            />
          )}
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

          {/* Thumbnail */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Thumbnail</h4>
            {featuredImage ? (
              <div className="space-y-2">
                <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video">
                  <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleImageClick}
                    className="flex-1 px-2 py-1.5 text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeaturedImage(null)}
                    className="flex-1 px-2 py-1.5 text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleImageClick}
                className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] text-slate-400 font-medium">Add Thumbnail</span>
              </button>
            )}
            {/* AI Thumbnail Suggestion */}
            <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
              {getThumbnailSuggestion(title, category, tags)}
            </p>

            {/* Quick Select from Product Photos */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <h5 className="text-[10px] font-medium text-slate-500 mb-2">Quick Select from Product Photos</h5>
              <div className="grid grid-cols-4 gap-1.5">
                {PRODUCT_IMAGES.map((img) => (
                  <button
                    key={img.src}
                    type="button"
                    title={img.label}
                    onClick={() => setFeaturedImage(img.src)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all hover:border-blue-400 hover:shadow-sm ${featuredImage === img.src ? 'border-blue-500 ring-1 ring-blue-300' : 'border-slate-200'}`}
                  >
                    <img src={img.src} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Score Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Content Score</h4>
            {analysisData ? (
              <button
                type="button"
                onClick={() => setActiveTab('analysis')}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    analysisData.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                    analysisData.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {analysisData.overall_score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500">/100</div>
                    <div className={`text-[10px] font-medium ${
                      analysisData.publish_recommendation === 'auto_publish' ? 'text-green-600' :
                      analysisData.publish_recommendation === 'needs_rewrite' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {analysisData.publish_recommendation === 'auto_publish' ? 'Ready to publish' :
                       analysisData.publish_recommendation === 'needs_rewrite' ? 'Needs improvement' : 'Manual review'}
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {Object.entries(analysisData.scores).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 w-16 truncate capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          (val.score / val.max) >= 0.8 ? 'bg-green-500' :
                          (val.score / val.max) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${(val.score / val.max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-8 text-right">{val.score}/{val.max}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-blue-500 mt-2 group-hover:underline">View details</p>
              </button>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-slate-400 mb-2">Not analyzed</p>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 disabled:opacity-50"
                >
                  {analyzing ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>
            )}
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

      {/* Image Upload Modal */}
      <ImageUploadModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        contentId={contentId}
        gallery={imageGallery}
        galleryLoading={galleryLoading}
        onUploadComplete={(img) => {
          setImageGallery(prev => [img, ...prev]);
        }}
        onInsertImage={insertImageMarkdown}
        onDeleteImage={(id) => {
          setImageGallery(prev => prev.filter(img => img.id !== id));
        }}
        onSetThumbnail={(url) => {
          setFeaturedImage(url);
          setImageModalOpen(false);
        }}
      />

      {/* Revision View Modal */}
      {viewingRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setViewingRevision(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Version {viewingRevision.version}</h3>
                <p className="text-xs text-slate-500">{viewingRevision.change_summary} &middot; {new Date(viewingRevision.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { handleRestoreRevision(viewingRevision); setViewingRevision(null); }} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">Restore</button>
                <button onClick={() => setViewingRevision(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {viewingRevision.title && <h2 className="text-lg font-bold text-slate-900 mb-3">{viewingRevision.title}</h2>}
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: (() => { try { return marked(viewingRevision.content || '', { breaks: true }) as string; } catch { return viewingRevision.content || ''; } })() }} />
            </div>
          </div>
        </div>
      )}

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

// ═══════════════════════════════════════════════════════════════
// ─── Research Tab Component ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════

function ResearchTab({ item }: { item: ContentItem }) {
  const research = item.research_data ? (() => { try { return JSON.parse(item.research_data!); } catch { return null; } })() : null;

  if (!research) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-sm font-medium text-slate-600 mb-1">No Research Data</h3>
        <p className="text-xs text-slate-400">Generate content with research enabled to see keyword analysis, competitor data, and sources here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Keyword Analysis */}
      {research.keyword_analysis && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Keyword Analysis</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-[10px] text-blue-600 font-medium uppercase">Primary</div>
              <div className="text-sm font-semibold text-blue-900 mt-1">{research.keyword_analysis.primary || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 font-medium uppercase">Intent</div>
              <div className="text-sm font-medium text-slate-700 mt-1 capitalize">{research.keyword_analysis.search_intent || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] text-slate-500 font-medium uppercase">Secondary Keywords</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(research.keyword_analysis.secondary || []).map((kw: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600">{kw}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitors */}
      {research.competitors?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Competitor Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Title</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium w-20">Words</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Strengths</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Gaps</th>
                </tr>
              </thead>
              <tbody>
                {research.competitors.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 px-2">
                      {c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{c.title || c.url}</a> : (c.title || 'N/A')}
                    </td>
                    <td className="py-2 px-2 text-slate-500">{c.word_count?.toLocaleString() || '-'}</td>
                    <td className="py-2 px-2 text-slate-600">{c.strengths || '-'}</td>
                    <td className="py-2 px-2 text-orange-600">{c.gaps || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strategy */}
      {research.strategy && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Content Strategy</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="text-[10px] text-emerald-600 font-medium uppercase">Angle</div>
              <p className="text-sm text-emerald-900 mt-1">{research.strategy.angle || 'N/A'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-[10px] text-purple-600 font-medium uppercase">Differentiator</div>
              <p className="text-sm text-purple-900 mt-1">{research.strategy.differentiator || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sources */}
      {research.sources?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Sources ({research.sources.length})</h3>
          <div className="space-y-2">
            {research.sources.map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                  s.type === 'pubmed' ? 'bg-blue-100 text-blue-700' :
                  s.type === 'internal' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>{s.type || 'web'}</span>
                {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{s.title || s.url}</a> : <span className="text-slate-600">{s.title || 'Unnamed'}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PubMed Articles (alternate data shape) */}
      {research.pubmed_articles?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">PubMed Sources ({research.pubmed_articles.length})</h3>
          <div className="space-y-3">
            {research.pubmed_articles.map((a: any, i: number) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs font-medium text-slate-800">{a.title}</div>
                <div className="text-[10px] text-slate-500 mt-1">{a.authors} &middot; {a.journal} ({a.year})</div>
                {a.pmid && <div className="text-[10px] text-blue-500 mt-0.5">PMID: {a.pmid}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics Coverage */}
      {research.topics_to_cover?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Topic Coverage</h3>
          <div className="space-y-1.5">
            {research.topics_to_cover.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                  t.covered ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                }`}>{t.covered ? '\u2713' : '\u2717'}</span>
                <span className={t.covered ? 'text-slate-600' : 'text-slate-800 font-medium'}>{t.topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── AI Analysis Tab Component ───────────────────────────────
// ═══════════════════════════════════════════════════════════════

const SUGGEST_TYPES = [
  { value: 'britzmedi_perspective', label: 'BRITZMEDI Perspective' },
  { value: 'clinical_evidence', label: 'Clinical Evidence' },
  { value: 'faq_expansion', label: 'FAQ Expansion' },
  { value: 'comparison', label: 'Product Comparison' },
];

function AnalysisTab({
  contentId, analysisData, analyzing, onAnalyze, onRewrite, onSuggestSection,
  rewriting, rewriteResult, onApplyRewrite, onCloseRewrite,
  suggestType, setSuggestType, suggesting, suggestResult, onApplySuggest, onCloseSuggest,
}: {
  contentId: number;
  analysisData: AnalysisData | null;
  analyzing: boolean;
  onAnalyze: () => void;
  onRewrite: (instructions?: string) => void;
  onSuggestSection: (type: string) => void;
  rewriting: boolean;
  rewriteResult: any;
  onApplyRewrite: (result: any) => void;
  onCloseRewrite: () => void;
  suggestType: string;
  setSuggestType: (t: string) => void;
  suggesting: boolean;
  suggestResult: string | null;
  onApplySuggest: (md: string) => void;
  onCloseSuggest: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Run Analysis button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {analyzing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
        {analysisData && <span className="text-xs text-slate-400">Last analysis available</span>}
      </div>

      {/* Analysis Results */}
      {analysisData && (
        <>
          {/* Overall Score */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${
                analysisData.overall_score >= 80 ? 'border-green-400 bg-green-50 text-green-700' :
                analysisData.overall_score >= 60 ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-red-400 bg-red-50 text-red-700'
              }`}>
                {analysisData.overall_score}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900 mb-2">Overall Quality Score</div>
                <div className="space-y-1.5">
                  {Object.entries(analysisData.scores).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 w-24 capitalize">{key.replace('_', ' ')}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (val.score / val.max) >= 0.8 ? 'bg-green-500' :
                            (val.score / val.max) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(val.score / val.max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 w-12 text-right">{val.score}/{val.max}</span>
                      <span className="text-[11px]">
                        {(val.score / val.max) >= 0.8 ? '\u2705' : (val.score / val.max) >= 0.6 ? '\u26a0\ufe0f' : '\u274c'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Score Details */}
          {Object.entries(analysisData.scores).some(([, val]) => val.details?.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Score Details</h3>
              <div className="space-y-3">
                {Object.entries(analysisData.scores).map(([key, val]) => val.details?.length > 0 && (
                  <div key={key}>
                    <div className="text-[11px] font-medium text-slate-600 capitalize mb-1">{key.replace('_', ' ')}</div>
                    <ul className="space-y-0.5">
                      {val.details.map((d, i) => (
                        <li key={i} className="text-xs text-slate-500 pl-3 relative before:content-['\u2022'] before:absolute before:left-0 before:text-slate-300">{d}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {analysisData.critical_issues?.length > 0 && (
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Critical Issues</h3>
              <ul className="space-y-1">
                {analysisData.critical_issues.map((issue, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <span className="flex-shrink-0 mt-0.5">{'\u274c'}</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysisData.suggestions?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Improvement Suggestions</h3>
              <div className="space-y-2">
                {[...analysisData.suggestions].sort((a, b) => {
                  const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                  return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
                }).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase flex-shrink-0 ${
                      s.priority === 'high' ? 'bg-red-100 text-red-700' :
                      s.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'
                    }`}>{s.priority}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800">{s.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.description}</div>
                    </div>
                    {s.auto_fixable && (
                      <button
                        onClick={() => onRewrite(s.description)}
                        disabled={rewriting}
                        className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex-shrink-0 disabled:opacity-50"
                      >
                        Apply Fix
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions: Full Rewrite + Suggest Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">AI Actions</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onRewrite()}
            disabled={rewriting}
            className="px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {rewriting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {rewriting ? 'Rewriting...' : 'Full Rewrite'}
          </button>
          <div className="flex items-center gap-2">
            <select
              value={suggestType}
              onChange={e => setSuggestType(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Suggest Section...</option>
              {SUGGEST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={() => suggestType && onSuggestSection(suggestType)}
              disabled={!suggestType || suggesting}
              className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 disabled:opacity-50"
            >
              {suggesting ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Rewrite Result */}
      {rewriteResult && (
        <div className="bg-white rounded-xl border-2 border-purple-300 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Rewrite Result</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => onApplyRewrite(rewriteResult)} className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg">Apply to Editor</button>
              <button onClick={onCloseRewrite} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Dismiss</button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto bg-slate-50 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: (() => { try { return marked(rewriteResult.content || '', { breaks: true }) as string; } catch { return rewriteResult.content || ''; } })() }} />
        </div>
      )}

      {/* Suggest Result */}
      {suggestResult && (
        <div className="bg-white rounded-xl border-2 border-emerald-300 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Suggested Section</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => onApplySuggest(suggestResult)} className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Add to Editor</button>
              <button onClick={onCloseSuggest} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Dismiss</button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto bg-slate-50 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: (() => { try { return marked(suggestResult, { breaks: true }) as string; } catch { return suggestResult; } })() }} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Revisions Tab Component ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════

function RevisionsTab({
  revisions, loading, onRestore, onView,
}: {
  revisions: RevisionItem[];
  loading: boolean;
  onRestore: (rev: RevisionItem) => void;
  onView: (rev: RevisionItem) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full" />
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-medium text-slate-600 mb-1">No Revisions Yet</h3>
        <p className="text-xs text-slate-400">Revisions are created automatically when you save or rewrite content.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left py-2.5 px-4 text-slate-500 font-medium">Version</th>
            <th className="text-left py-2.5 px-4 text-slate-500 font-medium">Change</th>
            <th className="text-left py-2.5 px-4 text-slate-500 font-medium">Words</th>
            <th className="text-left py-2.5 px-4 text-slate-500 font-medium">Score</th>
            <th className="text-left py-2.5 px-4 text-slate-500 font-medium">By</th>
            <th className="text-left py-2.5 px-4 text-slate-500 font-medium">Date</th>
            <th className="text-right py-2.5 px-4 text-slate-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {revisions.map((rev, i) => (
            <tr key={rev.id} className={`border-b border-slate-100 ${i === 0 ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
              <td className="py-2.5 px-4">
                <span className="font-medium text-slate-800">v{rev.version}</span>
                {i === 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">Latest</span>}
              </td>
              <td className="py-2.5 px-4 text-slate-600 max-w-[200px] truncate">{rev.change_summary || '-'}</td>
              <td className="py-2.5 px-4 text-slate-500">{rev.word_count?.toLocaleString() || '-'}</td>
              <td className="py-2.5 px-4">
                {rev.score != null ? (
                  <span className={`font-medium ${rev.score >= 80 ? 'text-green-600' : rev.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {rev.score}
                  </span>
                ) : '-'}
              </td>
              <td className="py-2.5 px-4 text-slate-500 capitalize">{rev.created_by}</td>
              <td className="py-2.5 px-4 text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</td>
              <td className="py-2.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button onClick={() => onView(rev)} className="px-2 py-1 text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded">View</button>
                  {i > 0 && <button onClick={() => onRestore(rev)} className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded">Restore</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
