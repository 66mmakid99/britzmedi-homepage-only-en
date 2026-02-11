import React, { useState, useEffect, useCallback } from 'react';

// ---------- Types ----------
interface Lead {
  id: number;
  company_name: string;
  company_website?: string;
  contact_name: string;
  job_title: string;
  email: string;
  country: string;
  interested_products: string;
  message?: string;
  lead_score: number;
  lead_grade: string;
  status: string;
  priority?: string;
  last_contacted_at?: string;
  next_action?: string;
  next_action_date?: string;
  assigned_to?: string;
  lost_reason?: string;
  ai_research?: string;
  created_at: string;
  updated_at?: string;
}

interface Activity {
  id: number;
  lead_id: number;
  type: string;
  title: string;
  description?: string;
  created_by: string;
  created_at: string;
}

interface Stats {
  total: number;
  hot: number;
  newToday: number;
  avgScore: number;
  byStatus: Record<string, number>;
}

// ---------- Constants ----------
const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] as const;
const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal'] as const;
const CLOSED_STAGES = ['won', 'lost'] as const;

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  qualified: '#8b5cf6',
  proposal: '#6366f1',
  won: '#22c55e',
  lost: '#ef4444',
};

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-amber-100 text-amber-700',
  C: 'bg-blue-100 text-blue-700',
  D: 'bg-slate-100 text-slate-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  hot: 'Hot',
  warm: 'Warm',
  normal: 'Normal',
  cold: 'Cold',
};

const ACTIVITY_ICONS: Record<string, string> = {
  email_sent: '\u2709\ufe0f',
  email_received: '\ud83d\udce8',
  call: '\ud83d\udcde',
  note: '\ud83d\udcdd',
  stage_change: '\u27a1\ufe0f',
  auto_action: '\u2699\ufe0f',
};

