import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Compass,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
  Trash2,
  ShieldAlert,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { Trip } from '../../types';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminTripDetailsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAction, setModalAction] = useState<'hide' | 'restore' | 'cancel' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrip = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const res = await adminApi.trips.getById(tripId);
      setTrip(res.trip);
      setJoinRequests(res.joinRequests || []);
      setReports(res.reports || []);
    } catch (e: any) {
      alert('Failed to load trip: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const handleConfirmAction = async (reason: string) => {
    if (!trip || !modalAction) return;
    setActionLoading(true);
    try {
      if (modalAction === 'hide') {
        await adminApi.trips.updateStatus(trip.id, 'closed', reason);
      } else if (modalAction === 'restore') {
        await adminApi.trips.updateStatus(trip.id, 'open', reason);
      } else if (modalAction === 'cancel') {
        await adminApi.trips.updateStatus(trip.id, 'closed', `Cancelled: ${reason}`);
      } else if (modalAction === 'delete') {
        await adminApi.trips.deleteTrip(trip.id);
        navigate('/admin/trips');
        return;
      }
      setModalAction(null);
      fetchTrip();
    } catch (err: any) {
      alert(err?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !trip) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-44 bg-slate-200 rounded animate-pulse" />
        <AdminTableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/trips"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </Link>
        <div className="flex items-center gap-2">
          {trip.status !== 'closed' ? (
            <button
              onClick={() => setModalAction('hide')}
              className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" /> Unpublish Trip
            </button>
          ) : (
            <button
              onClick={() => setModalAction('restore')}
              className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Trip
            </button>
          )}

          <button
            onClick={() => setModalAction('cancel')}
            className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Cancel for Safety
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
        <div className="relative h-64 sm:h-72 w-full bg-slate-900">
          <img
            src={trip.coverImageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80'}
            alt=""
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                  {trip.status}
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/80 text-white">
                  {trip.difficulty}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                {trip.name}
              </h1>
              <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {trip.destination} • {trip.durationDays} Days
              </p>
            </div>

            <div className="text-right bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-white self-stretch sm:self-auto">
              <span className="text-[10px] uppercase block text-slate-300">Estimated Budget</span>
              <span className="text-xl font-black">₹{trip.budgetPerPerson?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Trip Information */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl">
                {trip.description}
              </p>
            </div>

            {/* Itinerary */}
            {trip.itinerary && trip.itinerary.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Daily Schedule</h3>
                <div className="space-y-2.5">
                  {trip.itinerary.map((day) => (
                    <div key={day.day} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        D{day.day}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{day.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{day.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leader & Roster Panel */}
          <div className="space-y-6">
            {/* Leader Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Trip Leader</span>
              <div className="flex items-center gap-3">
                <img
                  src={trip.leader?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <Link to={`/admin/users/${trip.leader?.id}`} className="text-sm font-bold text-slate-900 hover:text-emerald-700">
                    {trip.leader?.name}
                  </Link>
                  <p className="text-xs text-slate-400">{trip.leader?.email || trip.leader?.phone || 'Contact on file'}</p>
                </div>
              </div>
            </div>

            {/* Participants Roster */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Confirmed Travellers ({trip.members?.length || 1}/{trip.maxMembers})
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {trip.spotsLeft ?? Math.max(0, trip.maxMembers - (trip.members?.length || 1))} spots left
                </span>
              </div>

              <div className="space-y-2">
                {trip.members && trip.members.length > 0 ? (
                  trip.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="font-semibold text-slate-800">{m.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{m.city || 'Confirmed'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No additional members joined yet.</p>
                )}
              </div>
            </div>

            {/* Associated Trust Reports */}
            {reports.length > 0 && (
              <div className="p-5 rounded-2xl border border-red-200 bg-red-50 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                  Trust Violations Lodged ({reports.length})
                </span>
                {reports.map((r) => (
                  <div key={r.id} className="text-xs text-red-900 border-t border-red-100 pt-2">
                    <p className="font-bold">{r.category?.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-red-700 line-clamp-1">{r.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalAction && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalAction(null)}
          onConfirm={handleConfirmAction}
          title={
            modalAction === 'hide'
              ? `Unpublish Trip: ${trip.name}`
              : modalAction === 'restore'
              ? `Restore Trip: ${trip.name}`
              : 'Cancel Trip for Safety'
          }
          message="Confirm this moderation change. The trip leader will be notified of the adjustment."
          confirmText="Confirm"
          variant="warning"
          requireReason={true}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

