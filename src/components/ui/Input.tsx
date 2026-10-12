import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substring(2, 7)}`;
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-text tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-text-subtle pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={resolvedType}
          className={`w-full bg-white text-text text-sm rounded-xl border transition-all duration-200 outline-none
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${isPassword || rightIcon ? 'pr-11' : 'pr-4'}
            py-3
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-border focus:border-primary focus:ring-2 focus:ring-accent/40'
            }
            placeholder:text-text-subtle disabled:bg-gray-50 disabled:text-text-muted
            ${className}`}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-text-subtle hover:text-text p-1 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : (
          rightIcon && <div className="absolute right-3.5 text-text-subtle">{rightIcon}</div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500 font-medium pl-0.5">{error}</p>
      ) : (
        helperText && <p className="text-xs text-text-muted pl-0.5">{helperText}</p>
      )}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-text tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-white text-text text-sm rounded-xl border p-3.5 transition-all duration-200 outline-none resize-y
          ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-border focus:border-primary focus:ring-2 focus:ring-accent/40'
          }
          placeholder:text-text-subtle disabled:bg-gray-50 disabled:text-text-muted
          ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-red-500 font-medium pl-0.5">{error}</p>
      ) : (
        helperText && <p className="text-xs text-text-muted pl-0.5">{helperText}</p>
      )}
    </div>
  );
};

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-text tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full bg-white text-text text-sm rounded-xl border px-3.5 py-3 pr-8 appearance-none transition-all duration-200 outline-none
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-border focus:border-primary focus:ring-2 focus:ring-accent/40'
            }
            ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-subtle text-xs">
          ▼
        </div>
      </div>
      {error && <p className="text-xs text-red-500 font-medium pl-0.5">{error}</p>}
    </div>
  );
};
