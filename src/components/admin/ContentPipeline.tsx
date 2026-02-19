import { useState, useEffect, useCallback } from 'react';

// ---------- Types ----------

interface QueueItem {
  id: number;
  keyword: string;
  search_intent: string | null;
  priority: number;
  target_word_count: number;
  status: string;
  retry_count: number;
  content_id: number | null;
  research_data: string | null;
  analysis_data: string | null;
  scheduled_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface PipelineLog {
  id: number;
  content_id: number | null;
  queue_id: number | null;
  action: string;
  details: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  published: number;
  manual_review: number;
  failed: number;
  auto_publish_rate: string;
  avg_score: number;
  avg_retries: string;
}

// ---------- Helpers ----------

const API_BASE = '/api/admin/content-pipeline';

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    },
  });
  return res;
}

function formatDate(d: string | null): string {
  if (!d) return '-';
  const date = new Date(d.endsWith('Z') ? d : d + 'Z');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getScoreFromAnalysis(analysisData: string | null): number | null {
  if (!analysisData) return null;
  try {
    const data = JSON.parse(analysisData);
    return data.overall_score ?? null;
  } catch {
    return null;
  }
}

// ---------- Status Badge ----------

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
    queued: { bg: '#f1f5f9', text: '#64748b', label: 'Queued' },
    researching: { bg: '#dbeafe', text: '#1d4ed8', label: 'Researching', pulse: true },
    generating: { bg: '#dbeafe', text: '#1d4ed8', label: 'Generating', pulse: true },
    analyzing: { bg: '#dbeafe', text: '#1d4ed8', label: 'Analyzing', pulse: true },
    rewriting: { bg: '#dbeafe', text: '#1d4ed8', label: 'Rewriting', pulse: true },
    processing: { bg: '#dbeafe', text: '#1d4ed8', label: 'Processing', pulse: true },
    published: { bg: '#dcfce7', text: '#166534', label: 'Published' },
    auto_publish: { bg: '#dcfce7', text: '#166534', label: 'Published' },
    manual_review: { bg: '#fef9c3', text: '#854d0e', label: 'Review' },
    auto_rewrite: { bg: '#fef9c3', text: '#854d0e', label: 'Rewriting' },
    failed: { bg: '#fee2e2', text: '#991b1b', label: 'Failed' },
    error: { bg: '#fee2e2', text: '#991b1b', label: 'Error' },
  };

  const c = config[status] || { bg: '#f1f5f9', text: '#64748b', label: status };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        whiteSpace: 'nowrap',
      }}
    >
      {c.pulse && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: c.text,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      {c.label}
    </span>
  );
}

// ---------- KPI Card ----------

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

// ---------- Main Component ----------

