'use client';

import { CheckIcon } from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { label: 'Contact Info',   short: 'Contact' },
  { label: 'Company Size',   short: 'Company' },
  { label: 'Revenue',        short: 'Revenue' },
  { label: 'Book Slot',      short: 'Book' },
];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="w-full h-1 rounded-full mb-6 overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
            background: 'linear-gradient(90deg, var(--brand), var(--brand-light))',
          }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center w-full">
        {STEPS.map(({ label, short }, index) => {
          const stepNum   = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive    = stepNum === currentStep;
          const isPending   = stepNum > currentStep;

          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx('step-dot', {
                    completed: isCompleted,
                    active: isActive,
                    pending: isPending,
                  })}
                >
                  {isCompleted ? <CheckIcon size={14} strokeWidth={2.5} /> : stepNum}
                </div>
                <span
                  className={clsx('text-[0.7rem] font-semibold whitespace-nowrap hidden sm:block', {
                    'text-[var(--emerald)]': isCompleted,
                    'text-[var(--brand)]':   isActive,
                    'text-[var(--text-muted)]': isPending,
                  })}
                >
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={clsx('step-line mx-2', {
                    completed: isCompleted,
                    pending: !isCompleted,
                  })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
