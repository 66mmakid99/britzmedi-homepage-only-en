import { useState, useEffect, useCallback } from 'react';

interface AEOResult {
  id: number;
  query: string;
  ai_engine: string;
  response_text: string;
  mentioned: number;
  mention_context: string | null;
  source_urls: string | null;
  checked_at: string;
  previous_mentioned: number | null;
}

interface AEOData {
  total: number;
  mentioned: number;
  rate: number;
  results: AEOResult[];
}

export default function AEOMonitor() {
  const [data, setData] = useState<AEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<Record<string, string>>({});

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/aeo-check');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch AEO results:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const runCheck = async () => {
    if (running) return;
    if (!window.confirm(
      'This will query Claude AI with web search for 10 queries.\n\n' +
      'Estimated time: 2-3 minutes.\n' +
      'Estimated cost: ~$0.50 in API credits.\n\n' +
      'Continue?'
    )) return;

    setRunning(true);
    setProgress(0);

    // Simulate progress since API processes all at once
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8;
      });
    }, 2000);

    try {
      const res = await fetch('/api/admin/aeo-check', { method: 'POST' });
      if (res.ok) {
        setProgress(100);
        await fetchResults();
      } else {
        const err = await res.json();
        alert('AEO check failed: ' + (err.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('AEO check failed: ' + e.message);
    } finally {
      clearInterval(progressInterval);
      setRunning(false);
      setProgress(0);
    }
  };

  const addToPipeline = async (query: string) => {
    setPipelineStatus(prev => ({ ...prev, [query]: 'adding' }));
    try {
      const res = await fetch('/api/admin/content-pipeline/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: query,
          search_intent: 'informational',
          priority: 1,
        }),
      });
      if (res.ok) {
        setPipelineStatus(prev => ({ ...prev, [query]: 'added' }));
      } else {
        setPipelineStatus(prev => ({ ...prev, [query]: 'error' }));
      }
    } catch {
      setPipelineStatus(prev => ({ ...prev, [query]: 'error' }));
    }
  };

  const getTrend = (r: AEOResult) => {
    if (r.previous_mentioned === null) return 'new';
    if (r.mentioned && !r.previous_mentioned) return 'up';
    if (!r.mentioned && r.previous_mentioned) return 'down';
    return 'same';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const mentionedCount = data?.mentioned ?? 0;
  const totalCount = data?.total ?? 0;
  const rate = data?.rate ?? 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
        {/* Mention Rate Card */}
        <div style={{
          flex: '1 1 280px',
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: rate > 0
              ? `conic-gradient(${rate >= 50 ? '#22c55e' : rate >= 20 ? '#eab308' : '#ef4444'} ${rate * 3.6}deg, #f1f5f9 0deg)`
              : '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: rate >= 50 ? '#22c55e' : rate >= 20 ? '#eab308' : rate > 0 ? '#ef4444' : '#94a3b8',
            }}>
              {loading ? '-' : `${rate}%`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
              AI Mention Rate
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {loading ? 'Loading...' : `${mentionedCount} of ${totalCount} queries mention BRITZMEDI`}
            </div>
            {data && data.results.length > 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Last checked: {formatDate(data.results[0]?.checked_at)}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          flex: '1 1 280px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Mentioned</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
              {loading ? '-' : mentionedCount}
            </div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Not Mentioned</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
              {loading ? '-' : totalCount - mentionedCount}
            </div>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #e2e8f0',
            gridColumn: '1 / -1',
          }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Target Goal</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1,
                height: 8,
                background: '#f1f5f9',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(rate, 100)}%`,
                  height: '100%',
                  background: rate >= 50 ? '#22c55e' : rate >= 20 ? '#eab308' : '#ef4444',
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                {loading ? '-' : `${rate}%`} / 50%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Run Check Button */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #e2e8f0',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={runCheck}
          disabled={running}
          style={{
            padding: '10px 24px',
            background: running ? '#94a3b8' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: running ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.15s',
          }}
          onMouseOver={(e) => { if (!running) (e.target as HTMLElement).style.background = '#1d4ed8'; }}
          onMouseOut={(e) => { if (!running) (e.target as HTMLElement).style.background = '#2563eb'; }}
        >
          {running ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
              </svg>
              Running AEO Check...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Run AEO Check
            </>
          )}
        </button>

        {running && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Querying AI engines...</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{Math.round(progress)}%</span>
            </div>
            <div style={{
              height: 6,
              background: '#f1f5f9',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: '#2563eb',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              10 queries with web search -- estimated 2-3 minutes
            </div>
          </div>
        )}

        {!running && (
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Queries Claude with web search to check if BRITZMEDI/TORR RF appears in AI responses.
            Each run costs ~$0.50 in API credits.
          </div>
        )}
      </div>

      {/* Results Table */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Query Results
          </h2>
          {data && data.results.length > 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {data.total} queries tracked
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Loading results...
          </div>
        ) : !data || data.results.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
              No AEO checks yet
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Click "Run AEO Check" to start monitoring AI mentions of BRITZMEDI.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', width: 90 }}>Mentioned</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Context</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', width: 70 }}>Trend</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>Checked</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r: AEOResult) => {
                  const trend = getTrend(r);
                  const isExpanded = expandedRow === r.id;
                  const pStatus = pipelineStatus[r.query];

                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: r.response_text ? 'pointer' : 'default',
                        background: isExpanded ? '#f8fafc' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onClick={() => {
                        if (r.response_text) setExpandedRow(isExpanded ? null : r.id);
                      }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = isExpanded ? '#f8fafc' : 'transparent'; }}
                    >
                      <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500, maxWidth: 300 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {r.response_text && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#94a3b8"
                              strokeWidth="2"
                              style={{
                                flexShrink: 0,
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.15s',
                              }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {r.query}
                          </span>
                        </div>

                        {/* Expanded AI Response */}
                        {isExpanded && r.response_text && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: 12,
                              padding: 12,
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 8,
                              fontSize: 12,
                              color: '#475569',
                              lineHeight: 1.6,
                              maxHeight: 300,
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {r.response_text.substring(0, 2000)}
                            {r.response_text.length > 2000 && (
                              <span style={{ color: '#94a3b8' }}> ... (truncated)</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {r.mentioned ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            background: '#f0fdf4',
                            color: '#16a34a',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            No
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: 250 }}>
                        <span style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 12,
                        }}>
                          {r.mention_context || (r.mentioned ? 'Mentioned in response' : '--')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {trend === 'up' && (
                          <span title="Gained mention" style={{ color: '#22c55e', fontSize: 16, fontWeight: 700 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </span>
                        )}
                        {trend === 'down' && (
                          <span title="Lost mention" style={{ color: '#ef4444', fontSize: 16, fontWeight: 700 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        )}
                        {trend === 'same' && (
                          <span title="No change" style={{ color: '#94a3b8' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            </svg>
                          </span>
                        )}
                        {trend === 'new' && (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            background: '#f0f9ff',
                            color: '#2563eb',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            NEW
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {formatDate(r.checked_at)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {!r.mentioned && (
                          <>
                            {pStatus === 'added' ? (
                              <span style={{
                                fontSize: 12,
                                color: '#22c55e',
                                fontWeight: 500,
                              }}>
                                Added to pipeline
                              </span>
                            ) : pStatus === 'adding' ? (
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>Adding...</span>
                            ) : pStatus === 'error' ? (
                              <span style={{ fontSize: 12, color: '#ef4444' }}>Failed</span>
                            ) : (
                              <button
                                onClick={() => addToPipeline(r.query)}
                                style={{
                                  padding: '5px 12px',
                                  background: '#f0f9ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.15s',
                                }}
                                onMouseOver={(e) => {
                                  (e.target as HTMLElement).style.background = '#2563eb';
                                  (e.target as HTMLElement).style.color = '#fff';
                                }}
                                onMouseOut={(e) => {
                                  (e.target as HTMLElement).style.background = '#f0f9ff';
                                  (e.target as HTMLElement).style.color = '#2563eb';
                                }}
                                title="Add this query as a content pipeline keyword"
                              >
                                + Add to Pipeline
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div style={{
        background: '#f0f9ff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #bfdbfe',
        marginTop: 24,
        display: 'flex',
        gap: 12,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
          <strong>About AEO Monitoring</strong><br />
          AEO (Answer Engine Optimization) measures how often AI assistants mention BRITZMEDI when responding to
          industry-relevant queries. A higher mention rate means better AI visibility. The "Add to Pipeline" button
          creates content targeting queries where BRITZMEDI is not yet mentioned, helping improve future AI responses.
          <br /><br />
          <strong>Tip:</strong> Run this check weekly to track progress. Focus content creation on queries where
          BRITZMEDI is not mentioned.
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
