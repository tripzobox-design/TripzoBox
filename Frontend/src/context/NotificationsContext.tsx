import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationItem } from '../types';
import { useAuth } from './AuthContext';
import { useTrips } from './TripsContext';
import { notificationsApi } from '../lib/api';
import { safeStorage } from '../lib/storage';

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
  const [serverNotifications, setServerNotifications] = useState<NotificationItem[]>([]);

  const [readByUser, setReadByUser] = useState<Record<string, string[]>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let active = true;
    if (!isLoggedIn) {
      setServerNotifications([]);
      return;
    }

    setServerNotifications([]);
    notificationsApi
      .getNotifications()
      .then((data) => {
        if (active && data?.notifications && Array.isArray(data.notifications)) {
          setServerNotifications(data.notifications);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isLoggedIn, user.id]);

  useEffect(() => {
    safeStorage.setJSON(storageKey, readByUser);
  }, [readByUser]);

  const readIds = new Set(
    user?.id && Array.isArray(readByUser[user.id]) ? readByUser[user.id] : []
  );

  const requests: NotificationItem[] = !isLoggedIn || !user?.id
    ? []
    : (trips || [])
        .filter((trip) => Boolean(trip?.leader?.id && trip.leader.id === user.id))
        .flatMap((trip) =>
          (trip.pendingJoinRequests || []).map((request) => ({
            id: `request:${trip.id}:${request?.id || ''}`,
            type: 'join_request' as const,
            title: `${request?.user?.name || 'A traveller'} wants to join`,
            message: `${trip.name || 'Trip'}: ${request?.message || 'Review this traveller’s request to join your room.'}`,
            timestamp: request?.requestedAt || '',
            read: false,
            link: `/app/trips/${trip.id}/requests`,
          }))
        );

  const joins: NotificationItem[] = !isLoggedIn
    ? []
    : Object.entries(joinRequests || {}).flatMap(([id, status]) => {
        const trip = (trips || []).find((item) => item?.id === id);
        return trip
          ? [
              {
                id: `join:${id}:${status}`,
                type: 'trip_invite' as const,
                title: status === 'accepted' ? 'Your join request was accepted' : 'Join request sent',
                message: trip.name || 'Trip',
                timestamp: 'Trip activity',
                read: false,
                link: `/app/trips/${id}`,
              },
            ]
          : [];
      });

  const notifications = isLoggedIn
    ? [...requests, ...joins, ...serverNotifications].map((item) => ({
        ...item,
        read: item.read || readIds.has(item.id),
      }))
    : [];

  const markRead = (id: string) => {
    if (!user?.id) return;
    setReadByUser((previous) => ({
      ...previous,
      [user.id]: [...new Set([...(Array.isArray(previous[user.id]) ? previous[user.id] : []), id])],
    }));
    notificationsApi.markRead(id).catch(() => {});
  };

  const markAllRead = () => {
    if (!user?.id) return;
    setReadByUser((previous) => ({
      ...previous,
      [user.id]: [
        ...new Set([
          ...(Array.isArray(previous[user.id]) ? previous[user.id] : []),
          ...notifications.map((item) => item.id),
        ]),
      ],
    }));
    notificationsApi.markAllRead().catch(() => {});
  };

  return (
    <Context.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((item) => !item.read).length,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useNotifications = () => {
  const value = useContext(Context);
  if (!value) throw new Error('NotificationsProvider is required');
  return value;
};
