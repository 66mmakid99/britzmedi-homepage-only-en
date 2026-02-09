import { useState, useEffect, useCallback } from 'react';
import { SocialPostList } from './SocialPostList';
import { AccountsPanel } from './AccountsPanel';
import { ChannelIcon } from './ChannelIcon';

interface SocialPost {
  id: number;
  post_id: string;
  channel: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  external_id: string | null;
  error_message: string | null;
  created_at: string;
  blog_title?: string;
  blog_slug?: string;
}

interface SocialAccount {
  id: number;
  channel: string;
  account_name: string;
  account_id: string | null;
  enabled: number;
  auto_post: number;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface ChannelStatus {
  connected: boolean;
  account?: string;
  error?: string;
}

type Tab = 'posts' | 'compose' | 'accounts';
type ChannelFilter = 'all' | 'twitter' | 'linkedin' | 'facebook';
type StatusFilter = 'all' | 'pending' | 'posted' | 'failed' | 'skipped';

export default function SocialDashboard() {
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [repostingId, setRepostingId] = useState<number | null>(null);

  // Compose state
  const [composeText, setComposeText] = useState('');
  const [composeChannel, setComposeChannel] = useState<'twitter' | 'linkedin' | 'facebook'>('twitter');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);

  // Share blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState('');
  const [sharingBlog, setSharingBlog] = useState(false);

