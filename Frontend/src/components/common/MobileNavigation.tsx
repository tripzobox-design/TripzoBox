import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, MapPin, BookOpen, Shield, Info, MessageSquare, Bell, User, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Drawer } from '../ui/Drawer';

const discovery = [
  { label: 'Home', path: '/', icon: Home }, { label: 'Explore', path: '/explore', icon: MapPin },
  { label: 'Trips', path: '/trips', icon: Compass }, { label: 'Stories', path: '/stories', icon: BookOpen },
  { label: 'Safety', path: '/safety', icon: Shield }, { label: 'About', path: '/about', icon: Info },
];
const personal = [
  { label: 'Travel Vault', path: '/app/vault', icon: Shield }, { label: 'Travel Diary', path: '/app/diary', icon: BookOpen },
  { label: 'Messages', path: '/app/messages', icon: MessageSquare }, { label: 'Notifications', path: '/app/notifications', icon: Bell },
  { label: 'My profile', path: '/app/profile', icon: User },
];

export const MobileNavigation: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, isLoggedIn, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const rows = (items: typeof discovery) => items.map(({ label, path, icon: Icon }) => {
    const active = path === '/' ? pathname === '/' : pathname.startsWith(path) || (path === '/trips' && pathname.startsWith('/app/trips'));
    return <Link key={path} to={path} onClick={onClose} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active ? 'bg-emerald-50 text-primary' : 'text-text-muted hover:bg-light-bg hover:text-primary'}`}><Icon className="w-5 h-5 shrink-0" /><span>{label}</span>{active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}</Link>;
  });
  return <Drawer isOpen={isOpen} onClose={onClose} id="mobile-navigation" title="Explore Tripzobox" description="Your next adventure starts here." closeLabel="Close navigation" panelClassName="w-[86vw] sm:w-[360px]" footer={isLoggedIn ? (
    <div className="flex items-center gap-2">
      <Link to="/app/profile" onClick={onClose} className="flex flex-1 min-w-0 items-center gap-2 rounded-xl bg-light-bg p-2 hover:bg-emerald-50"><img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" /><span className="min-w-0"><span className="block text-sm font-bold text-text truncate">{user.name}</span><span className="block text-[10px] text-text-muted">View profile</span></span></Link>
      <button type="button" onClick={() => { logout(); onClose(); navigate('/'); }} className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-3 text-xs font-semibold text-text-muted hover:bg-red-50 hover:text-red-600"><LogOut className="w-4 h-4" />Log out</button>
    </div>
  ) : <div className="grid grid-cols-2 gap-2"><Link to="/login" onClick={onClose} className="rounded-xl border border-border py-3 text-center text-sm font-semibold">Log in</Link><Link to="/signup" onClick={onClose} className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white">Get started<ArrowRight className="w-4 h-4" /></Link></div>}>
    <nav aria-label="Mobile navigation" className="space-y-5"><div><p className="px-3 text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Discover</p><div className="space-y-1">{rows(discovery)}</div></div>{isLoggedIn && <div className="border-t border-border pt-4"><p className="px-3 text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Your travel space</p><div className="space-y-1">{rows(personal)}</div></div>}</nav>
  </Drawer>;
};
