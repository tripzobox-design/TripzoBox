import React, { useRef, useEffect } from 'react';

export interface OtpInputGroupProps {
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}

export const OtpInputGroup: React.FC<OtpInputGroupProps> = ({
  value,
  onChange,
  onComplete,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const newValues = [...value];

    if (!val) {
      newValues[index] = '';
      onChange(newValues);
      return;
    }

    // Single digit input
    newValues[index] = val.slice(-1);
    onChange(newValues);

    // Auto-advance to next box if available
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if full OTP is entered
    if (newValues.every((digit) => digit !== '') && newValues.length === 6) {
      onComplete?.(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newValues = [...value];
    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || '';
    }
    onChange(newValues);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      onComplete?.(pastedData);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3.5 my-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={`w-11 h-12 sm:w-13 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border transition-all duration-200 outline-none
            ${
              value[idx]
                ? 'border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30'
                : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20'
            }`}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};

