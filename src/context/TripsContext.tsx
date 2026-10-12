import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip } from '../types';
import { mockTrips } from '../data/mockTrips';
import { useAuth } from './AuthContext';

interface TripsContextType {
  trips: Trip[];
  savedTripIds: string[];
  joinRequests: Record<string, 'pending' | 'accepted'>;
  toggleSaveTrip: (tripId: string) => void;
  isTripSaved: (tripId: string) => boolean;
  requestJoinTrip: (tripId: string) => void;
  createTrip: (tripData: Omit<Trip, 'id' | 'leader' | 'members' | 'status'>) => Trip;
  getTripById: (tripId: string) => Trip | undefined;
  myTrips: Trip[];
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

export const TripsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('tripzobox_trips');
    if (saved) {
      try {
        return JSON.parse(saved);
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
  };

  const isTripSaved = (tripId: string) => savedTripIds.includes(tripId);

  const requestJoinTrip = (tripId: string) => {
    setJoinRequests((prev) => ({
      ...prev,
      [tripId]: 'pending',
    }));

    // Simulate auto-acceptance after 2 seconds for a realistic demo
    setTimeout(() => {
      setJoinRequests((prev) => ({
        ...prev,
        [tripId]: 'accepted',
      }));

      // Add user to trip members
      setTrips((prevTrips) =>
        prevTrips.map((t) => {
          if (t.id === tripId) {
            const alreadyMember = t.members.some((m) => m.id === user.id);
            if (!alreadyMember && t.members.length < t.maxMembers) {
              return {
                ...t,
                members: [...t.members, user],
              };
            }
          }
          return t;
        })
      );
    }, 2000);
  };

  const createTrip = (tripData: Omit<Trip, 'id' | 'leader' | 'members' | 'status'>): Trip => {
    const newTrip: Trip = {
      ...tripData,
      id: `trip_${Date.now()}`,
      leader: user,
      members: [user],
      status: 'open',
      compatibilityScore: 95,
      itinerary: tripData.itinerary || [
        { day: 1, title: 'Arrival & Welcome Meetup', desc: 'Meet up with fellow travellers at base point.' },
        { day: 2, title: 'Exploration & Adventure', desc: 'Full day exploring local highlights and trails.' },
        { day: 3, title: 'Farewell & Memories', desc: 'Souvenir exchange and heading home.' }
      ],
      chatMessages: [
        { id: '1', sender: user, text: 'Welcome to our trip group! Excited to travel together.', time: 'Just now' }
      ]
    };

    setTrips((prev) => [newTrip, ...prev]);
    setJoinRequests((prev) => ({ ...prev, [newTrip.id]: 'accepted' }));
    return newTrip;
  };

  const getTripById = (tripId: string) => {
    return trips.find((t) => t.id === tripId);
  };

  const myTrips = trips.filter(
    (t) => t.leader.id === user.id || t.members.some((m) => m.id === user.id) || joinRequests[t.id] === 'accepted'
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
        getTripById,
        myTrips,
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
