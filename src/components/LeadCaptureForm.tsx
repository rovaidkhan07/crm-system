'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import StepIndicator from '@/components/StepIndicator';
import BookingStep from '@/components/BookingStep';
import {
  User, Building2, DollarSign, Calendar, CheckCircle2,
  ArrowRight, ArrowLeft, AlertCircle, Loader2, Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

const COMPANY_SIZES = ['1–2', '3–5', '6–10', '11–25', '26–50', '51–100', '100+'];

const REVENUE_RANGES = [
  { label: '$0 – $200K',   value: '$0-$200K',   numeric: 0 },
  { label: '$200K – $500K', value: '$200K-$500K', numeric: 200000 },
  { label: '$500K – $1M',  value: '$500K-$1M',  numeric: 500000 },
  { label: '$1M – $2M',    value: '$1M-$2M',    numeric: 1000000 },
  { label: '$2M – $5M',    value: '$2M-$5M',    numeric: 2000000 },
  { label: '$5M+',         value: '$5M+',       numeric: 5000000 },
];

function isHighRevenue(v: string) {
  const m = REVENUE_RANGES.find((r) => r.value === v);
  return m ? m.numeric >= 2000000 : false;
}

interface FormData {
  firstName: string; lastName: string; email: string;
  phone: string; extraQuestions: string;
  companySize: string; companyRevenue: string;
}

/* ─── Step section header ──────────────────────────────────── */
function SectionHeader({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--brand-subtle)', border: '1px solid #c7d2fe' }}
      >
        <Icon size={16} style={{ color: 'var(--brand)' }} strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{title}</h2>
        {sub && <p className="text-sm text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Field wrapper ────────────────────────────────────────── */
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
        {label}
        {required && <span className="ml-1 text-[var(--rose)]">*</span>}
      </label>
      {children}
      {error && (
        <p className="error-msg">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

export default function LeadCaptureForm() {
  const [step, setStep]           = useState(1);
  const [leadId, setLeadId]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<Partial<FormData>>({});
  const [globalError, setGlobalError] = useState('');
  const [bookingDone, setBookingDone] = useState(false);
  const [bookedDate, setBookedDate]   = useState('');
  const [bookedTime, setBookedTime]   = useState('');

  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    extraQuestions: '', companySize: '', companyRevenue: '',
  });

  function set(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: '' }));
    setGlobalError('');
  }

  /* validation */
  function validateStep1() {
    const errs: Partial<FormData> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim())  errs.lastName  = 'Last name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'A valid email is required';
    if (!form.phone.trim() || !/^\+?[\d\s\-().]{7,}$/.test(form.phone))
      errs.phone = 'A valid phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleStep1Next() {
    if (!validateStep1()) return;
    setLoading(true); setGlobalError('');
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          first_name:      form.firstName.trim(),
          last_name:       form.lastName.trim(),
          email:           form.email.trim().toLowerCase(),
          phone:           form.phone.trim(),
          extra_questions: form.extraQuestions.trim() || null,
          pipeline_stage:  'Lead',
        })
        .select('id').single();
      if (error) throw error;
      setLeadId(data.id);
      setStep(2);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleStep2Next() {
    if (!form.companySize) { setErrors({ companySize: 'Please select a company size' }); return; }
    setLoading(true);
    try {
      await supabase.from('leads').update({ company_size: form.companySize }).eq('id', leadId!);
      setStep(3);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save.');
    } finally { setLoading(false); }
  }

  async function handleStep3Next() {
    if (!form.companyRevenue) { setErrors({ companyRevenue: 'Please select a revenue range' }); return; }
    setLoading(true);
    try {
      await supabase.from('leads').update({ company_revenue: form.companyRevenue }).eq('id', leadId!);
      setStep(4);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save.');
    } finally { setLoading(false); }
  }

  async function handleBookingComplete(date: string, time: string) {
    const stage = isHighRevenue(form.companyRevenue) ? 'Qualified' : 'Appointment';
    await supabase.from('leads').update({ pipeline_stage: stage }).eq('id', leadId!);
    setBookedDate(date); setBookedTime(time); setBookingDone(true);
  }

  /* ── Success screen ───────────────────────────────────── */
  if (bookingDone) {
    const [h, m] = bookedTime.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const displayTime = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;

    return (
      <div className="text-center py-8 fade-in-up">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--emerald-subtle)', border: '2px solid #a7f3d0' }}
        >
          <CheckCircle2 size={36} style={{ color: 'var(--emerald)' }} />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">You&apos;re all set! 🎉</h2>
        <p className="text-[var(--text-secondary)] mb-6">Your appointment has been confirmed:</p>

        <div
          className="inline-block px-6 py-4 rounded-xl mb-6"
          style={{ background: 'var(--brand-subtle)', border: '1px solid #c7d2fe' }}
        >
          <div className="text-xl font-bold" style={{ color: 'var(--brand)' }}>
            {format(new Date(bookedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="text-lg font-semibold mt-1 text-[var(--text-secondary)]">{displayTime}</div>
        </div>

        <p className="text-[var(--text-muted)] text-sm mb-4">
          We&apos;ll reach out shortly with details. You can safely close this tab.
        </p>

        {isHighRevenue(form.companyRevenue) && (
          <div
            className="mt-4 px-4 py-3 rounded-xl inline-flex items-center gap-2"
            style={{ background: 'var(--violet-subtle)', border: '1px solid #ddd6fe' }}
          >
            <Sparkles size={15} style={{ color: 'var(--violet)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--violet)' }}>
              Based on your revenue, you&apos;ve been fast-tracked to Qualified!
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────────────── */
  return (
    <div className="fade-in-up">
      <StepIndicator currentStep={step} />

      {globalError && (
        <div
          className="mb-5 p-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium"
          style={{ background: 'var(--rose-subtle)', border: '1px solid #fecdd3', color: 'var(--rose)' }}
        >
          <AlertCircle size={16} /> {globalError}
        </div>
      )}

      {/* ── STEP 1: Contact ─────────────────────────────── */}
      {step === 1 && (
        <div className="fade-in-up">
          <SectionHeader icon={User} title="Contact Information" sub="Tell us a bit about yourself" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required error={errors.firstName}>
              <input
                id="firstName" type="text" placeholder="John"
                value={form.firstName} onChange={(e) => set('firstName', e.target.value)}
                className={`form-input ${errors.firstName ? 'error' : ''}`}
              />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input
                id="lastName" type="text" placeholder="Smith"
                value={form.lastName} onChange={(e) => set('lastName', e.target.value)}
                className={`form-input ${errors.lastName ? 'error' : ''}`}
              />
            </Field>
            <Field label="Email Address" required error={errors.email}>
              <input
                id="email" type="email" placeholder="john@company.com"
                value={form.email} onChange={(e) => set('email', e.target.value)}
                className={`form-input ${errors.email ? 'error' : ''}`}
              />
            </Field>
            <Field label="Phone Number" required error={errors.phone}>
              <input
                id="phone" type="tel" placeholder="+1 (555) 000-0000"
                value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className={`form-input ${errors.phone ? 'error' : ''}`}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Any questions or comments?" error={undefined}>
                <textarea
                  id="extraQuestions" rows={3}
                  placeholder="Share anything you'd like us to know before the call..."
                  value={form.extraQuestions} onChange={(e) => set('extraQuestions', e.target.value)}
                  className="form-input resize-none"
                />
              </Field>
              <p className="text-xs text-[var(--text-muted)] mt-1">Optional</p>
            </div>
          </div>
          <div className="mt-7 flex justify-end">
            <button onClick={handleStep1Next} disabled={loading} id="step1-next" className="btn-primary">
              {loading ? <Loader2 size={17} className="animate-spin" /> : null}
              {loading ? 'Saving...' : 'Continue'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Company Size ─────────────────────────── */}
      {step === 2 && (
        <div className="fade-in-up">
          <SectionHeader icon={Building2} title="Company Size" sub="How many employees does your company have?" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {COMPANY_SIZES.map((size) => {
              const isSelected = form.companySize === size;
              return (
                <button
                  key={size} id={`size-${size}`}
                  onClick={() => { set('companySize', size); setErrors({}); }}
                  className="p-3.5 rounded-xl border-[1.5px] text-sm font-semibold transition-all duration-200"
                  style={isSelected ? {
                    background: 'var(--brand-subtle)',
                    borderColor: 'var(--brand)',
                    color: 'var(--brand)',
                    boxShadow: '0 0 0 3px var(--brand-glow)',
                  } : {
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="text-base font-bold mb-0.5">{size}</div>
                  <div className="text-xs font-normal opacity-70">employees</div>
                </button>
              );
            })}
          </div>
          {errors.companySize && (
            <p className="error-msg mt-2"><AlertCircle size={12} />{errors.companySize}</p>
          )}
          <div className="mt-7 flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={17} /> Back</button>
            <button onClick={handleStep2Next} disabled={loading} id="step2-next" className="btn-primary">
              {loading ? <Loader2 size={17} className="animate-spin" /> : null}
              {loading ? 'Saving...' : 'Continue'} {!loading && <ArrowRight size={17} />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Revenue ─────────────────────────────── */}
      {step === 3 && (
        <div className="fade-in-up">
          <SectionHeader icon={DollarSign} title="Annual Revenue" sub="Approximate yearly revenue for your business" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REVENUE_RANGES.map((range) => {
              const isSelected = form.companyRevenue === range.value;
              const isHigh = range.numeric >= 2000000;
              return (
                <button
                  key={range.value} id={`revenue-${range.value}`}
                  onClick={() => { set('companyRevenue', range.value); setErrors({}); }}
                  className="p-4 rounded-xl border-[1.5px] text-sm font-semibold transition-all duration-200 text-left"
                  style={isSelected ? {
                    background: 'var(--brand-subtle)',
                    borderColor: 'var(--brand)',
                    color: 'var(--brand)',
                    boxShadow: '0 0 0 3px var(--brand-glow)',
                  } : {
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={13} />
                    <span>{range.label}</span>
                  </div>
                  {isHigh && (
                    <div
                      className="text-xs font-semibold flex items-center gap-1 mt-1"
                      style={{ color: isSelected ? 'var(--violet)' : 'var(--violet)' }}
                    >
                      <Sparkles size={11} /> Fast-track qualified
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {errors.companyRevenue && (
            <p className="error-msg mt-2"><AlertCircle size={12} />{errors.companyRevenue}</p>
          )}
          <div className="mt-7 flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary"><ArrowLeft size={17} /> Back</button>
            <button onClick={handleStep3Next} disabled={loading} id="step3-next" className="btn-primary">
              {loading ? <Loader2 size={17} className="animate-spin" /> : null}
              {loading ? 'Saving...' : 'Continue'} {!loading && <ArrowRight size={17} />}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Booking ─────────────────────────────── */}
      {step === 4 && leadId && (
        <div className="fade-in-up">
          <SectionHeader icon={Calendar} title="Book Your Appointment" sub="Pick a date and time that works for you" />
          <BookingStep leadId={leadId} onComplete={handleBookingComplete} />
          <div className="mt-4 flex justify-start">
            <button onClick={() => setStep(3)} className="btn-secondary"><ArrowLeft size={17} /> Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
