import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DraggableScrollRowHandle {
  scrollLeft: () => void;
  scrollRight: () => void;
  getContainer: () => HTMLDivElement | null;
}

export interface DraggableScrollRowProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  scrollAmount?: number;
  showSideArrows?: boolean;
  showProgressBar?: boolean;
  onScrollStatusChange?: (status: {
    canScrollLeft: boolean;
    canScrollRight: boolean;
    progress: number;
  }) => void;
}

export const DraggableScrollRow = forwardRef<DraggableScrollRowHandle, DraggableScrollRowProps>(
  (
    {
      children,
      className = '',
      scrollAmount = 360,
      showSideArrows = true,
      showProgressBar = false,
      onScrollStatusChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDownRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const isDragMovedRef = useRef(false);

    const [isDragging, setIsDragging] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);

    // Scroll by amount
    const scroll = useCallback(
      (direction: 'left' | 'right') => {
        const el = containerRef.current;
        if (!el) return;
        const delta = direction === 'left' ? -scrollAmount : scrollAmount;
        el.scrollBy({ left: delta, behavior: 'smooth' });
      },
      [scrollAmount]
    );

    // Expose imperative handle for external buttons in section headers
    useImperativeHandle(
      ref,
      () => ({
        scrollLeft: () => scroll('left'),
        scrollRight: () => scroll('right'),
        getContainer: () => containerRef.current,
      }),
      [scroll]
    );

    // Check scroll position to update arrow disabled states & progress
    const updateScrollStatus = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScroll = Math.max(0, scrollWidth - clientWidth);

      const nextCanScrollLeft = scrollLeft > 8;
      const nextCanScrollRight = scrollLeft < maxScroll - 8;
      const nextProgress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)) : 0;

      setCanScrollLeft(nextCanScrollLeft);
      setCanScrollRight(nextCanScrollRight);
      setScrollProgress(nextProgress);

      if (onScrollStatusChange) {
        onScrollStatusChange({
          canScrollLeft: nextCanScrollLeft,
          canScrollRight: nextCanScrollRight,
          progress: nextProgress,
        });
      }
    }, [onScrollStatusChange]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      updateScrollStatus();
      el.addEventListener('scroll', updateScrollStatus, { passive: true });
      window.addEventListener('resize', updateScrollStatus);

      return () => {
        el.removeEventListener('scroll', updateScrollStatus);
        window.removeEventListener('resize', updateScrollStatus);
      };
    }, [updateScrollStatus, children]);

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;

      isDownRef.current = true;
      isDragMovedRef.current = false;
      startXRef.current = e.pageX - el.offsetLeft;
      scrollLeftRef.current = el.scrollLeft;
      setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDownRef.current) return;
      const el = containerRef.current;
      if (!el) return;

      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * 1.35; // Responsive scroll factor

      if (Math.abs(x - startXRef.current) > 5) {
        isDragMovedRef.current = true;
      }

      el.scrollLeft = scrollLeftRef.current - walk;
      updateScrollStatus();
    };

    const handleMouseUpOrLeave = () => {
      isDownRef.current = false;
      setIsDragging(false);
    };

    // Prevent child click navigation if the user was actively dragging
    const handleClickCapture = (e: React.MouseEvent) => {
      if (isDragMovedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isDragMovedRef.current = false;
      }
    };

    return (
      <div className="relative group/drag-row w-full">
        {/* Floating Side Arrows on hover (Seamless Airbnb/Netflix style) */}
        {showSideArrows && (
          <>
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-md border border-border shadow-float flex items-center justify-center text-text hover:text-primary transition-all duration-200 ${
                canScrollLeft
                  ? 'opacity-0 group-hover/drag-row:opacity-100 hover:scale-105 cursor-pointer'
                  : 'opacity-0 pointer-events-none'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-md border border-border shadow-float flex items-center justify-center text-text hover:text-primary transition-all duration-200 ${
                canScrollRight
                  ? 'opacity-0 group-hover/drag-row:opacity-100 hover:scale-105 cursor-pointer'
                  : 'opacity-0 pointer-events-none'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Draggable Row Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
          className={`flex items-stretch gap-5 overflow-x-auto no-scrollbar scroll-smooth py-2 px-0.5 touch-pan-x transition-colors ${
            isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          } ${className}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {children}
        </div>

        {/* Optional drag progress bar */}
        {showProgressBar && (
          <div className="w-full h-1 bg-gray-100 rounded-full mt-4 overflow-hidden max-w-xs mx-auto">
            <div
              className="h-full bg-primary/70 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.max(15, scrollProgress)}%` }}
            />
          </div>
        )}
      </div>
    );
  }
);

DraggableScrollRow.displayName = 'DraggableScrollRow';
