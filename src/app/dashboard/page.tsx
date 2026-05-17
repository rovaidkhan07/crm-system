'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Lead, PipelineStage } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import KanbanCard from '@/components/KanbanCard';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import {
  RefreshCw, Users, UserCheck, Star, CheckCircle, XCircle,
  Loader2, TrendingUp, BarChart3,
} from 'lucide-react';

const STAGES: {
  id: PipelineStage; label: string; icon: React.ElementType;
  color: string; bg: string; border: string; dot: string;
}[] = [
  { id: 'Lead',          label: 'Leads',        icon: Users,       color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', dot: '#6366f1' },
  { id: 'Appointment',   label: 'Appointment',  icon: UserCheck,   color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#d97706' },
  { id: 'Qualified',     label: 'Qualified',    icon: Star,        color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', dot: '#059669' },
  { id: 'Sold',          label: 'Sold',         icon: CheckCircle, color: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed' },
  { id: 'Not Interested',label: 'Not Interested',icon: XCircle,    color: '#9f1239', bg: '#fff1f2', border: '#fecdd3', dot: '#e11d48' },
];

export default function DashboardPage() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');

  const fetchLeads = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('leads').select('*').order('created_at', { ascending: false });
    if (err) { setError('Failed to load leads. Please check your Supabase connection.'); }
    else { setLeads(data ?? []); }
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const grouped = STAGES.reduce<Record<PipelineStage, Lead[]>>((acc, s) => {
    acc[s.id] = leads.filter((l) => l.pipeline_stage === s.id);
    return acc;
  }, {} as Record<PipelineStage, Lead[]>);

  const totalRevenue = leads
    .filter((l) => l.pipeline_stage === 'Sold' && l.amount_paid)
    .reduce((sum, l) => sum + (l.amount_paid ?? 0), 0);

  const conversionRate = leads.length > 0
    ? Math.round((grouped['Sold'].length / leads.length) * 100) : 0;

  return (
    <div className="page-bg min-h-screen">
      <Navbar />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 py-8">

        {/* ── Page header ────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4 fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={20} style={{ color: 'var(--brand)' }} />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Pipeline <span className="gradient-text">Dashboard</span>
              </h1>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">
              {leads.length} total leads · {conversionRate}% conversion rate
            </p>
          </div>

          <div className="flex items-center gap-3">
            {totalRevenue > 0 && (
              <div
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--violet-subtle)', border: '1px solid #ddd6fe', color: 'var(--violet)' }}
              >
                <TrendingUp size={15} />
                ${totalRevenue.toLocaleString()} revenue
              </div>
            )}
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 fade-in-up" style={{ animationDelay: '0.05s' }}>
          {STAGES.map(({ id, label, icon: Icon, color, bg, border, dot }) => (
            <div
              key={id}
              className="card flex items-center gap-3"
              style={{ borderColor: border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--text-primary)] leading-none">
                  {grouped[id]?.length ?? 0}
                </div>
                <div className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{label}</div>
              </div>
              <div
                className="ml-auto w-2 h-2 rounded-full status-dot"
                style={{ background: dot }}
              />
            </div>
          ))}
        </div>

        {/* ── Availability Calendar ─────────────────────── */}
        <div
          className="mb-8 max-w-xl fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          <AvailabilityCalendar />
        </div>

        {/* ── Error ─────────────────────────────────────── */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl text-sm font-medium"
            style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3', color: 'var(--rose)' }}
          >
            {error}
          </div>
        )}

        {/* ── Kanban board ──────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-64 gap-3 text-[var(--text-muted)]">
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--brand)' }} />
            <span className="text-sm">Loading pipeline data…</span>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 fade-in-up" style={{ animationDelay: '0.15s' }}>
            {STAGES.map(({ id, label, icon: Icon, color, bg, border }) => (
              <div
                key={id}
                className="kanban-column flex-shrink-0"
                style={{ minWidth: 280 }}
              >
                {/* Column header */}
                <div
                  className="flex items-center justify-between mb-4 px-3 py-2 rounded-xl"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={15} style={{ color }} />
                    <span className="font-semibold text-sm" style={{ color }}>{label}</span>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'white', color, border: `1px solid ${border}` }}
                  >
                    {grouped[id].length}
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-0">
                  {grouped[id].length === 0 ? (
                    <div className="py-10 text-center text-[var(--text-muted)] text-sm">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                        style={{ background: 'var(--bg-muted)' }}
                      >
                        <Icon size={18} style={{ opacity: 0.35 }} />
                      </div>
                      <span>No {label.toLowerCase()} yet</span>
                    </div>
                  ) : (
                    grouped[id].map((lead) => <KanbanCard key={lead.id} lead={lead} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
