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
  date: string;
  onDateChange: (val: string) => void;
  budget: string;
  onBudgetChange: (val: string) => void;
  onSearch: () => void;
  className?: string;
}

export const TripFilterBar: React.FC<TripFilterBarProps> = ({
  destination,
  onDestinationChange,
  date,
  onDateChange,
  budget,
  onBudgetChange,
  onSearch,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-float border border-border p-3 sm:p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center ${className}`}
    >
      {/* Destination field */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-light-bg md:bg-transparent border md:border-0 border-border/80">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <div className="flex flex-col text-left w-full">
          <label className="text-[11px] font-semibold text-text-muted">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="Where do you want to go?"
            className="w-full text-sm font-medium text-text bg-transparent outline-none placeholder:text-text-subtle"
          />
        </div>
      </div>

      <div className="hidden md:block w-px h-8 bg-border" />

      {/* Date field */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-light-bg md:bg-transparent border md:border-0 border-border/80 -ml-0 md:-ml-6">
        <Calendar className="w-5 h-5 text-primary shrink-0" />
        <div className="flex flex-col text-left w-full">
          <label className="text-[11px] font-semibold text-text-muted">Date</label>
          <input
            type="text"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            placeholder="Any date (e.g. May 2025)"
            className="w-full text-sm font-medium text-text bg-transparent outline-none placeholder:text-text-subtle"
          />
        </div>
      </div>

      <div className="hidden md:block w-px h-8 bg-border" />

      {/* Budget field */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-light-bg md:bg-transparent border md:border-0 border-border/80 -ml-0 md:-ml-6">
        <Wallet className="w-5 h-5 text-primary shrink-0" />
        <div className="flex flex-col text-left w-full">
          <label className="text-[11px] font-semibold text-text-muted">Budget</label>
          <input
            type="text"
            value={budget}
            onChange={(e) => onBudgetChange(e.target.value)}
            placeholder="Any budget (e.g. ₹6,000)"
            className="w-full text-sm font-medium text-text bg-transparent outline-none placeholder:text-text-subtle"
          />
        </div>
      </div>

      {/* Search Button */}
      <Button
        variant="primary"
        onClick={onSearch}
        className="w-full h-full py-3"
        icon={<Search className="w-4 h-4" />}
      >
        Search
      </Button>
    </div>
  );
};
