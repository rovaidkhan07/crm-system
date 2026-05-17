'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday, isSameMonth, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Lock, Unlock, Loader2, AlertCircle, CalendarDays } from 'lucide-react';
import clsx from 'clsx';

export default function AvailabilityCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [toggling, setToggling]         = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('blocked_dates').select('date');
    if (err) setError('Failed to load blocked dates.');
    else setBlockedDates(data?.map((d) => d.date) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBlocked(); }, [fetchBlocked]);

  async function toggleDate(dateStr: string) {
    setToggling(dateStr); setError('');
    const isBlocked = blockedDates.includes(dateStr);
    if (isBlocked) {
      const { error: err } = await supabase.from('blocked_dates').delete().eq('date', dateStr);
      if (err) setError(`Failed to unblock ${dateStr}.`);
      else setBlockedDates((p) => p.filter((d) => d !== dateStr));
    } else {
      const { error: err } = await supabase.from('blocked_dates').insert({ date: dateStr });
      if (err) setError(`Failed to block ${dateStr}.`);
      else setBlockedDates((p) => [...p, dateStr]);
    }
    setToggling(null);
  }

  const monthStart  = startOfMonth(currentMonth);
  const monthEnd    = endOfMonth(currentMonth);
  const days        = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const blockedThisMonth = blockedDates.filter((d) =>
    isSameMonth(new Date(d + 'T12:00:00'), currentMonth)
  ).length;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand-subtle)', border: '1px solid #c7d2fe' }}
          >
            <CalendarDays size={14} style={{ color: 'var(--brand)' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] leading-tight">Availability Calendar</h2>
            <p className="text-xs text-[var(--text-muted)]">Click a date to block / unblock it</p>
          </div>
        </div>
        {blockedThisMonth > 0 && (
          <span className="badge badge-not-interested">{blockedThisMonth} blocked</span>
        )}
      </div>

      {error && (
        <div
          className="mb-3 p-2.5 rounded-lg flex items-center gap-2 text-sm font-medium"
          style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3', color: 'var(--rose)' }}
        >
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={14} />
        </button>
        <h3 className="font-semibold text-sm text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div className="calendar-grid mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[0.65rem] font-semibold text-[var(--text-muted)] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      {loading ? (
        <div className="flex items-center justify-center h-36 gap-2 text-[var(--text-muted)]">
          <div className="spinner-brand" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="calendar-grid">
          {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const dateStr   = format(day, 'yyyy-MM-dd');
            const isBlocked = blockedDates.includes(dateStr);
            const isToggling = toggling === dateStr;
            const dayToday  = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => toggleDate(dateStr)}
                disabled={isToggling}
                title={isBlocked ? `Unblock ${format(day, 'MMM d')}` : `Block ${format(day, 'MMM d')}`}
                className={clsx('calendar-day relative group', {
                  blocked: isBlocked,
                  today:   dayToday && !isBlocked,
                })}
              >
                {isToggling ? (
                  <div className="spinner-brand" style={{ width: '14px', height: '14px' }} />
                ) : (
                  <>
                    {format(day, 'd')}
                    <span
                      className={clsx(
                        'absolute inset-0 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-xs',
                        isBlocked
                          ? 'text-[var(--emerald)]'
                          : 'text-[var(--rose)]'
                      )}
                      style={{ background: isBlocked ? 'rgba(5,150,105,0.1)' : 'rgba(225,29,72,0.08)' }}
                    >
                      {isBlocked ? <Unlock size={11} /> : <Lock size={11} />}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div
        className="flex items-center gap-4 mt-4 pt-3 text-xs text-[var(--text-muted)]"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3' }} />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border" style={{ borderColor: 'var(--brand)' }} />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={9} />
          <span>Hover to toggle</span>
        </div>
      </div>
    </div>
  );
}
