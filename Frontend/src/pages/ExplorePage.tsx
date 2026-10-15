import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { useDestinations } from '../context/DestinationsContext';
import { DestinationCard } from '../components/feature/DestinationCard';
import { Button } from '../components/ui/Button';
import { Destination } from '../types';

const categories = ['All', 'Mountains', 'Beaches', 'Cities', 'Culture', 'Nature', 'Hidden Spots'];

export const ExplorePage: React.FC = () => {
  const { destinations } = useDestinations();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const category = categories.includes(params.get('category') || '') ? params.get('category')! : 'All';
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(() => destinations.filter((destination) =>
    (category === 'All' || destination.category === category || (category === 'Hidden Spots' && destination.isHiddenSpot)) &&
    `${destination.name} ${destination.state} ${destination.shortDescription}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [destinations, category, query]);
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => value === null ? next.delete(key) : next.set(key, value));
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const select = (destination: Destination) => navigate(`/explore/${destination.slug}`);

  return (
    <section id="explore" aria-labelledby="explore-title" className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-24 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><span className="text-xs font-bold tracking-widest uppercase text-primary">Find your next favourite place</span><h1 id="explore-title" className="font-heading font-bold text-2xl sm:text-3xl text-text mt-2">Explore destinations</h1><p className="text-sm text-text-muted mt-2">Beautiful places, hidden gems, and inspiration for your next journey.</p></div>
        <Button onClick={() => navigate('/explore/create')} icon={<Plus className="w-4 h-4" />}>Add Place</Button>
      </div>
      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 space-y-4 shadow-subtle">
        <div className="flex items-center gap-3 rounded-xl bg-light-bg border border-border px-4 py-3"><Search className="w-5 h-5 text-primary shrink-0" /><input aria-label="Search destinations" placeholder="Search places, states, or hidden gems..." value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(false); }} className="bg-transparent text-sm text-text outline-none flex-1 min-w-0" />{query && <button type="button" aria-label="Clear destination search" onClick={() => setQuery('')}><X className="w-4 h-4 text-text-muted" /></button>}</div>
        <div className="flex flex-wrap gap-2" aria-label="Destination categories">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => { update({ category: item === 'All' ? null : item }); setShowAll(false); }} className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-colors ${category === item ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-border hover:border-primary hover:text-primary'}`}>{item}</button>)}</div>
      </div>
      <p className="text-xs text-text-muted" role="status">{filtered.length} {filtered.length === 1 ? 'destination' : 'destinations'} to explore</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">{(showAll ? filtered : filtered.slice(0, 8)).map((destination) => <DestinationCard key={destination.id} destination={destination} onSelect={select} />)}</div>
      {!filtered.length && <div className="text-center rounded-2xl border border-dashed border-border p-8"><h3 className="font-semibold text-text">No places match this search</h3><p className="text-sm text-text-muted mt-2">Try another destination or explore all categories.</p><button type="button" onClick={() => { setQuery(''); update({ category: null }); }} className="text-sm text-primary font-semibold mt-4">Clear filters</button></div>}
      {filtered.length > 8 && <button type="button" onClick={() => setShowAll((previous) => !previous)} className="block mx-auto rounded-xl border border-primary/30 bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-emerald-50">{showAll ? 'Show fewer places' : `Show all ${filtered.length} places`}</button>}
    </section>
  );
};
