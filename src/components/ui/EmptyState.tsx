import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-border ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-accent/30 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-text font-heading">{title}</h3>
      <p className="text-xs sm:text-sm text-text-muted max-w-sm mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