  // Connection status
  const [channelStatuses, setChannelStatuses] = useState<Record<string, ChannelStatus>>({});
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/social/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setCounts(data.counts || {});
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch social posts:', err);
    }
  }, [channelFilter, statusFilter]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/social/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  }, []);

  const fetchConnectionStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admin/social/status');
      if (res.ok) {
        const data = await res.json();
        setChannelStatuses(data.channels || {});
      }
    } catch (err) {
      console.error('Failed to fetch connection status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchBlogPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blog/posts?status=published&limit=50');
      if (res.ok) {
        const data = await res.json();
        setBlogPosts(data.posts || []);
      }
    } catch {
      // Blog posts API may not exist — ignore
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPosts(), fetchAccounts(), fetchConnectionStatus(), fetchBlogPosts()])
      .finally(() => setLoading(false));
  }, [fetchPosts, fetchAccounts, fetchConnectionStatus, fetchBlogPosts]);

  const handleRepost = async (id: number) => {
    setRepostingId(id);
    try {
      const res = await fetch(`/api/admin/social/${id}/repost`, { method: 'POST' });
      if (res.ok) {
        await fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Repost failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setRepostingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this social post record?')) return;
    try {
      await fetch(`/api/admin/social/${id}`, { method: 'DELETE' });
      await fetchPosts();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleCompose = async () => {
    if (!composeText.trim()) return;
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch('/api/admin/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: composeChannel, content: composeText }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPostResult({ success: true, message: `Posted to ${composeChannel}! ID: ${data.externalId || 'N/A'}` });
        setComposeText('');
        await fetchPosts();
      } else {
        setPostResult({ success: false, message: data.error || 'Post failed' });
      }
    } catch {
      setPostResult({ success: false, message: 'Network error' });
    } finally {
      setPosting(false);
    }
  };

  const handleShareBlog = async () => {
    if (!selectedBlogId) return;
    setSharingBlog(true);
    setPostResult(null);
    try {
      const res = await fetch('/api/admin/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'twitter', postId: selectedBlogId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPostResult({ success: true, message: `Blog shared to X! Tweet ID: ${data.externalId || 'N/A'}` });
        setSelectedBlogId('');
        await fetchPosts();
      } else {
        setPostResult({ success: false, message: data.error || 'Share failed' });
      }
    } catch {
      setPostResult({ success: false, message: 'Network error' });
    } finally {
      setSharingBlog(false);
    }
  };

  const postedCount = counts['posted'] || 0;
  const failedCount = counts['failed'] || 0;
  const pendingCount = counts['pending'] || 0;

  const twitterStatus = channelStatuses['twitter'];

  const CHANNEL_FILTERS: { value: ChannelFilter; label: string }[] = [
    { value: 'all', label: 'All Channels' },
    { value: 'twitter', label: 'Twitter / X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'facebook', label: 'Facebook' },
  ];

  const STATUS_FILTERS: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: total },
    { value: 'posted', label: 'Posted', count: postedCount },
    { value: 'failed', label: 'Failed', count: failedCount },
    { value: 'pending', label: 'Pending', count: pendingCount },
  ];

  const charCount = composeText.length;
  const charLimit = composeChannel === 'twitter' ? 280 : composeChannel === 'linkedin' ? 3000 : 63206;
  const isOverLimit = charCount > charLimit;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Social Media</h1>
        <p className="text-sm text-slate-500 mt-1">Auto-posting and social media management</p>
      </div>

      {/* Connection Status Banner */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Connections:</span>
            <div className="flex items-center gap-2">
              <ChannelIcon channel="twitter" className="w-4 h-4" />
              {statusLoading ? (
                <span className="text-xs text-slate-400">Checking...</span>
              ) : twitterStatus?.connected ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {twitterStatus.account}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  {twitterStatus?.error || 'Not connected'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ChannelIcon channel="linkedin" className="w-4 h-4" />
              <span className="text-xs text-slate-400">Not configured</span>
            </div>
            <div className="flex items-center gap-2">
              <ChannelIcon channel="facebook" className="w-4 h-4" />
              <span className="text-xs text-slate-400">Not configured</span>
            </div>
          </div>
          <button
            onClick={fetchConnectionStatus}
            disabled={statusLoading}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Posts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-green-600 uppercase">Posted</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{postedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-red-600 uppercase">Failed</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{failedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Accounts</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{accounts.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'posts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Post History
        </button>
        <button
          onClick={() => setTab('compose')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'compose' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          New Post
        </button>
        <button
          onClick={() => setTab('accounts')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'accounts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Accounts
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200">
        {tab === 'posts' ? (
          <div>
            {/* Filters */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
              {/* Channel filter */}
              <div className="flex gap-1">
                {CHANNEL_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setChannelFilter(f.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      channelFilter === f.value
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.value !== 'all' && <ChannelIcon channel={f.value} className="w-3 h-3" />}
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-slate-200" />

              {/* Status filter */}
              <div className="flex gap-1">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      statusFilter === f.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                    {f.count !== undefined && f.count > 0 && (
                      <span className="ml-1 opacity-75">({f.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : (
              <SocialPostList
                posts={posts}
                onRepost={handleRepost}
                onDelete={handleDelete}
                repostingId={repostingId}
              />
            )}
          </div>
        ) : tab === 'compose' ? (
          <div className="p-6 space-y-6">
            {/* Result message */}
            {postResult && (
              <div className={`p-3 rounded-lg text-sm ${
                postResult.success
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {postResult.message}
              </div>
            )}

            {/* Compose Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Compose Post</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
                  <select
                    value={composeChannel}
                    onChange={(e) => setComposeChannel(e.target.value as any)}
                    className="w-full max-w-xs px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="twitter">Twitter / X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
                  <textarea
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    rows={4}
                    placeholder="Write your post..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${isOverLimit ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                      {charCount} / {charLimit}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCompose}
                  disabled={posting || !composeText.trim() || isOverLimit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {posting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Posting...
                    </>
                  ) : (
                    <>
                      <ChannelIcon channel={composeChannel} className="w-4 h-4" />
                      Post to {composeChannel === 'twitter' ? 'X' : composeChannel === 'linkedin' ? 'LinkedIn' : 'Facebook'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Share Blog Post */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Share Blog Post to X</h3>
              <p className="text-xs text-slate-500 mb-3">Select a published blog post to share on X/Twitter with auto-generated content.</p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Blog Post</label>
                  <select
                    value={selectedBlogId}
                    onChange={(e) => setSelectedBlogId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a blog post...</option>
                    {blogPosts.map((bp) => (
                      <option key={bp.id} value={bp.id}>{bp.title}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleShareBlog}
                  disabled={sharingBlog || !selectedBlogId}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {sharingBlog ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <ChannelIcon channel="twitter" className="w-4 h-4" />
                      Share to X
                    </>
                  )}
                </button>
              </div>
              {blogPosts.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">No published blog posts found.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <AccountsPanel accounts={accounts} onRefresh={fetchAccounts} />
          </div>
        )}
      </div>
    </div>
  );
}