export default function ContentPipeline() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Record<number, PipelineLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<number, boolean>>({});
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [processAllRunning, setProcessAllRunning] = useState(false);
  const [processAllProgress, setProcessAllProgress] = useState({ current: 0, total: 0 });

  // Single keyword form
  const [keyword, setKeyword] = useState('');
  const [intent, setIntent] = useState('informational');
  const [priority, setPriority] = useState(5);

  // Batch form
  const [batchText, setBatchText] = useState('');
  const [batchIntent, setBatchIntent] = useState('informational');
  const [batchPriority, setBatchPriority] = useState(5);

  // ---------- Data fetching ----------

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch('/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await apiFetch('/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (e) {
      console.error('Failed to fetch queue:', e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchQueue()]);
  }, [fetchStats, fetchQueue]);

  useEffect(() => {
    setLoading(true);
    refreshAll().finally(() => setLoading(false));
  }, [refreshAll]);

  // ---------- Add keyword ----------

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    try {
      const res = await apiFetch('/queue', {
        method: 'POST',
        body: JSON.stringify({
          keyword: keyword.trim(),
          search_intent: intent,
          priority,
        }),
      });
      if (res.ok) {
        setKeyword('');
        await refreshAll();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add keyword');
      }
    } catch (e) {
      console.error('Add keyword error:', e);
      alert('Failed to add keyword');
    }
  };

  // ---------- Batch add ----------

  const handleBatchAdd = async () => {
    const lines = batchText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('Enter at least one keyword (one per line)');
      return;
    }

    try {
      const keywords = lines.map((line) => ({
        keyword: line,
        search_intent: batchIntent,
        priority: batchPriority,
      }));

      const res = await apiFetch('/batch', {
        method: 'POST',
        body: JSON.stringify({ keywords }),
      });

      if (res.ok) {
        const data = await res.json();
        setBatchText('');
        alert(`Added ${data.queued} keyword(s) to queue`);
        await refreshAll();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to batch add');
      }
    } catch (e) {
      console.error('Batch add error:', e);
      alert('Failed to batch add');
    }
  };

  // ---------- Process single ----------

  const handleProcess = async (id: number) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const res = await apiFetch(`/process/${id}`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Processing failed');
      }
      await refreshAll();
    } catch (e) {
      console.error('Process error:', e);
      alert('Processing failed');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ---------- Process All ----------

  const handleProcessAll = async () => {
    const queuedItems = queue.filter((item) => item.status === 'queued');
    if (queuedItems.length === 0) {
      alert('No queued items to process');
      return;
    }

    setProcessAllRunning(true);
    setProcessAllProgress({ current: 0, total: queuedItems.length });

    for (let i = 0; i < queuedItems.length; i++) {
      setProcessAllProgress({ current: i + 1, total: queuedItems.length });
      setProcessingIds((prev) => new Set(prev).add(queuedItems[i].id));

      try {
        await apiFetch(`/process/${queuedItems[i].id}`, { method: 'POST' });
      } catch (e) {
        console.error(`Process item ${queuedItems[i].id} failed:`, e);
      }

      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(queuedItems[i].id);
        return next;
      });

      // Refresh queue state after each item so the UI updates
      await fetchQueue();
    }

    await refreshAll();
    setProcessAllRunning(false);
    setProcessAllProgress({ current: 0, total: 0 });
  };

  // ---------- Delete ----------

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this queue item?')) return;

    try {
      const res = await apiFetch(`/queue/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to delete');
      }
      await refreshAll();
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete');
    }
  };

  // ---------- Toggle logs ----------

  const toggleLogs = async (id: number) => {
    if (expandedLogs[id]) {
      setExpandedLogs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setLoadingLogs((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await apiFetch(`/logs?queue_id=${id}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setExpandedLogs((prev) => ({ ...prev, [id]: data }));
      }
    } catch (e) {
      console.error('Fetch logs error:', e);
    } finally {
      setLoadingLogs((prev) => ({ ...prev, [id]: false }));
    }
  };

  // ---------- Derived ----------

  const queuedCount = queue.filter((i) => i.status === 'queued').length;
  const processingCount = queue.filter((i) =>
    ['researching', 'generating', 'analyzing', 'rewriting', 'processing'].includes(i.status)
  ).length;
  const publishedCount = stats?.published ?? 0;
  const reviewCount = stats?.manual_review ?? 0;
  const failedCount = stats?.failed ?? 0;
  const avgScore = stats?.avg_score ?? 0;

  // ---------- Render ----------

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        Loading pipeline data...
      </div>
    );
  }

  return (
    <div>
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <KpiCard label="Queued" value={queuedCount} color="#64748b" />
        <KpiCard label="Processing" value={processingCount} color="#2563eb" />
        <KpiCard label="Published" value={publishedCount} color="#16a34a" />
        <KpiCard label="Review" value={reviewCount} color="#ca8a04" />
        <KpiCard label="Failed" value={failedCount} color="#dc2626" />
        <KpiCard label="Avg Score" value={avgScore} color="#7c3aed" />
      </div>

      {/* Add Keyword Forms */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Single Keyword */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#0f172a',
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            Add Single Keyword
          </h3>
          <form onSubmit={handleAddKeyword}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter keyword..."
                style={{
                  flex: '1 1 200px',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="informational">Informational</option>
                <option value="commercial">Commercial</option>
                <option value="transactional">Transactional</option>
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  background: '#fff',
                  cursor: 'pointer',
                  width: 70,
                }}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    P{n}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!keyword.trim()}
                style={{
                  padding: '8px 20px',
                  background: keyword.trim() ? '#2563eb' : '#94a3b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: keyword.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Batch Add */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#0f172a',
              marginTop: 0,
              marginBottom: 12,
            }}
          >
            Batch Add Keywords
          </h3>
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="One keyword per line..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={batchIntent}
              onChange={(e) => setBatchIntent(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
            </select>
            <select
              value={batchPriority}
              onChange={(e) => setBatchPriority(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 14,
                background: '#fff',
                cursor: 'pointer',
                width: 70,
              }}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  P{n}
                </option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {batchText.split('\n').filter((l) => l.trim()).length} keyword(s)
            </span>
            <button
              type="button"
              onClick={handleBatchAdd}
              disabled={!batchText.trim()}
              style={{
                padding: '8px 20px',
                background: batchText.trim() ? '#2563eb' : '#94a3b8',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: batchText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Batch Add
            </button>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Table header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Queue ({queue.length})
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {processAllRunning && (
              <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>
                Processing {processAllProgress.current}/{processAllProgress.total}...
              </span>
            )}
            <button
              onClick={handleProcessAll}
              disabled={processAllRunning || queuedCount === 0}
              style={{
                padding: '6px 16px',
                background:
                  processAllRunning || queuedCount === 0 ? '#94a3b8' : '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor:
                  processAllRunning || queuedCount === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {processAllRunning ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Process All ({queuedCount})
                </>
              )}
            </button>
            <button
              onClick={refreshAll}
              style={{
                padding: '6px 12px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Spin animation */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        {queue.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
            <svg
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>No items in queue</p>
            <p style={{ fontSize: 13 }}>Add keywords above to start generating content.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th
                    style={{
                      padding: '10px 16px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: 12,
                      width: 40,
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: 12,
                    }}
                  >
                    Keyword
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: 12,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  >
                    Score
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  >
                    Content
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: 12,
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: 12,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => {
                  const score = getScoreFromAnalysis(item.analysis_data);
                  const isProcessing = processingIds.has(item.id);
                  const isActiveStatus = [
                    'researching',
                    'generating',
                    'analyzing',
                    'rewriting',
                    'processing',
                  ].includes(item.status);
                  const logsExpanded = !!expandedLogs[item.id];

                  return (
                    <QueueRow
                      key={item.id}
                      item={item}
                      score={score}
                      isProcessing={isProcessing}
                      isActiveStatus={isActiveStatus}
                      logsExpanded={logsExpanded}
                      logs={expandedLogs[item.id] || []}
                      loadingLogs={!!loadingLogs[item.id]}
                      onProcess={() => handleProcess(item.id)}
                      onDelete={() => handleDelete(item.id)}
                      onToggleLogs={() => toggleLogs(item.id)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Queue Row ----------

function QueueRow({
  item,
  score,
  isProcessing,
  isActiveStatus,
  logsExpanded,
  logs,
  loadingLogs,
  onProcess,
  onDelete,
  onToggleLogs,
}: {
  item: QueueItem;
  score: number | null;
  isProcessing: boolean;
  isActiveStatus: boolean;
  logsExpanded: boolean;
  logs: PipelineLog[];
  loadingLogs: boolean;
  onProcess: () => void;
  onDelete: () => void;
  onToggleLogs: () => void;
}) {
  const canProcess = item.status === 'queued' && !isProcessing;
  const canRetry =
    ['failed', 'error', 'manual_review'].includes(item.status) && !isProcessing;
  const isPublished = ['published', 'auto_publish'].includes(item.status);

  return (
    <>
      <tr
        style={{
          borderBottom: logsExpanded ? 'none' : '1px solid #f1f5f9',
          background: isProcessing ? '#f0f9ff' : undefined,
        }}
      >
        {/* # */}
        <td style={{ padding: '10px 16px', color: '#94a3b8', fontSize: 13 }}>{item.id}</td>

        {/* Keyword */}
        <td style={{ padding: '10px 12px' }}>
          <div style={{ fontWeight: 500, color: '#0f172a' }}>{item.keyword}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            {item.search_intent || 'informational'} &middot; P{item.priority}
            {item.retry_count > 0 && (
              <span style={{ marginLeft: 6, color: '#f59e0b' }}>
                retry: {item.retry_count}
              </span>
            )}
          </div>
          {item.error_message && (
            <div
              style={{
                fontSize: 12,
                color: '#dc2626',
                marginTop: 4,
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={item.error_message}
            >
              {item.error_message}
            </div>
          )}
        </td>

        {/* Status */}
        <td style={{ padding: '10px 12px' }}>
          <StatusBadge status={item.status} />
        </td>

        {/* Score */}
        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
          {score !== null ? (
            <span
              style={{
                fontWeight: 600,
                fontSize: 14,
                color:
                  score >= 85 ? '#16a34a' : score >= 70 ? '#ca8a04' : '#dc2626',
              }}
            >
              {score}
            </span>
          ) : (
            <span style={{ color: '#cbd5e1' }}>-</span>
          )}
        </td>

        {/* Content */}
        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
          {item.content_id ? (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 500,
                background: '#dbeafe',
                color: '#1d4ed8',
              }}
            >
              #{item.content_id}
            </span>
          ) : (
            <span style={{ color: '#cbd5e1' }}>-</span>
          )}
        </td>

        {/* Created */}
        <td
          style={{
            padding: '10px 12px',
            color: '#64748b',
            fontSize: 13,
            whiteSpace: 'nowrap',
          }}
        >
          {formatDate(item.created_at)}
        </td>

        {/* Actions */}
        <td style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {/* Process / Retry */}
            {(canProcess || canRetry) && (
              <button
                onClick={onProcess}
                disabled={isProcessing}
                title={canRetry ? 'Retry' : 'Process'}
                style={{
                  padding: '4px 10px',
                  background: isProcessing ? '#94a3b8' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {isProcessing ? (
                  <>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    Running
                  </>
                ) : canRetry ? (
                  'Retry'
                ) : (
                  'Process'
                )}
              </button>
            )}

            {/* View (for published) */}
            {isPublished && item.content_id && (
              <a
                href={`/admin/content-hub?edit=${item.content_id}`}
                style={{
                  padding: '4px 10px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                View
              </a>
            )}

            {/* Logs toggle */}
            <button
              onClick={onToggleLogs}
              title="Toggle logs"
              style={{
                padding: '4px 10px',
                background: logsExpanded ? '#e2e8f0' : '#f8fafc',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Logs
            </button>

            {/* Delete */}
            {!isActiveStatus && (
              <button
                onClick={onDelete}
                title="Delete"
                style={{
                  padding: '4px 8px',
                  background: 'none',
                  color: '#94a3b8',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Logs */}
      {logsExpanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0, borderBottom: '1px solid #f1f5f9' }}>
            <div
              style={{
                background: '#f8fafc',
                padding: '12px 16px 12px 56px',
                borderTop: '1px solid #e2e8f0',
              }}
            >
              {loadingLogs ? (
                <div style={{ color: '#94a3b8', fontSize: 13, padding: 8 }}>
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13, padding: 8 }}>
                  No logs yet
                </div>
              ) : (
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '6px 0',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color: '#94a3b8',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          minWidth: 120,
                        }}
                      >
                        {formatDate(log.created_at)}
                      </span>
                      <span
                        style={{
                          padding: '1px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#e2e8f0',
                          color: '#475569',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.action}
                      </span>
                      <span
                        style={{
                          color: '#475569',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={log.details || ''}
                      >
                        {log.details || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
