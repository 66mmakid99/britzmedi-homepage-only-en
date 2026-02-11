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

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string;
  doctor_name: string | null;
  status: string;
  source: 'blog' | 'news';
}

interface ChannelStatus {
  connected: boolean;
  account?: string;
  error?: string;
  status?: 'healthy' | 'expiring' | 'expired' | 'disconnected';
  expires_at?: number;
  expires_in_days?: number;
}

type Tab = 'overview' | 'compose' | 'history' | 'accounts';
type ChannelFilter = 'all' | 'twitter' | 'linkedin' | 'facebook' | 'instagram';
type StatusFilter = 'all' | 'pending' | 'posted' | 'failed' | 'skipped';
type ComposeChannel = 'twitter' | 'linkedin' | 'instagram';
type ComposeSource = 'blog' | 'news' | 'custom';

const CHAR_LIMITS: Record<ComposeChannel, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
};

const CHANNEL_NAMES: Record<string, string> = {
  twitter: 'X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

export default function SocialDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [repostingId, setRepostingId] = useState<number | null>(null);

  // Compose state
  const [composeSource, setComposeSource] = useState<ComposeSource>('blog');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [channelPreviews, setChannelPreviews] = useState<Record<ComposeChannel, { enabled: boolean; text: string }>>({
    twitter: { enabled: true, text: '' },
    linkedin: { enabled: true, text: '' },
    instagram: { enabled: false, text: '' },
  });
  const [customText, setCustomText] = useState('');
  const [customChannel, setCustomChannel] = useState<ComposeChannel>('twitter');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const fetchContent = useCallback(async () => {
    try {
      const [blogRes, newsRes] = await Promise.all([
        fetch('/api/admin/blog/posts?status=published&limit=50'),
        fetch('/api/admin/content-hub/news'),
      ]);
      const items: ContentItem[] = [];
      if (blogRes.ok) {
        const data = await blogRes.json();
        for (const p of (data.posts || [])) {
          items.push({ ...p, source: 'blog' });
        }
      }
      if (newsRes.ok) {
        const news = await newsRes.json();
        for (const n of news) {
          if (n.published) {
            items.push({
              id: n.id,
              title: n.title,
              slug: n.id,
              excerpt: n.summary,
              featured_image: n.image,
              category: n.category,
              doctor_name: null,
              status: 'published',
              source: 'news',
            });
          }
        }
      }
      setContentItems(items);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPosts(), fetchAccounts(), fetchConnectionStatus(), fetchContent()])
      .finally(() => setLoading(false));

    const params = new URLSearchParams(window.location.search);
    if (params.get('linkedin_connected') === 'true') {
      setPostResult({ success: true, message: 'LinkedIn connected successfully!' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('linkedin_error')) {
      setPostResult({ success: false, message: `LinkedIn connection failed: ${params.get('linkedin_error')}` });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchPosts, fetchAccounts, fetchConnectionStatus, fetchContent]);

  // Generate previews when content is selected
  const handleContentSelect = async (contentId: string) => {
    setSelectedContentId(contentId);
    if (!contentId) return;

    const item = contentItems.find(c => c.id === contentId);
    if (!item) return;

    try {
      const res = await fetch('/api/admin/content-hub/sns-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          category: item.category,
          featuredImage: item.featured_image,
          doctorName: item.doctor_name,
          contentType: item.source,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChannelPreviews({
          twitter: { enabled: true, text: data.twitter || '' },
          linkedin: { enabled: true, text: data.linkedin || '' },
          instagram: { enabled: !!item.featured_image, text: data.instagram || '' },
        });
      }
    } catch {
      // ignore
    }
  };

  const handleRepost = async (id: number) => {
    setRepostingId(id);
    try {
      const res = await fetch(`/api/admin/social/${id}/repost`, { method: 'POST' });
      if (res.ok) await fetchPosts();
      else {
        const data = await res.json();
        alert(data.error || 'Repost failed');
      }
    } catch { alert('Network error'); }
    finally { setRepostingId(null); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this social post record?')) return;
    try {
      await fetch(`/api/admin/social/${id}`, { method: 'DELETE' });
      await fetchPosts();
    } catch { alert('Failed to delete'); }
  };

  const handlePostToChannels = async () => {
    const selectedItem = contentItems.find(c => c.id === selectedContentId);
    setPosting(true);
    setPostResult(null);
    const results: string[] = [];

    const channels: ComposeChannel[] = ['twitter', 'linkedin', 'instagram'];
    for (const ch of channels) {
      const preview = channelPreviews[ch];
      if (!preview.enabled || !preview.text.trim()) continue;

      try {
        const payload: Record<string, string> = { channel: ch, content: preview.text };
        if (selectedItem && selectedItem.source === 'blog') {
          payload.postId = selectedItem.id;
        }
        if (ch === 'instagram' && selectedItem?.featured_image) {
          payload.imageUrl = selectedItem.featured_image.startsWith('http')
            ? selectedItem.featured_image
            : `https://britzmedi.com${selectedItem.featured_image}`;
        }

        const res = await fetch('/api/admin/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        results.push(`${CHANNEL_NAMES[ch]}: ${data.success ? 'OK' : data.error || 'Failed'}`);
      } catch {
        results.push(`${CHANNEL_NAMES[ch]}: Network error`);
      }
    }

    setPostResult({ success: true, message: results.join(' | ') });
    setPosting(false);
    await fetchPosts();
  };

  const handleCustomPost = async () => {
    if (!customText.trim()) return;
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch('/api/admin/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: customChannel, content: customText }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPostResult({ success: true, message: `Posted to ${CHANNEL_NAMES[customChannel]}!` });
        setCustomText('');
        await fetchPosts();
      } else {
        setPostResult({ success: false, message: data.error || 'Failed' });
      }
    } catch {
      setPostResult({ success: false, message: 'Network error' });
    } finally {
      setPosting(false);
    }
  };

  const handleLinkedInDisconnect = async () => {
    if (!confirm('Disconnect LinkedIn account?')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/admin/social/linkedin/disconnect', { method: 'POST' });
      if (res.ok) { await fetchConnectionStatus(); await fetchAccounts(); }
      else alert('Failed to disconnect LinkedIn');
    } catch { alert('Network error'); }
    finally { setDisconnecting(false); }
  };

  const postedCount = counts['posted'] || 0;
  const failedCount = counts['failed'] || 0;
  const pendingCount = counts['pending'] || 0;

  const twitterStatus = channelStatuses['twitter'];
  const linkedinStatus = channelStatuses['linkedin'];
  const instagramStatus = channelStatuses['instagram'];

  const [refreshing, setRefreshing] = useState<string | null>(null);

  const handleRefreshToken = async (channel: string) => {
    setRefreshing(channel);
    try {
      const res = await fetch('/api/admin/social/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (data.success) {
        setPostResult({ success: true, message: `${CHANNEL_NAMES[channel] || channel} token refreshed!` });
        await fetchConnectionStatus();
      } else {
        setPostResult({ success: false, message: data.results?.[0]?.message || data.results?.[0]?.error || 'Refresh failed' });
      }
    } catch { setPostResult({ success: false, message: 'Network error' }); }
    finally { setRefreshing(null); }
  };

  // Auto-refresh expiring tokens on load
  useEffect(() => {
    if (Object.keys(channelStatuses).length === 0) return;
    const hasExpiring = Object.values(channelStatuses).some(
      s => s.connected && s.status === 'expiring'
    );
    if (hasExpiring) {
      fetch('/api/admin/social/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'auto' }),
      }).then(res => res.json()).then(data => {
        const refreshed = data.results?.filter((r: any) => r.success && r.message?.includes('refreshed'));
        if (refreshed?.length > 0) {
          fetchConnectionStatus();
        }
      }).catch(() => {});
    }
  }, [channelStatuses]);

  const getStatusConfig = (status?: ChannelStatus['status']) => {
    switch (status) {
      case 'healthy':
        return { dot: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Connected' };
      case 'expiring':
        return { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'Expiring' };
      case 'expired':
        return { dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Expired' };
      default:
        return { dot: 'bg-slate-300', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-500', label: 'Disconnected' };
    }
  };

  const renderChannelAction = (channel: string, status: ChannelStatus | undefined) => {
    const st = status?.status;
    if (channel === 'twitter') {
      if (!status?.connected) return <span className="text-[10px] text-slate-400">Set env vars to connect</span>;
      return null;
    }
    if (channel === 'linkedin') {
      if (st === 'healthy') {
        return (
          <button onClick={handleLinkedInDisconnect} disabled={disconnecting} className="text-[10px] text-red-500 hover:text-red-700 font-medium">
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        );
      }
      return (
        <a href="/api/admin/social/linkedin/authorize" className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
          {st === 'expired' || st === 'expiring' ? 'Reconnect' : 'Connect'}
        </a>
      );
    }
    if (channel === 'instagram') {
      if (st === 'expiring') {
        return (
          <button onClick={() => handleRefreshToken('instagram')} disabled={refreshing === 'instagram'} className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors">
            {refreshing === 'instagram' ? 'Refreshing...' : 'Refresh Token'}
          </button>
        );
      }
      if (st === 'expired' || !status?.connected) {
        return <span className="text-[10px] text-slate-400">Re-auth required (env var)</span>;
      }
      return null;
    }
    return null;
  };

  const filteredContent = contentItems.filter(c => {
    if (composeSource === 'blog') return c.source === 'blog';
    if (composeSource === 'news') return c.source === 'news';
    return false;
  });

  const customCharCount = customText.length;
  const customCharLimit = CHAR_LIMITS[customChannel];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Social Media</h1>
        <p className="text-sm text-slate-500 mt-1">Auto-posting, compose, and social media management</p>
      </div>

      {/* Notification */}
      {postResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          postResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {postResult.message}
          <button onClick={() => setPostResult(null)} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Connection Status Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['twitter', 'linkedin', 'instagram'] as const).map(ch => {
          const st = channelStatuses[ch];
          const cfg = getStatusConfig(st?.status);
          return (
            <div key={ch} className={`rounded-xl border p-4 ${cfg.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ChannelIcon channel={ch} className="w-5 h-5" />
                  <span className="text-sm font-semibold text-slate-900">{CHANNEL_NAMES[ch]}</span>
                </div>
                {statusLoading ? (
                  <span className="text-[10px] text-slate-400 animate-pulse">Checking...</span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
                    <span className={`w-2 h-2 ${cfg.dot} rounded-full ${st?.status === 'expiring' ? 'animate-pulse' : ''}`} />
                    {cfg.label}
                  </span>
                )}
              </div>
              {!statusLoading && (
                <div className="space-y-1.5">
                  {st?.account && (
                    <p className="text-xs text-slate-600">{st.account}</p>
                  )}
                  {st?.expires_in_days != null && (
                    <p className={`text-[11px] ${(st.expires_in_days ?? 0) < 7 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                      Token expires in {st.expires_in_days} day{st.expires_in_days !== 1 ? 's' : ''}
                    </p>
                  )}
                  {ch === 'twitter' && st?.connected && (
                    <p className="text-[11px] text-slate-400">Static tokens (no expiry)</p>
                  )}
                  {st?.error && !st.connected && (
                    <p className="text-[11px] text-red-500">{st.error}</p>
                  )}
                  <div className="pt-1">
                    {renderChannelAction(ch, st)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Refresh All Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchConnectionStatus}
          disabled={statusLoading}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <svg className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {statusLoading ? 'Checking...' : 'Refresh Status'}
        </button>
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
        {([
          { value: 'overview' as Tab, label: 'Overview' },
          { value: 'compose' as Tab, label: 'Compose' },
          { value: 'history' as Tab, label: 'History' },
          { value: 'accounts' as Tab, label: 'Accounts' },
        ]).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200">
        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-semibold text-slate-900">Platform Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['twitter', 'linkedin', 'instagram'] as const).map(ch => {
                const st = channelStatuses[ch];
                const cfg = getStatusConfig(st?.status);
                const chPosts = posts.filter(p => p.channel === ch);
                const posted = chPosts.filter(p => p.status === 'posted').length;
                const failed = chPosts.filter(p => p.status === 'failed').length;
                const last = chPosts.find(p => p.status === 'posted');
                return (
                  <div key={ch} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ChannelIcon channel={ch} className="w-5 h-5" />
                        <span className="text-sm font-semibold text-slate-900">{CHANNEL_NAMES[ch]}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 ${cfg.dot} rounded-full`} />
                        {cfg.label}
                      </span>
                    </div>
                    {st?.account && (
                      <p className="text-[11px] text-slate-500 mb-2">{st.account}</p>
                    )}
                    {st?.expires_in_days != null && (
                      <p className={`text-[10px] mb-2 ${(st.expires_in_days ?? 0) < 7 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                        Expires in {st.expires_in_days}d
                      </p>
                    )}
                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Posted</span>
                        <span className="font-medium text-green-700">{posted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed</span>
                        <span className="font-medium text-red-600">{failed}</span>
                      </div>
                      {last && (
                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <span className="text-[10px] text-slate-400">Last post:</span>
                          <p className="text-slate-600 truncate mt-0.5">{last.content.slice(0, 60)}...</p>
                        </div>
                      )}
                      {!st?.connected && (
                        <div className="pt-2 border-t border-slate-100 mt-2">
                          {renderChannelAction(ch, st)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent posts */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Posts</h3>
              <SocialPostList
                posts={posts.slice(0, 5)}
                onRepost={handleRepost}
                onDelete={handleDelete}
                repostingId={repostingId}
              />
            </div>
          </div>
        )}

        {/* Compose Tab */}
        {tab === 'compose' && (
          <div className="p-6 space-y-6">
            {/* Source selection */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Source</h3>
              <div className="flex gap-2 mb-4">
                {([
                  { value: 'blog' as ComposeSource, label: 'Blog Post' },
                  { value: 'news' as ComposeSource, label: 'News Item' },
                  { value: 'custom' as ComposeSource, label: 'Custom' },
                ]).map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setComposeSource(s.value); setSelectedContentId(''); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      composeSource === s.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Content selection (blog/news) */}
              {composeSource !== 'custom' && (
                <div className="mb-4">
                  <select
                    value={selectedContentId}
                    onChange={e => handleContentSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select {composeSource === 'blog' ? 'a blog post' : 'a news item'}...</option>
                    {filteredContent.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi-platform previews */}
              {composeSource !== 'custom' && selectedContentId && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-slate-700">Platform Previews</h4>
                  {(['twitter', 'linkedin', 'instagram'] as const).map(ch => {
                    const preview = channelPreviews[ch];
                    const limit = CHAR_LIMITS[ch];
                    const count = preview.text.length;
                    const isOver = count > limit;
                    return (
                      <div key={ch} className={`border rounded-lg overflow-hidden ${preview.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <ChannelIcon channel={ch} className="w-4 h-4" />
                            <span className="text-xs font-medium text-slate-700">{CHANNEL_NAMES[ch]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${isOver ? 'text-red-500' : 'text-slate-400'}`}>{count}/{limit}</span>
                            <button
                              onClick={() => setChannelPreviews(prev => ({ ...prev, [ch]: { ...prev[ch], enabled: !prev[ch].enabled } }))}
                              className={`w-8 h-4 rounded-full transition-colors relative ${preview.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${preview.enabled ? 'left-4' : 'left-0.5'}`} />
                            </button>
                          </div>
                        </div>
                        {preview.enabled && (
                          <div className="p-3">
                            <textarea
                              value={preview.text}
                              onChange={e => setChannelPreviews(prev => ({ ...prev, [ch]: { ...prev[ch], text: e.target.value } }))}
                              rows={ch === 'twitter' ? 3 : 5}
                              className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handlePostToChannels}
                    disabled={posting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {posting ? 'Posting...' : 'Post Now'}
                  </button>
                </div>
              )}

              {/* Custom post */}
              {composeSource === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
                    <select
                      value={customChannel}
                      onChange={e => setCustomChannel(e.target.value as ComposeChannel)}
                      className="w-full max-w-xs px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="twitter">X</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
                    <textarea
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs ${customCharCount > customCharLimit ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        {customCharCount}/{customCharLimit}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCustomPost}
                    disabled={posting || !customText.trim() || customCharCount > customCharLimit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ChannelIcon channel={customChannel} className="w-4 h-4" />
                    {posting ? 'Posting...' : `Post to ${CHANNEL_NAMES[customChannel]}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div>
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
              <div className="flex gap-1 flex-wrap">
                {([
                  { value: 'all' as ChannelFilter, label: 'All Channels' },
                  { value: 'twitter' as ChannelFilter, label: 'X' },
                  { value: 'linkedin' as ChannelFilter, label: 'LinkedIn' },
                  { value: 'instagram' as ChannelFilter, label: 'Instagram' },
                ]).map(f => (
                  <button
                    key={f.value}
                    onClick={() => setChannelFilter(f.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      channelFilter === f.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.value !== 'all' && <ChannelIcon channel={f.value} className="w-3 h-3" />}
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="flex gap-1">
                {([
                  { value: 'all' as StatusFilter, label: 'All', count: total },
                  { value: 'posted' as StatusFilter, label: 'Posted', count: postedCount },
                  { value: 'failed' as StatusFilter, label: 'Failed', count: failedCount },
                  { value: 'pending' as StatusFilter, label: 'Pending', count: pendingCount },
                ]).map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      statusFilter === f.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                    {f.count > 0 && <span className="ml-1 opacity-75">({f.count})</span>}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : (
              <SocialPostList posts={posts} onRepost={handleRepost} onDelete={handleDelete} repostingId={repostingId} />
            )}
          </div>
        )}

        {/* Accounts Tab */}
        {tab === 'accounts' && (
          <div className="p-6">
            <AccountsPanel accounts={accounts} onRefresh={fetchAccounts} />
          </div>
        )}
      </div>
    </div>
  );
}
