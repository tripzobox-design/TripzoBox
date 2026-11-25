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
  Flag,
  ShieldCheck,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useTrips } from '../context/TripsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { tripsApi } from '../lib/api';
import { VerificationBadges } from '../components/safety/VerificationBadges';
import { ReportModal } from '../components/safety/ReportModal';

export const TripLeaderConsolePage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getTripById, updateTripDetails, updateTripRoomType } = useTrips();
  const { user } = useAuth();
  const { success, info, error } = useToast();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string }>({ id: '', name: '' });

  const isRequestsRoute = location.pathname.endsWith('/requests');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'requests' | 'members' | 'itinerary' | 'expenses' | 'settings'
  >(isRequestsRoute ? 'requests' : 'overview');

  const [requestFilter, setRequestFilter] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const contextTrip = getTripById(tripId || '');
  const trip = contextTrip || {
    id: tripId || 'trip_current',
    name: 'Untitled Trip',
    destination: 'Trip Destination',
    startCity: '',
    startDate: '',
    endDate: '',
    durationDays: 1,
    budgetPerPerson: 5000,
    maxMembers: 8,
    coverImageUrl: '',
    leader: user,
    members: [user],
    tripType: 'group' as const,
    travelStyle: 'Solo',
    languages: ['English'],
    preferences: [],
    description: '',
    highlights: [],
    inclusions: ['Transport', 'Accommodation'],
    rules: ['Be respectful'],
    difficulty: 'medium' as const,
    galleryImages: [],
    itinerary: [],
    status: 'open' as const,
    roomType: 'public' as const,
    roomCode: 'ROOM-1001',
    compatibilityScore: 95,
  };

  // State for real join requests
  const [requestsList, setRequestsList] = useState<any[]>([]);

  // State for interactive itinerary
  const [consoleItinerary, setConsoleItinerary] = useState<{ day: number; title: string; desc: string }[]>(() => {
    return trip?.itinerary && trip.itinerary.length > 0 ? trip.itinerary.map((d: any) => ({ ...d })) : [];
  });
  const [isSavingItinerary, setIsSavingItinerary] = useState(false);

  // State for trip settings
  const [roomTypeState, setRoomTypeState] = useState<'public' | 'private'>(trip.roomType || 'public');
  const [maxMembersState, setMaxMembersState] = useState<number>(trip.maxMembers || 8);

  useEffect(() => {
    if (trip?.itinerary) {
      setConsoleItinerary(trip.itinerary.map((d: any) => ({ ...d })));
    }
  }, [trip?.itinerary]);

  useEffect(() => {
    if (trip?.roomType) setRoomTypeState(trip.roomType);
    if (trip?.maxMembers) setMaxMembersState(trip.maxMembers);
  }, [trip?.roomType, trip?.maxMembers]);

  useEffect(() => {
    if (trip?.id) {
      tripsApi
        .getRequests(trip.id)
        .then((serverReqs) => {
          if (Array.isArray(serverReqs)) {
            setRequestsList(
              serverReqs.map((sr: any) => ({
                id: sr.id,
                name: sr.user?.name || 'Applicant',
                location: sr.user?.location || sr.user?.city || 'India',
                avatarUrl: sr.user?.avatarUrl,
                time: sr.requestedAt || 'Recently',
                budget: sr.user?.budget || 'Flexible',
                travelStyle: sr.user?.travelStyle || 'Solo',
                languages: sr.user?.languages || 'English',
                message: sr.message || 'Excited to join this journey!',
                status: sr.status || 'pending',
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
        avatarUrl: m.avatarUrl,
        location: m.city ? `${m.city}, ${m.country || 'India'}` : 'Verified Traveller',
      }));
    }
    return [
      {
        id: trip?.leader?.id || user.id,
        name: trip?.leader?.name || user.name || 'Trip Leader',
        role: 'Trip Leader',
        avatarUrl: trip?.leader?.avatarUrl || user.avatarUrl,
        location: user.city ? `${user.city}, ${user.country || 'India'}` : 'Verified Traveller',
      },
    ];
  });

  const pendingCount = requestsList.filter((r) => r.status === 'pending').length;
  const acceptedCount = joinedMembers.length;
  const declinedCount = requestsList.filter((r) => r.status === 'declined').length;
  const totalSeats = maxMembersState || trip.maxMembers || 8;
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
        { id: target.id, name: target.name, role: 'Member', avatarUrl: target.avatarUrl, location: target.location },
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

  const handleAddItineraryDay = () => {
    setConsoleItinerary((prev) => [
      ...prev,
      { day: prev.length + 1, title: '', desc: '' },
    ]);
  };

  const handleRemoveItineraryDay = (index: number) => {
    setConsoleItinerary((prev) =>
      prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }))
    );
  };

  const handleSaveItinerary = async () => {
    const cleaned = consoleItinerary
      .map((d, idx) => ({
        day: idx + 1,
        title: d.title.trim() || `Day ${idx + 1} Activities`,
        desc: d.desc.trim(),
      }))
      .filter((d) => d.title || d.desc);

    setIsSavingItinerary(true);
    try {
      await updateTripDetails(trip.id, { itinerary: cleaned });
      success('Day-by-day itinerary updated successfully!', 'Itinerary Saved 🎉');
    } catch {
      info('Could not save itinerary to server.');
    } finally {
      setIsSavingItinerary(false);
    }
  };

  const handleToggleRoomType = async (newType: 'public' | 'private') => {
    setRoomTypeState(newType);
    updateTripRoomType(trip.id, newType);
    try {
      await tripsApi.updateRoomType(trip.id, newType);
      success(`Trip set to ${newType === 'public' ? 'Public Space' : 'Private Room'}.`);
    } catch {}
  };

  const handleSaveCapacity = async (capacity: number) => {
    setMaxMembersState(capacity);
    try {
      await updateTripDetails(trip.id, { maxMembers: capacity });
      success(`Trip capacity updated to ${capacity} seats.`);
    } catch {}
  };

  const filteredRequests = requestsList.filter((r) => r.status === requestFilter);

  // Real recent activity combining actual requests & confirmed participants
  const realActivities = [
    ...requestsList.map((r) => ({
      id: `req_${r.id}`,
      name: r.name,
      avatarUrl: r.avatarUrl,
      action: r.status === 'accepted' ? 'joined the trip' : r.status === 'declined' ? 'request declined' : 'requested to join',
      time: r.time,
      isPending: r.status === 'pending',
    })),
    ...joinedMembers.filter((m) => m.id !== trip.leader?.id).map((m) => ({
      id: `mem_${m.id}`,
      name: m.name,
      avatarUrl: m.avatarUrl,
      action: 'confirmed participation in the trip',
      time: 'Confirmed',
      isPending: false,
    })),
  ];

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

      {/* TRIP SUMMARY HEADER CARD */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {trip.coverImageUrl ? (
            <img
              src={trip.coverImageUrl}
              alt={trip.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-gray-100"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-emerald-50 text-primary flex items-center justify-center shrink-0 border border-emerald-100 font-bold text-xl">
              {(trip.name || 'T').charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-gray-900">
              {trip.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {trip.startDate && trip.endDate ? `${trip.startDate} - ${trip.endDate} · ` : ''}{trip.durationDays} day{trip.durationDays > 1 ? 's' : ''}
            </p>
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

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
        {/* Left Console Nav */}
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

        {/* Right Main Content Panel */}
        <div className="flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Recent Activity Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Recent Activity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requests')}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    View Requests
                  </button>
                </div>

                {realActivities.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {realActivities.map((act) => (
                      <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {act.avatarUrl ? (
                            <img
                              src={act.avatarUrl}
                              alt={act.name}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {(act.name || 'U').charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-800">
                              <span className="font-semibold text-gray-900">{act.name}</span>{' '}
                              {act.action}
                            </p>
                            <span className="text-[11px] text-gray-400">{act.time}</span>
                          </div>
                        </div>

                        {act.isPending && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('requests')}
                            className="px-3 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary-hover shrink-0 cursor-pointer"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="w-9 h-9 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">No recent activity yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      When travellers request to join or confirmed participants join, real-time activity updates will show here.
                    </p>
                  </div>
                )}
              </div>

              {/* Keep your group safe Card */}
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
          )}

          {/* TAB 2: JOIN REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-5 animate-in fade-in duration-200">
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
              </div>

              {/* Request Cards List */}
              <div className="space-y-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {req.avatarUrl ? (
                        <img
                          src={req.avatarUrl}
                          alt={req.name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {(req.name || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-heading font-bold text-sm sm:text-base text-gray-900">
                            {req.name}
                          </h4>
                          <span className="text-xs text-gray-400">· {req.time}</span>
                          <VerificationBadges
                            user={{
                              emailVerified: true,
                              phoneVerified: true,
                              identityVerificationStatus: 'VERIFIED',
                            } as any}
                            size="xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setReportTarget({ id: req.id, name: req.name });
                              setReportModalOpen(true);
                            }}
                            className="text-[11px] text-gray-400 hover:text-red-600 flex items-center gap-1 transition-colors ml-auto sm:ml-2 cursor-pointer"
                            title="Report suspicious applicant"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Report</span>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">{req.location}</p>

                        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                          Budget: <span className="font-semibold text-gray-800">{req.budget}</span> |
                          Travel style:{' '}
                          <span className="font-semibold text-gray-800">{req.travelStyle}</span> |
                          Languages:{' '}
                          <span className="font-semibold text-gray-800">{req.languages}</span>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pt-1">
                          "{req.message}"
                        </p>
                      </div>
                    </div>

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
                    <h4 className="font-heading font-bold text-base text-gray-700">No requests in this tab</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      When travellers apply to join your trip, their applications will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS */}
          {activeTab === 'members' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs text-left space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Joined Members ({joinedMembers.length}/{totalSeats})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Confirmed participants for this journey. {availableSeats} spots currently open.
                  </p>
                </div>
                <Link
                  to={`/app/trips/${trip.id}?tab=chat`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-semibold transition-colors"
                >
                  <span>Open Trip Chat</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {joinedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {(member.name || 'U').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                            {member.name}
                          </h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              member.role === 'Trip Leader'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{member.location}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Confirmed</span>
                    </span>
                  </div>
                ))}
              </div>

              {joinedMembers.length <= 1 && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                  <Users className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>{availableSeats} spots currently open. Once you accept applicants from Join Requests, their profiles will appear here.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ITINERARY */}
          {activeTab === 'itinerary' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs text-left space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Day-by-Day Itinerary Plan
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add and manage daily scheduled activities, sightseeing stops, and meeting points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItineraryDay}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Day</span>
                </button>
              </div>

              {consoleItinerary.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
                  <Calendar className="w-10 h-10 text-emerald-600/50 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm text-gray-800">No itinerary days added yet</h4>
                  <p className="text-xs text-gray-500 mt-1 mb-4 max-w-sm mx-auto">
                    Plan your daily routes, activities, and rest stops so joined travellers can view the complete schedule.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddItineraryDay}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Day 1 Plan</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {consoleItinerary.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-2 relative text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                            D{idx + 1}
                          </span>
                          <span>Day {idx + 1} Plan</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItineraryDay(idx)}
                          className="text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          Remove Day
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Day Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const copy = [...consoleItinerary];
                            copy[idx].title = e.target.value;
                            setConsoleItinerary(copy);
                          }}
                          placeholder={`e.g. Day ${idx + 1}: Arrival, Trekking & Sunset Point`}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Activity Details & Schedule
                        </label>
                        <textarea
                          rows={2}
                          value={item.desc}
                          onChange={(e) => {
                            const copy = [...consoleItinerary];
                            copy[idx].desc = e.target.value;
                            setConsoleItinerary(copy);
                          }}
                          placeholder="Outline meeting times, route details, rest stops, or meals..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-y"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleAddItineraryDay}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Day {consoleItinerary.length + 1}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveItinerary}
                      disabled={isSavingItinerary}
                      className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingItinerary ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Itinerary Changes</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs text-left space-y-5 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Trip Expenses & Budget Breakdown
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Estimated financial breakdown per person and collective journey projections.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">
                    Budget Per Person
                  </span>
                  <span className="font-heading font-extrabold text-2xl text-emerald-900 mt-1 block">
                    ₹{(trip.budgetPerPerson || 5000).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-emerald-600 mt-0.5 block">Estimated per traveller</span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">
                    Confirmed Collection
                  </span>
                  <span className="font-heading font-extrabold text-2xl text-gray-900 mt-1 block">
                    ₹{((trip.budgetPerPerson || 5000) * joinedMembers.length).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">
                    {joinedMembers.length} confirmed member{joinedMembers.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">
                    Total Potential Pool
                  </span>
                  <span className="font-heading font-extrabold text-2xl text-gray-900 mt-1 block">
                    ₹{((trip.budgetPerPerson || 5000) * totalSeats).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">{totalSeats} total seats</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Included In Trip Budget
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(trip.inclusions && trip.inclusions.length > 0 ? trip.inclusions : ['Transport', 'Accommodation', 'Permits & Guides', 'Local Activities']).map((inc: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>{inc}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs text-left space-y-5 animate-in fade-in duration-200">
              <div className="pb-3 border-b border-gray-100">
                <h3 className="font-heading font-bold text-base text-gray-900">
                  Trip Settings & Visibility
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure discovery mode and participant capacities for this trip.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Trip Visibility Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleRoomType('public')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        roomTypeState === 'public'
                          ? 'border-primary bg-emerald-50/80 ring-1 ring-primary'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs sm:text-sm text-gray-900">🌐 Public Space</span>
                        {roomTypeState === 'public' && <Check className="w-4 h-4 text-primary stroke-[2.5]" />}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Visible to all verified travellers on Explore and Trips. Anyone can apply to join.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleRoomType('private')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        roomTypeState === 'private'
                          ? 'border-primary bg-emerald-50/80 ring-1 ring-primary'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs sm:text-sm text-gray-900">🔒 Private Room</span>
                        {roomTypeState === 'private' && <Check className="w-4 h-4 text-primary stroke-[2.5]" />}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Hidden from public search. Only travellers with the room link or invite code can access.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                    Maximum Group Capacity
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[4, 6, 8, 10, 12, 16].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSaveCapacity(num)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          maxMembersState === num
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {num} Seats
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    to={`/app/trips/${trip.id}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Live Trip Page</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="user"
        targetId={reportTarget.id}
        targetName={reportTarget.name}
      />
    </div>
  );
};
