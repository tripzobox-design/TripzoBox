import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ChevronRight, Flame, Heart, MapPin, Users } from 'lucide-react';

const places = [
  { slug: 'manali', name: 'Manali, India', note: 'Mountains & Adventure', photo: 'photo-1626621341517-bbf3d9990a23' },
  { slug: 'bali', name: 'Bali, Indonesia', note: 'Beach & Adventure', photo: 'photo-1573790387438-4da905039392' },
  { slug: 'munnar', name: 'Munnar, Kerala', note: 'Nature & Hidden Gems', photo: 'photo-1593693397690-362cb9666fc2' },
];

export const MobileHeroShowcase: React.FC<{ liked: boolean; onToggleLike: () => void }> = ({ liked, onToggleLike }) => {
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(1);
  const activeRef = useRef(1);
  const moveTo = (index: number, smooth = true) => {
    activeRef.current = index;
    setActive(index);
    const container = row.current;
    const card = container?.children[index] as HTMLElement | undefined;
    if (container && card) container.scrollTo({ left: card.offsetLeft - (container.clientWidth - card.clientWidth) / 2, behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  };
  useEffect(() => {
    moveTo(activeRef.current, false);
    const observer = new ResizeObserver(() => moveTo(activeRef.current, false));
    if (row.current) observer.observe(row.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="lg:hidden text-white space-y-4">
      <div className="flex items-center justify-between gap-2"><h2 className="font-heading font-bold text-lg sm:text-xl">Trending Destinations</h2><Link to="/explore" className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-300">View All <ArrowRight className="w-4 h-4" /></Link></div>
      <div ref={row} onScroll={() => {
        const container = row.current;
        if (!container) return;
        const center = container.scrollLeft + container.clientWidth / 2;
        let nearest = 0;
        Array.from(container.children).forEach((child, index) => {
          const card = child as HTMLElement;
          const previous = container.children[nearest] as HTMLElement;
          if (Math.abs(card.offsetLeft + card.clientWidth / 2 - center) < Math.abs(previous.offsetLeft + previous.clientWidth / 2 - center)) nearest = index;
        });
        activeRef.current = nearest;
        setActive(nearest);
      }} className="relative flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory px-[16%] py-3 no-scrollbar" aria-label="Trending destination carousel">
        {places.map((place, index) => <article key={place.slug} className={`relative w-full min-w-full shrink-0 snap-center h-[220px] sm:h-[290px] rounded-3xl overflow-hidden border border-white/70 shadow-xl transition-transform duration-300 ${active === index ? 'scale-100' : 'scale-[.9]'}`}>
          <Link to={`/explore/${place.slug}`} className="absolute inset-0">
            <img src={`https://images.unsplash.com/${place.photo}?auto=format&fit=crop&w=800&q=85`} alt={place.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-black/5 to-transparent" />
            {place.slug === 'bali' && <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-800/85 px-3 py-1.5 text-xs font-semibold"><Flame className="w-4 h-4 text-amber-400 fill-amber-400" />Trending</span>}
            <div className="absolute inset-x-3 bottom-4 flex items-end justify-between gap-2"><div><h3 className="font-heading font-extrabold text-base sm:text-2xl flex items-center gap-1"><MapPin className="w-4 h-4 shrink-0" />{place.name}</h3><p className="text-xs sm:text-sm text-white/85 mt-1">{place.note}</p></div><span className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-full bg-emerald-50 text-primary flex items-center justify-center"><ChevronRight className="w-5 h-5" /></span></div>
          </Link>
          {place.slug === 'bali' && <button type="button" aria-label={liked ? 'Remove Bali from wishlist' : 'Save Bali to wishlist'} aria-pressed={liked} onClick={onToggleLike} className="absolute top-2 right-2 p-2 rounded-full bg-black/15"><Heart className={`w-6 h-6 ${liked ? 'fill-rose-500 text-rose-500' : 'text-white fill-white/20'}`} /></button>}
        </article>)}
      </div>
      <div className="flex justify-center gap-2 -mt-1">{places.map((place, index) => <button key={place.slug} type="button" aria-label={`Show ${place.name}`} aria-pressed={active === index} onClick={() => moveTo(index)} className="flex items-center justify-center w-9 h-7"><span className={`h-1.5 rounded-full transition-all ${active === index ? 'w-5 bg-emerald-300' : 'w-2 bg-white/40'}`} /></button>)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-3xl border border-white/35 bg-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3"><span className="rounded-full bg-emerald-500/20 p-2 text-emerald-200"><Users className="w-6 h-6" /></span><div><h3 className="font-heading font-bold text-base sm:text-lg">Find Your Travel Crew</h3><p className="text-xs sm:text-sm text-white/80 mt-1">Explore together. Make memories.</p></div></div>
        <div className="flex flex-wrap justify-between items-center gap-3 mt-3"><div className="flex -space-x-3" aria-hidden="true">{['photo-1507003211169-0a1dd7228f2d', 'photo-1519085360753-af0119f7cbe7', 'photo-1534528741775-53994a69daeb'].map((photo) => <img key={photo} src={`https://images.unsplash.com/${photo}?auto=format&fit=crop&w=90&q=80`} alt="" className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-white object-cover" />)}</div><Link to="/trips" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold hover:bg-primary-hover">Find Buddies <ArrowRight className="w-4 h-4" /></Link></div>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-white/35 bg-white/15 backdrop-blur-xl p-4 sm:p-5 shadow-xl">
        <img src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=500&q=85" alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/90 to-transparent" />
        <div className="relative max-w-[80%]"><h3 className="font-heading font-bold text-base sm:text-lg flex items-start gap-2"><Calendar className="w-5 h-5 shrink-0 text-emerald-200" />Planning Your Next Adventure?</h3><p className="text-xs sm:text-sm text-white/80 mt-2">Discover trips and meet fellow travellers.</p><Link to="/trips" className="inline-flex items-center gap-2 mt-3 rounded-xl bg-white text-primary px-4 py-2.5 text-sm font-bold">Explore Trips <ArrowRight className="w-4 h-4" /></Link></div>
      </div>
      </div>
    </div>
  );
};
