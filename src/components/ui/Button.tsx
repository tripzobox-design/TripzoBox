import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline-white';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2 min-h-[44px]',
    lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5 min-h-[48px]',
  };

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-subtle hover:shadow-hover hover:-translate-y-0.5',
    secondary: 'bg-white text-primary border border-primary hover:bg-accent-light',
    ghost: 'text-primary hover:text-primary-hover hover:bg-primary-light/50 p-2',
    'outline-white': 'bg-white/20 backdrop-blur-md text-white border border-white/60 hover:bg-white/30',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
