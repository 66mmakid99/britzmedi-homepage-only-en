import { useState, useEffect, useCallback } from 'react';
import { BlogList } from './BlogList';

interface BlogPost {
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
  source?: 'db' | 'file' | 'static';
}

interface ManifestPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: string;
  featured_image: string | null;
  published_at: string | null;
  updated_at: string | null;
  author: string;
  doctor_name: string | null;
  source: 'file' | 'static';
}

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
];

export default function BlogManagerDashboard() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      // Fetch D1 posts and file manifest in parallel
      const [dbRes, manifestRes] = await Promise.all([
        fetch(`/api/admin/blog/posts?${params}`),
        fetch('/api/blog-manifest.json'),
      ]);

      const dbData = await dbRes.json();
      const dbPosts: BlogPost[] = (dbData.posts || []).map((p: BlogPost) => ({
        ...p,
        source: 'db' as const,
      }));

      let manifestPosts: ManifestPost[] = [];
      if (manifestRes.ok) {
        manifestPosts = await manifestRes.json();
      }

      // Collect slugs from DB posts
      const dbSlugs = new Set(dbPosts.map(p => p.slug));

      // Convert manifest posts to BlogPost format, excluding duplicates
      const filePosts: BlogPost[] = manifestPosts
        .filter(mp => !dbSlugs.has(mp.slug))
        .filter(mp => {
          if (statusFilter !== 'all' && mp.status !== statusFilter) return false;
          if (search && !mp.title.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        })
        .map(mp => ({
          id: `file:${mp.slug}`,
          title: mp.title,
          slug: mp.slug,
          excerpt: mp.excerpt,
          featured_image: mp.featured_image,
          category: mp.category,
          tags: Array.isArray(mp.tags) ? mp.tags.join(', ') : null,
          status: mp.status,
          scheduled_date: null,
          published_at: mp.published_at,
          created_at: mp.published_at || '',
          updated_at: mp.updated_at || mp.published_at || '',
          youtube_url: null,
          doctor_name: mp.doctor_name,
          source: mp.source,
        }));

      // Merge and sort by date descending
      const allPosts = [...dbPosts, ...filePosts].sort(
        (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      );

      // Recompute counts including file posts
      const dbCounts = dbData.counts || {};
      const fileCountsByStatus: Record<string, number> = {};
      manifestPosts
        .filter(mp => !dbSlugs.has(mp.slug))
        .forEach(mp => {
          fileCountsByStatus[mp.status] = (fileCountsByStatus[mp.status] || 0) + 1;
        });

      const mergedCounts: Record<string, number> = { ...dbCounts };
      for (const [status, count] of Object.entries(fileCountsByStatus)) {
        mergedCounts[status] = (mergedCounts[status] || 0) + count;
      }

      setPosts(allPosts);
      setCounts(mergedCounts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleStatusChange = async (postId: string, status: string, scheduledDate?: string) => {
    try {
      if (postId.startsWith('file:')) {
        // File-based post — use GitHub API endpoint
        const slug = postId.replace('file:', '');
        await fetch(`/api/admin/blog/file-posts/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } else {
        // DB post — use existing D1 API
        const body: Record<string, string> = { status };
        if (scheduledDate) body.scheduled_date = scheduledDate;

        await fetch(`/api/admin/blog/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      fetchPosts();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (postId.startsWith('file:')) {
      alert('File-based posts cannot be deleted from the admin. Remove the JSON file from the repository instead.');
      return;
    }
    try {
      await fetch(`/api/admin/blog/${postId}`, { method: 'DELETE' });
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Manager</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage posts, scheduling, and publishing
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-white rounded-xl border border-slate-200 p-1">
        {STATUS_TABS.map(tab => {
          const count = tab.value === 'all' ? totalCount : (counts[tab.value] || 0);
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.value
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-slate-100 text-slate-500'
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

      {/* Blog List */}
      <BlogList
        posts={posts}
        loading={loading}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
