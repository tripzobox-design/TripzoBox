import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Wallet,
  Users,
  Mountain,
  Compass,
  Share2,
  Heart,
  Send,
  Check,
  MapPin,
  Leaf,
  Droplets,
  Utensils,
  Footprints,
  Sparkles,
} from 'lucide-react';
import { useTrips } from '../context/TripsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Avatar, AvatarGroup } from '../components/ui/Avatar';
import { StarRating } from '../components/ui/StarRating';

export const TripDetailsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isInApp = location.pathname.startsWith('/app');
  const { getTripById, isTripSaved, toggleSaveTrip, requestJoinTrip, joinRequests } = useTrips();
  const { user, isLoggedIn } = useAuth();
  const { success, info } = useToast();

  const trip = getTripById(tripId || '');

  const [activeTab, setActiveTab] = useState<'about' | 'itinerary' | 'members' | 'chat' | 'reviews'>('about');
  const [chatInput, setChatInput] = useState('');
  const [localMessages, setLocalMessages] = useState(trip?.chatMessages || []);

  if (!trip) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading font-bold text-2xl text-text">Trip not found</h2>
        <p className="text-text-muted mt-2">The trip you are looking for might have ended or moved.</p>
        <Button variant="primary" onClick={() => navigate(isInApp ? '/app/trips' : '/trips')} className="mt-4">
          Browse All Trips
        </Button>
      </div>
    );
  }

  const isSaved = isTripSaved(trip.id);
  const currentRequest = joinRequests[trip.id] as ('pending' | 'accepted' | undefined);
  const joinStatus: 'pending' | 'accepted' | 'none' = trip.members.some((m) => m.id === user.id)
    ? 'accepted'
    : currentRequest || 'none';

  const handleJoinClick = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (joinStatus === 'none') {
      requestJoinTrip(trip.id);
      info('Join request sent to trip leader. Simulating review...');
    }
  };

  const handleShareClick = () => {
    navigator.clipboard?.writeText(window.location.href);
    success('Trip link copied to clipboard!', 'Ready to Share');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      sender: user,
      text: chatInput.trim(),
      time: 'Just now',
    };

    setLocalMessages([...localMessages, newMessage]);
    setChatInput('');
  };

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'members', label: `Members (${trip.members.length}/${trip.maxMembers})` },
    { id: 'chat', label: 'Chat' },
    { id: 'reviews', label: 'Reviews' },
  ];

  const getHighlightIcon = (highlight: string) => {
    const lower = highlight.toLowerCase();
    if (lower.includes('tea') || lower.includes('plant') || lower.includes('nature')) {
      return <Leaf className="w-3.5 h-3.5 text-primary" />;
    }
    if (lower.includes('water') || lower.includes('lake') || lower.includes('river')) {
      return <Droplets className="w-3.5 h-3.5 text-primary" />;
    }
    if (lower.includes('food') || lower.includes('lunch') || lower.includes('dine')) {
      return <Utensils className="w-3.5 h-3.5 text-primary" />;
    }
    if (lower.includes('trek') || lower.includes('hike') || lower.includes('walk')) {
      return <Footprints className="w-3.5 h-3.5 text-primary" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-primary" />;
  };

  return (
    <div className={`flex flex-col gap-6 text-left max-w-6xl mx-auto ${isInApp ? '' : 'px-4 sm:px-6 lg:px-8 py-8 sm:py-10'}`}>
      {/* 1. HERO BANNER WITH OVERLAID BACK BUTTON (Matching Reference Screen 7) */}
      <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[220px] max-h-[360px] w-full bg-text shadow-float">
        <img
          src={trip.coverImageUrl}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        
        {/* Floating Back to Trips button (Matching Reference Screen 7) */}
        <Link
          to={isInApp ? '/app/trips' : '/trips'}
          className="absolute top-5 left-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-subtle border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trips</span>
        </Link>

        {/* Destination Pin Tag */}
        <div className="absolute bottom-4 left-6">
          <span className="text-xs font-semibold text-white/95 flex items-center gap-1.5 backdrop-blur-md bg-black/50 px-3 py-1.5 rounded-full border border-white/15">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            {trip.destination}
          </span>
        </div>
      </div>

      {/* 2. TITLE ROW & ACTION BUTTONS (Matching Reference Screen 7) */}
      <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text">
              {trip.name}
            </h1>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShareClick}
                className="p-2 rounded-xl text-text-subtle hover:text-primary hover:bg-light-bg transition-colors"
                aria-label="Share Trip"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleSaveTrip(trip.id)}
                className="p-2 rounded-xl text-text-subtle hover:text-red-500 hover:bg-light-bg transition-colors"
                aria-label="Bookmark Trip"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick info row with icons (Matching Reference Screen 7) */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-text-muted mt-2.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              {trip.startDate} – {trip.endDate}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              {trip.durationDays} days
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <Wallet className="w-4 h-4" />
              ₹{trip.budgetPerPerson.toLocaleString()} per person
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-accent/40 text-primary border border-accent/60">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {trip.tripType === 'group' ? 'Group Trip' : 'Solo / Group'}
            </span>
          </div>
        </div>

        {/* Join CTA */}
        <div className="shrink-0">
          {joinStatus === 'accepted' ? (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-200">
              <Check className="w-4 h-4 stroke-[3]" />
              Joined ✓
            </div>
          ) : joinStatus === 'pending' ? (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm border border-amber-200 animate-pulse">
              Request Pending...
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleJoinClick}
              className="px-8 font-semibold shadow-hover"
            >
              Join Trip
            </Button>
          )}
        </div>
      </div>

      {/* 3. MAIN CONTENT: STAT CARDS + TABS (LEFT 2 COLS) & SIDEBAR (RIGHT 1 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* THREE STAT CARDS (Matching Reference Screen 7: Members, Difficulty, Type) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Stat Card 1: Members */}
            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-card flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-heading font-bold text-base sm:text-lg text-text truncate">
                  {trip.members.length}/{trip.maxMembers}
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted font-medium">Members</div>
              </div>
            </div>

            {/* Stat Card 2: Difficulty */}
            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-card flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                <Mountain className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-heading font-bold text-base sm:text-lg text-text capitalize truncate">
                  {trip.difficulty || 'Medium'}
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted font-medium">Difficulty</div>
              </div>
            </div>

            {/* Stat Card 3: Type */}
            <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-card flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-heading font-bold text-base sm:text-lg text-text truncate">
                  Solo/Group
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted font-medium">Type</div>
              </div>
            </div>
          </div>

          {/* TABS CONTAINER */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle">
            {/* Tabs */}
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tabId) => setActiveTab(tabId as any)}
              variant="underline"
            />

            {/* TAB: ABOUT */}
            {activeTab === 'about' && (
              <div className="pt-6 space-y-6">
                <div>
                  <h4 className="font-heading font-semibold text-base text-text mb-2">
                    About this trip
                  </h4>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {trip.description}
                  </p>
                </div>

                {/* Trip Highlights Chips (Matching Reference Screen 7) */}
                <div>
                  <h4 className="font-heading font-semibold text-base text-text mb-3">
                    Trip Highlights
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {trip.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 text-xs bg-light-bg text-text font-medium px-3.5 py-2 rounded-full border border-border shadow-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-accent/40 flex items-center justify-center shrink-0">
                          {getHighlightIcon(h)}
                        </span>
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Compatibility match box */}
                <div className="bg-accent-light border border-accent rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {trip.compatibilityScore || 94}%
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-text uppercase tracking-wider font-heading">
                      Compatibility Fit Score
                    </h5>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      Based on your shared interests in nature, photography, and gentle hiking pace.
                    </p>
                    <p className="text-[11px] text-text-subtle mt-1.5 italic">
                      *Note: Compatibility reflects travel preference fit only, never a safety endorsement.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ITINERARY */}
            {activeTab === 'itinerary' && (
              <div className="pt-6 space-y-4">
                <h4 className="font-heading font-semibold text-base text-text mb-3">
                  Day-by-Day Plan
                </h4>
                <div className="space-y-3">
                  {trip.itinerary?.map((item) => (
                    <div
                      key={item.day}
                      className="p-4 rounded-xl bg-light-bg border border-border flex items-start gap-3.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                        D{item.day}
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm text-text">{item.title}</h5>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: MEMBERS */}
            {activeTab === 'members' && (
              <div className="pt-6 space-y-4">
                <h4 className="font-heading font-semibold text-base text-text mb-3">
                  Trip Travellers ({trip.members.length}/{trip.maxMembers})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {trip.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-xl bg-light-bg border border-border flex items-center gap-3"
                    >
                      <Avatar src={member.avatarUrl} name={member.name} size="md" />
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-text truncate">{member.name}</p>
                          {member.id === trip.leader.id && (
                            <span className="text-[10px] font-semibold bg-primary text-white px-2 py-0.2 rounded-full">
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted truncate">{member.city}, {member.country || 'India'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CHAT */}
            {activeTab === 'chat' && (
              <div className="pt-6 space-y-4">
                <div className="bg-light-bg rounded-xl p-4 border border-border h-64 overflow-y-auto space-y-3 flex flex-col">
                  {localMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${
                        msg.sender.id === user.id ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted mb-0.5">
                        <span className="font-semibold text-text">{msg.sender.name}</span>
                        <span>· {msg.time}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs sm:text-sm ${
                          msg.sender.id === user.id
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-white text-text border border-border rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Write a message to the group..."
                    className="flex-1 bg-white text-sm rounded-xl border border-border px-4 py-2.5 outline-none focus:border-primary"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Send className="w-4 h-4" />}>
                    Send
                  </Button>
                </form>
              </div>
            )}

            {/* TAB: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="pt-6 space-y-4">
                <h4 className="font-heading font-semibold text-base text-text mb-3">
                  Past Traveller Feedback
                </h4>
                <div className="space-y-3">
                  {trip.reviews?.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl bg-light-bg border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar src={rev.author.avatarUrl} name={rev.author.name} size="xs" />
                          <span className="text-xs font-semibold text-text">{rev.author.name}</span>
                        </div>
                        <StarRating value={rev.rating} readOnly size="sm" />
                      </div>
                      <p className="text-xs text-text-muted italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leader Card & Members Sidebar (Matching Screen 7) */}
        <div className="space-y-5">
          {/* Trip Leader Card */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card text-left">
            <h4 className="font-heading font-bold text-base text-text mb-4">
              Trip Leaders
            </h4>
            <div className="flex items-center gap-3.5">
              <Avatar src={trip.leader.avatarUrl} name={trip.leader.name} size="lg" />
              <div>
                <h5 className="font-semibold text-sm sm:text-base text-text">{trip.leader.name}</h5>
                <span className="text-xs font-semibold text-primary bg-accent/40 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  Top Leader
                </span>
                <p className="text-xs text-text-muted mt-1">{trip.leader.city}, {trip.leader.country || 'India'}</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border line-clamp-3 leading-relaxed">
              {trip.leader.bio}
            </p>
          </div>

          {/* Members Stack Card */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card text-left">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-heading font-bold text-base text-text">
                Members ({trip.members.length}/{trip.maxMembers})
              </h4>
              <span className="text-xs font-semibold text-primary">
                {trip.maxMembers - trip.members.length} spots left
              </span>
            </div>

            <AvatarGroup users={trip.members} max={5} size="md" className="py-2" />

            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShareClick}
                className="w-full text-xs"
                icon={<Share2 className="w-3.5 h-3.5" />}
              >
                Share Trip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
