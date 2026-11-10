import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Compass,
  UserCheck,
  ShieldAlert,
  AlertOctagon,
  UserX,
  FileText,
  MapPin,
  HelpCircle,
  Image as ImageIcon,
  Package,
  BookOpen,
  Bell,
  Activity,
  Sliders,
  ShieldCheck,
  KeyRound,
  FileSpreadsheet,
  Cpu,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  Star,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminGlobalSearchModal } from '../components/admin/AdminGlobalSearchModal';
import { Logo } from '../components/ui/Logo';
import { SEO } from '../components/common/SEO';

export const AdminLayout: React.FC = () => {
  const { admin, isLoggedIn, loading, role, logout, hasPermission, hasRole } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tripzobox_admin_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut Cmd/Ctrl + K for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('tripzobox_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Authenticating Administrator...</p>
        </div>
      </div>
    );
  }

  // Guard: Not logged in or non-admin role
  if (!isLoggedIn || !admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const roleColors: Record<string, string> = {
    superadmin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    admin: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    moderator: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    support: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    content_manager: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  };

  interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
    permission?: string;
    superadminOnly?: boolean;
    badge?: string;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navigationGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Travellers', path: '/admin/users', icon: Users, permission: 'users.view' },
        { label: 'Trips', path: '/admin/trips', icon: Compass, permission: 'trips.view' },
        { label: 'Join Requests', path: '/admin/join-requests', icon: UserCheck, permission: 'join_requests.view' },
      ],
    },
    {
      title: 'Trust & Safety',
      items: [
        { label: 'Safety Center', path: '/admin/trust-safety', icon: ShieldAlert, permission: 'safety.reports.manage' },
        { label: 'Review Moderation', path: '/admin/reviews', icon: Star, permission: 'safety.reports.manage' },
        { label: 'Reports & Complaints', path: '/admin/reports', icon: AlertOctagon, permission: 'safety.reports.manage' },
        { label: 'Blocked Accounts', path: '/admin/blocks', icon: UserX, permission: 'safety.blocks.manage' },
      ],
    },
    {
      title: 'Content & CMS',
      items: [
        { label: 'Homepage CMS', path: '/admin/cms/homepage', icon: FileText, permission: 'cms.view' },
        { label: 'Destinations', path: '/admin/cms/destinations', icon: MapPin, permission: 'destinations.manage' },
        { label: 'Pages & FAQs', path: '/admin/cms/pages', icon: HelpCircle, permission: 'cms.view' },
        { label: 'Media Library', path: '/admin/media', icon: ImageIcon, permission: 'media.manage' },
        { label: 'Travel Packages', path: '/admin/packages', icon: Package, permission: 'packages.manage' },
        { label: 'Diary Moderation', path: '/admin/diary', icon: BookOpen, permission: 'diary.moderate' },
      ],
    },
    {
      title: 'Communications',
      items: [
        { label: 'Announcements', path: '/admin/notifications', icon: Bell, permission: 'notifications.broadcast' },
      ],
    },
    {
      title: 'System & Security',
      items: [
        { label: 'Service Monitoring', path: '/admin/system/services', icon: Activity, permission: 'system.health.view' },
        { label: 'Platform Settings', path: '/admin/settings', icon: Sliders, superadminOnly: true },
        { label: 'Administrators', path: '/admin/administrators', icon: ShieldCheck, superadminOnly: true },
        { label: 'Roles & RBAC', path: '/admin/roles', icon: KeyRound, permission: 'system.settings.edit' },
        { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileSpreadsheet, permission: 'audit_logs.view' },
        { label: 'System Health', path: '/admin/system/health', icon: Cpu, permission: 'system.health.view' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SEO title="Administration Control Panel" noIndex={true} />
      {/* Global Search Modal */}
      <AdminGlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Main Layout Container */}
      <div className="flex flex-1 min-h-screen relative">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed lg:sticky top-0 h-screen z-40 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none ${
            isCollapsed ? 'w-20' : 'w-64'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Sidebar Header */}
          <div className="h-16 px-3.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2.5 overflow-hidden group focus:outline-none"
              title="TripzoBox Administration"
            >
              <div className="relative shrink-0 flex items-center justify-center p-1 rounded-xl bg-white/10 hover:bg-white/15 transition-all shadow-xs border border-white/10">
                <img
                  src="/logo-icon.png"
                  alt="TripzoBox Logo"
                  className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
                />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 text-left flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-heading font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                      Tripzo<span className="text-emerald-400">b</span>o<span className="text-lime-400">x</span>
                    </span>
                    <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                      Admin
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-400/80 tracking-wide mt-1 truncate">
                    Control Panel
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shadow-xs border border-slate-700/50 cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Sidebar Nav Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
            {navigationGroups.map((group) => {
              // Filter items by role/permission
              const allowedItems = group.items.filter((item) => {
                if (item.superadminOnly && role !== 'superadmin') return false;
                if (item.permission && !hasPermission(item.permission)) return false;
                return true;
              });

              if (allowedItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {!isCollapsed && (
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 mb-2">
                      {group.title}
                    </p>
                  )}
                  {allowedItems.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group relative ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        {!isCollapsed && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}
                        {item.badge && !isCollapsed && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer with Live Environment pill */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
            <div className={`flex items-center justify-between text-xs text-slate-400 ${isCollapsed ? 'justify-center' : ''}`}>
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-slate-400">Node/Mongo Live</span>
                </div>
              )}
              <Link
                to="/"
                target="_blank"
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
                title="Open Public Site in New Tab"
              >
                {!isCollapsed && <span>Public Site</span>}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-subtle">
            {/* Left Header items */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Quick Search Bar trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 text-slate-500 text-xs sm:text-sm font-medium border border-slate-200/60 transition group w-44 sm:w-72"
              >
                <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                <span className="truncate">Search platform...</span>
                <kbd className="hidden sm:inline-block ml-auto text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right Header items */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Quick Report Link */}
              <Link
                to="/admin/reports"
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Safety Reports"
              >
                <AlertOctagon className="w-5 h-5 text-slate-500" />
              </Link>

              {/* Admin Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                >
                  <img
                    src={admin.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={admin.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                      {admin.name}
                    </p>
                    <span className={`inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${roleColors[admin.role] || 'text-slate-500'}`}>
                      {admin.role.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{admin.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{admin.email}</p>
                    </div>

                    <Link
                      to="/admin/administrators"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      Staff Management
                    </Link>
                    <Link
                      to="/admin/settings"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition"
                    >
                      <Sliders className="w-4 h-4 text-slate-400" />
                      Platform Settings
                    </Link>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold transition"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content Outlet */}
          <main className="flex-1 p-4 sm:p-6 w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

