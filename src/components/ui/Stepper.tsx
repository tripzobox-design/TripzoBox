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
            <div
              onClick={() => isClickable && onStepClick(step.id)}
              className={`flex items-center gap-2.5 ${
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
                className={`text-xs sm:text-sm font-medium whitespace-nowrap
                  ${isCurrent ? 'text-text font-semibold' : 'text-text-muted'}`}
              >
                {step.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex-1 mx-3 sm:mx-4 h-0.5 bg-border rounded-full overflow-hidden">
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
