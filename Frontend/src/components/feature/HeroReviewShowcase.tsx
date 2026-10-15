import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Quote,
  MessageSquare,
  Shield,
  Compass,
  X,
  ExternalLink,
} from 'lucide-react';
import { heroSlideReviews, allCommunityReviews, TravelerReview } from '../../data/mockReviews';
import { Button } from '../ui/Button';

interface HeroReviewShowcaseProps {
  currentSlide: number;
  onSelectSlide: (index: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  progressPercent: number;
}

export const HeroReviewShowcase: React.FC<HeroReviewShowcaseProps> = ({
  currentSlide,
  onSelectSlide,
  isPaused,
  onTogglePause,
  progressPercent,
}) => {
  const navigate = useNavigate();
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Mountains' | 'Beaches' | 'Culture'>('All');

  const activeReview: TravelerReview = heroSlideReviews[currentSlide] || heroSlideReviews[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIndex = (currentSlide - 1 + heroSlideReviews.length) % heroSlideReviews.length;
    onSelectSlide(prevIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = (currentSlide + 1) % heroSlideReviews.length;
    onSelectSlide(nextIndex);
  };

  const filteredReviews = allCommunityReviews.filter((rev) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Mountains') {
      return (
        rev.destinationTag.toLowerCase().includes('alpine') ||
        rev.destinationTag.toLowerCase().includes('peaks') ||
        rev.destinationTag.toLowerCase().includes('highlands') ||
        rev.destinationTag.toLowerCase().includes('himalayan')
      );
    }
    if (selectedFilter === 'Beaches') {
      return (
        rev.destinationTag.toLowerCase().includes('sunset') ||
        rev.destinationTag.toLowerCase().includes('coastal') ||
        rev.destinationTag.toLowerCase().includes('shores') ||
        rev.destinationTag.toLowerCase().includes('turquoise') ||
        rev.destinationTag.toLowerCase().includes('bohemian')
      );
    }
    if (selectedFilter === 'Culture') {
      return (
        rev.destinationTag.toLowerCase().includes('culture') ||
        rev.destinationTag.toLowerCase().includes('ancient') ||
        rev.destinationTag.toLowerCase().includes('nordic') ||
        rev.travelStyle.toLowerCase().includes('heritage')
      );
    }
    return true;
  });

