'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import StepIndicator from '@/components/StepIndicator';
import BookingStep from '@/components/BookingStep';
import { User, Building2, DollarSign, Calendar, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const COMPANY_SIZES = ['1–2', '3–5', '6–10', '11–25', '26–50', '51–100', '100+'];

const REVENUE_RANGES = [
  { label: '$0 – $200K', value: '$0-$200K', numeric: 0 },
  { label: '$200K – $500K', value: '$200K-$500K', numeric: 200000 },
  { label: '$500K – $1M', value: '$500K-$1M', numeric: 500000 },
  { label: '$1M – $2M', value: '$1M-$2M', numeric: 1000000 },
  { label: '$2M – $5M', value: '$2M-$5M', numeric: 2000000 },
  { label: '$5M+', value: '$5M+', numeric: 5000000 },
];

function isHighRevenue(revenueValue: string) {
  const match = REVENUE_RANGES.find((r) => r.value === revenueValue);
  return match ? match.numeric >= 2000000 : false;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  extraQuestions: string;
  companySize: string;
  companyRevenue: string;
}

export default function LeadCaptureForm() {
  const [step, setStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [globalError, setGlobalError] = useState('');
  const [bookingDone, setBookingDone] = useState(false);
  const [bookedDate, setBookedDate] = useState('');
  const [bookedTime, setBookedTime] = useState('');

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    extraQuestions: '',
    companySize: '',
    companyRevenue: '',
  });

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setGlobalError('');
  }

  // ─── Validation ──────────────────────────────────────────────────────────────
  function validateStep1() {
    const errs: Partial<FormData> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Valid email is required';
    if (!form.phone.trim() || !/^\+?[\d\s\-().]{7,}$/.test(form.phone))
      errs.phone = 'Valid phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Step 1 submit → save to Supabase as "Lead" ──────────────────────────────
  async function handleStep1Next() {
    if (!validateStep1()) return;
    setLoading(true);
    setGlobalError('');
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          extra_questions: form.extraQuestions.trim() || null,
          pipeline_stage: 'Lead',
        })
        .select('id')
        .single();

      if (error) throw error;
      setLeadId(data.id);
      setStep(2);
    } catch (err: unknown) {
      setGlobalError(
        err instanceof Error ? err.message : 'Failed to save your info. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2 → save company size ──────────────────────────────────────────────
  async function handleStep2Next() {
    if (!form.companySize) { setErrors({ companySize: 'Please select company size' }); return; }
    setLoading(true);
    try {
      await supabase.from('leads').update({ company_size: form.companySize }).eq('id', leadId!);
      setStep(3);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 3 → save revenue ───────────────────────────────────────────────────
  async function handleStep3Next() {
    if (!form.companyRevenue) { setErrors({ companyRevenue: 'Please select revenue range' }); return; }
    setLoading(true);
    try {
      await supabase.from('leads').update({ company_revenue: form.companyRevenue }).eq('id', leadId!);
      setStep(4);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 4 booking complete ──────────────────────────────────────────────────
  async function handleBookingComplete(date: string, time: string) {
    const highRevenue = isHighRevenue(form.companyRevenue);
    const newStage = highRevenue ? 'Qualified' : 'Appointment';
    await supabase
      .from('leads')
      .update({ pipeline_stage: newStage })
      .eq('id', leadId!);
    setBookedDate(date);
    setBookedTime(time);
    setBookingDone(true);
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  if (bookingDone) {
    const [h, m] = bookedTime.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const displayTime = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;

    return (
      <div className="text-center py-8 fade-in-up">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">You&apos;re all set!</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Your appointment has been confirmed for
        </p>
        <div className="inline-block p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/30 mb-6">
          <div className="text-xl font-bold text-indigo-300">
            {format(new Date(bookedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="text-lg text-indigo-200 mt-1">{displayTime}</div>
        </div>
        <p className="text-[var(--text-muted)] text-sm">
          We&apos;ll be in touch shortly. You can close this tab.
        </p>
        {isHighRevenue(form.companyRevenue) && (
          <div className="mt-4 p-3 rounded-lg bg-violet-900/20 border border-violet-500/30 inline-block">
            <p className="text-violet-300 text-sm font-medium">
              🎉 Based on your revenue, you&apos;ve been fast-tracked to Qualified status!
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <StepIndicator currentStep={step} />

      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />
          {globalError}
        </div>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <User size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Contact Information</h2>
              <p className="text-[var(--text-muted)] text-sm">Tell us a bit about yourself</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
              />
              {errors.firstName && <p className="error-msg"><AlertCircle size={12} />{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Smith"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
              />
              {errors.lastName && <p className="error-msg"><AlertCircle size={12} />{errors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="error-msg"><AlertCircle size={12} />{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
              />
              {errors.phone && <p className="error-msg"><AlertCircle size={12} />{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Any questions or comments? <span className="text-[var(--text-muted)] font-normal">(optional)</span>
              </label>
              <textarea
                id="extraQuestions"
                rows={3}
                placeholder="Share any questions you have for us..."
                value={form.extraQuestions}
                onChange={(e) => set('extraQuestions', e.target.value)}
                className="form-input resize-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleStep1Next}
              disabled={loading}
              id="step1-next"
              className="btn-primary"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Saving...' : 'Continue'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Building2 size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Company Size</h2>
              <p className="text-[var(--text-muted)] text-sm">How many employees does your company have?</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {COMPANY_SIZES.map((size) => (
              <button
                key={size}
                id={`size-${size}`}
                onClick={() => { set('companySize', size); setErrors({}); }}
                className={`p-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  form.companySize === size
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#3a3a5a] hover:text-[var(--text-primary)]'
                }`}
              >
                {size} employees
              </button>
            ))}
          </div>
          {errors.companySize && <p className="error-msg mt-2"><AlertCircle size={12} />{errors.companySize}</p>}
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">
              <ArrowLeft size={18} /> Back
            </button>
            <button onClick={handleStep2Next} disabled={loading} id="step2-next" className="btn-primary">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Saving...' : 'Continue'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <DollarSign size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Annual Revenue</h2>
              <p className="text-[var(--text-muted)] text-sm">Approximate yearly revenue for your business</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REVENUE_RANGES.map((range) => (
              <button
                key={range.value}
                id={`revenue-${range.value}`}
                onClick={() => { set('companyRevenue', range.value); setErrors({}); }}
                className={`p-4 rounded-xl border text-sm font-semibold transition-all duration-200 text-left ${
                  form.companyRevenue === range.value
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10'
                    : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[#3a3a5a] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className={form.companyRevenue === range.value ? 'text-indigo-400' : 'text-[var(--text-muted)]'} />
                  {range.label}
                </div>
                {range.numeric >= 2000000 && (
                  <div className="mt-1 text-xs text-violet-400 font-medium">⚡ Fast-track qualified</div>
                )}
              </button>
            ))}
          </div>
          {errors.companyRevenue && <p className="error-msg mt-2"><AlertCircle size={12} />{errors.companyRevenue}</p>}
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">
              <ArrowLeft size={18} /> Back
            </button>
            <button onClick={handleStep3Next} disabled={loading} id="step3-next" className="btn-primary">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Saving...' : 'Continue'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4 ── */}
      {step === 4 && leadId && (
        <div className="fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Calendar size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Book Appointment</h2>
            </div>
          </div>
          <BookingStep leadId={leadId} onComplete={handleBookingComplete} />
          <div className="mt-4 flex justify-start">
            <button onClick={() => setStep(3)} className="btn-secondary">
              <ArrowLeft size={18} /> Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
