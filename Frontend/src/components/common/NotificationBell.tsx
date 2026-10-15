import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  return <Link to="/app/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-text-muted hover:bg-emerald-50 hover:text-primary"><Bell className="w-5 h-5" />{unreadCount > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 px-1 rounded-full bg-primary text-white border-2 border-white text-[9px] font-bold flex items-center justify-center">{unreadCount > 99 ? '99+' : unreadCount}</span>}</Link>;
};
