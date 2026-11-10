import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'indigo' | 'cyan';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  trend,
  onClick,
}) => {
  const colorStyles = {
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badgeBg: 'bg-emerald-50 text-emerald-700',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      badgeBg: 'bg-blue-50 text-blue-700',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      badgeBg: 'bg-purple-50 text-purple-700',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badgeBg: 'bg-amber-50 text-amber-700',
    },
    red: {
      iconBg: 'bg-red-50 text-red-600 border-red-100',
      badgeBg: 'bg-red-50 text-red-700',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badgeBg: 'bg-indigo-50 text-indigo-700',
    },
    cyan: {
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
      badgeBg: 'bg-cyan-50 text-cyan-700',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-emerald-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h4>
        </div>
        <div className={`p-3 rounded-xl border ${colorStyles.iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span className="truncate">{subtitle}</span>
          {trend && (
            <span
              className={`font-semibold shrink-0 ml-2 px-2 py-0.5 rounded-full ${
                trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

