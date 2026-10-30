import React from 'react';
import { Link } from 'react-router-dom';

export interface LogoProps {
  variant?: 'horizontal' | 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  asLink?: boolean;
  to?: string;
  inverted?: boolean; // For dark backgrounds (e.g., auth hero pane)
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showTagline = true,
  className = '',
  asLink = false,
  to = '/',
  inverted = false,
}) => {
  // Height sizing for the logo images
  const sizeClasses = {
    xs: { icon: 'h-7', horiz: 'h-8', full: 'h-14', text: 'text-lg', tag: 'text-[9px]' },
    sm: { icon: 'h-8', horiz: 'h-9', full: 'h-16', text: 'text-xl', tag: 'text-[10px]' },
    md: { icon: 'h-10', horiz: 'h-11', full: 'h-20', text: 'text-2xl', tag: 'text-[11px]' },
    lg: { icon: 'h-12', horiz: 'h-14', full: 'h-24', text: 'text-3xl', tag: 'text-xs' },
    xl: { icon: 'h-16', horiz: 'h-18', full: 'h-32', text: 'text-4xl', tag: 'text-sm' },
  }[size];

  const renderContent = () => {
    if (variant === 'icon') {
      return (
        <img
          src="/logo-icon.png"
          alt="Tripzobox"
          className={`${sizeClasses.icon} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        />
      );
    }

    if (variant === 'full') {
      return (
        <img
          src="/logo.png"
          alt="Tripzobox — Explore The World Without Limits"
          className={`${sizeClasses.full} w-auto object-contain ${className}`}
        />
      );
    }

    // Horizontal Variant
    if (inverted) {
      // On dark backgrounds: Icon mark + white brand typography for optimal contrast
      return (
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="/logo-icon.png"
            alt="Tripzobox"
            className={`${sizeClasses.icon} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
          />
          <div className="flex flex-col text-left leading-none">
            <span
              className={`font-heading font-extrabold ${sizeClasses.text} text-white tracking-tight leading-none`}
            >
              Tripzo<span className="text-secondary">b</span>o<span className="text-[#84cc16]">x</span>
            </span>
            {showTagline && (
              <span
                className={`font-medium ${sizeClasses.tag} text-emerald-200/90 tracking-wide mt-1`}
              >
                Explore The World Without Limits
              </span>
            )}
          </div>
        </div>
      );
    }

    // Standard Horizontal on light backgrounds: Use the master horizontal logo image or icon + styled text
    return (
      <div className="flex items-center gap-2.5 sm:gap-3">
        <img
          src="/logo-icon.png"
          alt="Tripzobox"
          className={`${sizeClasses.icon} w-auto shrink-0 object-contain transition-transform duration-200 group-hover:scale-105`}
        />
        <div className="flex flex-col items-start leading-none">
          <span
            className={`font-heading font-extrabold ${sizeClasses.text} tracking-tight text-[#087b68]`}
          >
            Tripzo<span className="text-[#159b6f]">b</span>o<span className="text-[#84cc16]">x</span>
          </span>
          {showTagline && (
            <span
              className={`mt-1 font-semibold tracking-wide text-[#1c9a82] ${sizeClasses.tag}`}
            >
              Explore The World Without Limits
            </span>
          )}
        </div>
      </div>
    );
  };

  if (asLink) {
    return (
      <Link
        to={to}
        className={`inline-flex items-center group ${className}`}
        aria-label="Tripzobox Home"
      >
        {renderContent()}
      </Link>
    );
  }

  return <div className={`inline-flex items-center ${className}`}>{renderContent()}</div>;
};

export default Logo;
