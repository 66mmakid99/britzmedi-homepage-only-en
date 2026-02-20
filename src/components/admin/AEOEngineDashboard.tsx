import { useState, useEffect, useCallback } from 'react';

interface DiagnosisQuery {
  query: string;
  mentioned: boolean;
  position?: string;
  competitor_mentioned?: string[];
  snippet?: string;
}

interface Status {
  diagnosis: {
    mention_rate: number;
    total_queries: number;
    mentioned: number;
    not_mentioned: number;
    queries: DiagnosisQuery[];
    diagnosed_at: string;
    run_at: string;
  } | null;
  plan: any | null;
  produce: any | null;
  analyze: any | null;
  pipeline: {
    queued: number;
    processing: number;
    published: number;
    reviewing: number;
    failed: number;
  };
  avg_quality_score: number;
}

interface TimelinePoint {
  date: string;
  mention_rate: number;
  total_queries: number;
  mentioned: number;
}

interface History {
  timeline: TimelinePoint[];
  recent_cycles: { phase: string; status: string; created_at: string }[];
}

export default function AEOEngineDashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [showQueries, setShowQueries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch('/api/admin/aeo-engine/status'),
        fetch('/api/admin/aeo-engine/history'),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runCycle = async (mode: string) => {
    setRunning(mode);
    setError(null);
    try {
      const res = await fetch('/api/admin/aeo-engine/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Run failed');
      } else {
        await fetchData();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading AEO Engine...</div>;
  }

  const mentionRate = status?.diagnosis?.mention_rate ?? 0;
  const prevRate = history?.timeline && history.timeline.length >= 2
    ? history.timeline[history.timeline.length - 2]?.mention_rate ?? 0
    : 0;
  const change = mentionRate - prevRate;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Mention Rate Card */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 14, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 1 }}>AEO Mention Rate</h2>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 48, fontWeight: 700, color: '#0c4a6e' }}>{mentionRate}%</span>
          {status?.diagnosis && (
            <span style={{ fontSize: 16, color: change > 0 ? '#16a34a' : change < 0 ? '#dc2626' : '#6b7280' }}>
              {change > 0 ? '+' : ''}{change}%p vs previous
            </span>
          )}
        </div>
        {status?.diagnosis && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>
            {status.diagnosis.mentioned}/{status.diagnosis.total_queries} queries mention BRITZMEDI/TORR RF
            &middot; Last run: {new Date(status.diagnosis.run_at).toLocaleString()}
          </p>
        )}
        {!status?.diagnosis && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#94a3b8' }}>No diagnosis data yet. Run your first cycle.</p>
        )}
      </div>

      {/* Cycle Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { mode: 'full', label: 'Run Full Cycle', color: '#1e40af' },
          { mode: 'diagnose', label: 'Diagnose Only', color: '#0369a1' },
          { mode: 'produce', label: 'Produce Only', color: '#047857' },
          { mode: 'analyze', label: 'Analyze Only', color: '#7c3aed' },
        ].map(({ mode, label, color }) => (
          <button
            key={mode}
            onClick={() => runCycle(mode)}
            disabled={!!running}
            style={{
              padding: '8px 16px',
              background: running === mode ? '#94a3b8' : color,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: running ? 'wait' : 'pointer',
              fontSize: 13,
              opacity: running && running !== mode ? 0.5 : 1,
            }}
          >
            {running === mode ? 'Running...' : label}
          </button>
        ))}
      </div>

      {/* Cycle Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { phase: 'Diagnose', data: status?.diagnosis, icon: '1', detail: status?.diagnosis ? `${status.diagnosis.total_queries} queries` : '-' },
          { phase: 'Plan', data: status?.plan, icon: '2', detail: status?.plan?.planned_content ? `${status.plan.planned_content.length} planned` : '-' },
          { phase: 'Produce', data: status?.produce, icon: '3', detail: status?.produce ? `${status.produce.processed || 0} made` : '-' },
          { phase: 'Analyze', data: status?.analyze, icon: '8', detail: status?.analyze?.recommendations ? `${status.analyze.recommendations.length} recs` : '-' },
        ].map(({ phase, data, icon, detail }) => (
          <div key={phase} style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 16,
            textAlign: 'center',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: data ? '#dcfce7' : '#f1f5f9',
              color: data ? '#16a34a' : '#94a3b8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600, marginBottom: 8,
            }}>
              {data ? '\u2713' : icon}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{phase}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{detail}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Stats */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Content Pipeline</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Queued', value: status?.pipeline?.queued ?? 0, color: '#3b82f6' },
            { label: 'Processing', value: status?.pipeline?.processing ?? 0, color: '#f59e0b' },
            { label: 'Published', value: status?.pipeline?.published ?? 0, color: '#22c55e' },
            { label: 'Reviewing', value: status?.pipeline?.reviewing ?? 0, color: '#8b5cf6' },
            { label: 'Failed', value: status?.pipeline?.failed ?? 0, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0ea5e9' }}>{status?.avg_quality_score ?? 0}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Avg Score</div>
          </div>
        </div>
      </div>

      {/* Growth Timeline */}
      {history?.timeline && history.timeline.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Growth Timeline</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
            {history.timeline.map((point, i) => {
              const maxRate = Math.max(...history.timeline.map(p => p.mention_rate), 1);
              const height = Math.max(8, (point.mention_rate / maxRate) * 100);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{point.mention_rate}%</div>
                  <div style={{
                    width: '100%',
                    maxWidth: 40,
                    height: `${height}%`,
                    background: i === history.timeline.length - 1 ? '#1e40af' : '#93c5fd',
                    borderRadius: '4px 4px 0 0',
                  }} />
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Query Results */}
      {status?.diagnosis?.queries && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3
            style={{ margin: '0 0 12px', fontSize: 15, cursor: 'pointer' }}
            onClick={() => setShowQueries(!showQueries)}
          >
            Query Results {showQueries ? '\u25B2' : '\u25BC'}
          </h3>
          {showQueries && (
            <div style={{ fontSize: 13 }}>
              {status.diagnosis.queries.map((q, i) => (
                <div key={i} style={{
                  padding: '8px 0',
                  borderBottom: i < status.diagnosis!.queries.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 16 }}>{q.mentioned ? '\u2705' : '\u274C'}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{q.query}</div>
                    {q.competitor_mentioned && q.competitor_mentioned.length > 0 && (
                      <div style={{ fontSize: 11, color: '#dc2626' }}>
                        Competitors: {q.competitor_mentioned.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations */}
      {status?.analyze?.recommendations && status.analyze.recommendations.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>AI Recommendations</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {status.analyze.recommendations.map((rec: string, i: number) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 13 }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cron Setup Info */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>Automated Schedule</h3>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#92400e' }}>
          Set up external cron at <strong>cron-job.org</strong> to automate daily cycles:
        </p>
        <div style={{ background: '#451a03', color: '#fef3c7', padding: 12, borderRadius: 6, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`URL: https://britzmedi.com/api/cron/aeo-engine
Method: POST
Headers: Authorization: Bearer {CRON_SECRET}
Body: {"mode": "full"}
Schedule: Every day at 00:00 UTC (09:00 KST)`}
        </div>
      </div>
    </div>
  );
}
