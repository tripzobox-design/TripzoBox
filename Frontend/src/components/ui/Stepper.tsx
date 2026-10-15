import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  label: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full flex items-center justify-between ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isClickable = onStepClick && step.id <= currentStep;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              disabled={!isClickable}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`min-w-0 flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 shrink-0
                  ${
                    isCompleted
                      ? 'bg-primary text-white'
                      : isCurrent
                      ? 'bg-primary text-white ring-4 ring-accent/40 shadow-sm'
                      : 'bg-white border border-border text-text-muted'
                  }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`max-w-[72px] sm:max-w-none text-[11px] sm:text-sm font-medium text-center sm:text-left sm:whitespace-nowrap
                  ${isCurrent ? 'text-text font-semibold' : 'text-text-muted'}`}
              >
                {step.label}
              </span>
            </button>

            {idx < steps.length - 1 && (
              <div className="flex-1 min-w-2 mx-2 sm:mx-4 h-0.5 bg-border rounded-full overflow-hidden">
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
