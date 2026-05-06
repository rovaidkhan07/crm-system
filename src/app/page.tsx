import Navbar from '@/components/Navbar';
import LeadCaptureForm from '@/components/LeadCaptureForm';

export const metadata = {
  title: 'Schedule a Free Consultation | CRM Pro',
  description: 'Book your free consultation in 4 simple steps.',
};

export default function HomePage() {
  return (
    <main className="animated-bg min-h-screen">
      <Navbar />
      {/* Full-screen centered layout */}
      <div className="flex items-start justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-2xl">
          {/* Decorative glow orbs */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
              width: '600px', height: '600px', pointerEvents: 'none', zIndex: 0,
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 65%)',
            }}
          />

          {/* Hero text */}
          <div className="text-center mb-10" style={{ position: 'relative', zIndex: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Free Consultation
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
              Let&apos;s Grow Your{' '}
              <span className="gradient-text">Business Together</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-base max-w-md mx-auto">
              Complete the form below to schedule your free strategy session. Takes less than 2 minutes.
            </p>
          </div>

          {/* Form card */}
          <div className="card border-[var(--border)] shadow-2xl shadow-black/30" style={{ position: 'relative', zIndex: 1 }}>
            <LeadCaptureForm />
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {['🔒 Secure & Private', '⚡ 2-Minute Setup', '🗓️ Flexible Scheduling'].map((b) => (
              <span key={b} className="text-[var(--text-muted)] text-sm font-medium">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
