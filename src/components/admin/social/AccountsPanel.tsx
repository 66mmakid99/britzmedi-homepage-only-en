import { useState } from 'react';
import { ChannelIcon } from './ChannelIcon';

interface SocialAccount {
  id: number;
  channel: string;
  account_name: string;
  account_id: string | null;
  enabled: number;
  auto_post: number;
}

interface AccountsPanelProps {
  accounts: SocialAccount[];
  onRefresh: () => void;
}

const CHANNELS = [
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
];

export function AccountsPanel({ accounts, onRefresh }: AccountsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [channel, setChannel] = useState('twitter');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!accountName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/social/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, account_name: accountName.trim() }),
      });
      if (res.ok) {
        setAccountName('');
        setShowForm(false);
        onRefresh();
      }
    } catch {
      alert('Failed to add account');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number, field: 'enabled' | 'auto_post', current: number) => {
    try {
      await fetch(`/api/admin/social/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: current ? false : true }),
      });
      onRefresh();
    } catch {
      alert('Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this social account?')) return;
    try {
      await fetch(`/api/admin/social/accounts/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch {
      alert('Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Manage connected social media accounts. Enabled accounts with auto-post will automatically share new blog posts.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          {showForm ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Platform</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CHANNELS.map((ch) => (
                <option key={ch.value} value={ch.value}>{ch.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="@britzmedi"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !accountName.trim()}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="mb-2">No social accounts configured</p>
          <p className="text-xs">Add accounts to enable auto-posting when blog posts are published.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
              <div className={`flex-shrink-0 ${account.channel === 'twitter' ? 'text-slate-900' : account.channel === 'linkedin' ? 'text-blue-700' : 'text-blue-600'}`}>
                <ChannelIcon channel={account.channel} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">{account.account_name}</p>
                <p className="text-xs text-slate-500 capitalize">{account.channel === 'twitter' ? 'Twitter / X' : account.channel}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!account.enabled}
                    onChange={() => handleToggle(account.id, 'enabled', account.enabled)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600">Enabled</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!account.auto_post}
                    onChange={() => handleToggle(account.id, 'auto_post', account.auto_post)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600">Auto-post</span>
                </label>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
