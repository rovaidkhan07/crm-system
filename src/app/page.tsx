import Navbar from '@/components/Navbar';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { Shield, Clock, CalendarCheck } from 'lucide-react';

export const metadata = {
  title: 'Book a Free Strategy Session | NexusCRM',
  description:
    'Schedule your free 30-minute business strategy consultation in under 2 minutes. Fast, simple, and no commitment required.',
};

const TRUST_ITEMS = [
  { icon: Shield, label: 'Secure & Private', sub: '256-bit encrypted' },
  { icon: Clock,   label: '2-Minute Setup',  sub: 'Quick & easy' },
  { icon: CalendarCheck, label: 'Flexible Timing', sub: 'You pick the slot' },
];

export default function HomePage() {
  return (
    <div className="page-bg">
      <Navbar />

      <main className="relative z-10 flex items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-2xl">

          {/* ── Hero text ─────────────────────────────────── */}
          <div className="text-center mb-10 fade-in-up">
            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: 'var(--brand-subtle)',
                color: 'var(--brand)',
                border: '1px solid #c7d2fe',
              }}
            >
              <span
                className="status-dot"
                style={{ background: 'var(--brand)', width: '6px', height: '6px' }}
              />
              Free Consultation · No Commitment
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] mb-4 leading-tight tracking-tight">
              Let&apos;s Grow Your{' '}
              <span className="gradient-text">Business Together</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-base max-w-md mx-auto leading-relaxed">
              Complete the form below to schedule your free 30-minute strategy session.
              Takes less than 2 minutes.
            </p>
          </div>

          {/* ── Form card ─────────────────────────────────── */}
          <div
            className="card-elevated fade-in-up"
            style={{ animationDelay: '0.08s' }}
          >
            <LeadCaptureForm />
          </div>

          {/* ── Trust badges ──────────────────────────────── */}
          <div
            className="flex items-center justify-center gap-6 mt-8 flex-wrap fade-in-up"
            style={{ animationDelay: '0.16s' }}
          >
            {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2 text-center">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--brand-subtle)' }}
                >
                  <Icon size={13} style={{ color: 'var(--brand)' }} strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[var(--text-primary)] leading-none">{label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
