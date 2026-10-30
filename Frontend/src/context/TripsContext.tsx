import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, User } from '../types';
import { mockTrips } from '../data/mockTrips';
import { mockUsers } from '../data/mockUsers';
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
  getTripById: (tripId: string) => Trip | undefined;
  myTrips: Trip[];
  refreshTrips: () => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export const TripsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('tripzobox_trips');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((t: Trip) => t.id));
        const newTrips = mockTrips.filter((m) => !existingIds.has(m.id));
        if (newTrips.length > 0) {
          const merged = [...parsed, ...newTrips];
          localStorage.setItem('tripzobox_trips', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch (e) {
        return mockTrips;
      }
    }
    return mockTrips;
  });

  const [savedTripIds, setSavedTripIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('tripzobox_saved_trips');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ['trip_munnar_1'];
      }
    }
    return ['trip_munnar_1'];
  });

  const [joinRequests, setJoinRequests] = useState<Record<string, 'pending' | 'accepted'>>(() => {
    const saved = localStorage.getItem('tripzobox_join_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { trip_munnar_1: 'accepted' };
      }
    }
    return { trip_munnar_1: 'accepted' };
  });

  const refreshTrips = async () => {
    try {
      const serverTrips = await tripsApi.getTrips();
      if (Array.isArray(serverTrips) && serverTrips.length > 0) {
        setTrips(serverTrips);
      }
    } catch (e) {
      // Backend offline or unreachable, keep cached trips
    }
  };

  // Synchronize with backend API on mount
  useEffect(() => {
    refreshTrips();

    tripsApi
      .getSavedTrips()
      .then((data) => {
        if (data?.savedTripIds) {
          setSavedTripIds(data.savedTripIds);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('tripzobox_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('tripzobox_saved_trips', JSON.stringify(savedTripIds));
  }, [savedTripIds]);

  useEffect(() => {
    localStorage.setItem('tripzobox_join_requests', JSON.stringify(joinRequests));
  }, [joinRequests]);

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
      pendingJoinRequests: isPublic
        ? [
            {
              id: `req_${Date.now()}_1`,
              user: mockUsers[3] || {
                id: 'u_ananya',
                name: 'Ananya Sen',
                username: '@ananya_walks',
                avatarUrl:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                city: 'Bengaluru',
                languages: ['English', 'Kannada'],
                bio: 'Weekend backpacker and nature lover.',
                travelInterests: ['Hiking', 'Nature', 'Photography'],
                budgetStyle: 'mid-range',
                stats: { trips: 4, stories: 2, followers: 89, following: 40 },
              },
              message:
                'Hey Trip Leader! Love your planned itinerary. Can I join your squad from Bengaluru?',
              requestedAt: '5 mins ago',
            },
            {
              id: `req_${Date.now()}_2`,
              user: mockUsers[5] || {
                id: 'u_rohan',
                name: 'Rohan Verma',
                username: '@rohan_wander',
                avatarUrl:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                city: 'Kochi',
                languages: ['English', 'Malayalam'],
                bio: 'Passionate roadtripper and coffee explorer.',
                travelInterests: ['Food', 'Road Trips', 'Culture'],
                budgetStyle: 'budget',
                stats: { trips: 7, stories: 5, followers: 120, following: 65 },
              },
              message:
                'Namaste! Keen to join your group. I have good photography gear to share with the team!',
              requestedAt: '25 mins ago',
            },
          ]
        : [],
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
