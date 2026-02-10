// Content Hub Dashboard — enhanced main component with Pipeline, All Content, SEO Briefs, Progress, and Quality tabs

import { useState, useEffect, useCallback } from 'react';
import { ContentItemCard } from './ContentItemCard';
import { SEOBriefCard } from './SEOBriefCard';
import { GenerateModal } from './GenerateModal';
import { ProgressTracker } from './ProgressTracker';

// ─── Types ──────────────────────────────────────────────────────

interface ContentItem {
  id: number;
  source_type: 'youtube' | 'file' | 'seo_brief' | 'manual';
  source_id: string | null;
  source_url: string | null;
  title: string;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  category: string | null;
  tags: string | null;
  featured_image: string | null;
  seo_keyword: string | null;
  seo_gap_score: number | null;
  seo_target_position: number | null;
  status: 'brief' | 'generating' | 'draft' | 'review' | 'approved' | 'published' | 'archived';
  author: string;
  word_count: number | null;
  estimated_read_time: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SEOBrief {
  id: number;
  keyword: string;
  tier: number;
  category: string;
  target_position: number;
  priority: string;
  content_type: string;
  status: string;
  latest_position: number | null;
  latest_impressions: number | null;
}

type Tab = 'pipeline' | 'all' | 'seo_briefs' | 'progress' | 'quality';
type SourceFilter = 'all' | 'youtube' | 'file' | 'seo_brief' | 'manual';
type StatusFilter = 'all' | 'brief' | 'generating' | 'draft' | 'review' | 'approved' | 'published' | 'archived';

// ─── Constants ──────────────────────────────────────────────────

const TABS: { value: Tab; label: string }[] = [
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'all', label: 'All Content' },
  { value: 'seo_briefs', label: 'SEO Briefs' },
  { value: 'progress', label: 'Progress' },
  { value: 'quality', label: 'Quality' },
];

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'file', label: 'File' },
  { value: 'seo_brief', label: 'SEO Brief' },
  { value: 'manual', label: 'Manual' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'brief', label: 'Brief' },
  { value: 'generating', label: 'Generating' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const PIPELINE_COLUMNS = [
  { status: 'brief', label: 'Brief', color: 'bg-slate-500' },
  { status: 'generating', label: 'Generating', color: 'bg-yellow-500' },
  { status: 'draft', label: 'Draft', color: 'bg-blue-500' },
  { status: 'review', label: 'Review', color: 'bg-orange-500' },
  { status: 'approved', label: 'Approved', color: 'bg-green-500' },
  { status: 'published', label: 'Published', color: 'bg-emerald-500' },
  { status: 'archived', label: 'Archived', color: 'bg-slate-400' },
];

const STATUS_BADGE: Record<string, string> = {
  brief: 'bg-slate-100 text-slate-600',
  generating: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-blue-100 text-blue-700',
  review: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
};

const SOURCE_BADGE: Record<string, { label: string; className: string }> = {
  youtube: { label: 'YouTube', className: 'bg-red-100 text-red-700' },
  file: { label: 'File', className: 'bg-sky-100 text-sky-700' },
  seo_brief: { label: 'SEO', className: 'bg-purple-100 text-purple-700' },
  manual: { label: 'Manual', className: 'bg-slate-100 text-slate-600' },
};

const TRANSITION_ACTIONS: Record<string, { action: string; label: string; style: string; confirm?: string }[]> = {
  brief: [
    { action: 'start_generate', label: 'Start Generating', style: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
    { action: 'move_to_draft', label: 'Move to Draft', style: 'bg-blue-600 hover:bg-blue-700 text-white' },
  ],
  generating: [
    { action: 'complete_generate', label: 'Move to Draft', style: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { action: 'back_to_brief', label: 'Back to Brief', style: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
  ],
  draft: [
    { action: 'submit_review', label: 'Submit for Review', style: 'bg-orange-600 hover:bg-orange-700 text-white' },
  ],
  review: [
    { action: 'approve', label: 'Approve', style: 'bg-green-600 hover:bg-green-700 text-white' },
    { action: 'reject', label: 'Back to Draft', style: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
  ],
  approved: [
    { action: 'publish', label: 'Publish', style: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    { action: 'back_to_draft', label: 'Back to Draft', style: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
  ],
  published: [
    { action: 'archive', label: 'Archive', style: 'bg-slate-600 hover:bg-slate-700 text-white', confirm: 'Archive this content? It will be removed from the live site.' },
    { action: 'unpublish', label: 'Unpublish', style: 'bg-red-100 hover:bg-red-200 text-red-700', confirm: 'Unpublish this content? It will be removed from the live site.' },
  ],
  archived: [
    { action: 'reopen', label: 'Reopen as Draft', style: 'bg-slate-200 hover:bg-slate-300 text-slate-700' },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Pipeline Card (compact for kanban) ─────────────────────────

function PipelineCard({
  item,
  selected,
  onClick,
}: {
  item: ContentItem;
  selected: boolean;
  onClick: () => void;
}) {
  const sourceBadge = SOURCE_BADGE[item.source_type] || SOURCE_BADGE.manual;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-lg border transition-all hover:shadow-md cursor-pointer ${
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Thumbnail */}
      {item.featured_image && (
        <div className="h-24 w-full overflow-hidden rounded-t-lg bg-slate-100">
          <img src={item.featured_image} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="p-3 space-y-2">
        <h4 className="text-sm font-medium text-slate-900 line-clamp-2 leading-tight">
          {item.title}
        </h4>

        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${sourceBadge.className}`}>
            {sourceBadge.label}
          </span>
          {item.word_count !== null && item.word_count > 0 && (
            <span className="text-[10px] text-slate-400">{item.word_count.toLocaleString()}w</span>
          )}
        </div>

        {item.seo_keyword && (
          <div className="flex items-center gap-1 text-[10px] text-purple-600 truncate">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span className="truncate">{item.seo_keyword}</span>
          </div>
        )}

        {item.category && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
            {item.category}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export default function ContentHubDashboard() {
  // State
  const [tab, setTab] = useState<Tab>('pipeline');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [seoBriefs, setSeoBriefs] = useState<SEOBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [seoBriefsLoading, setSeoBriefsLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrefill, setGeneratePrefill] = useState<{ keyword?: string; title?: string; content_type?: string; tier?: number } | undefined>(undefined);
  const [transitionLoading, setTransitionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ContentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Data fetching ──────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== 'all') params.set('source_type', sourceFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/content-hub/items?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch content items');
      const data = await res.json();
      setItems(data.items || data || []);
    } catch (err) {
      console.error('Failed to fetch content items:', err);
      setError('Failed to load content items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, statusFilter, search]);

  const fetchSeoBriefs = useCallback(async () => {
    setSeoBriefsLoading(true);
    try {
      const res = await fetch('/api/admin/content-hub/seo-briefs');
      if (!res.ok) throw new Error('Failed to fetch SEO briefs');
      const data = await res.json();
      setSeoBriefs(data.briefs || data || []);
    } catch (err) {
      console.error('Failed to fetch SEO briefs:', err);
      setSeoBriefs([]);
    } finally {
      setSeoBriefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (tab === 'seo_briefs' && seoBriefs.length === 0) {
      fetchSeoBriefs();
    }
  }, [tab, seoBriefs.length, fetchSeoBriefs]);

  // ─── Actions ────────────────────────────────────────────────

  const handleSelectItem = useCallback((item: ContentItem) => {
    setSelectedItem(prev => prev?.id === item.id ? null : item);
  }, []);

  const handleTransition = useCallback(async (itemId: number, actionName: string, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    setTransitionLoading(actionName);
    try {
      const res = await fetch(`/api/admin/content-hub/items/${itemId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Transition failed');
      }

      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to transition');
    } finally {
      setTransitionLoading(null);
    }
  }, [fetchItems]);

  const handleDelete = useCallback(async (item: ContentItem) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/content-hub/items/${item.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      setDeleteConfirm(null);
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  }, [fetchItems]);

  const handleGenerateFromBrief = useCallback((brief: SEOBrief) => {
    setGeneratePrefill({
      keyword: brief.keyword,
      content_type: brief.content_type,
      tier: brief.tier,
    });
    setShowGenerateModal(true);
  }, []);

  const handleNewContent = useCallback(() => {
    setGeneratePrefill(undefined);
    setShowGenerateModal(true);
  }, []);

  const handleGenerated = useCallback((_contentId: number) => {
    fetchItems();
    if (tab === 'seo_briefs') {
      fetchSeoBriefs();
    }
  }, [fetchItems, fetchSeoBriefs, tab]);

  const closeDetail = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // ─── Bulk Actions ──────────────────────────────────────────

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  }, [items, selectedIds.size]);

  const toggleSelectItem = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} item(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/admin/content-hub/items/${id}`, { method: 'DELETE' })
      );
      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)).length;
      if (failed > 0) alert(`${failed} item(s) could not be deleted (may be published).`);
      setSelectedIds(new Set());
      setSelectedItem(null);
      fetchItems();
    } catch { alert('Bulk delete failed'); }
    finally { setBulkLoading(false); }
  }, [selectedIds, fetchItems]);

  const handleBulkUnpublish = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Unpublish ${selectedIds.size} item(s)?`)) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/admin/content-hub/items/${id}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unpublish' }),
        })
      );
      await Promise.allSettled(promises);
      setSelectedIds(new Set());
      setSelectedItem(null);
      fetchItems();
    } catch { alert('Bulk unpublish failed'); }
    finally { setBulkLoading(false); }
  }, [selectedIds, fetchItems]);

  const handleDuplicate = useCallback(async (item: ContentItem) => {
    try {
      const suffix = Date.now().toString(36).slice(-4);
      const res = await fetch('/api/admin/content-hub/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${item.title} (Copy)`,
          slug: `${(item.slug || 'content')}-copy-${suffix}`,
          source_type: item.source_type,
          content: item.content || '',
          excerpt: item.excerpt || '',
          category: item.category || '',
          tags: item.tags || '',
          seo_keyword: item.seo_keyword || '',
          author: item.author || 'Admin',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to duplicate');
      }
      fetchItems();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to duplicate content'); }
  }, [fetchItems]);

  // ─── Derived data ──────────────────────────────────────────

  const statusCounts: Record<string, number> = {};
  for (const item of items) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  }
  const totalCount = items.length;

  // Quality sorted (ascending by word count as proxy for quality; real quality would be from API)
  const qualitySorted = [...items]
    .filter(item => item.status !== 'brief' && item.status !== 'generating')
    .sort((a, b) => (a.word_count || 0) - (b.word_count || 0));

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pipeline, content management, SEO briefs, progress tracking, and quality
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            <span className="font-medium">{totalCount}</span> items
          </span>
          <button
            onClick={handleNewContent}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Content
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); closeDetail(); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Source + Status filters (for All Content and Pipeline tabs) */}
      {(tab === 'all' || tab === 'pipeline') && (
        <div className="space-y-3 mb-6">
          {/* Source filter pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Source:</span>
            {SOURCE_FILTERS.map(sf => (
              <button
                key={sf.value}
                onClick={() => setSourceFilter(sf.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  sourceFilter === sf.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* Status filter pills (All Content only) */}
          {tab === 'all' && (
            <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
              {STATUS_FILTERS.map(sf => {
                const count = sf.value === 'all' ? totalCount : (statusCounts[sf.value] || 0);
                return (
                  <button
                    key={sf.value}
                    onClick={() => setStatusFilter(sf.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      statusFilter === sf.value
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {sf.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      statusFilter === sf.value ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search */}
          {tab === 'all' && (
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search content..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); fetchItems(); }} className="text-red-600 hover:text-red-800 text-xs font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && tab !== 'seo_briefs' && tab !== 'progress' ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Main area */}
          <div className={`flex-1 ${selectedItem ? 'min-w-0' : ''}`}>

            {/* ─── Pipeline Tab ─── */}
            {tab === 'pipeline' && (
              <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
                {PIPELINE_COLUMNS.map(col => {
                  const columnItems = items.filter(item => item.status === col.status);
                  return (
                    <div key={col.status} className="flex-shrink-0 w-56">
                      {/* Column header */}
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                        <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                          {columnItems.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="space-y-2 min-h-[200px] bg-slate-50 rounded-xl p-2 border border-slate-100">
                        {columnItems.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-8">No items</p>
                        ) : (
                          columnItems.map(item => (
                            <PipelineCard
                              key={item.id}
                              item={item}
                              selected={selectedItem?.id === item.id}
                              onClick={() => handleSelectItem(item)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── All Content Tab ─── */}
            {tab === 'all' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm text-slate-400">No content items found</p>
                    <button
                      onClick={handleNewContent}
                      className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Create your first content
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <div className="w-6 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === items.length && items.length > 0}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">Title</div>
                      <div className="w-20 text-center">Status</div>
                      <div className="w-16 text-center">Source</div>
                      <div className="w-20 text-right">Date</div>
                      <div className="w-8" />
                    </div>

                    {/* Table rows */}
                    <div className="divide-y divide-slate-100">
                      {items.map(item => {
                        const sourceBadge = SOURCE_BADGE[item.source_type] || SOURCE_BADGE.manual;
                        const statusStyle = STATUS_BADGE[item.status] || STATUS_BADGE.draft;
                        const isSelected = selectedIds.has(item.id);
                        const isMenuOpen = openMenuId === item.id;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                              selectedItem?.id === item.id ? 'bg-blue-50' : isSelected ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <div className="w-6 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectItem(item.id)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer"
                              />
                            </div>

                            {/* Title (clickable for detail sidebar) */}
                            <button
                              onClick={() => handleSelectItem(item)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <h4 className="text-sm font-medium text-slate-900 truncate">{item.title}</h4>
                              {item.seo_keyword && (
                                <span className="text-[10px] text-purple-500 truncate block mt-0.5">{item.seo_keyword}</span>
                              )}
                            </button>

                            {/* Status */}
                            <div className="w-20 flex justify-center">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${statusStyle}`}>
                                {capitalize(item.status)}
                              </span>
                            </div>

                            {/* Source */}
                            <div className="w-16 flex justify-center">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${sourceBadge.className}`}>
                                {sourceBadge.label}
                              </span>
                            </div>

                            {/* Date */}
                            <div className="w-20 text-right text-xs text-slate-400">
                              {formatDate(item.updated_at || item.created_at)}
                            </div>

                            {/* ⋮ Menu */}
                            <div className="w-8 relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : item.id); }}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {isMenuOpen && (
                                <>
                                  {/* Backdrop to close menu */}
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  {/* Dropdown */}
                                  <div className="absolute right-0 top-8 z-20 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                                    {item.status !== 'brief' && (
                                      <a
                                        href={`/admin/content-hub/edit/${item.id}`}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                      >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </a>
                                    )}
                                    {item.status === 'published' && item.slug && (
                                      <a
                                        href={`/blog/${item.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                      >
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View Post
                                      </a>
                                    )}
                                    <button
                                      onClick={() => { setOpenMenuId(null); handleDuplicate(item); }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Duplicate
                                    </button>
                                    {item.status === 'published' && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); handleTransition(item.id, 'unpublish', 'Unpublish this content? It will be removed from the live site.'); }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        Unpublish
                                      </button>
                                    )}
                                    {item.status !== 'published' && (
                                      <button
                                        onClick={() => { setOpenMenuId(null); setDeleteConfirm(item); }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bulk action bar */}
                    {selectedIds.size > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-t border-blue-200">
                        <span className="text-sm text-blue-700 font-medium">
                          {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleBulkUnpublish}
                            disabled={bulkLoading}
                            className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Unpublish
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            disabled={bulkLoading}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─── SEO Briefs Tab ─── */}
            {tab === 'seo_briefs' && (
              <div>
                {seoBriefsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
                  </div>
                ) : seoBriefs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 text-center py-12">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-slate-400">No SEO briefs available</p>
                    <p className="text-xs text-slate-400 mt-1">SEO briefs are generated from keyword gap analysis</p>
                  </div>
                ) : (
                  <div>
                    {/* Summary header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span><span className="font-medium text-slate-700">{seoBriefs.length}</span> briefs</span>
                        <span><span className="font-medium text-red-600">{seoBriefs.filter(b => b.tier === 1).length}</span> T1</span>
                        <span><span className="font-medium text-orange-600">{seoBriefs.filter(b => b.tier === 2).length}</span> T2</span>
                        <span><span className="font-medium text-blue-600">{seoBriefs.filter(b => b.tier === 3).length}</span> T3</span>
                        <span><span className="font-medium text-purple-600">{seoBriefs.filter(b => b.tier === 4).length}</span> T4</span>
                      </div>
                      <button
                        onClick={fetchSeoBriefs}
                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Refresh
                      </button>
                    </div>

                    {/* Brief cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {seoBriefs.map(brief => (
                        <SEOBriefCard
                          key={brief.id}
                          brief={brief}
                          onGenerate={handleGenerateFromBrief}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Progress Tab ─── */}
            {tab === 'progress' && (
              <ProgressTracker />
            )}

            {/* ─── Quality Tab ─── */}
            {tab === 'quality' && (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50 rounded-t-xl">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <span className="w-8">#</span>
                    <span className="flex-1">Content</span>
                    <span className="w-20 text-center">Source</span>
                    <span className="w-20 text-center">Status</span>
                    <span className="w-24 text-center">Words</span>
                    <span className="w-24 text-right">SEO</span>
                  </div>
                </div>

                {qualitySorted.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-12">No content with quality data available</p>
                ) : (
                  qualitySorted.map((item, i) => {
                    const sourceBadge = SOURCE_BADGE[item.source_type] || SOURCE_BADGE.manual;
                    const statusStyle = STATUS_BADGE[item.status] || STATUS_BADGE.draft;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`w-full text-left flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors ${
                          selectedItem?.id === item.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="w-8 text-xs text-slate-400">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 truncate">{item.title}</h4>
                          {item.seo_keyword && (
                            <span className="text-[10px] text-purple-500 truncate block">{item.seo_keyword}</span>
                          )}
                        </div>
                        <div className="w-20 flex justify-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${sourceBadge.className}`}>
                            {sourceBadge.label}
                          </span>
                        </div>
                        <div className="w-20 flex justify-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${statusStyle}`}>
                            {capitalize(item.status)}
                          </span>
                        </div>
                        <div className="w-24 text-center text-xs text-slate-500">
                          {item.word_count !== null ? (
                            <span className={`font-medium ${
                              (item.word_count || 0) >= 1500 ? 'text-green-600' :
                              (item.word_count || 0) >= 800 ? 'text-blue-600' :
                              (item.word_count || 0) >= 300 ? 'text-orange-600' : 'text-red-500'
                            }`}>
                              {item.word_count?.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </div>
                        <div className="w-24 text-right text-xs">
                          {item.seo_gap_score !== null ? (
                            <span className={`font-medium ${
                              (item.seo_gap_score || 0) >= 80 ? 'text-green-600' :
                              (item.seo_gap_score || 0) >= 50 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              Gap: {item.seo_gap_score}
                            </span>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ─── Detail Sidebar ─── */}
          {selectedItem && (
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-20 bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 truncate">{selectedItem.title}</h3>
                  <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Status + Source badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${STATUS_BADGE[selectedItem.status] || ''}`}>
                      {capitalize(selectedItem.status)}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">Source:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${(SOURCE_BADGE[selectedItem.source_type] || SOURCE_BADGE.manual).className}`}>
                      {(SOURCE_BADGE[selectedItem.source_type] || SOURCE_BADGE.manual).label}
                    </span>
                  </div>

                  {/* SEO info */}
                  {(selectedItem.seo_keyword || selectedItem.seo_gap_score !== null) && (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 space-y-1">
                      {selectedItem.seo_keyword && (
                        <div className="text-xs">
                          <span className="text-purple-500">Keyword: </span>
                          <span className="text-purple-800 font-medium">{selectedItem.seo_keyword}</span>
                        </div>
                      )}
                      {selectedItem.seo_gap_score !== null && (
                        <div className="text-xs">
                          <span className="text-purple-500">Gap Score: </span>
                          <span className="text-purple-800 font-semibold">{selectedItem.seo_gap_score}</span>
                        </div>
                      )}
                      {selectedItem.seo_target_position !== null && (
                        <div className="text-xs">
                          <span className="text-purple-500">Target Position: </span>
                          <span className="text-purple-800 font-semibold">#{selectedItem.seo_target_position}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-1.5 text-xs text-slate-500">
                    {selectedItem.category && (
                      <div>Category: <span className="text-slate-700">{selectedItem.category}</span></div>
                    )}
                    {selectedItem.author && (
                      <div>Author: <span className="text-slate-700">{selectedItem.author}</span></div>
                    )}
                    {selectedItem.word_count !== null && selectedItem.word_count > 0 && (
                      <div>Word Count: <span className="text-slate-700">{selectedItem.word_count.toLocaleString()}</span></div>
                    )}
                    {selectedItem.estimated_read_time && (
                      <div>Read Time: <span className="text-slate-700">{selectedItem.estimated_read_time}</span></div>
                    )}
                    {selectedItem.tags && (
                      <div>
                        Tags: <span className="text-slate-700">{selectedItem.tags}</span>
                      </div>
                    )}
                    <div>Updated: <span className="text-slate-700">{formatDate(selectedItem.updated_at)}</span></div>
                    <div>Created: <span className="text-slate-700">{formatDate(selectedItem.created_at)}</span></div>
                    {selectedItem.published_at && (
                      <div>Published: <span className="text-slate-700">{formatDate(selectedItem.published_at)}</span></div>
                    )}
                    {selectedItem.slug && (
                      <div className="truncate">Slug: <span className="text-slate-700">{selectedItem.slug}</span></div>
                    )}
                    {selectedItem.source_url && (
                      <div className="truncate">
                        Source:{' '}
                        <a
                          href={selectedItem.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedItem.source_url}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  {selectedItem.excerpt && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{selectedItem.excerpt}</p>
                    </div>
                  )}

                  {/* Transition Actions */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-medium text-slate-500 mb-2">Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {(TRANSITION_ACTIONS[selectedItem.status] || []).map(act => (
                        <button
                          key={act.action}
                          onClick={() => handleTransition(selectedItem.id, act.action, act.confirm)}
                          disabled={!!transitionLoading}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${act.style} ${
                            transitionLoading === act.action ? 'opacity-50' : ''
                          } disabled:opacity-50`}
                        >
                          {transitionLoading === act.action ? 'Processing...' : act.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {selectedItem.status !== 'brief' && (
                      <a
                        href={`/admin/content-hub/edit/${selectedItem.id}`}
                        className="block w-full text-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      >
                        Open Editor
                      </a>
                    )}
                    {selectedItem.status === 'published' && selectedItem.slug && (
                      <a
                        href={`/blog/${selectedItem.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                      >
                        View on Site
                      </a>
                    )}
                  </div>

                  {/* Delete */}
                  {selectedItem.status !== 'published' && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setDeleteConfirm(selectedItem)}
                        className="w-full text-center px-3 py-2 text-xs font-medium text-red-600 bg-white hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                      >
                        Delete Content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
              Are you sure you want to delete <span className="font-medium">"{deleteConfirm.title}"</span>?
              All revisions will also be removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerated={handleGenerated}
        prefill={generatePrefill}
      />
    </div>
  );
}
