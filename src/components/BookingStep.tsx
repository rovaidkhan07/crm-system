'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday, isPast, startOfDay } from 'date-fns';
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

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 5);

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  async function fetchBlockedDates() {
    setFetchingBlocked(true);
    const { data, error } = await supabase.from('blocked_dates').select('date');
    if (!error && data) {
      setBlockedDates(data.map((d) => d.date));
    }
    setFetchingBlocked(false);
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  function isDateBlocked(date: Date) {
    const formatted = format(date, 'yyyy-MM-dd');
    return blockedDates.includes(formatted);
  }

  function isDateSelectable(date: Date) {
    const d = startOfDay(date);
    return (
      !isPast(d) &&
      d >= today &&
      d <= maxDate &&
      !isDateBlocked(date) &&
      isSameMonth(date, currentMonth)
    );
  }

  function handleDayClick(date: Date) {
    if (!isDateSelectable(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
    setError('');
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time slot.');
      return;
    }
    setLoading(true);
    setError('');
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          appointment_date: dateStr,
          appointment_time: selectedTime,
        })
        .eq('id', leadId);
      if (updateError) throw updateError;
      onComplete(dateStr, selectedTime);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isBlockedSelected = selectedDate && isDateBlocked(selectedDate);
  const showTimeSlots = selectedDate && !isBlockedSelected;

  return (
    <div className="fade-in-up">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Book Your Appointment</h2>
        <p className="text-[var(--text-secondary)] text-sm">
          Select a date within the next 5 days and pick your preferred time
        </p>
      </div>

      {/* Month Nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-[var(--text-primary)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
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

      {/* Calendar days */}
      {fetchingBlocked ? (
        <div className="flex items-center justify-center h-40 gap-3 text-[var(--text-muted)]">
          <div className="spinner border-[var(--text-muted)] border-t-[var(--accent)]" />
          <span>Loading availability...</span>
        </div>
      ) : (
        <div className="calendar-grid">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const selectable = isDateSelectable(day);
            const blocked = isDateBlocked(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const dayToday = isToday(day);
            const inRange =
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
                  blocked: blocked && inRange,
                  today: dayToday && !isSelected,
                  disabled: !selectable && !blocked,
                  'other-month': !isSameMonth(day, currentMonth),
                })}
                title={
                  blocked && inRange
                    ? 'Date blocked by admin'
                    : !inRange
                    ? 'Outside booking window'
                    : undefined
                }
              >
                {format(day, 'd')}
                {blocked && inRange && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] text-red-400">✕</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-4 mt-3 mb-5 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-900/50 border border-red-500/40" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-[var(--accent)]" />
          <span>Today</span>
        </div>
      </div>

      {/* Time slots */}
      {showTimeSlots && (
        <div className="mt-4 fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[var(--accent)]" />
            <h4 className="font-semibold text-[var(--text-primary)] text-sm">
              Available times for {format(selectedDate, 'EEEE, MMMM d')}
            </h4>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {TIME_SLOTS.map((slot) => {
              const [h] = slot.split(':').map(Number);
              const ampm = h < 12 ? 'AM' : 'PM';
              const display12 = h % 12 === 0 ? 12 : h % 12;
              const min = slot.split(':')[1];
              const label = `${display12}:${min} ${ampm}`;
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

      {selectedDate && isDateBlocked(selectedDate) && (
        <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />
          This date is blocked. Please choose another date.
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="mt-4 p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/30 flex items-center gap-2 text-sm text-indigo-300">
          <CalendarDays size={16} />
          Selected: <strong>{format(selectedDate, 'MMMM d, yyyy')}</strong> at{' '}
          <strong>{selectedTime}</strong>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={loading || !selectedDate || !selectedTime}
          className="btn-primary"
        >
          {loading ? <div className="spinner" /> : <CheckCircle2 size={18} />}
          {loading ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
}
