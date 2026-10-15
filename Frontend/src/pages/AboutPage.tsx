import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Compass, Users, Shield, BookOpen, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { useDestinations } from '../context/DestinationsContext';

const values = [
  { icon: Users, title: 'Good company matters', description: 'Talk about your interests, budget, and travel pace before you set out. Shared expectations make space for better experiences together.' },
  { icon: Heart, title: 'Respect comes along', description: 'Be considerate of personal boundaries, local cultures, and the places you visit. Ask before sharing someone else’s photo or story.' },
  { icon: Compass, title: 'Stay curious', description: 'Take the quieter trail, learn from local perspectives, and share the practical details that help the next traveller explore thoughtfully.' },
];

export const AboutPage: React.FC = () => {
  const { destinations } = useDestinations();
  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-10 space-y-5 sm:space-y-6 lg:space-y-10 text-left">
      <section className="grid md:grid-cols-2 lg:grid-cols-[1.3fr_1fr] gap-4 lg:gap-10 items-center rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-5 lg:p-10">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-widest uppercase"><Sparkles className="w-4 h-4" />Our story</span>
          <h1 className="font-heading font-extrabold text-[26px] sm:text-3xl lg:text-5xl text-text tracking-tight mt-3 lg:mt-4">About Tripzobox</h1>
          <p className="font-heading font-semibold text-base sm:text-lg lg:text-2xl text-primary mt-2 lg:mt-4">A place to find your people and your next adventure.</p>
          <p className="text-sm lg:text-base text-text-muted mt-3 lg:mt-4 leading-relaxed max-w-2xl"><span className="lg:hidden">Discover new places, meet travel companions, and share the moments that make each journey yours.</span><span className="hidden lg:inline">We believe the people you meet can become as memorable as the places you visit. Tripzobox brings discovery, shared travel plans, and personal stories together so you can spend more time looking forward to the journey.</span></p>
          <div className="grid grid-cols-2 lg:flex gap-2 lg:gap-3 mt-4 lg:mt-6">
            <Link to="/explore" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-2 lg:px-5 py-3 text-xs lg:text-sm font-semibold text-white hover:bg-primary-hover transition-colors"><span className="lg:hidden">Explore places</span><span className="hidden lg:inline">Explore places</span> <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/trips" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-white px-2 lg:px-5 py-3 text-xs lg:text-sm font-semibold text-primary hover:bg-emerald-50 transition-colors"><span className="lg:hidden">Find buddies</span><span className="hidden lg:inline">Find travel companions</span> <Users className="w-4 h-4" /></Link>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden min-h-[150px] sm:min-h-[190px] md:h-full lg:min-h-[310px] lg:h-full">
          <img src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1000&q=85" alt="Friends enjoying a mountain hike together" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <p className="absolute bottom-4 lg:bottom-6 inset-x-4 lg:inset-x-6 font-heading font-bold text-base lg:text-xl text-white">Your journey. Your people. Your story.</p>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-4 sm:p-5 lg:p-8 shadow-subtle">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Why we’re here</span>
          <h2 className="font-heading font-bold text-2xl text-text mt-2">Make travel feel more connected</h2>
          <div className="space-y-4 text-sm sm:text-base text-text-muted leading-relaxed mt-4">
            <p>A weekend in Munnar, a coastal escape to Varkala, or a first trip with new companions can start with a simple conversation. Our mission is to make it easier to turn that spark into a shared plan.</p>
            <div className="hidden lg:block space-y-4">            <p>Tripzobox gives travellers a place to discover destinations, discuss expectations, organize a trip room, and keep memories in a travel diary. Whether you prefer a relaxed itinerary or an active adventure, there’s room to describe what works for you.</p>
            <p>We want the community to be useful before, during, and after the trip: inspiration when you’re deciding, clear plans when you’re preparing, and honest stories when you return.</p>
</div>
            <details className="lg:hidden"><summary className="cursor-pointer text-primary text-sm font-semibold">More about our mission</summary><div className="space-y-3 mt-3">            <p>Tripzobox gives travellers a place to discover destinations, discuss expectations, organize a trip room, and keep memories in a travel diary. Whether you prefer a relaxed itinerary or an active adventure, there’s room to describe what works for you.</p>
            <p>We want the community to be useful before, during, and after the trip: inspiration when you’re deciding, clear plans when you’re preparing, and honest stories when you return.</p>
</div></details>
          </div>
        </div>
        <aside className="rounded-3xl bg-emerald-950 text-white p-4 sm:p-5 lg:p-8 grid grid-cols-1 content-center gap-0 lg:gap-6">
          {[
            { label: 'Places to discover', value: String(destinations.length), detail: 'Browse destinations and community discoveries.' },
            { label: 'Travel your way', value: 'Your pace', detail: 'Find plans that suit your interests and budget.' },
            { label: 'Memories worth keeping', value: 'Your story', detail: 'Record the details you want to remember.' },
          ].map((item) => <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 border-b last:border-b-0 border-white/15 lg:block lg:border-0 lg:py-0"><span className="text-[10px] sm:text-xs text-emerald-200 uppercase tracking-wide">{item.label}</span><p className="font-heading font-bold text-lg sm:text-xl lg:text-3xl lg:mt-1 whitespace-nowrap">{item.value}</p><p className="col-span-2 text-xs lg:text-sm text-white/75 lg:mt-1 leading-relaxed">{item.detail}</p></div>)}
        </aside>
      </section>

      <section aria-labelledby="about-values" className="space-y-3 lg:space-y-5">
        <div><h2 id="about-values" className="font-heading font-bold text-2xl sm:text-3xl text-text">What brings us together</h2><p className="text-sm text-text-muted mt-2">A few shared habits can make every journey better.</p></div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-5">{values.map(({ icon: Icon, title, description }, index) => <article key={title} className="min-w-0 rounded-2xl border border-emerald-100 bg-white p-2.5 sm:p-4 lg:p-6 text-center lg:text-left shadow-subtle"><div className="inline-flex p-2 lg:p-3 rounded-xl bg-primary/10 text-primary"><Icon className="w-5 h-5 lg:w-6 lg:h-6" /></div><h3 className="font-heading font-bold text-xs sm:text-sm lg:text-lg text-text mt-2 lg:mt-4 leading-snug">{title}</h3><p className="text-[11px] sm:text-xs lg:text-sm text-text-muted mt-2 leading-relaxed"><span className="lg:hidden">{['Share your interests, budget, and pace.', 'Respect people, places, and privacy.', 'Explore thoughtfully. Share useful tips.'][index]}</span><span className="hidden lg:inline">{description}</span></p></article>)}</div>
      </section>

      <section className="rounded-3xl border border-border bg-white p-4 sm:p-5 lg:p-8 space-y-6">
        <div><span className="text-xs font-bold text-primary uppercase tracking-widest">From inspiration to memories</span><h2 className="font-heading font-bold text-2xl sm:text-3xl text-text mt-2">One community, every part of the journey</h2></div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { icon: MapPin, title: 'Discover a place', text: 'Browse familiar favourites and hidden spots. Share a discovery with photos and useful local details.', link: '/explore', action: 'Explore destinations' },
            { icon: Users, title: 'Make a shared plan', text: 'Find a trip or host your own room. Discuss the route, group size, costs, and expectations before departure.', link: '/trips', action: 'Browse trips' },
            { icon: Shield, title: 'Prepare thoughtfully', text: 'Keep important travel information organized and read our guidance on boundaries and group conduct.', link: '/safety', action: 'Read safety guidance' },
            { icon: BookOpen, title: 'Keep the story', text: 'Record your experience in a diary and share the moments, tips, and recommendations others can learn from.', link: '/stories', action: 'Read travel stories' },
          ].map(({ icon: Icon, title, text, link, action }) => <article key={title} className="flex flex-col items-start"><Icon className="w-6 h-6 text-primary" /><h3 className="font-heading font-bold text-base text-text mt-3">{title}</h3><p className="text-sm text-text-muted leading-relaxed mt-2 mb-4">{text}</p><Link to={link} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover mt-auto">{action}<ArrowRight className="w-4 h-4" /></Link></article>)}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5 lg:p-8"><h2 className="font-heading font-bold text-xl text-text">For first-time explorers and experienced hosts</h2><p className="text-sm text-text-muted leading-relaxed mt-3">You don’t need a perfect itinerary to begin. Come with a destination in mind, a story to share, or a willingness to meet people. Experienced travellers can help by sharing practical advice and setting clear, considerate expectations when hosting.</p><Link to="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-primary mt-5">See how it works <ArrowRight className="w-4 h-4" /></Link></div>
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 lg:p-8"><h2 className="font-heading font-bold text-xl text-text">Trust is something we build together</h2><p className="text-sm text-text-muted leading-relaxed mt-3">Be honest about your plans, respect a companion’s boundaries, and agree on shared expenses early. Our community rules explain the conduct we expect from travellers and trip leaders, so everyone can make informed choices about who they travel with.</p><Link to="/community-rules" className="inline-flex items-center gap-2 text-sm font-semibold text-primary mt-5">Read our community rules <ArrowRight className="w-4 h-4" /></Link></div>
      </section>

      <section id="contact" className="rounded-2xl border border-border bg-white p-4 sm:p-5 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div><h2 className="font-heading font-bold text-xl text-text">Help shape the next chapter</h2><p className="text-sm text-text-muted mt-2 leading-relaxed">Have a question, an idea, or feedback? We’d like to hear from you.</p><a href="mailto:hello@tripzobox.com" className="inline-block text-sm text-primary font-semibold hover:underline mt-2">hello@tripzobox.com</a></div>
        <Link to="/contact" className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors">Get in touch <ArrowRight className="w-4 h-4" /></Link>
      </section>
    </div>
  );
};
