import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'flat' | 'interactive' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    surface: 'bg-white rounded-2xl border border-border/80 shadow-card',
    flat: 'bg-light-bg rounded-2xl border border-border/60',
    interactive: 'bg-white rounded-2xl border border-border/80 shadow-card hover:shadow-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer',
    bordered: 'bg-white rounded-2xl border-2 border-primary/20 shadow-sm',
  };

  return (
    <div
      className={`overflow-hidden ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
