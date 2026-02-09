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
type ChannelFilter = 'all' | 'twitter' | 'linkedin' | 'facebook' | 'instagram';
type StatusFilter = 'all' | 'pending' | 'posted' | 'failed' | 'skipped';
type ComposeChannel = 'twitter' | 'linkedin' | 'facebook' | 'instagram';

const CHAR_LIMITS: Record<ComposeChannel, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
};

const CHANNEL_NAMES: Record<ComposeChannel, string> = {
  twitter: 'X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

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
  const [composeChannel, setComposeChannel] = useState<ComposeChannel>('twitter');
  const [composeImageUrl, setComposeImageUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);

  // Share blog state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState('');
  const [shareBlogChannel, setShareBlogChannel] = useState<ComposeChannel>('twitter');
  const [sharingBlog, setSharingBlog] = useState(false);

  // Connection status
  const [channelStatuses, setChannelStatuses] = useState<Record<string, ChannelStatus>>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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

    // Handle OAuth callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get('linkedin_connected') === 'true') {
      setPostResult({ success: true, message: 'LinkedIn connected successfully!' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('linkedin_error')) {
      const err = params.get('linkedin_error');
      setPostResult({ success: false, message: `LinkedIn connection failed: ${err}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
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
      const payload: Record<string, string> = { channel: composeChannel, content: composeText };
      if (composeChannel === 'instagram' && composeImageUrl.trim()) {
        payload.imageUrl = composeImageUrl.trim();
      }
      const res = await fetch('/api/admin/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPostResult({ success: true, message: `Posted to ${CHANNEL_NAMES[composeChannel]}! ID: ${data.externalId || 'N/A'}` });
        setComposeText('');
        setComposeImageUrl('');
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
        body: JSON.stringify({ channel: shareBlogChannel, postId: selectedBlogId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPostResult({ success: true, message: `Blog shared to ${CHANNEL_NAMES[shareBlogChannel]}! ID: ${data.externalId || 'N/A'}` });
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

  const handleLinkedInDisconnect = async () => {
    if (!confirm('Disconnect LinkedIn account?')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/admin/social/linkedin/disconnect', { method: 'POST' });
      if (res.ok) {
        await fetchConnectionStatus();
        await fetchAccounts();
      } else {
        alert('Failed to disconnect LinkedIn');
      }
    } catch {
      alert('Network error');
    } finally {
      setDisconnecting(false);
    }
  };

  const postedCount = counts['posted'] || 0;
  const failedCount = counts['failed'] || 0;
  const pendingCount = counts['pending'] || 0;

  const twitterStatus = channelStatuses['twitter'];
  const linkedinStatus = channelStatuses['linkedin'];
  const instagramStatus = channelStatuses['instagram'];

  const CHANNEL_FILTERS: { value: ChannelFilter; label: string }[] = [
    { value: 'all', label: 'All Channels' },
    { value: 'twitter', label: 'Twitter / X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
  ];

  const STATUS_FILTERS: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: total },
    { value: 'posted', label: 'Posted', count: postedCount },
    { value: 'failed', label: 'Failed', count: failedCount },
    { value: 'pending', label: 'Pending', count: pendingCount },
  ];

  const charCount = composeText.length;
  const charLimit = CHAR_LIMITS[composeChannel];
  const isOverLimit = charCount > charLimit;

  const renderChannelStatus = (channel: string, status: ChannelStatus | undefined) => {
    if (statusLoading) {
      return <span className="text-xs text-slate-400">Checking...</span>;
    }
    if (status?.connected) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          {status.account}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
        {status?.error || 'Not connected'}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Social Media</h1>
        <p className="text-sm text-slate-500 mt-1">Auto-posting and social media management</p>
      </div>

      {/* Notification banner */}
      {postResult && tab !== 'compose' && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          postResult.success
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {postResult.message}
          <button onClick={() => setPostResult(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Connection Status Banner */}
      <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-700">Connections:</span>

            {/* Twitter */}
            <div className="flex items-center gap-2">
              <ChannelIcon channel="twitter" className="w-4 h-4" />
              {renderChannelStatus('twitter', twitterStatus)}
            </div>

            {/* LinkedIn */}
            <div className="flex items-center gap-2">
              <ChannelIcon channel="linkedin" className="w-4 h-4" />
              {statusLoading ? (
                <span className="text-xs text-slate-400">Checking...</span>
              ) : linkedinStatus?.connected ? (
                <>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {linkedinStatus.account}
                  </span>
                  <button
                    onClick={handleLinkedInDisconnect}
                    disabled={disconnecting}
                    className="text-xs text-red-500 hover:text-red-700 font-medium ml-1"
                  >
                    {disconnecting ? '...' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <a
                  href="/api/admin/social/linkedin/authorize"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                >
                  Connect LinkedIn
                </a>
              )}
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-2">
              <ChannelIcon channel="instagram" className="w-4 h-4" />
              {renderChannelStatus('instagram', instagramStatus)}
            </div>

            {/* Facebook */}
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
              <div className="flex gap-1 flex-wrap">
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
                    onChange={(e) => setComposeChannel(e.target.value as ComposeChannel)}
                    className="w-full max-w-xs px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="twitter">Twitter / X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
                  <textarea
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    rows={4}
                    placeholder={composeChannel === 'instagram' ? 'Write your caption...' : 'Write your post...'}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${isOverLimit ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                      {charCount} / {charLimit}
                    </span>
                  </div>
                </div>

                {/* Image URL field for Instagram */}
                {composeChannel === 'instagram' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Image URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={composeImageUrl}
                      onChange={(e) => setComposeImageUrl(e.target.value)}
                      placeholder="https://britzmedi.com/images/..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">Instagram requires an image for every post. Use a public URL.</p>
                  </div>
                )}

                <button
                  onClick={handleCompose}
                  disabled={posting || !composeText.trim() || isOverLimit || (composeChannel === 'instagram' && !composeImageUrl.trim())}
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
                      Post to {CHANNEL_NAMES[composeChannel]}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Share Blog Post */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Share Blog Post</h3>
              <p className="text-xs text-slate-500 mb-3">Select a published blog post to share on social media with auto-generated content.</p>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
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
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
                  <select
                    value={shareBlogChannel}
                    onChange={(e) => setShareBlogChannel(e.target.value as ComposeChannel)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="twitter">X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
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
                      <ChannelIcon channel={shareBlogChannel} className="w-4 h-4" />
                      Share to {CHANNEL_NAMES[shareBlogChannel]}
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
