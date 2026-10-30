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
  Crown,
  Globe,
  Lock,
  Copy,
  CheckCircle2,
  XCircle,
  UserCheck,
  Car,
  Home,
  ShieldAlert,
} from 'lucide-react';
import { useTrips } from '../context/TripsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Avatar, AvatarGroup } from '../components/ui/Avatar';
import { StarRating } from '../components/ui/StarRating';
import { Modal } from '../components/ui/Modal';
import { User } from '../types';

export const TripDetailsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isInApp = location.pathname.startsWith('/app');
  const {
    getTripById,
    isTripSaved,
    toggleSaveTrip,
    requestJoinTrip,
    joinRequests,
    acceptJoinRequest,
    declineJoinRequest,
    updateTripRoomType,
  } = useTrips();
  const { user, isLoggedIn } = useAuth();
  const { success, info } = useToast();

  const trip = getTripById(tripId || '');
  const isLeader = Boolean(user && trip && trip.leader.id === user.id);

  const [activeTab, setActiveTab] = useState<'about' | 'itinerary' | 'members' | 'chat' | 'reviews' | 'images' | 'contact'>('about');
  const [infoTab, setInfoTab] = useState<'reviews' | 'images' | 'contact'>('reviews');
  const [selectedTraveller, setSelectedTraveller] = useState<User | null>(null);
  const [showRoomTypeConfirm, setShowRoomTypeConfirm] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [localMessages, setLocalMessages] = useState(trip?.chatMessages || []);

  const handleConfirmRoomTypeChange = () => {
    if (!trip) return;
    const targetType = trip.roomType === 'private' ? 'public' : 'private';
    updateTripRoomType(trip.id, targetType);
    setShowRoomTypeConfirm(false);
    success(
      targetType === 'private'
        ? 'Trip privacy set to Private Room. Only travellers with the invite code can access it.'
        : 'Trip privacy set to Public Space. Travellers across Tripzobox can discover and request to join.',
      targetType === 'private' ? 'Switched to Private Room' : 'Switched to Public Space'
    );
  };

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
    <div className={`flex flex-col gap-4 sm:gap-6 text-left w-full max-w-7xl 2xl:max-w-[1536px] mx-auto ${isInApp ? '' : 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}`}>
      {/* 1. HERO BANNER (Matching Reference Screen 4) */}
      <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[260px] max-h-[420px] w-full bg-emerald-950 shadow-float">
        <img
          src={trip.coverImageUrl}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />

        {/* Top-left: Back button & Public Trip Badge (Matching Screen 4) */}
        <div className="absolute top-5 left-5 flex items-center gap-2.5">
          <Link
            to={isInApp ? '/app/trips' : '/trips'}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center backdrop-blur-md transition-all shadow-subtle"
            aria-label="Back to Trips"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/90 text-white backdrop-blur-md shadow-xs">
            <Globe className="w-3.5 h-3.5" />
            <span>Public Trip</span>
          </span>
        </div>

        {/* Top-right: Heart bookmark button (Matching Screen 4) */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareClick}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center backdrop-blur-md transition-all shadow-subtle cursor-pointer"
            aria-label="Share Trip"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleSaveTrip(trip.id)}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center backdrop-blur-md transition-all shadow-subtle cursor-pointer"
            aria-label="Save Trip"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>
        </div>

        {/* Bottom Banner Title & Destination Pin (Matching Screen 4) */}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-white tracking-tight drop-shadow-sm">
            {trip.name}
          </h1>
          <p className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-200/90 mt-1.5 drop-shadow-xs">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{trip.destination}</span>
          </p>
        </div>
      </div>

      {/* 2. STATS BAR & TAGS CARD (Matching Reference Screen 4) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pb-4 border-b border-gray-100">
          {/* Stat 1: Dates */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                {trip.startDate} - {trip.endDate}
              </span>
              <span className="text-xs text-gray-500 font-medium">({trip.durationDays} days)</span>
            </div>
          </div>

          {/* Stat 2: Members joined */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                {trip.members.length} of {trip.maxMembers} joined
              </span>
              <span className="text-xs text-gray-500 font-medium">
                ({Math.max(0, trip.maxMembers - trip.members.length)} spots left)
              </span>
            </div>
          </div>

          {/* Stat 3: Budget per person */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-gray-900 block">
                ₹{trip.budgetPerPerson.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-medium">per person</span>
            </div>
          </div>
        </div>

        {/* Tag Badges row matching Screen 4: Nature, Trekking, Photography, Food */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {(trip.preferences.length > 0 ? trip.preferences : ['Nature', 'Trekking', 'Photography', 'Food']).map(
            (tag) => (
              <span
                key={tag}
                className="px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-primary border border-emerald-200/80"
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      {/* 2.5 TRIP LEADER ROOM CONTROL CENTER (Visible if current user is the Trip Leader) */}
      {isLeader && (
        <div className="bg-gradient-to-r from-emerald-950 via-gray-900 to-emerald-900 text-white rounded-2xl p-5 sm:p-6 border border-emerald-700/40 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0"><Crown className="w-5 h-5" /></div>
                <h3 className="min-w-0 flex-1 font-heading font-bold text-base sm:text-lg text-white leading-snug"><span className="sm:hidden">Trip Leader Console</span><span className="hidden sm:inline">Trip Leader Room Console</span></h3>
                <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"><span className="sm:hidden">Host</span><span className="hidden sm:inline">Host Control</span></span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">Manage join requests, room privacy, and companion approvals.</p>
            </div>
            {/* Room Type Toggle & Room Code */}
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRoomTypeConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer"
              >
                {trip.roomType === 'private' ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span><span className="sm:hidden">Private room</span><span className="hidden sm:inline">Private Room (Click to make Public)</span></span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span><span className="sm:hidden">Public space</span><span className="hidden sm:inline">Public Space (Click to make Private)</span></span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `${window.location.origin}/trips/${trip.id}?code=${trip.roomCode || 'ROOM'}`
                  );
                  success(`Room code #${trip.roomCode || 'ROOM'} & link copied to clipboard!`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span><span className="hidden sm:inline">Room Code: </span>{trip.roomCode || 'ROOM-8492'}</span>
              </button>
            </div>
          </div>

          {/* Pending Applications from Travellers */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>
                  Pending Join Requests (
                  {trip.pendingJoinRequests?.length || 0})
                </span>
              </h4>
              <span className="text-[11px] text-gray-400">
                {trip.maxMembers - trip.members.length} spots remaining in room
              </span>
            </div>

            {trip.pendingJoinRequests && trip.pendingJoinRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trip.pendingJoinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={req.user.avatarUrl}
                        name={req.user.name}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h5 className="font-semibold text-xs sm:text-sm text-white truncate">
                            {req.user.name}
                          </h5>
                          <span className="text-[10px] text-gray-400">
                            {req.requestedAt}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300">
                          {req.user.city} · {req.user.travelInterests?.join(', ')}
                        </p>
                        {req.message && (
                          <p className="text-xs text-gray-200 mt-1 italic bg-black/20 p-2 rounded-lg border border-white/5">
                            "{req.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          declineJoinRequest(trip.id, req.user.id);
                          info(`Declined join request from ${req.user.name}`);
                        }}
                        className="px-2 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-300 border border-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          acceptJoinRequest(trip.id, req.user.id);
                          success(
                            `Accepted ${req.user.name} into the trip room!`,
                            'Member Approved'
                          );
                        }}
                        className="px-2 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept to Room</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/15 text-center text-xs text-gray-300">
                <p>
                  🌐 Your Public Space is live on Tripzobox! Any traveller can request to join. When someone applies, you can review and accept them right here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT: STAT CARDS + TABS (LEFT 2 COLS) & SIDEBAR (RIGHT 1 COL) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 min-w-0 space-y-3 lg:space-y-6">
          {/* THREE STAT CARDS (Matching Reference Screen 7: Members, Difficulty, Type) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:gap-4">
            {/* Stat Card 1: Members */}
            <div className="bg-white rounded-2xl border border-border p-2 sm:p-4 lg:p-5 shadow-card flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 lg:gap-4 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-heading font-bold text-xs sm:text-base lg:text-lg text-text truncate">
                  {trip.members.length}/{trip.maxMembers}
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted font-medium">Members</div>
              </div>
            </div>

            {/* Stat Card 2: Difficulty */}
            <div className="bg-white rounded-2xl border border-border p-2 sm:p-4 lg:p-5 shadow-card flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 lg:gap-4 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                <Mountain className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-heading font-bold text-xs sm:text-base lg:text-lg text-text capitalize truncate">
                  {trip.difficulty || 'Medium'}
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted font-medium">Difficulty</div>
              </div>
            </div>

            {/* Stat Card 3: Type */}
            <div className="bg-white rounded-2xl border border-border p-2 sm:p-4 lg:p-5 shadow-card flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 lg:gap-4 text-center sm:text-left">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-accent/35 text-primary flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="font-heading font-bold text-xs sm:text-base lg:text-lg text-text truncate">
                  {trip.tripType === 'solo' ? 'Solo' : trip.tripType === 'couple' ? 'Couple' : 'Group'}
                </div>
                <div className="text-[11px] sm:text-xs text-text-muted font-medium">Type</div>
              </div>
            </div>
          </div>

          {/* TABS CONTAINER */}
          <div id="trip-main-details" className="scroll-mt-24 bg-white rounded-2xl border border-border p-3 sm:p-4 lg:p-6 shadow-subtle">
            {/* Tabs */}
            <div className="hidden sm:block"><Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tabId) => setActiveTab(tabId as any)}
              variant="underline"
            /></div>
            <div className="grid grid-cols-4 gap-1 border-b border-border sm:hidden" aria-label="Trip details">
              {tabs.map((tab) => <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => setActiveTab(tab.id as any)} className={`min-w-0 py-3 text-[11px] font-semibold border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-muted'}`}>{tab.id === 'members' ? 'Members' : tab.label}</button>)}
            </div>

            {/* TAB: ABOUT */}
            {activeTab === 'about' && (
              <div className="pt-3 sm:pt-4 lg:pt-6 space-y-6">
                <div>
                  <h4 className="font-heading font-semibold text-base text-text mb-2">
                    About this trip
                  </h4>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {trip.description}
                  </p>
                </div>

                {/* Trip Inclusions (Matching Screen 4) */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-heading font-semibold text-base text-text mb-3">
                    Trip Inclusions
                  </h4>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-light-bg border border-border text-xs font-semibold text-text shadow-2xs">
                      <Car className="w-4 h-4 text-primary" />
                      <span>Transport</span>
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-light-bg border border-border text-xs font-semibold text-text shadow-2xs">
                      <Home className="w-4 h-4 text-primary" />
                      <span>Accommodation</span>
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-light-bg border border-border text-xs font-semibold text-text shadow-2xs">
                      <Utensils className="w-4 h-4 text-primary" />
                      <span>Meals (breakfast + dinner)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('itinerary')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3 hover:underline cursor-pointer"
                  >
                    <span>View More</span>
                    <span>&gt;</span>
                  </button>
                </div>

                {/* Trip Highlights Chips */}
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
              <div className="pt-3 sm:pt-4 lg:pt-6 space-y-4">
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
              <div className="pt-3 sm:pt-4 lg:pt-6 space-y-4">
                <h4 className="font-heading font-semibold text-base text-text mb-3">
                  Trip Travellers ({trip.members.length}/{trip.maxMembers})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {trip.members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedTraveller(member)}
                      aria-label={`View ${member.name}'s profile`}
                      className="w-full p-3.5 rounded-xl bg-light-bg border border-border flex items-center gap-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
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
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CHAT */}
            {activeTab === 'chat' && (
              <div className="pt-3 sm:pt-4 lg:pt-6 space-y-4">
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

          </div>
          <section className="rounded-2xl border border-border bg-white p-3 sm:p-4 lg:p-6 shadow-subtle" aria-labelledby="trip-info-heading">
            <h3 id="trip-info-heading" className="font-heading font-bold text-base text-text mb-3">More about this trip</h3>
            <div className="grid grid-cols-3 gap-2" aria-label="Additional trip information">
              {([{ id: 'reviews', label: 'Reviews' }, { id: 'images', label: 'Photos' }, { id: 'contact', label: 'Contact' }] as const).map((item) => <button key={item.id} type="button" aria-pressed={infoTab === item.id} onClick={() => setInfoTab(item.id)} className={`rounded-xl py-2.5 text-xs sm:text-sm font-semibold border transition-colors ${infoTab === item.id ? 'bg-primary text-white border-primary' : 'bg-light-bg text-text-muted border-border hover:border-primary'}`}>{item.label}</button>)}
            </div>            {/* TAB: REVIEWS */}
            {infoTab === 'reviews' && (
              <div className="pt-3 sm:pt-4 lg:pt-6 space-y-4">
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
            {infoTab === 'images' && (
              <div className="pt-3 sm:pt-4 lg:pt-6 space-y-4">
                <h4 className="font-heading font-semibold text-base text-text">Trip Images</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...new Set([trip.coverImageUrl, ...(trip.galleryImages || [])])].map((src, index) => (
                    <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border focus-visible:outline-primary">
                      <img src={src} alt={`${trip.name} — photo ${index + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {infoTab === 'contact' && (
              <div className="pt-3 sm:pt-4 lg:pt-6 space-y-4">
                <h4 className="font-heading font-semibold text-base text-text">Contact Information</h4>
                <div className="rounded-xl bg-light-bg border border-border p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={trip.leader.avatarUrl} name={trip.leader.name} size="md" />
                    <div>
                      <p className="font-semibold text-sm text-text">{trip.leader.name}</p>
                      <p className="text-xs text-text-muted">Trip leader · {trip.leader.city}, {trip.leader.country || 'India'}</p>
                    </div>
                  </div>
                  {trip.contactInformation?.email && (
                    <p className="text-sm text-text-muted">Email: <a href={`mailto:${trip.contactInformation.email}`} className="text-primary break-all hover:underline">{trip.contactInformation.email}</a></p>
                  )}
                  {trip.contactInformation?.phone && (
                    <p className="text-sm text-text-muted">Phone: <a href={`tel:${trip.contactInformation.phone}`} className="text-primary hover:underline">{trip.contactInformation.phone}</a></p>
                  )}
                  {!trip.contactInformation?.email && !trip.contactInformation?.phone && (
                    <p className="text-sm text-text-muted">The trip leader hasn't shared an email or phone number. Ask your questions in the trip chat.</p>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => { setActiveTab('chat'); document.getElementById('trip-main-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} icon={<Send className="w-4 h-4" />}>Open Trip Chat</Button>
                </div>
              </div>
            )}


          </section>
        </div>

        {/* Right Column: Leader Card & Trip Rules & Action Button (Matching Screen 4) */}
        <div className="space-y-4">
          {/* Trip Organizer Card (Matching Screen 4) */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-xs text-left">
            <h4 className="font-heading font-bold text-sm sm:text-base text-text mb-3">
              Trip Organizer
            </h4>
            <div className="flex items-center gap-3">
              <Avatar src={trip.leader.avatarUrl} name={trip.leader.name} size="md" />
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-sm text-text truncate">{trip.leader.name}</h5>
                <p className="text-xs text-text-muted mt-0.5">
                  Trip Leader · {trip.leader.stats?.trips || 4} trips
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTraveller(trip.leader)}
              className="w-full mt-3.5 py-2 px-3 rounded-xl border border-gray-200 hover:border-primary text-xs font-semibold text-text hover:text-primary transition-colors cursor-pointer text-center"
            >
              View Profile
            </button>
          </div>

          {/* Trip Rules (Matching Screen 4) */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-xs text-left">
            <h4 className="font-heading font-bold text-sm sm:text-base text-text mb-3">
              Trip Rules
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Be respectful</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>No alcohol</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Keep the group active</span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3 hover:underline cursor-pointer"
            >
              <span>View All</span>
              <span>&gt;</span>
            </button>
          </div>

          {/* Request to Join / Leader Actions CTA (Matching Screen 4) */}
          <div className="bg-white rounded-2xl border border-border p-4 shadow-xs text-left space-y-2.5">
            {isLeader ? (
              <div className="space-y-2">
                <Link
                  to={`/app/trips/${trip.id}/console`}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors block text-center"
                >
                  Trip Leader Console
                </Link>
                <Link
                  to={`/app/trips/${trip.id}/requests`}
                  className="w-full py-2.5 rounded-xl border border-primary text-primary hover:bg-emerald-50 font-semibold text-xs transition-colors block text-center"
                >
                  Join Requests ({trip.pendingJoinRequests?.length || 2})
                </Link>
              </div>
            ) : joinStatus === 'accepted' ? (
              <div className="w-full py-3 rounded-xl bg-emerald-50 text-primary font-semibold text-xs sm:text-sm text-center border border-emerald-200">
                Joined ✓ (See you in Munnar!)
              </div>
            ) : joinStatus === 'pending' ? (
              <div className="w-full py-3 rounded-xl bg-amber-50 text-amber-700 font-semibold text-xs sm:text-sm text-center border border-amber-200">
                Request Pending Review...
              </div>
            ) : (
              <button
                type="button"
                onClick={handleJoinClick}
                className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              >
                Request to Join
              </button>
            )}

            {/* Quick Leader Tools link if not leader to let user preview console & requests */}
            {!isLeader && (
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>Trip Leader preview:</span>
                <Link
                  to={`/app/trips/${trip.id}/console`}
                  className="font-semibold text-primary hover:underline"
                >
                  Leader Console &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Members Stack Card */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <h4 className="font-heading font-bold text-sm text-text">
                Members ({trip.members.length}/{trip.maxMembers})
              </h4>
              <span className="text-xs font-semibold text-primary">
                {Math.max(0, trip.maxMembers - trip.members.length)} spots left
              </span>
            </div>

            <AvatarGroup users={trip.members} max={5} size="md" className="py-1" />
          </div>
        </div>
      </div>
      <Modal isOpen={selectedTraveller !== null} onClose={() => setSelectedTraveller(null)} title="Traveller profile">
        {selectedTraveller && <div className="space-y-4 text-left">
          <div className="flex items-center gap-3">
            <Avatar src={selectedTraveller.avatarUrl} name={selectedTraveller.name} size="lg" />
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-lg text-text break-words">{selectedTraveller.name}</h3>
              <p className="text-xs text-text-muted">@{selectedTraveller.username}</p>
              <p className="text-sm text-text-muted mt-1">{selectedTraveller.city}, {selectedTraveller.country || 'India'}</p>
              {selectedTraveller.id === trip.leader.id && <span className="text-xs font-semibold text-primary">Trip leader</span>}
            </div>
          </div>
          {selectedTraveller.bio && <p className="text-sm text-text leading-relaxed">{selectedTraveller.bio}</p>}
          <div className="flex flex-wrap gap-2">{selectedTraveller.travelInterests.map((interest) => <span key={interest} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{interest}</span>)}</div>
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-light-bg p-3 text-sm">
            <div><dt className="text-xs text-text-muted">Trips</dt><dd className="font-semibold text-text">{selectedTraveller.stats.trips}</dd></div>
            <div><dt className="text-xs text-text-muted">Stories</dt><dd className="font-semibold text-text">{selectedTraveller.stats.stories}</dd></div>
            <div><dt className="text-xs text-text-muted">Budget style</dt><dd className="font-semibold text-text capitalize">{selectedTraveller.budgetStyle}</dd></div>
            <div><dt className="text-xs text-text-muted">Languages</dt><dd className="font-semibold text-text">{selectedTraveller.languages.join(', ') || 'Not shared'}</dd></div>
          </dl>
        </div>}
      </Modal>

      {/* Confirmation Modal to change between Public Space and Private Room */}
      <Modal
        isOpen={showRoomTypeConfirm}
        onClose={() => setShowRoomTypeConfirm(false)}
        title={trip.roomType === 'private' ? 'Make Trip Public?' : 'Make Trip Private?'}
        maxWidth="md"
      >
        <div className="space-y-4 text-left pt-1">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                trip.roomType === 'private'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {trip.roomType === 'private' ? (
                <Globe className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-heading font-bold text-sm text-gray-900">
                {trip.roomType === 'private'
                  ? 'Switch to a Public Space'
                  : 'Switch to a Private Room'}
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {trip.roomType === 'private'
                  ? 'Your trip will be discoverable by all travellers on the Explore & Trips pages. Anyone can discover your itinerary and submit join requests.'
                  : `Your trip will be hidden from public discovery. Only travellers with the direct room link or Room Code (${trip.roomCode || 'ROOM-8492'}) will be able to view and request to join.`}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-3 bg-white text-xs space-y-2 text-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Current status:</span>
              <span className="font-semibold text-gray-800">
                {trip.roomType === 'private' ? '🔒 Private Room' : '🌐 Public Space'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">New status:</span>
              <span
                className={`font-semibold ${
                  trip.roomType === 'private' ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {trip.roomType === 'private' ? '🌐 Public Space' : '🔒 Private Room'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowRoomTypeConfirm(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRoomTypeChange}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                trip.roomType === 'private'
                  ? 'bg-primary hover:bg-primary-hover'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {trip.roomType === 'private' ? 'Yes, Make Public' : 'Yes, Make Private'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
