import React from 'react';
import { Check } from 'lucide-react';

export interface AuthStepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  className?: string;
}

export const AuthStepper: React.FC<AuthStepperProps> = ({
  currentStep,
  onStepClick,
  className = '',
}) => {
  const steps = [
    { id: 1 as const, label: 'Account' },
    { id: 2 as const, label: 'Personal Info' },
    { id: 3 as const, label: 'Preferences' },
  ];

  return (
    <div className={`w-full max-w-lg mx-auto flex items-center justify-between px-2 ${className}`}>
      {steps.map((step, idx) => {
        const isCurrent = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isClickable = onStepClick && step.id <= currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step Pill / Indicator */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                isCurrent
                  ? 'bg-primary text-white shadow-xs ring-2 ring-primary/20'
                  : isCompleted
                  ? 'bg-emerald-50 text-primary hover:bg-emerald-100 cursor-pointer'
                  : 'text-gray-400 cursor-default'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : isCompleted
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.id}
              </span>
              <span className="whitespace-nowrap hidden min-[360px]:inline">{step.label}</span>
            </button>

            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1.5 sm:mx-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStep > step.id ? 'bg-primary w-full' : 'w-0'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

