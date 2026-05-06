'use client';

import { CheckIcon } from 'lucide-react';
import clsx from 'clsx';

const STEPS = ['Contact Info', 'Company Size', 'Revenue', 'Book Appointment'];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center w-full mb-8">
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isPending = stepNum > currentStep;

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
                {isCompleted ? <CheckIcon size={16} /> : stepNum}
              </div>
              <span
                className={clsx('text-xs font-medium whitespace-nowrap hidden sm:block', {
                  'text-[var(--success)]': isCompleted,
                  'text-[var(--accent-hover)]': isActive,
                  'text-[var(--text-muted)]': isPending,
                })}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={clsx('step-line mx-1', {
                  completed: isCompleted,
                  pending: !isCompleted,
                })}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
