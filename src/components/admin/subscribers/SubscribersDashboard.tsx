import { useState, useEffect, useCallback } from 'react';

interface Subscriber {
  id: number;
  email: string;
  name: string | null;
  language: string;
  categories: string;
  status: string;
  subscribed_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

interface Stats {
  total: number;
  active: number;
  pending: number;
  unsubscribed: number;
}

type StatusFilter = 'all' | 'active' | 'pending' | 'unsubscribed';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', ko: 'Korean', zh: 'Chinese', ja: 'Japanese',
  es: 'Spanish', 'pt-br': 'Portuguese', de: 'German', ar: 'Arabic',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function parseCategories(cats: string): string[] {
  try {
    return JSON.parse(cats || '[]');
  } catch {
    return [];
  }
}

export default function SubscribersDashboard() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/subscribers/list?${params}`);
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setStats(data.stats || { total: 0, active: 0, pending: 0, unsubscribed: 0 });
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/subscribers/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700' },
    { label: 'Active', value: stats.active, color: 'bg-green-100 text-green-700' },
    { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-700' },
    { label: 'Unsubscribed', value: stats.unsubscribed, color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscribers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage email subscribers and notifications</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
          {(['all', 'active', 'pending', 'unsubscribed'] as StatusFilter[]).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-slate-500 text-sm">No subscribers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Language</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Categories</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(sub => {
                  const cats = parseCategories(sub.categories);
                  return (
                    <tr key={sub.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{sub.email}</td>
                      <td className="px-4 py-3 text-slate-600">{sub.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {LANGUAGE_LABELS[sub.language] || sub.language}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cats.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cats.map(c => (
                              <span key={c} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">All</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(sub.subscribed_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    unsubscribed: { bg: 'bg-red-100', text: 'text-red-700' },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}
