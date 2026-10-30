import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../ui/Logo';

export interface AuthHeaderProps {
  onBack?: () => void;
  showBack?: boolean;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  onBack,
  showBack = false,
  className = '',
}) => {
  return (
    <header className={`w-full py-4 px-4 sm:px-8 flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer mr-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Logo asLink to="/" size="sm" variant="horizontal" />
      </div>
    </header>
  );
};

