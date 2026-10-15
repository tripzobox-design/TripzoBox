import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  Compass,
  BookOpen,
  MapPin,
  MessageSquare,
  Bell,
  User,
  Plus,
  Search,
  X,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { SimpleSearchBar } from '../components/ui/SearchBar';
import { Logo } from '../components/ui/Logo';

export const AppShell: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isLoggedIn, navigate, location]);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Primary navigation items
  const sidebarItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Travel Vault', path: '/app/vault', icon: Shield },
    { label: 'Trips', path: '/app/trips', icon: Compass },
    { label: 'Travel Diary', path: '/app/diary', icon: BookOpen },
    { label: 'Explore', path: '/explore', icon: MapPin },
    { label: 'Messages', path: '/app/messages', icon: MessageSquare, badge: 2 },
    { label: 'Notifications', path: '/app/notifications', icon: Bell, badge: 1 },
    { label: 'Profile', path: '/app/profile', icon: User },
  ];

  // Mobile Bottom Tab Bar items (5 items max)
  const bottomNavItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Trips', path: '/app/trips', icon: Compass },
    // Center element is elevated Create CTA
    { label: 'Diary', path: '/app/diary', icon: BookOpen },
    { label: 'Profile', path: '/app/profile', icon: User },
  ];

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/app/trips?q=${encodeURIComponent(searchQuery)}`);
      setMobileSearchOpen(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-light-bg flex flex-col md:flex-row text-text">
      {/* DESKTOP SIDEBAR (≥768px) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-border/80 flex items-center">
          <Logo asLink to="/" size="sm" variant="horizontal" />
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto" aria-label="App Sidebar">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/35 text-primary font-bold'
                    : 'text-text-muted hover:text-text hover:bg-light-bg'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-text-subtle'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-accent/40 text-primary-dark'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-border/80">
          <div
            onClick={() => navigate('/app/profile')}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-light-bg cursor-pointer transition-colors"
          >
            <Avatar src={user.avatarUrl} name={user.name} size="md" />
            <div className="min-w-0 text-left flex-1">
              <p className="text-sm font-semibold text-text truncate">{user.name}</p>
              <p className="text-xs text-text-muted truncate">@{user.username}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* TOP BAR */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border h-16 sm:h-18 px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Mobile Logo (<768px) */}
          <div className="flex items-center gap-2 md:hidden">
            <Logo asLink to="/" size="xs" variant="horizontal" />
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <SimpleSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
            />
          </div>

          {/* Right Topbar Actions */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-text hover:bg-light-bg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-text-muted" />
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => navigate('/app/notifications')}
              className="relative p-2 sm:p-2.5 rounded-xl text-text-muted hover:text-text hover:bg-light-bg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* User Avatar & Menu Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-light-bg transition-colors"
                aria-label="User profile menu"
              >
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                <span className="hidden sm:inline text-sm font-semibold text-text">
                  {user.name}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-float border border-border py-2 z-40 text-left">
                    <div className="px-4 py-2 border-b border-border/80">
                      <p className="text-xs font-semibold text-text">{user.name}</p>
                      <p className="text-[11px] text-text-muted truncate">{user.city}, {user.country}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/app/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text hover:bg-light-bg hover:text-primary transition-colors"
                      >
                        <User className="w-4 h-4 text-text-subtle" />
                        View Profile
                      </Link>
                      <Link
                        to="/app/vault"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text hover:bg-light-bg hover:text-primary transition-colors"
                      >
                        <Shield className="w-4 h-4 text-text-subtle" />
                        Travel Vault
                      </Link>
                      <Link
                        to="/app/explore"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text hover:bg-light-bg hover:text-primary transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-text-subtle" />
                        Explore Places
                      </Link>
                      <Link
                        to="/app/profile?tab=settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text hover:bg-light-bg hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4 text-text-subtle" />
                        Account Settings
                      </Link>
                    </div>

                    <div className="border-t border-border/80 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Collapsible Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="md:hidden bg-white border-b border-border px-4 py-3 flex items-center gap-2">
            <SimpleSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-text-subtle hover:text-text"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* App Main View Outlet */}
        <main className="flex-1 p-4 pb-28 sm:p-6 sm:pb-12 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* MOBILE FIXED BOTTOM TAB BAR (<768px) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border px-3 py-2 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {/* Item 1: Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        {/* Item 2: Trips */}
        <NavLink
          to="/app/trips"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text'
            }`
          }
        >
          <Compass className="w-5 h-5" />
          <span>Trips</span>
        </NavLink>

        {/* Item 3: Center Elevated Add/Create Button */}
        <div className="relative -top-4">
          <button
            type="button"
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-hover hover:bg-primary-hover active:scale-95 transition-all"
            aria-label="Create or Add"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Item 4: Travel Diary */}
        <NavLink
          to="/app/diary"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text'
            }`
          }
        >
          <BookOpen className="w-5 h-5" />
          <span>Diary</span>
        </NavLink>

        {/* Item 5: Profile */}
        <NavLink
          to="/app/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Quick Add Popover Modal from Center Bottom Button */}
      {quickAddOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setQuickAddOpen(false)} />
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl p-4 shadow-float border border-border md:hidden text-left flex flex-col gap-2">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider px-2 py-1 font-heading">
              Quick Actions
            </h4>
            <button
              onClick={() => {
                setQuickAddOpen(false);
                navigate('/app/trips/create');
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-light-bg text-sm font-semibold text-text"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/40 text-primary flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              Create a Trip
            </button>
            <button
              onClick={() => {
                setQuickAddOpen(false);
                navigate('/app/diary/add');
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-light-bg text-sm font-semibold text-text"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/40 text-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              Add Travel Experience
            </button>
            <button
              onClick={() => {
                setQuickAddOpen(false);
                navigate('/app/vault');
              }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-light-bg text-sm font-semibold text-text"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/40 text-primary flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              Add Document to Vault
            </button>
          </div>
        </>
      )}
    </div>
  );
};
