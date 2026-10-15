import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { useTrips } from '../../context/TripsContext';
import { TripCard } from './TripCard';

export const MemberHome: React.FC = () => {
  const { trips, myTrips, savedTripIds } = useTrips();
  const [tab, setTab] = useState<'mine' | 'saved' | 'discover'>('mine');
  const selectedTrips = tab === 'mine' ? myTrips : tab === 'saved'
    ? trips.filter((trip) => savedTripIds.includes(trip.id))
    : trips.filter((trip) => trip.roomType !== 'private' && trip.status !== 'closed');

  return (
    <section className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 lg:pt-10 pb-5 lg:pb-8 space-y-4 lg:space-y-7">
      <div id="member-trips" className="space-y-5 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-heading text-xl lg:text-2xl font-bold text-text">Your next chapter</h2><p className="hidden sm:block text-sm text-text-muted mt-1">All your travel plans, a little closer.</p></div>
          <Link to={tab === 'mine' ? '/app/trips/my' : '/trips'} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><span className="sm:hidden">View all</span><span className="hidden sm:inline">{tab === 'mine' ? 'Manage my trips' : 'Explore trips'}</span><ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Choose trips to show">
          {([{ id: 'mine', label: 'Joined & hosted' }, { id: 'saved', label: 'Saved trips' }, { id: 'discover', label: 'Discover trips' }] as const).map((item) => (
            <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => { setTab(item.id); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${tab === item.id ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-border hover:border-primary hover:text-primary'}`}>{item.label}</button>
          ))}
        </div>
        {selectedTrips.length ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-5">{selectedTrips.slice(0, 3).map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : (
          <div className="rounded-2xl border border-dashed border-primary/25 bg-emerald-50/50 p-8 text-center">
            <Compass className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-heading font-bold text-lg text-text">{tab === 'saved' ? 'Start your travel wishlist' : 'Your next adventure is waiting'}</h3>
            <p className="text-sm text-text-muted mt-2">{tab === 'saved' ? 'Tap the heart on a trip to keep it here for later.' : 'Join a trip or host your own. Your plans will appear here.'}</p>
            <Link to="/trips" className="inline-flex items-center gap-2 mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">Explore trips <ArrowRight className="w-4 h-4" /></Link>
          </div>
        )}
        {selectedTrips.length > 3 && <Link to="/trips" className="block w-fit mx-auto rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:border-primary">Show all {selectedTrips.length} trips</Link>}
      </div>
    </section>
  );
};
