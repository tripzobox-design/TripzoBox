import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Home,
  Compass,
  MapPin,
  BookOpen,
  Shield,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  ArrowRight,
  LayoutDashboard,
  ChevronDown,
  FolderLock,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Drawer } from '../ui/Drawer';

const discovery = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Travel Vault', path: '/app/vault', icon: Shield },
  { label: 'Trips', path: '/trips', icon: Compass },
  { label: 'Trip Diary', path: '/app/diary', icon: BookOpen },
  { label: 'Explore', path: '/explore', icon: MapPin },
];

const accountSettingsSubMenu = [
  { label: 'Profile', path: '/app/profile?tab=profile', tab: 'profile', icon: UserIcon },
  { label: 'Account Security', path: '/app/profile?tab=security', tab: 'security', icon: ShieldCheck },
  { label: 'Travel Vault', path: '/app/vault', tab: 'vault', icon: FolderLock },
  { label: 'My Trips', path: '/app/profile?tab=trips', tab: 'trips', icon: Compass },
  { label: 'Travel Diary', path: '/app/profile?tab=diary', tab: 'diary', icon: BookOpen },
  { label: 'Notifications', path: '/app/notifications', tab: 'notifications', icon: Bell },
  { label: 'Help & Support', path: '/app/profile?tab=help', tab: 'help', icon: HelpCircle },
];

export const MobileNavigation: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user, isLoggedIn, logout } = useAuth();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isProfileSubMenuOpen, setIsProfileSubMenuOpen] = useState(true);

  const currentTab = searchParams.get('tab');
  const isProfileRoute =
    pathname.startsWith('/app/profile') || pathname.startsWith('/app/account-security');

  const rows = (items: typeof discovery) =>
    items.map(({ label, path, icon: Icon }) => {
      const active =
        path === '/'
          ? pathname === '/'
          : pathname.startsWith(path) || (path === '/trips' && pathname.startsWith('/app/trips'));
      return (
        <Link
          key={path}
          to={path}
          onClick={onClose}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
            active
              ? 'bg-emerald-50 text-primary'
              : 'text-text-muted hover:bg-light-bg hover:text-primary'
          }`}
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span>{label}</span>
          {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
        </Link>
      );
    });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      id="mobile-navigation"
      title="Explore Tripzobox"
      description="Your next adventure starts here."
      closeLabel="Close navigation"
      panelClassName="w-[86vw] sm:w-[360px]"
      footer={
        isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Link
              to="/app/profile"
              onClick={onClose}
              className="flex flex-1 min-w-0 items-center gap-2 rounded-xl bg-light-bg p-2 hover:bg-emerald-50"
            >
              <img
                src={user.avatarUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-text truncate">{user.name}</span>
                <span className="block text-[10px] text-text-muted">View profile</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
                navigate('/');
              }}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-3 text-xs font-semibold text-text-muted hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={onClose}
              className="rounded-xl border border-border py-3 text-center text-sm font-semibold"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )
      }
    >
      <nav aria-label="Mobile navigation" className="space-y-5">
        <div>
          <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">
            Discover
          </p>
          <div className="space-y-1">{rows(discovery)}</div>
        </div>

        {isLoggedIn && (
          <div className="border-t border-border pt-4">
            <p className="px-3 text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">
              Your travel space
            </p>
            <div className="space-y-1">
              {/* Messages */}
              <Link
                to="/app/messages"
                onClick={onClose}
                aria-current={pathname.startsWith('/app/messages') ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  pathname.startsWith('/app/messages')
                    ? 'bg-emerald-50 text-primary'
                    : 'text-text-muted hover:bg-light-bg hover:text-primary'
                }`}
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>Messages</span>
                {pathname.startsWith('/app/messages') && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>

              {/* Notifications */}
              <Link
                to="/app/notifications"
                onClick={onClose}
                aria-current={pathname.startsWith('/app/notifications') ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  pathname.startsWith('/app/notifications')
                    ? 'bg-emerald-50 text-primary'
                    : 'text-text-muted hover:bg-light-bg hover:text-primary'
                }`}
              >
                <Bell className="w-5 h-5 shrink-0" />
                <span>Notifications</span>
                {pathname.startsWith('/app/notifications') && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>

              {/* My profile with Account Settings Sub-menu */}
              <div className="space-y-1 pt-1">
                <div
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isProfileRoute
                      ? 'bg-emerald-50 text-primary'
                      : 'text-text-muted hover:bg-light-bg hover:text-primary'
                  }`}
                >
                  <Link
                    to="/app/profile"
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <UserIcon className="w-5 h-5 shrink-0" />
                    <span>My profile</span>
                    {isProfileRoute && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileSubMenuOpen(!isProfileSubMenuOpen);
                    }}
                    aria-label={isProfileSubMenuOpen ? 'Collapse sub menu' : 'Expand sub menu'}
                    className="p-1 rounded-lg hover:bg-emerald-100/60 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isProfileSubMenuOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Sub-menu Drawer items (Account Settings) */}
                {isProfileSubMenuOpen && (
                  <div className="ml-4 pl-3 border-l-2 border-emerald-200 space-y-1 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {accountSettingsSubMenu.map(({ label, path, tab, icon: SubIcon }) => {
                      const isSubActive =
                        tab === 'vault'
                          ? pathname.startsWith('/app/vault')
                          : tab === 'notifications'
                          ? pathname.startsWith('/app/notifications')
                          : isProfileRoute &&
                            (currentTab === tab || (!currentTab && tab === 'profile'));

                      return (
                        <Link
                          key={label}
                          to={path}
                          onClick={onClose}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                            isSubActive
                              ? 'bg-emerald-100/70 text-emerald-900 font-semibold shadow-2xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <SubIcon
                              className={`w-4 h-4 shrink-0 ${
                                isSubActive ? 'text-primary' : 'text-gray-400'
                              }`}
                            />
                            <span>{label}</span>
                          </div>
                          {isSubActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </Drawer>
  );
};
