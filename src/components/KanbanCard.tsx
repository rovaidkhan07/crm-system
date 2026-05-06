'use client';

import { Lead } from '@/lib/supabase';
import { format } from 'date-fns';
import { Phone, Mail, Building2, DollarSign, Calendar, Clock, User } from 'lucide-react';
import clsx from 'clsx';

const stageColors: Record<string, string> = {
  Lead: 'badge-lead',
  Appointment: 'badge-appointment',
  Qualified: 'badge-qualified',
  Sold: 'badge-sold',
  'Not Interested': 'badge-not-interested',
};

interface KanbanCardProps {
  lead: Lead;
}

export default function KanbanCard({ lead }: KanbanCardProps) {
  const fullName = `${lead.first_name} ${lead.last_name}`;

  let apptDisplay = null;
  if (lead.appointment_date && lead.appointment_time) {
    const [h, m] = lead.appointment_time.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const timeStr = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    let dateStr = lead.appointment_date;
    try {
      dateStr = format(new Date(lead.appointment_date + 'T12:00:00'), 'MMM d, yyyy');
    } catch {}
    apptDisplay = { dateStr, timeStr };
  }

  return (
    <div className="kanban-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-indigo-400" />
          </div>
          <div>
            <div className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{fullName}</div>
            <div className={clsx('badge mt-0.5', stageColors[lead.pipeline_stage])}>
              {lead.pipeline_stage}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <Mail size={11} className="text-[var(--text-muted)] flex-shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone size={11} className="text-[var(--text-muted)] flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
        {lead.company_size && (
          <div className="flex items-center gap-1.5">
            <Building2 size={11} className="text-[var(--text-muted)] flex-shrink-0" />
            <span>{lead.company_size} employees</span>
          </div>
        )}
        {lead.company_revenue && (
          <div className="flex items-center gap-1.5">
            <DollarSign size={11} className="text-[var(--text-muted)] flex-shrink-0" />
            <span>{lead.company_revenue}/yr</span>
          </div>
        )}
        {apptDisplay && (
          <div className="pt-1 mt-1 border-t border-[var(--border)] space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-amber-400 flex-shrink-0" />
              <span className="text-amber-300 font-medium">{apptDisplay.dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-amber-400 flex-shrink-0" />
              <span className="text-amber-300 font-medium">{apptDisplay.timeStr}</span>
            </div>
          </div>
        )}
        {lead.amount_paid != null && (
          <div className="pt-1 mt-1 border-t border-[var(--border)] flex items-center gap-1.5">
            <DollarSign size={11} className="text-violet-400 flex-shrink-0" />
            <span className="text-violet-300 font-semibold">
              Paid: ${lead.amount_paid.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
