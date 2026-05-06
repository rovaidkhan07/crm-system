'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function AvailabilityCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('blocked_dates').select('date');
    if (err) {
      setError('Failed to load blocked dates.');
    } else {
      setBlockedDates(data?.map((d) => d.date) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  async function toggleDate(dateStr: string) {
    setToggling(dateStr);
    setError('');
    const isBlocked = blockedDates.includes(dateStr);
    if (isBlocked) {
      // Unblock
      const { error: err } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('date', dateStr);
      if (err) {
        setError(`Failed to unblock ${dateStr}.`);
      } else {
        setBlockedDates((prev) => prev.filter((d) => d !== dateStr));
      }
    } else {
      // Block
      const { error: err } = await supabase
        .from('blocked_dates')
        .insert({ date: dateStr });
      if (err) {
        setError(`Failed to block ${dateStr}.`);
      } else {
        setBlockedDates((prev) => [...prev, dateStr]);
      }
    }
    setToggling(null);
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const blockedThisMonth = blockedDates.filter((d) => {
    const dt = new Date(d + 'T12:00:00');
    return isSameMonth(dt, currentMonth);
  }).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Availability Calendar</h2>
          <p className="text-sm text-[var(--text-muted)]">Click any date to block or unblock it</p>
        </div>
        <div className="flex items-center gap-4">
          {blockedThisMonth > 0 && (
            <span className="badge badge-not-interested">
              {blockedThisMonth} blocked
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="calendar-grid mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-[var(--text-muted)] py-1">
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3 text-[var(--text-muted)]">
          <Loader2 size={20} className="animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="calendar-grid">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isBlocked = blockedDates.includes(dateStr);
            const isToggling = toggling === dateStr;
            const dayToday = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => toggleDate(dateStr)}
                disabled={isToggling}
                title={isBlocked ? `Click to unblock ${format(day, 'MMM d')}` : `Click to block ${format(day, 'MMM d')}`}
                className={clsx('calendar-day relative group', {
                  blocked: isBlocked,
                  today: dayToday && !isBlocked,
                })}
              >
                {isToggling ? (
                  <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                ) : (
                  <>
                    {format(day, 'd')}
                    <span className={clsx(
                      'absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs',
                      isBlocked ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    )}>
                      {isBlocked ? <Unlock size={12} /> : <Lock size={12} />}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-900/40 border border-red-500/40" />
          <span>Blocked (no bookings)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-[var(--accent)]" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={10} />
          <span>Hover to toggle</span>
        </div>
      </div>
    </div>
  );
}
