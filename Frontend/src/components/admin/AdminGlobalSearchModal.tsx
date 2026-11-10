import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User as UserIcon, Compass, AlertOctagon, ArrowRight, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../lib/adminApi';

interface AdminGlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminGlobalSearchModal: React.FC<AdminGlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    trips: any[];
    reports: any[];
  }>({ users: [], trips: [], reports: [] });

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ users: [], trips: [], reports: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ users: [], trips: [], reports: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [usersRes, tripsRes, reportsRes] = await Promise.all([
          adminApi.users.getAll({ search: query, limit: 4 }),
          adminApi.trips.getAll({ search: query, limit: 4 }),
          adminApi.safety.getReports({ limit: 4 }),
        ]);

        const filteredReports = (reportsRes?.reports || []).filter(
          (r: any) =>
            r.reporterName?.toLowerCase().includes(query.toLowerCase()) ||
            r.targetName?.toLowerCase().includes(query.toLowerCase()) ||
            r.description?.toLowerCase().includes(query.toLowerCase())
        );

        setResults({
          users: usersRes?.users || [],
          trips: tripsRes?.trips || [],
          reports: filteredReports,
        });
      } catch (e) {
        // silent search error
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const hasResults =
    results.users.length > 0 || results.trips.length > 0 || results.reports.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 pt-20">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search across travellers, trips, and reports... (Esc to close)"
            className="w-full text-base bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400"
          />
          {loading && <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-8 text-sm text-slate-400">
              Type at least 2 characters to search across users, trips, and trust reports.
            </div>
          )}

          {query.trim().length >= 2 && !loading && !hasResults && (
            <div className="text-center py-8 text-sm text-slate-500">
              No matching records found for <span className="font-semibold text-slate-700">"{query}"</span>.
            </div>
          )}

          {results.users.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Travellers & Staff</p>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleSelect(`/admin/users/${u.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
                          {u.name}
                        </p>
                        <p className="text-xs text-slate-400">{u.email || u.username}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                      {u.role || 'user'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.trips.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trips</p>
              <div className="space-y-1">
                {results.trips.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelect(`/admin/trips/${t.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
                          {t.name}
                        </p>
                        <p className="text-xs text-slate-400">{t.destination} • Leader: {t.leader?.name}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        t.status === 'open'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.reports.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trust & Safety Reports</p>
              <div className="space-y-1">
                {results.reports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleSelect('/admin/reports')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
                          {r.category?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{r.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Navigate with arrow keys or click directly</span>
          <span>TripzoBox Management Portal</span>
        </div>
      </div>
    </div>
  );
};

