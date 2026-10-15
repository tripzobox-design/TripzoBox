import React, { useState } from 'react';
import { MobileHeroShowcase } from './MobileHeroShowcase';
import { Link } from 'react-router-dom';
import { Flame, Heart, MapPin, Users, Calendar, ArrowRight, Plane, ChevronRight } from 'lucide-react';

const featured = [
  { slug: 'bali', name: 'Bali, Indonesia', category: 'Beach & Adventure', image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?auto=format&fit=crop&w=1000&q=85' },
  { slug: 'manali', name: 'Manali, India', category: 'Mountains & Adventure', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=700&q=85' },
  { slug: 'munnar', name: 'Munnar, Kerala', category: 'Nature & Hidden Gems', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=700&q=85' },
];

export const HeroInteractiveShowcase: React.FC = () => {
  const [liked, setLiked] = useState(() => {
    try { return localStorage.getItem('tripzobox_featured_bali_saved') === 'true'; } catch { return false; }
  });
  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    try { localStorage.setItem('tripzobox_featured_bali_saved', String(next)); } catch { /* Storage may be unavailable. */ }
  };

  return (
    <>
    <MobileHeroShowcase liked={liked} onToggleLike={toggleLike} />
    <div className="hidden lg:block">
    <div className="relative w-full max-w-[800px] mx-auto text-white pt-3 lg:pt-6">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[280px] pointer-events-none hidden sm:block">
        <svg viewBox="0 0 800 300" fill="none" className="absolute inset-0 w-full h-full overflow-visible"><path d="M350 50 C420 -35 515 20 460 40 C420 55 440 -20 510 0 M660 85 C780 50 815 155 780 215" stroke="white" strokeOpacity=".65" strokeWidth="1.5" strokeDasharray="5 5" /></svg>
        <Plane className="absolute left-[62%] -top-3 w-9 h-9 rotate-12 fill-white" /><MapPin className="absolute -right-3 top-48 w-9 h-9" />
      </div>
      <div className="grid grid-cols-12 gap-4 sm:gap-6 items-center">
        <article className="relative col-span-12 sm:col-span-7 h-[380px] sm:h-[400px] xl:h-[425px] rounded-[28px] border-2 border-white/75 overflow-hidden shadow-2xl sm:-rotate-[4deg] motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:rotate-0 group bg-emerald-950">
          <img src={featured[0].image} alt="Turquoise sea and green cliffs in Bali" className="absolute inset-0 w-full h-full object-cover motion-safe:group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
          <div className="absolute top-5 inset-x-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 bg-emerald-800/80 backdrop-blur-md rounded-full px-3 py-2 text-xs font-bold"><Flame className="w-4 h-4 text-amber-300 fill-amber-300" />Trending Destination</span>
            <button type="button" onClick={toggleLike} aria-label={liked ? 'Remove Bali from wishlist' : 'Save Bali to wishlist'} aria-pressed={liked} className="p-2 rounded-full bg-black/15 hover:bg-black/35 transition-colors"><Heart className={`w-6 h-6 ${liked ? 'fill-rose-500 text-rose-500' : 'fill-white/25 text-white'}`} /></button>
          </div>
          <div className="absolute bottom-4 sm:bottom-5 inset-x-4 sm:inset-x-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h2 className="flex items-center gap-1.5 font-heading font-extrabold text-2xl"><MapPin className="w-5 h-5 shrink-0" />Bali, Indonesia</h2><p className="text-sm text-white/85 mt-1">Beach & Adventure</p><p className="text-xs text-emerald-200 font-semibold mt-2">Your next island escape</p></div>
              <Link to="/explore/bali" aria-label="Explore Bali" className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 text-primary shrink-0 hover:bg-white"><ChevronRight className="w-6 h-6" /></Link>
            </div>
            <Link to="/explore/bali" className="flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-hover py-3.5 text-sm font-bold transition-colors shadow-lg">Explore Destination <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </article>
        <div className="col-span-12 sm:col-span-5 grid grid-cols-2 sm:grid-cols-1 gap-4 sm:gap-6 sm:pb-5">
          {featured.slice(1).map((destination, index) => (
            <Link key={destination.slug} to={`/explore/${destination.slug}`} className={`group relative block h-[155px] sm:h-[178px] xl:h-[185px] overflow-hidden rounded-3xl border-2 border-white/65 shadow-xl motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:rotate-0 ${index === 0 ? 'sm:-rotate-[5deg] sm:-translate-x-1' : 'sm:rotate-[4deg] sm:translate-x-5'}`}>
              <img src={destination.image} alt={destination.name} className="absolute inset-0 w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
              <div className="absolute inset-x-3 bottom-4 flex items-end justify-between gap-2"><div><h3 className="font-heading font-bold text-sm sm:text-base flex items-center gap-1"><MapPin className="w-4 h-4 shrink-0" />{destination.name}</h3><p className="text-[11px] sm:text-xs text-white/85 mt-1">{destination.category}</p></div><span className="rounded-full bg-emerald-50 text-primary w-8 h-8 flex items-center justify-center shrink-0"><ChevronRight className="w-5 h-5" /></span></div>
            </Link>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-6">
        <div className="sm:col-span-7 rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-4 shadow-xl flex items-center gap-4">
          <div className="hidden xl:flex -space-x-4 shrink-0" aria-hidden="true">
            {['photo-1507003211169-0a1dd7228f2d', 'photo-1519085360753-af0119f7cbe7', 'photo-1534528741775-53994a69daeb'].map((photo) => <img key={photo} src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=100&q=80`} alt="" className="h-12 w-12 rounded-full border-2 border-white object-cover" />)}
          </div>
          <div><h3 className="flex items-center gap-2 font-heading font-bold text-base"><Users className="w-5 h-5 text-emerald-200 shrink-0" />Find Your Travel Crew</h3><p className="text-xs text-white/85 mt-2">Explore together. Make memories.</p><Link to="/trips" className="inline-flex items-center gap-2 mt-3 rounded-xl bg-primary hover:bg-primary-hover px-5 py-2 text-xs font-bold">Find Buddies <ArrowRight className="w-3.5 h-3.5" /></Link></div>
        </div>
        <div className="relative sm:col-span-5 rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-4 shadow-xl overflow-hidden">
          <img src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=400&q=80" alt="" className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-75" />
          <div className="relative max-w-[80%]"><h3 className="flex items-center gap-2 font-heading font-bold text-base"><Calendar className="w-5 h-5 text-emerald-200 shrink-0" />Upcoming Adventures</h3><p className="text-xs text-white/85 mt-2 leading-relaxed">Discover trips and meet fellow travellers.</p><Link to="/trips" className="inline-flex items-center gap-2 mt-3 rounded-xl bg-white hover:bg-emerald-50 text-primary px-4 py-2 text-xs font-bold">Explore Trips <ArrowRight className="w-3.5 h-3.5" /></Link></div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
};
