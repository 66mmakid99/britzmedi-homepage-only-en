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

type Tab = 'posts' | 'accounts';
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

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPosts(), fetchAccounts()]).finally(() => setLoading(false));
  }, [fetchPosts, fetchAccounts]);

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

  const postedCount = counts['posted'] || 0;
  const failedCount = counts['failed'] || 0;
  const pendingCount = counts['pending'] || 0;

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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Social Media</h1>
        <p className="text-sm text-slate-500 mt-1">Auto-posting and social media management</p>
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
        ) : (
          <div className="p-6">
            <AccountsPanel accounts={accounts} onRefresh={fetchAccounts} />
          </div>
        )}
      </div>
    </div>
  );
}
