'use client';

import { Lead } from '@/lib/supabase';
import { format } from 'date-fns';
import { Phone, Mail, Building2, DollarSign, Calendar, Clock } from 'lucide-react';

const stageBadge: Record<string, string> = {
  Lead:           'badge-lead',
  Appointment:    'badge-appointment',
  Qualified:      'badge-qualified',
  Sold:           'badge-sold',
  'Not Interested': 'badge-not-interested',
};

interface KanbanCardProps { lead: Lead; }

export default function KanbanCard({ lead }: KanbanCardProps) {
  const fullName = `${lead.first_name} ${lead.last_name}`;

  let apptDisplay: { dateStr: string; timeStr: string } | null = null;
  if (lead.appointment_date && lead.appointment_time) {
    const [h, m] = lead.appointment_time.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12  = h % 12 === 0 ? 12 : h % 12;
    const timeStr = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
    let dateStr = lead.appointment_date;
    try { dateStr = format(new Date(lead.appointment_date + 'T12:00:00'), 'MMM d, yyyy'); } catch {}
    apptDisplay = { dateStr, timeStr };
  }

  /* Avatar initials */
  const initials = `${lead.first_name[0] ?? ''}${lead.last_name[0] ?? ''}`.toUpperCase();

  return (
    <div className="kanban-card">
      {/* Header row */}
      <div className="flex items-start gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--brand-subtle), #e0e7ff)',
            border: '1.5px solid #c7d2fe',
            color: 'var(--brand)',
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[var(--text-primary)] text-sm leading-tight truncate">{fullName}</div>
          <span className={`badge mt-1 ${stageBadge[lead.pipeline_stage]}`}>
            {lead.pipeline_stage}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <Mail size={10} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone size={10} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span>{lead.phone}</span>
        </div>
        {lead.company_size && (
          <div className="flex items-center gap-1.5">
            <Building2 size={10} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span>{lead.company_size} employees</span>
          </div>
        )}
        {lead.company_revenue && (
          <div className="flex items-center gap-1.5">
            <DollarSign size={10} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span>{lead.company_revenue}/yr</span>
          </div>
        )}

        {/* Appointment */}
        {apptDisplay && (
          <div
            className="mt-2 pt-2 border-t space-y-1"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-1.5">
              <Calendar size={10} className="flex-shrink-0" style={{ color: 'var(--amber)' }} />
              <span className="font-semibold" style={{ color: 'var(--amber)' }}>{apptDisplay.dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={10} className="flex-shrink-0" style={{ color: 'var(--amber)' }} />
              <span className="font-semibold" style={{ color: 'var(--amber)' }}>{apptDisplay.timeStr}</span>
            </div>
          </div>
        )}

        {/* Amount paid */}
        {lead.amount_paid != null && (
          <div
            className="mt-2 pt-2 border-t flex items-center gap-1.5"
            style={{ borderColor: 'var(--border)' }}
          >
            <DollarSign size={10} className="flex-shrink-0" style={{ color: 'var(--violet)' }} />
            <span className="font-bold" style={{ color: 'var(--violet)' }}>
              Paid: ${lead.amount_paid.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
