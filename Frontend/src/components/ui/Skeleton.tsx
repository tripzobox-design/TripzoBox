import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3">
      <Skeleton className="w-full h-44 rounded-xl" />
      <Skeleton className="w-3/4 h-5 rounded-md mt-1" />
      <Skeleton className="w-1/2 h-4 rounded-md" />
      <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
        <Skeleton className="w-20 h-4 rounded-md" />
        <Skeleton className="w-16 h-4 rounded-md" />
      </div>
    </div>
  );
};

export const ListRowSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="w-48 h-4 rounded-md" />
        <Skeleton className="w-28 h-3 rounded-md" />
      </div>
      <Skeleton className="w-20 h-8 rounded-lg shrink-0" />
    </div>
  );
};
