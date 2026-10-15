import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Compass, Heart, MessageSquare, Shield, Check } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import { NotificationItem } from '../types';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const { notifications, markRead, markAllRead: readAll } = useNotifications();

  const markAllRead = () => {
    readAll();
    success('All notifications marked as read.');
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'trip_invite':
      case 'join_request':
        return <Compass className="w-5 h-5 text-primary" />;
      case 'story_like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'trip_update':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'system':
        return <Shield className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-3xl mx-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 pb-0 sm:pb-2">
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-text">
            Notifications
          </h1>

        <Button
          variant="secondary"
          size="sm"
          onClick={markAllRead}
          icon={<CheckCheck className="w-3.5 h-3.5" />}
          className="text-xs shrink-0 whitespace-nowrap !px-2 sm:!px-3"
          aria-label="Mark all notifications as read"
        >
          <span className="sm:hidden">Read all</span><span className="hidden sm:inline">Mark all as read</span>
        </Button>
        <p className="col-span-2 text-xs sm:text-sm text-text-muted">
          Stay updated with your trips, joins, and community reactions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-card divide-y divide-border overflow-hidden">
        {notifications.map((notif) => (
          <button
            type="button"
            key={notif.id}
            onClick={() => {
              markRead(notif.id);
              navigate(notif.link || (notif.type === 'system' ? '/safety' : '/app/diary'));
            }}
            className={`w-full text-left p-4 sm:p-5 flex items-start gap-3 transition-colors cursor-pointer ${
              notif.read ? 'bg-white hover:bg-light-bg' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-light-bg flex items-center justify-center shrink-0 border border-border">
              {getNotificationIcon(notif.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                <h4 className="font-semibold text-sm text-text">{notif.title}</h4>
                <span className="text-[11px] text-text-subtle shrink-0">
                  {notif.timestamp}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                {notif.message}
              </p>
            </div>

            {!notif.read && (
              <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 self-center" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
