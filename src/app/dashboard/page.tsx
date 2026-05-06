'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Lead, PipelineStage } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import KanbanCard from '@/components/KanbanCard';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { RefreshCw, Users, UserCheck, Star, CheckCircle, XCircle, Loader2, TrendingUp } from 'lucide-react';

const STAGES: { id: PipelineStage; label: string; icon: React.ElementType; color: string; glowColor: string }[] = [
  { id: 'Lead', label: 'Leads', icon: Users, color: 'text-indigo-400', glowColor: 'border-indigo-500/30 bg-indigo-500/5' },
  { id: 'Appointment', label: 'Appointment', icon: UserCheck, color: 'text-amber-400', glowColor: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'Qualified', label: 'Qualified', icon: Star, color: 'text-emerald-400', glowColor: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'Sold', label: 'Sold', icon: CheckCircle, color: 'text-violet-400', glowColor: 'border-violet-500/30 bg-violet-500/5' },
  { id: 'Not Interested', label: 'Not Interested', icon: XCircle, color: 'text-red-400', glowColor: 'border-red-500/30 bg-red-500/5' },
];

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError('Failed to load leads. Please check your Supabase connection.');
    } else {
      setLeads(data ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const grouped = STAGES.reduce<Record<PipelineStage, Lead[]>>((acc, s) => {
    acc[s.id] = leads.filter((l) => l.pipeline_stage === s.id);
    return acc;
  }, {} as Record<PipelineStage, Lead[]>);

  const totalRevenue = leads
    .filter((l) => l.pipeline_stage === 'Sold' && l.amount_paid)
    .reduce((sum, l) => sum + (l.amount_paid ?? 0), 0);

  return (
    <div className="animated-bg min-h-screen">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Pipeline <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              {leads.length} total leads across all stages
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalRevenue > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <TrendingUp size={16} className="text-violet-400" />
                <span className="text-violet-300 font-semibold text-sm">
                  ${totalRevenue.toLocaleString()} revenue
                </span>
              </div>
            )}
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Availability Calendar */}
        <div className="mb-8 max-w-xl">
          <AvailabilityCalendar />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {STAGES.map(({ id, label, icon: Icon, color, glowColor }) => (
            <div key={id} className={`card border ${glowColor} flex items-center gap-3`}>
              <Icon size={20} className={color} />
              <div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {grouped[id].length}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Kanban Board */}
        {loading ? (
          <div className="flex items-center justify-center h-64 gap-3 text-[var(--text-muted)]">
            <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
            <span>Loading pipeline data...</span>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(({ id, label, icon: Icon, color, glowColor }) => (
              <div key={id} className="kanban-column flex-shrink-0" style={{ minWidth: 280 }}>
                {/* Column header */}
                <div className={`flex items-center justify-between mb-4 p-2 rounded-lg border ${glowColor}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={color} />
                    <span className="font-semibold text-[var(--text-primary)] text-sm">{label}</span>
                  </div>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${color} bg-current/10`}
                    style={{ backgroundColor: 'rgba(var(--accent-rgb, 99 102 241) / 0.1)' }}
                  >
                    <span className="text-[var(--text-primary)]">{grouped[id].length}</span>
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-0">
                  {grouped[id].length === 0 ? (
                    <div className="py-8 text-center text-[var(--text-muted)] text-sm">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center mx-auto mb-2">
                        <Icon size={18} className="opacity-30" />
                      </div>
                      No {label.toLowerCase()} yet
                    </div>
                  ) : (
                    grouped[id].map((lead) => (
                      <KanbanCard key={lead.id} lead={lead} />
                    ))
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
