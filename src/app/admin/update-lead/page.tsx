'use client';

import { useState } from 'react';
import { supabase, Lead } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import {
  Search, CheckCircle2, XCircle, DollarSign,
  User, Phone, Mail, Building2, Loader2,
  AlertCircle, BadgeCheck, Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

type Outcome = 'Sold' | 'Not Interested' | '';

const stageBadge: Record<string, string> = {
  Lead: 'badge-lead', Appointment: 'badge-appointment',
  Qualified: 'badge-qualified', Sold: 'badge-sold', 'Not Interested': 'badge-not-interested',
};

export default function UpdateLeadPage() {
  const [phone, setPhone]       = useState('');
  const [lead, setLead]         = useState<Lead | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [outcome, setOutcome]   = useState<Outcome>('');
  const [amountPaid, setAmountPaid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess]   = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setSearching(true); setSearchError(''); setLead(null);
    setOutcome(''); setAmountPaid(''); setSuccess(false); setSubmitError('');

    const { data, error } = await supabase
      .from('leads').select('*')
      .ilike('phone', `%${phone.trim().replace(/\D/g, '')}%`)
      .limit(1).maybeSingle();

    if (error) {
      setSearchError('Database error. Please try again.');
    } else if (!data) {
      const { data: data2, error: error2 } = await supabase
        .from('leads').select('*')
        .or(`phone.ilike.%${phone.trim()}%`)
        .limit(1).maybeSingle();
      if (error2 || !data2)
        setSearchError('No lead found with that phone number. Please double-check and try again.');
      else setLead(data2);
    } else { setLead(data); }
    setSearching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!outcome) { setSubmitError('Please select an outcome.'); return; }
    if (outcome === 'Sold' && (!amountPaid || isNaN(Number(amountPaid)) || Number(amountPaid) < 0)) {
      setSubmitError('Please enter a valid payment amount.'); return;
    }
    if (!lead) return;
    setSubmitting(true); setSubmitError('');

    const updates: Partial<Lead> = {
      pipeline_stage: outcome,
      amount_paid: outcome === 'Sold' ? Number(amountPaid) : null,
    };
    const { error } = await supabase.from('leads').update(updates).eq('id', lead.id);
    if (error) setSubmitError(error.message);
    else { setSuccess(true); setLead((p) => p ? { ...p, ...updates } : p); }
    setSubmitting(false);
  }

  function reset() {
    setLead(null); setPhone(''); setOutcome(''); setAmountPaid(''); setSuccess(false);
  }

  return (
    <div className="page-bg min-h-screen">
      <Navbar />

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-12">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="text-center mb-8 fade-in-up">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'var(--violet-subtle)', border: '1px solid #ddd6fe', color: 'var(--violet)' }}
          >
            <BadgeCheck size={13} /> Internal Sales Tool
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
            Update Lead <span className="gradient-text">Outcome</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-sm mx-auto">
            Search a lead by phone number and record their final sales outcome.
          </p>
        </div>

        {/* ── Search card ────────────────────────────────── */}
        <div className="card mb-5 fade-in-up" style={{ animationDelay: '0.06s' }}>
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Step 1 · Find Lead by Phone
          </h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Phone
                size={15} strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                id="searchPhone" type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setSearchError(''); }}
                className="form-input pl-10"
              />
            </div>
            <button type="submit" disabled={searching || !phone.trim()} className="btn-primary">
              {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
          {searchError && (
            <div
              className="mt-3 p-3 rounded-xl flex items-center gap-2 text-sm font-medium"
              style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3', color: 'var(--rose)' }}
            >
              <AlertCircle size={14} /> {searchError}
            </div>
          )}
        </div>

        {/* ── Lead card ──────────────────────────────────── */}
        {lead && (
          <div className="card mb-5 fade-in-up">
            <div className="flex items-start gap-3 mb-4">
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg,var(--brand-subtle),#e0e7ff)',
                  border: '1.5px solid #c7d2fe', color: 'var(--brand)',
                }}
              >
                {lead.first_name[0]}{lead.last_name[0]}
              </div>
              <div>
                <div className="font-bold text-[var(--text-primary)] text-base leading-tight">
                  {lead.first_name} {lead.last_name}
                </div>
                <span className={`badge mt-1 ${stageBadge[lead.pipeline_stage]}`}>
                  {lead.pipeline_stage}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <Mail size={13} style={{ color: 'var(--text-muted)' }} /> {lead.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} style={{ color: 'var(--text-muted)' }} /> {lead.phone}
              </div>
              {lead.company_size && (
                <div className="flex items-center gap-2">
                  <Building2 size={13} style={{ color: 'var(--text-muted)' }} /> {lead.company_size} employees
                </div>
              )}
              {lead.company_revenue && (
                <div className="flex items-center gap-2">
                  <DollarSign size={13} style={{ color: 'var(--text-muted)' }} /> {lead.company_revenue}/yr
                </div>
              )}
              {lead.appointment_date && lead.appointment_time && (
                <div className="sm:col-span-2 flex items-center gap-2 font-medium" style={{ color: 'var(--amber)' }}>
                  📅 {format(new Date(lead.appointment_date + 'T12:00:00'), 'MMM d, yyyy')} at {lead.appointment_time}
                </div>
              )}
              {lead.extra_questions && (
                <div
                  className="sm:col-span-2 p-2.5 rounded-lg text-xs italic"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  &ldquo;{lead.extra_questions}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Outcome form ───────────────────────────────── */}
        {lead && !success && (
          <div className="card fade-in-up">
            <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Step 2 · Record Outcome
            </h2>
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-[var(--text-secondary)] mb-4">What was the result of this lead?</p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Sold */}
                <button
                  type="button" id="outcome-sold"
                  onClick={() => { setOutcome('Sold'); setSubmitError(''); }}
                  className="p-4 rounded-xl border-[1.5px] flex flex-col items-center gap-2 transition-all duration-200"
                  style={outcome === 'Sold' ? {
                    background: 'var(--violet-subtle)', borderColor: 'var(--violet)',
                    boxShadow: '0 0 0 3px rgba(124,58,237,0.12)',
                  } : { background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <CheckCircle2
                    size={24}
                    style={{ color: outcome === 'Sold' ? 'var(--violet)' : 'var(--text-muted)' }}
                  />
                  <span
                    className="font-semibold text-sm"
                    style={{ color: outcome === 'Sold' ? 'var(--violet)' : 'var(--text-secondary)' }}
                  >
                    Sold! 🎉
                  </span>
                </button>

                {/* Not Interested */}
                <button
                  type="button" id="outcome-not-interested"
                  onClick={() => { setOutcome('Not Interested'); setAmountPaid(''); setSubmitError(''); }}
                  className="p-4 rounded-xl border-[1.5px] flex flex-col items-center gap-2 transition-all duration-200"
                  style={outcome === 'Not Interested' ? {
                    background: 'var(--rose-subtle)', borderColor: 'var(--rose)',
                    boxShadow: '0 0 0 3px rgba(225,29,72,0.1)',
                  } : { background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <XCircle
                    size={24}
                    style={{ color: outcome === 'Not Interested' ? 'var(--rose)' : 'var(--text-muted)' }}
                  />
                  <span
                    className="font-semibold text-sm"
                    style={{ color: outcome === 'Not Interested' ? 'var(--rose)' : 'var(--text-secondary)' }}
                  >
                    Not Interested
                  </span>
                </button>
              </div>

              {/* Amount paid */}
              {outcome === 'Sold' && (
                <div className="mb-5 fade-in-up">
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                    Payment Amount <span style={{ color: 'var(--rose)' }}>*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={15} strokeWidth={2}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      id="amountPaid" type="number" min="0" step="0.01"
                      placeholder="5000.00" value={amountPaid}
                      onChange={(e) => { setAmountPaid(e.target.value); setSubmitError(''); }}
                      className="form-input pl-10"
                    />
                  </div>
                </div>
              )}

              {submitError && (
                <div
                  className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-medium"
                  style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3', color: 'var(--rose)' }}
                >
                  <AlertCircle size={14} /> {submitError}
                </div>
              )}

              <button
                type="submit" disabled={submitting || !outcome}
                id="submit-outcome" className="btn-primary w-full"
              >
                {submitting ? <Loader2 size={17} className="animate-spin" /> : null}
                {submitting ? 'Updating…' : 'Save Outcome'}
              </button>
            </form>
          </div>
        )}

        {/* ── Success ────────────────────────────────────── */}
        {success && lead && (
          <div className="card text-center fade-in-up">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--emerald-subtle)', border: '2px solid #a7f3d0' }}
            >
              <CheckCircle2 size={28} style={{ color: 'var(--emerald)' }} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Lead Updated!</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              <strong>{lead.first_name} {lead.last_name}</strong> has been marked as{' '}
              <span className={`badge inline-flex ${stageBadge[lead.pipeline_stage]}`}>
                {lead.pipeline_stage}
              </span>
            </p>
            {lead.amount_paid != null && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4 font-semibold"
                style={{ background: 'var(--violet-subtle)', border: '1px solid #ddd6fe', color: 'var(--violet)' }}
              >
                <Sparkles size={14} /> Payment recorded: ${lead.amount_paid.toLocaleString()}
              </div>
            )}
            <br />
            <button onClick={reset} className="btn-secondary">
              Look up another lead
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
