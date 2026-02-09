// Content Hub — main dashboard with Pipeline, All Content, and Quality tabs

import { useState, useEffect, useCallback } from 'react';
import { PipelineView } from './PipelineView';
import { QualityPanel } from './QualityPanel';
import { TransitionActions } from './TransitionActions';
import { BlogStatusBadge } from '../blog-manager/BlogStatusBadge';
import { QualityGradeBadge } from './QualityPanel';
import type { QualityResult } from '../../../lib/content/quality-checker';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string;
  tags: string | null;
  status: string;
  scheduled_date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  youtube_url: string | null;
  doctor_name: string | null;
  contentType?: 'blog' | 'news';
}

interface NewsItem {
  id: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  image: string | null;
  featured: boolean;
  published: boolean;
}

type ContentTypeFilter = 'all' | 'blog' | 'news';

interface QualityInfo {
  id: string;
  slug: string;
  title: string;
  status: string;
  score: number;
  grade: string;
  checks: QualityResult['checks'];
}

type Tab = 'pipeline' | 'all' | 'quality';
type StatusFilter = 'all' | 'draft' | 'review' | 'approved' | 'published' | 'archived';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function ContentHub() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const [posts, setPosts] = useState<Post[]>([]);
  const [qualityData, setQualityData] = useState<QualityInfo[]>([]);
  const [qualityMap, setQualityMap] = useState<Record<string, QualityInfo>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityResult | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [contentType, setContentType] = useState<ContentTypeFilter>('all');
  const [newsItems, setNewsItems] = useState<Post[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, qualityRes, newsRes] = await Promise.all([
        fetch('/api/admin/blog/posts?limit=200'),
        fetch('/api/admin/content-hub/quality-check'),
        fetch('/api/admin/content-hub/news'),
      ]);

      const postsData = await postsRes.json();
      const blogPosts = (postsData.posts || []).map((p: Post) => ({ ...p, contentType: 'blog' as const }));
      setCounts(postsData.counts || {});

      // Fetch news items
      let newsAsPosts: Post[] = [];
      if (newsRes.ok) {
        const nData: NewsItem[] = await newsRes.json();
        newsAsPosts = nData.map(n => ({
          id: `news:${n.id}`,
          title: n.title,
          slug: n.id,
          excerpt: n.summary,
          featured_image: n.image,
          category: n.category,
          tags: null,
          status: n.published ? 'published' : 'draft',
          scheduled_date: null,
          published_at: n.date,
          created_at: n.date,
          updated_at: n.date,
          youtube_url: null,
          doctor_name: null,
          contentType: 'news' as const,
        }));
        setNewsItems(newsAsPosts);
      }

      setPosts([...blogPosts, ...newsAsPosts]);

      if (qualityRes.ok) {
        const qData: QualityInfo[] = await qualityRes.json();
        setQualityData(qData);
        const map: Record<string, QualityInfo> = {};
        for (const q of qData) {
          map[q.id] = q;
        }
        setQualityMap(map);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSelectPost = useCallback(async (post: Post) => {
    setSelectedPost(post);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/content-hub/quality-check?id=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedQuality({ score: data.score, grade: data.grade, checks: data.checks });
      }
    } catch (err) {
      console.error('Failed to fetch quality:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleTransition = useCallback(async (targetStatus: string, override?: boolean) => {
    if (!selectedPost) return;
    try {
      const res = await fetch('/api/admin/content-hub/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPost.id, targetStatus, override }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.canOverride) return; // TransitionActions handles override UI
        alert(data.error || 'Transition failed');
        return;
      }
      setSelectedPost(null);
      setSelectedQuality(null);
      fetchData();
    } catch (err) {
      console.error('Transition error:', err);
      alert('Failed to transition post');
    }
  }, [selectedPost, fetchData]);

  const closeDetail = () => {
    setSelectedPost(null);
    setSelectedQuality(null);
  };

  // Filtered posts for "All Content" tab
  const filteredPosts = posts.filter(p => {
    if (contentType !== 'all' && p.contentType !== contentType) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Pipeline only shows blog posts (news has simpler workflow)
  const pipelinePosts = posts.filter(p => p.contentType === 'blog' || !p.contentType);

  // Quality-sorted posts for "Quality" tab
  const qualitySorted = [...qualityData].sort((a, b) => a.score - b.score);

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Workflow pipeline, quality checks, and publishing
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium">{totalCount}</span> posts total
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        {([
          { value: 'pipeline' as Tab, label: 'Pipeline' },
          { value: 'all' as Tab, label: 'All Content' },
          { value: 'quality' as Tab, label: 'Quality' },
        ]).map(t => (
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full" />
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Main area */}
          <div className={`flex-1 ${selectedPost ? 'min-w-0' : ''}`}>
            {/* Pipeline Tab */}
            {tab === 'pipeline' && (
              <PipelineView
                posts={pipelinePosts}
                qualityMap={qualityMap}
                selectedId={selectedPost?.id || null}
                onSelectPost={handleSelectPost}
              />
            )}

            {/* All Content Tab */}
            {tab === 'all' && (
              <div>
                {/* Content type filter */}
                <div className="flex items-center gap-2 mb-3">
                  {([
                    { value: 'all' as ContentTypeFilter, label: 'All Types' },
                    { value: 'blog' as ContentTypeFilter, label: 'Blog' },
                    { value: 'news' as ContentTypeFilter, label: 'News' },
                  ]).map(ct => (
                    <button
                      key={ct.value}
                      onClick={() => setContentType(ct.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        contentType === ct.value
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1 mb-4 bg-white rounded-xl border border-slate-200 p-1">
                  {STATUS_TABS.map(st => {
                    const count = st.value === 'all' ? totalCount : (counts[st.value] || 0);
                    return (
                      <button
                        key={st.value}
                        onClick={() => setStatusFilter(st.value)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          statusFilter === st.value
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {st.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          statusFilter === st.value ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {filteredPosts.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-12">No posts found</p>
                  ) : (
                    filteredPosts.map(post => {
                      const q = qualityMap[post.id];
                      return (
                        <button
                          key={post.id}
                          onClick={() => handleSelectPost(post)}
                          className={`w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors ${
                            selectedPost?.id === post.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {post.featured_image ? (
                              <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 truncate">{post.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {post.contentType === 'news' ? (
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-pink-100 text-pink-700">News</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-sky-100 text-sky-700">Blog</span>
                              )}
                              <BlogStatusBadge status={post.status} />
                              {q && <QualityGradeBadge grade={q.grade} score={q.score} />}
                              <span className="text-[10px] text-slate-400">
                                {post.category}
                              </span>
                            </div>
                          </div>

                          {/* Date */}
                          <div className="text-xs text-slate-400 flex-shrink-0">
                            {formatDate(post.updated_at || post.created_at)}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Quality Tab */}
            {tab === 'quality' && (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50 rounded-t-xl">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <span className="w-8">#</span>
                    <span className="flex-1">Post</span>
                    <span className="w-20 text-center">Status</span>
                    <span className="w-20 text-center">Score</span>
                    <span className="w-24 text-right">Issues</span>
                  </div>
                </div>

                {qualitySorted.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-12">No quality data available</p>
                ) : (
                  qualitySorted.map((q, i) => {
                    const failCount = q.checks.filter(c => c.status === 'fail').length;
                    const warnCount = q.checks.filter(c => c.status === 'warn').length;
                    const post = posts.find(p => p.id === q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => post && handleSelectPost(post)}
                        className={`w-full text-left flex items-center gap-2 px-4 py-3 hover:bg-slate-50 transition-colors ${
                          selectedPost?.id === q.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <span className="w-8 text-xs text-slate-400">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 truncate">{q.title}</h4>
                        </div>
                        <div className="w-20 flex justify-center">
                          <BlogStatusBadge status={q.status} />
                        </div>
                        <div className="w-20 flex justify-center">
                          <QualityGradeBadge grade={q.grade} score={q.score} />
                        </div>
                        <div className="w-24 text-right text-xs">
                          {failCount > 0 && <span className="text-red-500 font-medium">{failCount} fail</span>}
                          {failCount > 0 && warnCount > 0 && <span className="text-slate-300 mx-1">·</span>}
                          {warnCount > 0 && <span className="text-amber-500">{warnCount} warn</span>}
                          {failCount === 0 && warnCount === 0 && <span className="text-green-500">All pass</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Detail Sidebar */}
          {selectedPost && (
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-20 bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 truncate">{selectedPost.title}</h3>
                  <button onClick={closeDetail} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <BlogStatusBadge status={selectedPost.status} />
                  </div>

                  {/* Post details */}
                  <div className="space-y-1 text-xs text-slate-500">
                    {selectedPost.category && (
                      <div>Category: <span className="text-slate-700">{selectedPost.category}</span></div>
                    )}
                    {selectedPost.doctor_name && (
                      <div>Expert: <span className="text-slate-700">{selectedPost.doctor_name}</span></div>
                    )}
                    <div>Updated: <span className="text-slate-700">{formatDate(selectedPost.updated_at)}</span></div>
                    {selectedPost.slug && (
                      <div className="truncate">Slug: <span className="text-slate-700">{selectedPost.slug}</span></div>
                    )}
                  </div>

                  {/* Quality Panel */}
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full" />
                    </div>
                  ) : selectedQuality ? (
                    <QualityPanel quality={selectedQuality} />
                  ) : null}

                  {/* Transition Actions (blog only) */}
                  {selectedPost.contentType !== 'news' && (
                    <div className="pt-2 border-t border-slate-100">
                      <TransitionActions
                        postId={selectedPost.id}
                        currentStatus={selectedPost.status}
                        qualityScore={selectedQuality?.score}
                        onTransition={handleTransition}
                      />
                    </div>
                  )}

                  {/* Edit / View link */}
                  {selectedPost.contentType === 'news' ? (
                    <a
                      href={`/news/${selectedPost.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      View on Site
                    </a>
                  ) : (
                    <a
                      href={`/admin/youtube-to-blog?edit=${selectedPost.id}`}
                      className="block w-full text-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    >
                      Open in Editor
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
