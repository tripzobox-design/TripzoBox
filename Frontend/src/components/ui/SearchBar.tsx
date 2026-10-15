import React, { useState } from 'react';
import { Search, MapPin, Calendar, Wallet } from 'lucide-react';
import { Button } from './Button';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  onSubmit?: () => void;
  className?: string;
}

export const SimpleSearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search destinations, trips, or people...',
  value,
  onChange,
  onSubmit,
  className = '',
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit && onSubmit();
      }}
      className={`relative flex items-center w-full ${className}`}
    >
      <Search className="absolute left-3.5 w-4 h-4 text-text-subtle pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-light-bg sm:bg-white text-text text-sm rounded-xl pl-10 pr-4 py-2.5 border border-border focus:border-primary focus:ring-2 focus:ring-accent/40 outline-none transition-all placeholder:text-text-subtle"
      />
    </form>
  );
};

export interface TripFilterBarProps {
  destination: string;
  onDestinationChange: (val: string) => void;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endDate?: string;
  onEndDateChange?: (val: string) => void;
  date?: string;
  onDateChange?: (val: string) => void;
  budget: string;
  onBudgetChange: (val: string) => void;
  onSearch: () => void;
  className?: string;
}

export const TripFilterBar: React.FC<TripFilterBarProps> = ({
  destination,
  onDestinationChange,
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  date,
  onDateChange,
  budget,
  onBudgetChange,
  onSearch,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-float border border-border p-2 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 ${className}`}
    >
      {/* Destination field */}
      <div className="flex-[1.1] flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-light-bg md:bg-transparent border md:border-0 border-border/80 focus-within:bg-light-bg/60 transition-colors">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <div className="flex flex-col text-left w-full min-w-0">
          <label className="text-[11px] font-semibold text-text-muted">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="Where do you want to go?"
            className="w-full text-sm font-medium text-text bg-transparent outline-none placeholder:text-text-subtle truncate"
          />
        </div>
      </div>

      <div className="hidden md:block w-px h-8 bg-border shrink-0 my-auto mx-1" />

      {/* Date Range: From Date to To Date */}
      <div className="flex-[1.5] flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-light-bg md:bg-transparent border md:border-0 border-border/80 focus-within:bg-light-bg/60 transition-colors min-w-0">
        <Calendar className="w-5 h-5 text-primary shrink-0" />
        <div className="flex flex-col text-left w-full min-w-0">
          <div className="flex items-center justify-between w-full pr-1">
            <label className="text-[11px] font-semibold text-text-muted">Dates (From — To)</label>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  onStartDateChange?.('');
                  onEndDateChange?.('');
                }}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 w-full">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-text-muted shrink-0">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  onStartDateChange?.(e.target.value);
                  onDateChange?.(e.target.value);
                }}
                onClick={(e) => {
                  try {
                    (e.currentTarget as any).showPicker?.();
                  } catch {}
                }}
                aria-label="Trip start date"
                className="w-full text-xs font-medium text-text bg-transparent outline-none cursor-pointer"
              />
            </div>
            <span className="text-text-muted text-xs font-bold shrink-0">→</span>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-text-muted shrink-0">To</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                onClick={(e) => {
                  try {
                    (e.currentTarget as any).showPicker?.();
                  } catch {}
                }}
                aria-label="Trip end date"
                className="w-full text-xs font-medium text-text bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block w-px h-8 bg-border shrink-0 my-auto mx-1" />

      {/* Budget field */}
      <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-light-bg md:bg-transparent border md:border-0 border-border/80 focus-within:bg-light-bg/60 transition-colors">
        <Wallet className="w-5 h-5 text-primary shrink-0" />
        <div className="flex flex-col text-left w-full min-w-0">
          <label className="text-[11px] font-semibold text-text-muted">Budget</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            placeholder="Any budget (e.g. ₹6,000)"
            className="w-full text-sm font-medium text-text bg-transparent outline-none placeholder:text-text-subtle truncate"
          />
        </div>
      </div>

      {/* Search Button */}
      <div className="shrink-0 p-1 md:pl-2">
        <Button
          variant="primary"
          onClick={onSearch}
          className="w-full md:w-auto px-7 py-3 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2"
          icon={<Search className="w-4 h-4" />}
        >
          Search
        </Button>
      </div>
    </div>
  );
};
