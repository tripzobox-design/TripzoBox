import React, { createContext, useContext, useState } from 'react';
import { Destination } from '../types';
import { mockDestinations } from '../data/mockDestinations';

interface DestinationsContextType {
  destinations: Destination[];
  addDestination: (newDest: Omit<Destination, 'id' | 'slug'>) => Destination;
  getDestinationBySlug: (slug: string) => Destination | undefined;
}

const STORAGE_KEY = 'tripzobox_user_destinations';

const DestinationsContext = createContext<DestinationsContextType | undefined>(undefined);

export const DestinationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [destinations, setDestinations] = useState<Destination[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom items with mockDestinations (custom first so latest user creations appear on top)
          const customSlugs = new Set(parsed.map((d: Destination) => d.slug));
          const remainingMock = mockDestinations.filter((d) => !customSlugs.has(d.slug));
          return [...parsed, ...remainingMock];
        }
      }
    } catch (e) {
      console.error('Error loading custom destinations:', e);
    }
    return mockDestinations;
  });

  const addDestination = (newDestData: Omit<Destination, 'id' | 'slug'>): Destination => {
    const timestamp = Date.now();
    const cleanName = newDestData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `spot-${timestamp}`;
    const slug = `${cleanName}-${timestamp.toString().slice(-4)}`;
    const id = `dest_user_${timestamp}`;

    const newDestination: Destination = {
      ...newDestData,
      id,
      slug,
      isPublic: newDestData.isPublic !== false,
      createdAt: newDestData.createdAt || new Date().toISOString(),
    };

    setDestinations((prev) => {
      const updated = [newDestination, ...prev];
      try {
        const savedRaw = localStorage.getItem(STORAGE_KEY);
        const existingCustom = savedRaw ? JSON.parse(savedRaw) : [];
        const nextCustom = [newDestination, ...existingCustom];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustom));
      } catch (err) {
        console.error('Failed to persist custom destination:', err);
      }
      return updated;
    });

    return newDestination;
  };

  const getDestinationBySlug = (slug: string) => {
    return destinations.find((d) => d.slug === slug);
  };

  return (
    <DestinationsContext.Provider value={{ destinations, addDestination, getDestinationBySlug }}>
      {children}
    </DestinationsContext.Provider>
  );
};

export const useDestinations = () => {
  const context = useContext(DestinationsContext);
  if (!context) {
    throw new Error('useDestinations must be used within a DestinationsProvider');
  }
  return context;
};
