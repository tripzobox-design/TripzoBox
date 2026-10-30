import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Users,
  Clock,
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Eye,
  FileText,
  DollarSign,
  Settings,
  UserCheck,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useTrips } from '../context/TripsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripsApi } from '../lib/api';

export const TripLeaderConsolePage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getTripById } = useTrips();
  const { user } = useAuth();
  const { success, info, error } = useToast();

  const isRequestsRoute = location.pathname.endsWith('/requests');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'requests' | 'members' | 'itinerary' | 'expenses' | 'settings'
  >(isRequestsRoute ? 'requests' : 'overview');

  const [requestFilter, setRequestFilter] = useState<'pending' | 'accepted' | 'declined'>(
    'pending'
  );

  const trip = getTripById(tripId || 'trip_munnar_1') || {
    id: tripId || 'trip_munnar_1',
    name: 'Munnar Weekend Escape',
    destination: 'Munnar, Kerala',
    startCity: 'Bengaluru',
    startDate: '12 Dec 2025',
    endDate: '14 Dec 2025',
    durationDays: 3,
    budgetPerPerson: 5000,
    maxMembers: 6,
    coverImageUrl:
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
    leader: user,
    members: [user],
    tripType: 'group' as const,
    travelStyle: 'Solo',
    languages: ['English', 'Hindi'],
    preferences: ['Nature', 'Trekking'],
    description: 'Scenic exploration journey.',
    highlights: ['Tea Gardens', 'Waterfalls'],
    inclusions: ['Transport', 'Stay'],
    rules: ['Be respectful'],
    difficulty: 'medium' as const,
    galleryImages: [],
    itinerary: [],
    status: 'open' as const,
    roomType: 'public' as const,
    roomCode: 'ROOM-1001',
    compatibilityScore: 95,
  };

  // State for pending join requests (matching Screen 5)
  const [requestsList, setRequestsList] = useState([
    {
      id: 'req_neha',
      name: 'Neha Sharma',
      location: 'Bengaluru, Karnataka',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      time: '2h ago',
      budget: '₹5k - ₹8k',
      travelStyle: 'Solo',
      languages: 'Hindi, English',
      message:
        'Hi! I love trekking and exploring new places. This trip looks amazing. I would love to join!',
      status: 'pending' as 'pending' | 'accepted' | 'declined',
    },
    {
      id: 'req_rohit',
      name: 'Rohit Verma',
      location: 'Chennai, Tamil Nadu',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      time: '5h ago',
      budget: '₹5k - ₹10k',
      travelStyle: 'Group',
      languages: 'English, Hindi',
      message:
        'Hey! I am a nature and photography enthusiast. Would love to be part of this trip.',
      status: 'pending' as 'pending' | 'accepted' | 'declined',
    },
  ]);

  useEffect(() => {
    if (trip?.id) {
      tripsApi
        .getRequests(trip.id)
        .then((serverReqs) => {
          if (Array.isArray(serverReqs) && serverReqs.length > 0) {
            setRequestsList(
              serverReqs.map((sr: any) => ({
                id: sr.id,
                name: sr.user.name,
                location: sr.user.location || sr.user.city || 'India',
                avatarUrl: sr.user.avatarUrl,
                time: sr.requestedAt || 'Recently',
                budget: sr.user.budget || 'Flexible',
                travelStyle: sr.user.travelStyle || 'Solo',
                languages: sr.user.languages || 'English, Hindi',
                message: sr.message,
                status: sr.status,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [trip?.id]);

  const [joinedMembers, setJoinedMembers] = useState(() => {
    if (trip?.members && trip.members.length > 0) {
      return trip.members.map((m: any) => ({
        id: m.id,
        name: m.name,
        role: m.id === trip.leader?.id ? 'Trip Leader' : 'Member',
        avatarUrl:
          m.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      }));
    }
    return [
      {
        id: trip?.leader?.id || 'mem_aarav',
        name: trip?.leader?.name || 'Aarav Sharma',
        role: 'Trip Leader',
        avatarUrl:
          trip?.leader?.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      },
    ];
  });

  const pendingCount = requestsList.filter((r) => r.status === 'pending').length;
  const acceptedCount = joinedMembers.length;
  const declinedCount = requestsList.filter((r) => r.status === 'declined').length;
  const totalSeats = trip.maxMembers || 6;
  const availableSeats = Math.max(0, totalSeats - joinedMembers.length);

  const handleAcceptRequest = async (id: string, name: string) => {
    if (joinedMembers.length >= totalSeats) {
      error(`Cannot accept ${name}. Trip has reached maximum capacity of ${totalSeats} members.`, 'Trip Full');
      return;
    }
    setRequestsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r))
    );
    const target = requestsList.find((r) => r.id === id);
    if (target && !joinedMembers.some((m) => m.id === target.id)) {
      setJoinedMembers((prev) => [
        ...prev,
        { id: target.id, name: target.name, role: 'Member', avatarUrl: target.avatarUrl },
      ]);
    }
    try {
      await tripsApi.acceptRequest(trip.id, id);
      success(`${name} has been accepted into the trip squad!`, 'Request Approved');
    } catch {
      success(`${name} has been accepted into the trip squad!`, 'Request Approved');
    }
  };

  const handleDeclineRequest = (id: string, name: string) => {
    setRequestsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'declined' } : r))
    );
    tripsApi.declineRequest(trip.id, id).catch(() => {});
    info(`${name}'s request was declined.`);
  };

  const filteredRequests = requestsList.filter((r) => r.status === requestFilter);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto py-2 sm:py-6 text-left">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to={`/app/trips/${trip.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trip Page</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
          {activeTab === 'requests' ? 'Join Requests' : 'Trip Leader Console'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {activeTab === 'requests'
            ? 'Manage who can join your trip.'
            : 'Everything you need to manage your trip.'}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TRIP SUMMARY HEADER CARD (Matching Screen 5 & 6) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Munnar Thumbnail */}
          <img
            src={trip.coverImageUrl}
            alt={trip.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-gray-100"
          />
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-gray-900">
              {trip.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {trip.startDate} - {trip.endDate} · {trip.durationDays} days
            </p>
            {/* Progress bar and spots left */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold text-primary">
                {joinedMembers.length} of {totalSeats} joined
              </span>
              <span className="text-xs text-gray-400">({availableSeats} spots left)</span>
            </div>
          </div>
        </div>

        <Link
          to={`/app/trips/${trip.id}`}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold text-center transition-colors shrink-0"
        >
          View Trip
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 5: JOIN REQUESTS VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'requests' ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Navigation to go back to Overview if wanted */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => setRequestFilter('pending')}
                className={`text-xs sm:text-sm font-semibold pb-3 -mb-3 relative transition-colors cursor-pointer ${
                  requestFilter === 'pending'
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Pending ({pendingCount})
                {requestFilter === 'pending' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('accepted')}
                className={`text-xs sm:text-sm font-semibold pb-3 -mb-3 relative transition-colors cursor-pointer ${
                  requestFilter === 'accepted'
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Accepted ({acceptedCount})
                {requestFilter === 'accepted' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRequestFilter('declined')}
                className={`text-xs sm:text-sm font-semibold pb-3 -mb-3 relative transition-colors cursor-pointer ${
                  requestFilter === 'declined'
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Declined ({declinedCount})
                {requestFilter === 'declined' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Switch to Leader Console
            </button>
          </div>

          {/* Request Cards List (Matching Screen 5) */}
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                {/* User Info */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={req.avatarUrl}
                    alt={req.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100"
                  />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900">
                        {req.name}
                      </h4>
                      <span className="text-xs text-gray-400">· {req.time}</span>
                    </div>
                    <p className="text-xs text-gray-500">{req.location}</p>

                    {/* Metadata Row */}
                    <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                      Budget: <span className="font-semibold text-gray-800">{req.budget}</span> |
                      Travel style:{' '}
                      <span className="font-semibold text-gray-800">{req.travelStyle}</span> |
                      Languages:{' '}
                      <span className="font-semibold text-gray-800">{req.languages}</span>
                    </div>

                    {/* Message quote */}
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pt-1">
                      "{req.message}"
                    </p>
                  </div>
                </div>

                {/* Action Buttons (Screen 5) */}
                {req.status === 'pending' && (
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(req.id, req.name)}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.id, req.name)}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                  </div>
                )}

                {req.status === 'accepted' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <Check className="w-3.5 h-3.5" />
                    <span>Accepted</span>
                  </span>
                )}

                {req.status === 'declined' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    <X className="w-3.5 h-3.5" />
                    <span>Declined</span>
                  </span>
                )}
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="py-12 text-center bg-white rounded-2xl border border-gray-200">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="font-heading font-bold text-base text-gray-700">No requests here</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Check the other tabs or share your trip link with friends.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SCREEN 6: TRIP LEADER CONSOLE VIEW */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 4 Stats Cards (Screen 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-2xs">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 block">
                {totalSeats}
              </span>
              <span className="text-xs text-gray-500 font-medium">Total Seats</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-2xs">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-600 block">
                {joinedMembers.length}
              </span>
              <span className="text-xs text-gray-500 font-medium">Joined</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-2xs">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-amber-500 block">
                {pendingCount}
              </span>
              <span className="text-xs text-gray-500 font-medium">Pending</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-2xs">
              <span className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 block">
                {availableSeats}
              </span>
              <span className="text-xs text-gray-500 font-medium">Available</span>
            </div>
          </div>

          {/* Split Layout: Sidebar + Main Area */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Console Nav (Screen 6) */}
            <aside className="w-full md:w-56 bg-white rounded-2xl border border-gray-200/90 p-3 shadow-2xs shrink-0 self-start">
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview', icon: Eye },
                  {
                    id: 'requests',
                    label: 'Join Requests',
                    icon: Users,
                    badge: pendingCount,
                  },
                  { id: 'members', label: 'Members', icon: UserCheck },
                  { id: 'itinerary', label: 'Itinerary', icon: Calendar },
                  { id: 'expenses', label: 'Expenses', icon: DollarSign },
                  { id: 'settings', label: 'Trip Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-100/70 text-emerald-900 font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-400'}`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Right Main Content Panel (Screen 6) */}
            <div className="flex-1 space-y-6">
              {/* Recent Activity Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Recent Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View Requests
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  <div className="py-3 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                      alt="Neha"
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-800">
                        <span className="font-semibold text-gray-900">Neha Sharma</span> requested
                        to join
                      </p>
                      <span className="text-[11px] text-gray-400">2h ago</span>
                    </div>
                  </div>

                  <div className="py-3 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                      alt="Rohit"
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-800">
                        <span className="font-semibold text-gray-900">Rohit Verma</span> requested
                        to join
                      </p>
                      <span className="text-[11px] text-gray-400">5h ago</span>
                    </div>
                  </div>

                  <div className="py-3 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
                      alt="Priya"
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-800">
                        <span className="font-semibold text-gray-900">Priya Nair</span> joined the
                        trip
                      </p>
                      <span className="text-[11px] text-gray-400">1 day ago</span>
                    </div>
                  </div>

                  <div className="py-3 flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
                      alt="Arjun"
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-gray-800">
                        <span className="font-semibold text-gray-900">Arjun Mehta</span> joined the
                        trip
                      </p>
                      <span className="text-[11px] text-gray-400">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keep your group safe Card (Screen 6) */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 flex items-start gap-3.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900">
                    Keep your group safe
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Review each request carefully and make sure you know the people joining your
                    trip. Verify compatibility and keep conversations on Tripzobox.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

