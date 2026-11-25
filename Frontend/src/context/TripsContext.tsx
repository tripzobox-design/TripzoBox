import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip } from '../types';
import { useAuth } from './AuthContext';
import { tripsApi } from '../lib/api';

interface TripsContextType {
  trips: Trip[];
  savedTripIds: string[];
  joinRequests: Record<string, 'pending' | 'accepted'>;
  toggleSaveTrip: (tripId: string) => void;
  isTripSaved: (tripId: string) => boolean;
  requestJoinTrip: (tripId: string) => void;
  createTrip: (tripData: Omit<Trip, 'id' | 'leader' | 'members' | 'status'> & Partial<Pick<Trip, 'roomType' | 'roomCode' | 'status'>>) => Trip;
  acceptJoinRequest: (tripId: string, applicantId: string) => void;
  declineJoinRequest: (tripId: string, applicantId: string) => void;
  updateTripRoomType: (tripId: string, roomType: 'public' | 'private') => void;
  updateTripDetails: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  getTripById: (tripId: string) => Trip | undefined;
  myTrips: Trip[];
  refreshTrips: () => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

const scopedTripsKey = (base: string, userId?: string): string =>
  userId ? `${base}:${userId}` : base;

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const TripsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();

  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      localStorage.removeItem('tripzobox_trips');
    } catch {}
    return [];
  });

  const [savedTripIds, setSavedTripIds] = useState<string[]>(() => {
    if (!isLoggedIn) return [];
    return readStored<string[]>(scopedTripsKey('tripzobox_saved_trips', user?.id), []);
  });

  const [joinRequests, setJoinRequests] = useState<Record<string, 'pending' | 'accepted'>>(() => {
    if (!isLoggedIn) return {};
    return readStored<Record<string, 'pending' | 'accepted'>>(
      scopedTripsKey('tripzobox_join_requests', user?.id),
      {}
    );
  });

  const refreshTrips = async () => {
    try {
      const serverTrips = await tripsApi.getTrips();
      if (Array.isArray(serverTrips)) {
        setTrips(serverTrips);
        try {
          if (serverTrips.length === 0) {
            localStorage.removeItem('tripzobox_trips');
          } else {
            localStorage.setItem('tripzobox_trips', JSON.stringify(serverTrips));
          }
        } catch {}
      }
    } catch (e) {
      // Backend offline or unreachable, keep cached trips
    }
  };

  // Synchronize with backend API whenever session or active user changes
  useEffect(() => {
    let active = true;
    refreshTrips();

    if (!isLoggedIn || !user?.id) {
      setSavedTripIds([]);
      setJoinRequests({});
      return () => {
        active = false;
      };
    }

    setSavedTripIds(readStored<string[]>(scopedTripsKey('tripzobox_saved_trips', user.id), []));
    setJoinRequests(
      readStored<Record<string, 'pending' | 'accepted'>>(
        scopedTripsKey('tripzobox_join_requests', user.id),
        {}
      )
    );

    tripsApi
      .getSavedTrips()
      .then((data) => {
        if (active && Array.isArray(data?.savedTripIds)) {
          setSavedTripIds(data.savedTripIds);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    localStorage.setItem('tripzobox_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedTripsKey('tripzobox_saved_trips', user.id),
      JSON.stringify(savedTripIds)
    );
  }, [savedTripIds, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedTripsKey('tripzobox_join_requests', user.id),
      JSON.stringify(joinRequests)
    );
  }, [joinRequests, isLoggedIn, user?.id]);

  const toggleSaveTrip = (tripId: string) => {
    setSavedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
    tripsApi.toggleSaveTrip(tripId).catch(() => {});
  };

  const isTripSaved = (tripId: string) => savedTripIds.includes(tripId);

  const requestJoinTrip = (tripId: string) => {
    const trip = trips.find((item) => item.id === tripId);
    if (!trip || trip.roomType === 'private' || trip.status !== 'open' || trip.members.length >= trip.maxMembers) return;
    if (trip.members.some((member) => member.id === user.id) || joinRequests[tripId]) return;

    setJoinRequests((prev) => ({
      ...prev,
      [tripId]: 'pending',
    }));

    tripsApi
      .requestJoin(tripId, {
        message: `Hi! I would love to join your ${trip.name} trip!`,
      })
      .catch((err) => {
        console.warn('[TripsContext] Join request fallback:', err);
      });
  };

  const createTrip = (
    tripData: Omit<Trip, 'id' | 'leader' | 'members' | 'status'> &
      Partial<Pick<Trip, 'roomType' | 'roomCode' | 'status'>>
  ): Trip => {
    const isPublic = tripData.roomType !== 'private';
    const roomCode =
      tripData.roomCode || `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTrip: Trip = {
      ...tripData,
      id: `trip_${Date.now()}`,
      leader: user,
      members: [user],
      status: tripData.status || 'open',
      roomType: isPublic ? 'public' : 'private',
      roomCode,
      compatibilityScore: 98,
      pendingJoinRequests: [],
      itinerary: tripData.itinerary || [
        {
          day: 1,
          title: 'Arrival & Squad Welcome Meetup',
          desc: `Meet up with fellow travellers in ${tripData.startCity || 'base hub'}. Evening icebreaker dinner and route briefing with Trip Leader.`,
        },
        {
          day: 2,
          title: 'Scenic Exploration & Trails',
          desc: `Full day adventure exploring top attractions, local viewpoints, and photography stops across ${tripData.destination}.`,
        },
        {
          day: 3,
          title: 'Culture, Local Delights & Sunset',
          desc: 'Immersive village walk, traditional lunch, and sunset viewpoint celebration.',
        },
        {
          day: 4,
          title: 'Farewell & Memory Exchange',
          desc: 'Shared group breakfast, contact exchange, and return journey.',
        },
      ],
      chatMessages: [
        {
          id: 'm_welcome',
          sender: user,
          text: `Welcome to our ${isPublic ? 'Public Space' : 'Private Room'}! As the trip leader, I'm excited to travel with everyone. Feel free to introduce yourselves!`,
          time: 'Just now',
        },
      ],
    };

    setTrips((prev) => [newTrip, ...prev]);
    setJoinRequests((prev) => ({ ...prev, [newTrip.id]: 'accepted' }));

    // Send to backend
    tripsApi.createTrip(newTrip).catch((err) => {
      console.warn('[TripsContext] Server createTrip sync failed:', err);
    });

    return newTrip;
  };

  const acceptJoinRequest = (tripId: string, applicantId: string) => {
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if (t.id === tripId) {
          if (t.leader.id !== user.id || t.members.length >= t.maxMembers) return t;
          const req = t.pendingJoinRequests?.find((r) => r.user.id === applicantId);
          const applicant = req?.user;
          const remainingReqs =
            t.pendingJoinRequests?.filter((r) => r.user.id !== applicantId) || [];
          const updatedMembers =
            applicant && !t.members.some((m) => m.id === applicant.id)
              ? [...t.members, applicant]
              : t.members;

          const welcomeMsg = applicant
            ? {
                id: `m_${Date.now()}`,
                sender: applicant,
                text: `Thanks for accepting me into the room, @${user.name}! Can't wait for this adventure!`,
                time: 'Just now',
              }
            : null;

          return {
            ...t,
            members: updatedMembers,
            pendingJoinRequests: remainingReqs,
            chatMessages: welcomeMsg
              ? [...(t.chatMessages || []), welcomeMsg]
              : t.chatMessages,
          };
        }
        return t;
      })
    );

    tripsApi.acceptRequest(tripId, applicantId).catch(() => {});
  };

  const declineJoinRequest = (tripId: string, applicantId: string) => {
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if (t.id === tripId) {
          if (t.leader.id !== user.id) return t;
          return {
            ...t,
            pendingJoinRequests:
              t.pendingJoinRequests?.filter((r) => r.user.id !== applicantId) || [],
          };
        }
        return t;
      })
    );

    tripsApi.declineRequest(tripId, applicantId).catch(() => {});
  };

  const updateTripRoomType = (tripId: string, roomType: 'public' | 'private') => {
    setTrips((prevTrips) =>
      prevTrips.map((t) => (t.id === tripId ? { ...t, roomType } : t))
    );
    tripsApi.updateRoomType(tripId, roomType).catch(() => {});
  };

  const updateTripDetails = async (tripId: string, updates: Partial<Trip>) => {
    setTrips((prevTrips) =>
      prevTrips.map((t) => (t.id === tripId ? { ...t, ...updates } : t))
    );
    try {
      await tripsApi.updateTrip(tripId, updates);
    } catch {}
  };

  const getTripById = (tripId: string) => {
    return trips.find((t) => t.id === tripId);
  };

  const myTrips = trips.filter(
    (t) =>
      t.leader.id === user.id ||
      t.members.some((m) => m.id === user.id) ||
      joinRequests[t.id] === 'accepted'
  );

  return (
    <TripsContext.Provider
      value={{
        trips,
        savedTripIds,
        joinRequests,
        toggleSaveTrip,
        isTripSaved,
        requestJoinTrip,
        createTrip,
        acceptJoinRequest,
        declineJoinRequest,
        updateTripRoomType,
        updateTripDetails,
        getTripById,
        myTrips,
        refreshTrips,
      }}
    >
      {children}
    </TripsContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripsContext);
  if (!context) throw new Error('useTrips must be used within TripsProvider');
  return context;
};
