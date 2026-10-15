import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center min-w-0 max-w-full gap-2 overflow-x-auto pb-1 no-scrollbar ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-2 text-xs sm:text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary text-white shadow-subtle'
                    : 'bg-white text-text-muted hover:text-text border border-border'
                }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-light-bg text-text-muted'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'segmented') {
    return (
      <div className={`flex items-center p-1 bg-light-bg rounded-xl border border-border ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 text-center py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary text-white shadow-subtle'
                    : 'text-text-muted hover:text-text'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  return (
    <div className={`flex items-center min-w-0 max-w-full gap-4 sm:gap-6 border-b border-border overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative py-3.5 text-sm sm:text-base font-semibold whitespace-nowrap transition-colors duration-200
              ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'}`}
          >
            <div className="flex items-center gap-2">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-normal ${
                    isActive ? 'bg-accent/40 text-primary-dark' : 'bg-gray-100 text-text-muted'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full transition-all duration-200" />
            )}
          </button>
        );
      })}
    </div>
  );
};