// ---------- Helpers ----------
function parseProducts(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function isOverdue(lead: Lead): boolean {
  if (['won', 'lost'].includes(lead.status)) return false;
  const ref = lead.last_contacted_at || lead.created_at;
  return Date.now() - new Date(ref).getTime() > 48 * 60 * 60 * 1000;
}

// ---------- Toast Notification ----------
function Toast({ message, type, onDismiss }: { message: string; type: 'error' | 'success'; onDismiss: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-[60] max-w-sm px-4 py-3 rounded-xl shadow-lg border flex items-start gap-3 animate-[slideIn_0.2s_ease-out] ${
      type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
    }`}>
      <span className="text-sm">{type === 'error' ? '\u26a0\ufe0f' : '\u2705'}</span>
      <p className="text-sm flex-1">{message}</p>
      <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 shrink-0">&times;</button>
    </div>
  );
}

// ---------- Main Component ----------
export default function LeadsPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [view, setView] = useState<'pipeline' | 'all'>('pipeline');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // Modal states
  const [activityModal, setActivityModal] = useState<{ type: string; leadId: number } | null>(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [lostReasonModal, setLostReasonModal] = useState<number | null>(null);
  const [lostReason, setLostReason] = useState('');

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
  };

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (gradeFilter) params.set('grade', gradeFilter);
      if (search) params.set('search', search);
      params.set('limit', '200');
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error(`Failed to load leads (${res.status})`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load leads';
      setError(msg);
      console.error('Failed to fetch leads:', err);
    }
  }, [gradeFilter, search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/leads/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* non-critical */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchLeads(), fetchStats()]);
    setLoading(false);
  }, [fetchLeads, fetchStats]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Fetch activities for selected lead
  const fetchActivities = useCallback(async (leadId: number) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      setActivities(data.activities || []);
      if (data.lead) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data.lead } : l));
      }
    } catch { setActivities([]); }
  }, []);

  useEffect(() => {
    if (selectedLead) fetchActivities(selectedLead.id);
  }, [selectedLead?.id, fetchActivities]);

  // Update lead status
  const moveStage = async (leadId: number, newStatus: string, reason?: string) => {
    try {
      const body: any = { status: newStatus };
      if (reason) body.lost_reason = reason;
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data.lead } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, ...data.lead } : null);
        fetchActivities(leadId);
      }
      fetchStats();
    } catch (err) {
      console.error('Failed to move stage:', err);
      showToast('Failed to update lead stage. Please try again.');
    }
  };

  // Add activity
  const addActivity = async () => {
    if (!activityModal || !activityTitle.trim()) return;
    try {
      const res = await fetch(`/api/admin/leads/${activityModal.leadId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityModal.type,
          title: activityTitle.trim(),
          description: activityDesc.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setActivityModal(null);
      setActivityTitle('');
      setActivityDesc('');
      fetchActivities(activityModal.leadId);
    } catch (err) {
      console.error('Failed to add activity:', err);
      showToast('Failed to log activity. Please try again.');
    }
  };

  // Delete lead
  const deleteLead = async (leadId: number) => {
    if (!confirm('Delete this lead permanently?')) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
      fetchStats();
    } catch (err) {
      console.error('Failed to delete lead:', err);
      showToast('Failed to delete lead. Please try again.');
    }
  };

  // Group leads by stage
  const leadsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = leads.filter(l => l.status === stage);
    return acc;
  }, {} as Record<string, Lead[]>);

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {error && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span>Failed to load leads. Please check your connection and try again.</span>
          <button onClick={loadAll} className="ml-auto shrink-0 px-3 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 rounded-lg">
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Leads" value={stats?.total ?? 0} icon="users" color="primary" />
        <StatCard label="Hot Leads (A)" value={stats?.hot ?? 0} icon="fire" color="green" />
        <StatCard label="New Today" value={stats?.newToday ?? 0} icon="clock" color="amber" />
        <StatCard label="Avg Score" value={stats?.avgScore ?? 0} icon="chart" color="blue" />
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          <button
            onClick={() => setView('pipeline')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'pipeline' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Leads
          </button>
        </div>

        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
        >
          <option value="">All Grades</option>
          <option value="A">A - Hot</option>
          <option value="B">B - Warm</option>
          <option value="C">C - Cool</option>
          <option value="D">D - Cold</option>
        </select>

        <input
          type="search"
          placeholder="Search leads..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white w-64"
        />

        <button
          onClick={loadAll}
          className="ml-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading leads...
        </div>
      ) : !error && leads.length === 0 && !search && !gradeFilter ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No leads yet</h3>
          <p className="text-sm text-slate-500">Leads will appear here when visitors submit the contact form.</p>
        </div>
      ) : view === 'pipeline' ? (
        <PipelineView
          leadsByStage={leadsByStage}
          onSelect={setSelectedLead}
          onMoveStage={moveStage}
        />
      ) : (
        <AllLeadsTable
          leads={leads}
          onSelect={setSelectedLead}
          onMoveStage={moveStage}
          onDelete={deleteLead}
        />
      )}

      {/* Lead Detail Sidebar */}
      {selectedLead && (
        <LeadDetailSidebar
          lead={selectedLead}
          activities={activities}
          onClose={() => setSelectedLead(null)}
          onMoveStage={moveStage}
          onAddActivity={(type) => {
            setActivityModal({ type, leadId: selectedLead.id });
            setActivityTitle(type === 'email_sent' ? 'Email sent' : type === 'call' ? 'Phone call' : '');
          }}
          onMarkLost={() => {
            setLostReasonModal(selectedLead.id);
            setLostReason('');
          }}
          onDelete={() => deleteLead(selectedLead.id)}
        />
      )}

      {/* Add Activity Modal */}
      {activityModal && (
        <Modal onClose={() => setActivityModal(null)}>
          <h3 className="text-lg font-semibold mb-4">
            {ACTIVITY_ICONS[activityModal.type]} Log {activityModal.type === 'email_sent' ? 'Email' : activityModal.type === 'call' ? 'Call' : 'Note'}
          </h3>
          <input
            type="text"
            value={activityTitle}
            onChange={e => setActivityTitle(e.target.value)}
            placeholder="Title (e.g., 'Sent product catalog')"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            autoFocus
          />
          <textarea
            value={activityDesc}
            onChange={e => setActivityDesc(e.target.value)}
            placeholder="Details (optional)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm h-24 resize-none mb-4"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setActivityModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={addActivity} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Save</button>
          </div>
        </Modal>
      )}

      {/* Lost Reason Modal */}
      {lostReasonModal && (
        <Modal onClose={() => setLostReasonModal(null)}>
          <h3 className="text-lg font-semibold mb-4">Mark as Lost</h3>
          <input
            type="text"
            value={lostReason}
            onChange={e => setLostReason(e.target.value)}
            placeholder="Reason (e.g., 'Chose competitor', 'Budget issue')"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-4"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setLostReasonModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button
              onClick={() => {
                moveStage(lostReasonModal, 'lost', lostReason);
                setLostReasonModal(null);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Mark Lost
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------- Sub-Components ----------

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const bgColors: Record<string, string> = {
    primary: 'bg-blue-100',
    green: 'bg-green-100',
    amber: 'bg-amber-100',
    blue: 'bg-indigo-100',
  };
  const textColors: Record<string, string> = {
    primary: 'text-blue-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    blue: 'text-indigo-600',
  };
  const icons: Record<string, React.ReactNode> = {
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    fire: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bgColors[color]} flex items-center justify-center`}>
          <svg className={`w-5 h-5 ${textColors[color]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icons[icon]}
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ---------- Pipeline View ----------
function PipelineView({
  leadsByStage,
  onSelect,
  onMoveStage,
}: {
  leadsByStage: Record<string, Lead[]>;
  onSelect: (lead: Lead) => void;
  onMoveStage: (id: number, stage: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
      {PIPELINE_STAGES.map(stage => (
        <div key={stage} className="flex-1 min-w-[220px] max-w-[300px]">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
            <span className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</span>
            <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
              {leadsByStage[stage]?.length || 0}
            </span>
          </div>
          <div className="space-y-2">
            {(leadsByStage[stage] || []).map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => onSelect(lead)} />
            ))}
            {(leadsByStage[stage] || []).length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No leads
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Won / Lost columns */}
      {CLOSED_STAGES.map(stage => (
        <div key={stage} className="min-w-[180px] max-w-[220px]">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
            <span className="text-sm font-semibold text-slate-700">{STAGE_LABELS[stage]}</span>
            <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
              {leadsByStage[stage]?.length || 0}
            </span>
          </div>
          <div className="space-y-2">
            {(leadsByStage[stage] || []).map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => onSelect(lead)} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadCard({ lead, onClick, compact }: { lead: Lead; onClick: () => void; compact?: boolean }) {
  const overdue = isOverdue(lead);
  const products = parseProducts(lead.interested_products);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-3 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all ${overdue ? 'ring-2 ring-red-200' : ''}`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-sm font-semibold text-slate-900 line-clamp-1">{lead.company_name}</span>
        {overdue && <span className="text-red-500 text-xs ml-1 shrink-0" title="48h+ no response">!</span>}
      </div>
      {!compact && (
        <>
          <p className="text-xs text-slate-500 mb-1">{lead.contact_name} &middot; {lead.job_title}</p>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${GRADE_COLORS[lead.lead_grade] || GRADE_COLORS.D}`}>
              {lead.lead_grade}
            </span>
            <span className="text-[10px] text-slate-400">{lead.country}</span>
          </div>
          {products.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {products.slice(0, 2).map(p => (
                <span key={p} className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">{p}</span>
              ))}
              {products.length > 2 && <span className="text-[10px] text-slate-400">+{products.length - 2}</span>}
            </div>
          )}
        </>
      )}
      <p className="text-[10px] text-slate-400 mt-1.5">{timeAgo(lead.created_at)}</p>
    </div>
  );
}

// ---------- All Leads Table ----------
function AllLeadsTable({
  leads,
  onSelect,
  onMoveStage,
  onDelete,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onMoveStage: (id: number, stage: string) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Lead</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Country</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Score</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Products</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                  No leads found
                </td>
              </tr>
            ) : leads.map(lead => {
              const overdue = isOverdue(lead);
              const products = parseProducts(lead.interested_products);
              return (
                <tr
                  key={lead.id}
                  className={`hover:bg-slate-50 cursor-pointer ${overdue ? 'bg-red-50/50' : ''}`}
                  onClick={() => onSelect(lead)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {overdue && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" title="48h+ no response" />}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{lead.contact_name}</p>
                        <p className="text-xs text-slate-500">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{lead.company_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{lead.country}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${GRADE_COLORS[lead.lead_grade] || GRADE_COLORS.D}`}>
                      {lead.lead_score} ({lead.lead_grade})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={lead.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => onMoveStage(lead.id, e.target.value)}
                      className="text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer"
                      style={{ backgroundColor: STAGE_COLORS[lead.status] + '20', color: STAGE_COLORS[lead.status] }}
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {products.slice(0, 2).map(p => (
                        <span key={p} className="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(lead.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Lead Detail Sidebar ----------
function LeadDetailSidebar({
  lead,
  activities,
  onClose,
  onMoveStage,
  onAddActivity,
  onMarkLost,
  onDelete,
}: {
  lead: Lead;
  activities: Activity[];
  onClose: () => void;
  onMoveStage: (id: number, stage: string) => void;
  onAddActivity: (type: string) => void;
  onMarkLost: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(lead);
  const products = parseProducts(lead.interested_products);
  const stageIdx = STAGES.indexOf(lead.status as any);
  const nextStages = PIPELINE_STAGES.filter((_, i) => i > stageIdx && i < 4);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{lead.company_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{ backgroundColor: STAGE_COLORS[lead.status] + '20', color: STAGE_COLORS[lead.status] }}
                >
                  {STAGE_LABELS[lead.status] || lead.status}
                </span>
                {overdue && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                    48h+ No Response
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${GRADE_COLORS[lead.lead_grade]}`}>
                  Score: {lead.lead_score} ({lead.lead_grade})
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-900 font-medium">{lead.contact_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Title</span>
                <span className="text-slate-900">{lead.job_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Country</span>
                <span className="text-slate-900">{lead.country}</span>
              </div>
              {lead.company_website && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Website</span>
                  <a href={lead.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {lead.company_website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {products.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Interests</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {products.map(p => (
                      <span key={p} className="px-2 py-0.5 text-xs bg-slate-100 rounded">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {lead.message && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-xs">Message</span>
                  <p className="text-slate-700 mt-1">{lead.message}</p>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-400 pt-2">
                <span>Submitted {new Date(lead.created_at).toLocaleString()}</span>
                {lead.last_contacted_at && (
                  <span>Last contact: {timeAgo(lead.last_contacted_at)}</span>
                )}
              </div>
            </div>
          </section>

          {/* Actions */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </button>
              <button
                onClick={() => onAddActivity('email_sent')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Log Email
              </button>
              <button
                onClick={() => onAddActivity('call')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Log Call
              </button>
              <button
                onClick={() => onAddActivity('note')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Add Note
              </button>
            </div>
          </section>

          {/* Move Stage */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Move Stage</h3>
            <div className="flex flex-wrap gap-2">
              {nextStages.map(s => (
                <button
                  key={s}
                  onClick={() => onMoveStage(lead.id, s)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50"
                  style={{ color: STAGE_COLORS[s] }}
                >
                  &rarr; {STAGE_LABELS[s]}
                </button>
              ))}
              {lead.status !== 'won' && lead.status !== 'lost' && (
                <>
                  <button
                    onClick={() => onMoveStage(lead.id, 'won')}
                    className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
                  >
                    Won
                  </button>
                  <button
                    onClick={onMarkLost}
                    className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    Lost
                  </button>
                </>
              )}
              {(lead.status === 'won' || lead.status === 'lost') && (
                <button
                  onClick={() => onMoveStage(lead.id, 'new')}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Reopen
                </button>
              )}
            </div>
            {lead.lost_reason && (
              <p className="text-xs text-red-600 mt-2">Lost reason: {lead.lost_reason}</p>
            )}
          </section>

          {/* Activity Timeline */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Activity Timeline ({activities.length})
            </h3>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No activities recorded yet</p>
            ) : (
              <div className="space-y-0">
                {activities.map((act, i) => (
                  <div key={act.id} className="flex gap-3 pb-4">
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{ACTIVITY_ICONS[act.type] || '\u2022'}</span>
                      {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{act.title}</p>
                      {act.description && <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(act.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Danger Zone */}
          <section className="pt-4 border-t border-slate-200">
            <button
              onClick={onDelete}
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              Delete this lead
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
