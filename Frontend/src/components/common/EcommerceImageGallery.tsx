import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from 'lucide-react';

interface EcommerceImageGalleryProps {
  images: string[];
  title?: string;
  aspectRatio?: string; // default aspect-[4/3]
  className?: string;
}

export const EcommerceImageGallery: React.FC<EcommerceImageGalleryProps> = ({
  images: rawImages,
  title = 'Gallery Image',
  aspectRatio = 'aspect-[4/3] sm:aspect-[16/10]',
  className = '',
}) => {
  // Deduplicate and filter valid image URLs
  const images = Array.from(new Set(rawImages.filter(Boolean)));
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Safety check on index bounds
  const activeIndex = Math.min(Math.max(0, selectedIndex), Math.max(0, images.length - 1));

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setSelectedIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Touch Swipe Handlers (Flipkart / Amazon Mobile swipe behavior)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    const deltaY = touchStartY - e.changedTouches[0].clientY;

    // Ensure horizontal swipe is dominant over vertical scroll
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        handleNext(); // Swiped left -> next photo
      } else {
        handlePrev(); // Swiped right -> prev photo
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Keyboard navigation when Lightbox is active
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailsRef.current) return;
    const activeThumb = thumbnailsRef.current.children[activeIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeIndex]);

  if (images.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-gray-300 p-8 text-center bg-gray-50 text-gray-400 ${className}`}>
        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="text-xs font-medium">No images available for this trip yet.</p>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className={`space-y-3 w-full select-none ${className}`}>
      {/* ========================================================= */}
      {/* 1. MAIN PRODUCT-STYLE IMAGE SHOWCASE (Amazon / Flipkart) */}
      {/* ========================================================= */}
      <div className="relative group w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-gray-200/90 shadow-card">
        {/* Main Image Container with Touch Gestures */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsLightboxOpen(true)}
          className={`relative w-full ${aspectRatio} cursor-zoom-in bg-slate-900/90 flex items-center justify-center overflow-hidden`}
        >
          <img
            key={activeImage}
            src={activeImage}
            alt={`${title} — Photo ${activeIndex + 1}`}
            className="w-full h-full object-cover sm:object-contain md:object-cover transition-opacity duration-300"
            loading="eager"
          />

          {/* Gradient overlay for better badge readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />

          {/* Flipkart/Amazon Pill Badge: Counter (e.g. 1 / 4) */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold shadow-xs border border-white/10">
            <span>{activeIndex + 1}</span>
            <span className="text-white/60">/</span>
            <span>{images.length}</span>
          </div>

          {/* Expand Fullscreen / Lightbox Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xs border border-white/10 cursor-pointer"
            aria-label="View full size image"
            title="Expand to Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Flipkart / Amazon Mobile Dot Indicators (Bottom Centered) */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md pointer-events-auto">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(idx);
                  }}
                  className={`transition-all rounded-full cursor-pointer ${
                    idx === activeIndex
                      ? 'w-5 h-2 bg-emerald-400'
                      : 'w-2 h-2 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Left Arrow Navigation (ChevronLeft) */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-float backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer border border-gray-200/80 hover:scale-105 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Right Arrow Navigation (ChevronRight) */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-float backdrop-blur-xs flex items-center justify-center transition-all cursor-pointer border border-gray-200/80 hover:scale-105 active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. HORIZONTAL THUMBNAIL RAIL (Amazon & Flipkart Style)   */}
      {/* ========================================================= */}
      {images.length > 1 && (
        <div className="relative">
          <div
            ref={thumbnailsRef}
            className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto py-1 px-0.5 scrollbar-none scroll-smooth touch-pan-x"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {images.map((img, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-2 border-primary ring-2 ring-primary/30 shadow-sm scale-102 opacity-100'
                      : 'border border-gray-200 opacity-60 hover:opacity-100 hover:border-gray-300'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. FULLSCREEN LIGHTBOX MODAL (Flipkart/Amazon Zoom View)  */}
      {/* ========================================================= */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar: Title, Counter & Close */}
          <div
            className="w-full max-w-6xl mx-auto flex items-center justify-between text-white py-2 px-1 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-full">
                {activeIndex + 1} of {images.length}
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-300 hidden sm:inline truncate max-w-md">
                {title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close fullscreen"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Central Full-Resolution Image with Navigation Chevrons */}
          <div
            className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              key={`lightbox-${activeImage}`}
              src={activeImage}
              alt={`${title} — full size`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
            />

            {/* Left Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            {/* Right Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {images.length > 1 && (
            <div
              className="w-full max-w-4xl mx-auto flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 scrollbar-none z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={`lb-thumb-${idx}`}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-emerald-400 ring-2 ring-emerald-400/40 scale-105'
                        : 'border border-white/20 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