  return (
    <div className="relative w-full">
      {/* Outer Ambient Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/25 to-teal-400/30 rounded-3xl blur-2xl opacity-75 pointer-events-none" />

      {/* Floating Pill Top-Right: Sync Status & Traveler Count */}
      <div className="hidden sm:flex absolute -top-4 -right-2 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-accent font-bold">1,240+ Verified Reviews</span>
        <span className="text-gray-400 text-[10px]">| Live Sync</span>
      </div>

      {/* Main Glassmorphic Showcase Card */}
      <div className="relative z-10 bg-black/65 backdrop-blur-2xl border border-white/25 rounded-3xl p-5 sm:p-6 shadow-2xl text-white text-left transition-all duration-300">
        
        {/* Top Header: Community Travelers Avatar Selector */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-2.5">
            <div className="flex items-center gap-1.5 text-accent font-bold uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Traveler Community Reviews</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300 text-xs">
              <span className="font-semibold text-white">0{currentSlide + 1}</span>
              <span className="text-gray-500">/</span>
              <span>0{heroSlideReviews.length}</span>
            </div>
          </div>

          {/* Traveler Quick-Switch Avatars Strip */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/10 border border-white/15 overflow-x-auto no-scrollbar">
            {heroSlideReviews.map((slideRev, idx) => {
              const isActive = idx === currentSlide;
              return (
                <button
                  key={slideRev.id}
                  type="button"
                  onClick={() => onSelectSlide(idx)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 text-left ${
                    isActive
                      ? 'bg-primary text-white shadow-md ring-2 ring-accent/60 scale-[1.02]'
                      : 'hover:bg-white/10 text-gray-300 hover:text-white'
                  }`}
                  title={`View ${slideRev.user.name}'s review of ${slideRev.destination}`}
                >
                  <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/30">
                    <img
                      src={slideRev.user.avatarUrl}
                      alt={slideRev.user.name}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[11px] font-bold leading-tight truncate max-w-[85px]">
                      {slideRev.user.name.split(' ')[0]}
                    </p>
                    <p className="text-[9px] text-gray-300 truncate max-w-[85px]">
                      {slideRev.destination.split(',')[0]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE REVIEW DISPLAY (Tied synchronously to the background slide) */}
        <div
          key={activeReview.id}
          className="space-y-4 animate-in fade-in zoom-in-95 duration-400"
        >
          {/* User Profile & Role Info */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-accent/80 p-0.5 bg-black/40 shadow-lg">
                  <img
                    src={activeReview.user.avatarUrl}
                    alt={activeReview.user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-black text-white" title="Identity Verified">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-base sm:text-lg text-white leading-tight">
                    {activeReview.user.name}
                  </h4>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/15 text-accent text-[10px] font-semibold border border-white/20">
                    {activeReview.userRoleBadge}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  @{activeReview.user.username} • {activeReview.user.city}, {activeReview.user.country}
                </p>
              </div>
            </div>

            {/* Rating Stars & Chemistry Tag */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < activeReview.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-500'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-amber-300 ml-1">5.0</span>
              </div>
              <span className="text-[10px] text-gray-300 mt-0.5 block">
                {activeReview.date}
              </span>
            </div>
          </div>

          {/* Synchronized Destination Banner */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="font-bold text-white block sm:inline">
                  {activeReview.destination}
                </span>
                <span className="hidden sm:inline text-gray-300 text-[11px] ml-1.5">
                  • {activeReview.destinationTag}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold shrink-0">
              {activeReview.chemistryScore}% Chemistry
            </span>
          </div>

          {/* Review Quote Body */}
          <div className="relative bg-white/5 rounded-2xl p-4 border border-white/10">
            <Quote className="absolute top-3 right-3 w-8 h-8 text-white/10 pointer-events-none" />
            
            <h5 className="font-heading font-semibold text-sm text-accent mb-1.5 leading-snug">
              "{activeReview.quoteTitle}"
            </h5>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-body italic">
              "{activeReview.reviewText}"
            </p>

            {/* Feature Highlight Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-white/10">
              {activeReview.highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-gray-200"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-accent" />
                  <span>{h}</span>
                </span>
              ))}
              <span className="text-[10px] text-gray-400 ml-auto hidden sm:inline">
                {activeReview.travelStyle}
              </span>
            </div>
          </div>

          {/* Action CTAs & Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(activeReview.tripLink)}
                className="text-xs font-bold rounded-xl shadow-md py-2 px-3.5 flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Destination</span>
              </Button>

              <button
                type="button"
                onClick={() => setShowAllReviewsModal(true)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">All Community Reviews</span>
                <span className="sm:hidden">All Reviews</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  {allCommunityReviews.length}
                </span>
              </button>
            </div>

            {/* Slide Navigation Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onTogglePause}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
                title={isPaused ? 'Resume auto-slideshow' : 'Pause slideshow'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handlePrev}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
                title="Previous Review & Background"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
                title="Next Review & Background"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Synchronized Slide Progress Bar */}
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-accent h-full transition-all duration-100 ease-linear rounded-full shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* Floating Social Proof Pill Bottom-Left */}
      <div className="hidden sm:flex absolute -bottom-3 -left-3 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
        <div className="flex text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span>4.9/5 from 1,240+ Verified Travelers</span>
      </div>

      {/* MODAL: ALL COMMUNITY REVIEWS (Mounted via createPortal for clean full-screen overlay) */}
      {showAllReviewsModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowAllReviewsModal(false)}
          >
            <div
              className="relative w-full max-w-3xl max-h-[88vh] bg-gray-900 border border-white/20 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white">
                      All Community Traveler Reviews
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold border border-accent/30">
                      {allCommunityReviews.length} Stories
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1">
                    Read genuine reviews from verified members across all destinations. Click any review to sync it with the hero background!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllReviewsModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 py-3 border-b border-white/10 overflow-x-auto no-scrollbar text-xs">
                {(['All', 'Mountains', 'Beaches', 'Culture'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      selectedFilter === filter
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Reviews Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
                {filteredReviews.map((rev) => {
                  // Check if this review corresponds to one of the 5 hero slides
                  const slideIdx = heroSlideReviews.findIndex(
                    (s) => s.destination === rev.destination || s.id === rev.id
                  );

                  return (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/40 transition-all text-white space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={rev.user.avatarUrl}
                            alt={rev.user.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-accent/50"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {rev.user.name}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-accent font-medium">
                                {rev.userRoleBadge}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              @{rev.user.username} • {rev.user.city}, {rev.user.country}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">{rev.date}</span>
                        </div>
                      </div>

                      <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                        <p className="text-xs font-semibold text-accent mb-1">
                          "{rev.quoteTitle}"
                        </p>
                        <p className="text-xs text-gray-200 leading-relaxed italic">
                          "{rev.reviewText}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-accent" />
                          <span className="font-medium text-white">{rev.destination}</span>
                          <span className="text-emerald-400 font-semibold">• {rev.chemistryScore}% Fit</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {slideIdx !== -1 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                onSelectSlide(slideIdx);
                                setShowAllReviewsModal(false);
                              }}
                              className="text-xs py-1.5 px-3 bg-accent/20 hover:bg-accent/30 text-accent border-accent/40 font-semibold"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Show on Hero & Background
                            </Button>
                          )}
                          <Button
                            variant="outline-white"
                            size="sm"
                            onClick={() => {
                              setShowAllReviewsModal(false);
                              navigate(rev.tripLink);
                            }}
                            className="text-xs py-1.5 px-3"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Trip Page
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>All reviews are from verified identity trips on Tripzobox.</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAllReviewsModal(false)}
                  className="text-xs py-1 px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
