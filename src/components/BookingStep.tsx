'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  format, addDays, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isSameDay, isSameMonth,
  isToday, isPast, startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const TIME_SLOTS: string[] = [];
for (let h = 9; h < 20; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}
TIME_SLOTS.push('20:00');

interface BookingProps {
  leadId: string;
  onComplete: (date: string, time: string) => void;
}

export default function BookingStep({ leadId, onComplete }: BookingProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBlocked, setFetchingBlocked] = useState(true);
  const [error, setError] = useState('');

  const today   = startOfDay(new Date());
  const maxDate = addDays(today, 5);

  useEffect(() => { fetchBlockedDates(); }, []);

  async function fetchBlockedDates() {
    setFetchingBlocked(true);
    const { data, error } = await supabase.from('blocked_dates').select('date');
    if (!error && data) setBlockedDates(data.map((d) => d.date));
    setFetchingBlocked(false);
  }

  const monthStart   = startOfMonth(currentMonth);
  const monthEnd     = endOfMonth(currentMonth);
  const days         = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  function isDateBlocked(date: Date) {
    return blockedDates.includes(format(date, 'yyyy-MM-dd'));
  }

  function isDateSelectable(date: Date) {
    const d = startOfDay(date);
    return (
      !isPast(d) && d >= today && d <= maxDate &&
      !isDateBlocked(date) && isSameMonth(date, currentMonth)
    );
  }

  function handleDayClick(date: Date) {
    if (!isDateSelectable(date)) return;
    setSelectedDate(date); setSelectedTime(null); setError('');
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and a time slot.'); return;
    }
    setLoading(true); setError('');
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ appointment_date: dateStr, appointment_time: selectedTime })
        .eq('id', leadId);
      if (updateError) throw updateError;
      onComplete(dateStr, selectedTime);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to book. Please try again.');
    } finally { setLoading(false); }
  }

  const isBlockedSelected = selectedDate && isDateBlocked(selectedDate);
  const showTimeSlots     = selectedDate && !isBlockedSelected;

  return (
    <div className="fade-in-up">
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-semibold text-[var(--text-primary)] text-sm">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <ChevronRight size={16} />
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

      {/* Calendar */}
      {fetchingBlocked ? (
        <div className="flex items-center justify-center h-40 gap-3 text-[var(--text-muted)]">
          <div className="spinner-brand" /> <span className="text-sm">Loading availability…</span>
        </div>
      ) : (
        <div className="calendar-grid">
          {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const selectable = isDateSelectable(day);
            const blocked    = isDateBlocked(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const dayToday   = isToday(day);
            const inRange    =
              !isPast(startOfDay(day)) &&
              startOfDay(day) >= today &&
              startOfDay(day) <= maxDate &&
              isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={!selectable}
                className={clsx('calendar-day', {
                  selected: isSelected,
                  blocked:  blocked && inRange,
                  today:    dayToday && !isSelected,
                  disabled: !selectable && !blocked,
                  'other-month': !isSameMonth(day, currentMonth),
                })}
                title={
                  blocked && inRange ? 'Blocked by admin' :
                  !inRange ? 'Outside 5-day window' : undefined
                }
              >
                {format(day, 'd')}
                {blocked && inRange && (
                  <span className="absolute bottom-0.5 right-0.5 text-[7px]" style={{ color: 'var(--rose)' }}>✕</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 mb-5 text-xs text-[var(--text-muted)]">
        {[
          { color: 'linear-gradient(135deg,var(--brand),var(--brand-light))', label: 'Selected' },
          { color: 'var(--rose-subtle)', border: '1px solid #fecdd3', label: 'Blocked' },
          { color: 'transparent',        border: '1.5px solid var(--brand)', label: 'Today' },
        ].map(({ color, border, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color, border }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Time slots */}
      {showTimeSlots && (
        <div className="mt-1 fade-in-up">
          <div
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
          >
            <Clock size={14} style={{ color: 'var(--brand)' }} />
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Available times — {format(selectedDate, 'EEE, MMM d')}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {TIME_SLOTS.map((slot) => {
              const [h]   = slot.split(':').map(Number);
              const ampm  = h < 12 ? 'AM' : 'PM';
              const h12   = h % 12 === 0 ? 12 : h % 12;
              const min   = slot.split(':')[1];
              const label = `${h12}:${min} ${ampm}`;
              return (
                <button
                  key={slot}
                  onClick={() => { setSelectedTime(slot); setError(''); }}
                  className={clsx('time-slot', { selected: selectedTime === slot })}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Blocked warning */}
      {selectedDate && isDateBlocked(selectedDate) && (
        <div
          className="mt-4 p-3 rounded-xl flex items-center gap-2.5 text-sm font-medium"
          style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3', color: 'var(--rose)' }}
        >
          <AlertCircle size={15} /> This date is blocked. Please choose another date.
        </div>
      )}

      {error && (
        <div
          className="mt-3 p-3 rounded-xl flex items-center gap-2.5 text-sm font-medium"
          style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3', color: 'var(--rose)' }}
        >
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Selection summary */}
      {selectedDate && selectedTime && (
        <div
          className="mt-4 p-3 rounded-xl flex items-center gap-2.5 text-sm font-semibold slide-in"
          style={{ background: 'var(--brand-subtle)', border: '1px solid #c7d2fe', color: 'var(--brand)' }}
        >
          <CalendarDays size={15} />
          {format(selectedDate, 'MMMM d, yyyy')} at{' '}
          {(() => {
            const [h] = selectedTime.split(':').map(Number);
            const ampm = h < 12 ? 'AM' : 'PM';
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${h12}:${selectedTime.split(':')[1]} ${ampm}`;
          })()}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={loading || !selectedDate || !selectedTime}
          className="btn-primary"
        >
          {loading ? <div className="spinner" /> : <CheckCircle2 size={17} />}
          {loading ? 'Booking…' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
}
