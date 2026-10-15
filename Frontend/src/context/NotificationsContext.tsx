import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockNotifications } from '../data/mockMessages';
import { NotificationItem } from '../types';
import { useAuth } from './AuthContext';
import { useTrips } from './TripsContext';

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}
const Context = createContext<NotificationsState | undefined>(undefined);
const storageKey = 'tripzobox_notification_reads';

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const { trips, joinRequests } = useTrips();
  const [readByUser, setReadByUser] = useState<Record<string, string[]>>(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}; } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(readByUser)); } catch { /* Read state still works if storage is unavailable. */ } }, [readByUser]);
  const readIds = new Set(Array.isArray(readByUser[user.id]) ? readByUser[user.id] : []);
  const requests: NotificationItem[] = trips.filter((trip) => trip.leader.id === user.id).flatMap((trip) => (trip.pendingJoinRequests || []).map((request) => ({
    id: `request:${trip.id}:${request.id}`, type: 'join_request', title: `${request.user.name} wants to join`,
    message: `${trip.name}: ${request.message || 'Review this traveller’s request to join your room.'}`, timestamp: request.requestedAt, read: false, link: `/app/trips/${trip.id}`,
  })));
  const joins: NotificationItem[] = Object.entries(joinRequests).flatMap(([id, status]) => {
    const trip = trips.find((item) => item.id === id);
    return trip ? [{ id: `join:${id}:${status}`, type: 'trip_invite' as const, title: status === 'accepted' ? 'Your join request was accepted' : 'Join request sent', message: trip.name, timestamp: 'Trip activity', read: false, link: `/app/trips/${id}` }] : [];
  });
  const notifications = isLoggedIn ? [...requests, ...joins, ...mockNotifications].map((item) => ({ ...item, read: item.read || readIds.has(item.id) })) : [];
  const markRead = (id: string) => setReadByUser((previous) => ({ ...previous, [user.id]: [...new Set([...(Array.isArray(previous[user.id]) ? previous[user.id] : []), id])] }));
  const markAllRead = () => setReadByUser((previous) => ({ ...previous, [user.id]: [...new Set([...(Array.isArray(previous[user.id]) ? previous[user.id] : []), ...notifications.map((item) => item.id)])] }));
  return <Context.Provider value={{ notifications, unreadCount: notifications.filter((item) => !item.read).length, markRead, markAllRead }}>{children}</Context.Provider>;
};
export const useNotifications = () => {
  const value = useContext(Context);
  if (!value) throw new Error('NotificationsProvider is required');
  return value;
};
