import { useState, useEffect, useCallback } from 'react';

interface Conversation {
  id: number;
  session_id: string;
  visitor_ip: string | null;
  visitor_country: string | null;
  visitor_language: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  lead_converted: number;
  status: string;
  preview: string | null;
}

interface ChatMessage {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  tokens_used: number;
  created_at: string;
}

interface Stats {
  total: number;
  today: number;
  avgMessages: number;
  leadConverted: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ChatAdmin() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, avgMessages: 0, leadConverted: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchConversations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/chat/conversations?${params}`);
      const data = await res.json();
      setConversations(data.conversations || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const openConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/${conv.id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    const date = new Date(d + 'Z');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const convRate = stats.total > 0 ? ((stats.leadConverted / stats.total) * 100).toFixed(1) : '0';

  // Detail view
  if (selectedConv) {
    return (
      <div style={{ padding: '0 24px 24px' }}>
        <button
          onClick={() => { setSelectedConv(null); setMessages([]); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 0', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 16 }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to list
        </button>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <InfoBadge label="Session" value={selectedConv.session_id.slice(0, 20) + '...'} />
          <InfoBadge label="IP" value={selectedConv.visitor_ip || '-'} />
          <InfoBadge label="Country" value={selectedConv.visitor_country || '-'} />
          <InfoBadge label="Language" value={selectedConv.visitor_language || '-'} />
          <InfoBadge label="Messages" value={String(selectedConv.message_count)} />
          <InfoBadge label="Started" value={formatDate(selectedConv.started_at)} />
          {selectedConv.lead_converted ? (
            <span style={{ padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600, background: '#dcfce7', color: '#166534' }}>Lead Converted</span>
          ) : null}
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, maxHeight: 600, overflowY: 'auto' }}>
          {messagesLoading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>No messages</p>
          ) : messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: 14,
                lineHeight: 1.5,
                background: msg.role === 'user' ? '#2563eb' : '#e2e8f0',
                color: msg.role === 'user' ? '#fff' : '#1e293b',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
              }}>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                  {formatDate(msg.created_at)}
                  {msg.tokens_used > 0 && ` · ${msg.tokens_used} tokens`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Conversations" value={String(stats.total)} color="#3b82f6" />
        <StatCard label="Today" value={String(stats.today)} color="#8b5cf6" />
        <StatCard label="Avg Messages" value={String(stats.avgMessages)} color="#f59e0b" />
        <StatCard label="Lead Conversion" value={`${convRate}%`} sub={`${stats.leadConverted} converted`} color="#10b981" />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search messages..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
        />
        <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Clear</button>
        )}
      </form>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading conversations...</p>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 60 }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <p style={{ fontWeight: 500, marginBottom: 4 }}>No conversations yet</p>
          <p style={{ fontSize: 13 }}>Chat conversations will appear here once visitors use the chatbot.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: '#64748b' }}>Date</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: '#64748b' }}>IP / Country</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: '#64748b' }}>Messages</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: '#64748b' }}>Preview</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, color: '#64748b' }}>Lead</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map(conv => (
                  <tr
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {formatDate(conv.started_at)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13 }}>{conv.visitor_ip || '-'}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{conv.visitor_country || ''} {conv.visitor_language ? `· ${conv.visitor_language}` : ''}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 500, background: '#f1f5f9', color: '#475569' }}>{conv.message_count}</span>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b', fontSize: 13 }}>
                      {conv.preview || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {conv.lead_converted ? (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} title="Converted" />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchConversations(pagination.page - 1)}
                style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >Prev</button>
              <span style={{ padding: '6px 12px', fontSize: 14, color: '#64748b' }}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchConversations(pagination.page + 1)}
                style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, background: '#f1f5f9', color: '#475569' }}>
      <span style={{ fontWeight: 600 }}>{label}:</span> {value}
    </span>
  );
}
