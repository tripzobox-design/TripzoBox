import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Compass, Heart, MessageSquare, Shield, Check } from 'lucide-react';
import { mockNotifications } from '../data/mockMessages';
import { NotificationItem } from '../types';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    success('All notifications marked as read.');
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'trip_invite':
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
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Stay updated with your trips, joins, and community reactions.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={markAllRead}
          icon={<CheckCheck className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          Mark all as read
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-card divide-y divide-border overflow-hidden">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => {
              if (notif.link) navigate(notif.link);
            }}
            className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
              notif.read ? 'bg-white hover:bg-light-bg' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-light-bg flex items-center justify-center shrink-0 border border-border">
              {getNotificationIcon(notif.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
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
          </div>
        ))}
      </div>
    </div>
  );
};
