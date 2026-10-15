import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const AccountNav: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => { menu.current?.removeAttribute('open'); }, [location.pathname, location.search, location.hash]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) menu.current?.removeAttribute('open'); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') menu.current?.removeAttribute('open'); };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, []);
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link to="/app/messages" aria-label="Messages" className="hidden min-[380px]:inline-flex p-2 rounded-xl text-text-muted hover:bg-emerald-50 hover:text-primary"><MessageSquare className="w-5 h-5" /></Link>
      <NotificationBell />
      <details ref={menu} className="relative">
        <summary aria-label="Open account menu" className="list-none flex items-center gap-2 rounded-full border border-border p-1.5 cursor-pointer hover:border-primary/40 [&::-webkit-details-marker]:hidden">
          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          <span className="hidden xl:block text-sm font-semibold text-text max-w-24 truncate">{user.name.split(' ')[0]}</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted mr-1" />
        </summary>
        <div className="absolute right-0 top-full mt-3 w-60 rounded-2xl border border-border bg-white p-2 shadow-float z-50 text-left">
          <div className="px-3 py-3 border-b border-border mb-1"><p className="font-semibold text-sm text-text truncate">{user.name}</p><p className="text-xs text-text-muted truncate">{user.username}</p></div>
          {[
            ['Messages', '/app/messages'], ['Notifications', '/app/notifications'],
            ['Home', '/'], ['My trips', '/app/trips/my'], ['Travel Vault', '/app/vault'], ['Travel Diary', '/app/diary'], ['My profile', '/app/profile'],
          ].map(([label, to]) => <Link key={label} to={to} className="block rounded-lg px-3 py-2 text-sm text-text hover:bg-emerald-50 hover:text-primary">{label}</Link>)}
          <button type="button" onClick={() => { logout(); navigate('/'); menu.current?.removeAttribute('open'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-border mt-1"><LogOut className="w-4 h-4" />Log out</button>
        </div>
      </details>
    </div>
  );
};
