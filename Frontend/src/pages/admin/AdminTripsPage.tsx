import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Users,
  Calendar,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { Trip } from '../../types';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [modalAction, setModalAction] = useState<'hide' | 'restore' | 'cancel' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await adminApi.trips.getAll({
        page,
        limit: 10,
        search,
        status: statusFilter,
      });
      setTrips(Array.isArray(res?.trips) ? res.trips : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      setAlertMsg(e?.message || 'Failed to fetch trips');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTrips();
  };

  const handleConfirmAction = async (reason: string) => {
    if (!selectedTrip || !modalAction) return;
    setActionLoading(true);

    try {
      if (modalAction === 'hide') {
        await adminApi.trips.updateStatus(selectedTrip.id, 'closed', reason);
        setAlertMsg(`Trip "${selectedTrip.name}" unpublished and closed.`);
      } else if (modalAction === 'restore') {
        await adminApi.trips.updateStatus(selectedTrip.id, 'open', reason);
        setAlertMsg(`Trip "${selectedTrip.name}" restored to open status.`);
      } else if (modalAction === 'cancel') {
        await adminApi.trips.updateStatus(selectedTrip.id, 'closed', `Cancelled: ${reason}`);
        setAlertMsg(`Trip "${selectedTrip.name}" cancelled for policy/safety reasons.`);
      } else if (modalAction === 'delete') {
        await adminApi.trips.deleteTrip(selectedTrip.id);
        setAlertMsg(`Trip "${selectedTrip.name}" permanently deleted.`);
      }
      setModalAction(null);
      setSelectedTrip(null);
      fetchTrips();
    } catch (err: any) {
      alert(err?.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Trip Management & Moderation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Review traveller journeys, enforce safety rules, and unpublish non-compliant itineraries.
          </p>
        </div>
      </div>

      {alertMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trips by title, destination, or trip leader..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="open">Open (Accepting)</option>
          <option value="full">Full Capacity</option>
          <option value="closed">Closed / Unpublished</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Trips Table */}
      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : trips.length === 0 ? (
        <AdminEmptyState
          title="No trips found"
          description="Try modifying search keywords or status filter to see community trips."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('');
            setPage(1);
          }}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Trip Details</th>
                  <th className="py-3.5 px-4">Trip Leader</th>
                  <th className="py-3.5 px-4">Dates & Budget</th>
                  <th className="py-3.5 px-4">Participants</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition group">
                    {/* Trip Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.coverImageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80'}
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 ring-1 ring-slate-200"
                        />
                        <div>
                          <Link
                            to={`/admin/trips/${t.id}`}
                            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1"
                          >
                            {t.name}
                          </Link>
                          <p className="text-[11px] text-slate-500">{t.destination} • {t.durationDays} Days</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {t.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Leader */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={t.leader?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{t.leader?.name}</p>
                          <p className="text-[10px] text-slate-400">@{t.leader?.username || t.leader?.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Dates & Budget */}
                    <td className="py-3.5 px-4">
                      <p className="text-xs font-semibold text-slate-800">
                        ₹{t.budgetPerPerson?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ person</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t.startDate} → {t.endDate}
                      </p>
                    </td>

                    {/* Participants */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold">{t.members?.length || 1}</span> / {t.maxMembers}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {t.spotsLeft ?? Math.max(0, t.maxMembers - (t.members?.length || 1))} spots left
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          t.status === 'open'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'full'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : t.status === 'closed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/trips/${t.id}`}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition"
                          title="Inspect Trip"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Unpublish / Hide */}
                        {t.status !== 'closed' ? (
                          <button
                            onClick={() => {
                              setSelectedTrip(t);
                              setModalAction('hide');
                            }}
                            className="p-1.5 rounded-xl text-amber-600 hover:bg-amber-50 transition"
                            title="Unpublish Trip"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedTrip(t);
                              setModalAction('restore');
                            }}
                            className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
                            title="Restore Trip"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel for Safety */}
                        <button
                          onClick={() => {
                            setSelectedTrip(t);
                            setModalAction('cancel');
                          }}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 transition"
                          title="Cancel for Safety Concerns"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>

                        {/* Delete Trip */}
                        <button
                          onClick={() => {
                            setSelectedTrip(t);
                            setModalAction('delete');
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Permanently Remove Trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {trips.length} of {totalCount} trips
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-800">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {modalAction && selectedTrip && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalAction(null)}
          onConfirm={handleConfirmAction}
          title={
            modalAction === 'hide'
              ? `Unpublish Trip: ${selectedTrip.name}`
              : modalAction === 'restore'
              ? `Restore Trip: ${selectedTrip.name}`
              : modalAction === 'cancel'
              ? `Cancel Trip for Policy / Safety: ${selectedTrip.name}`
              : `Permanently Delete Trip: ${selectedTrip.name}`
          }
          message="Confirm this moderation action. All participant records and join requests will be appropriately handled and audit logged."
          confirmText="Confirm"
          variant={modalAction === 'delete' || modalAction === 'cancel' ? 'danger' : 'warning'}
          requireReason={true}
          reasonPlaceholder="Document policy or safety moderation justification..."
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

