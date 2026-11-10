import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Compass,
  User,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Users,
  MapPin,
  Calendar,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface OverrideModalConfig {
  isOpen: boolean;
  request: any | null;
  action: 'APPROVE' | 'REJECT' | 'REVOKE_APPROVAL' | 'OVERRIDE_APPROVE';
  title: string;
  description: string;
  requiresReason: boolean;
}

export const AdminJoinRequestsPage: React.FC = () => {
  const { hasRole, admin } = useAdminAuth();
  const canOverride = hasRole(['superadmin', 'admin', 'moderator']);

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal State
  const [overrideModal, setOverrideModal] = useState<OverrideModalConfig>({
    isOpen: false,
    request: null,
    action: 'APPROVE',
    title: '',
    description: '',
    requiresReason: false,
  });
  const [reasonInput, setReasonInput] = useState<string>('');
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState<boolean>(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any | null>(null);

  // Global Feedback Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminApi.joinRequests.getAll({
        page,
        limit: 10,
        status: statusFilter,
        search: searchTerm,
      });
      const list = res?.joinRequests || res?.requests || [];
      setRequests(Array.isArray(list) ? list : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      console.error('Failed to load join requests:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const handleOpenActionModal = (
    request: any,
    action: 'APPROVE' | 'REJECT' | 'REVOKE_APPROVAL' | 'OVERRIDE_APPROVE'
  ) => {
    setReasonInput('');
    setModalError(null);

    let title = '';
    let description = '';
    let requiresReason = false;

    if (action === 'APPROVE') {
      title = 'Approve Join Request';
      description = `Confirm ${request.userName || 'applicant'}'s spot in the group. This will add them to the confirmed participants list.`;
      requiresReason = false;
    } else if (action === 'REJECT') {
      title = 'Reject Join Request';
      description = `Reject ${request.userName || 'applicant'}'s application to join "${request.tripTitle || 'this trip'}".`;
      requiresReason = false;
    } else if (action === 'REVOKE_APPROVAL') {
      title = 'Revoke Confirmed Participation';
      description = `Remove ${request.userName || 'applicant'} from the confirmed participant group of "${request.tripTitle || 'this trip'}". A legitimate moderation or safety reason is required.`;
      requiresReason = true;
    } else if (action === 'OVERRIDE_APPROVE') {
      title = 'Override Rejection & Approve Decision';
      description = `Reconsider and approve ${request.userName || 'applicant'}'s previously rejected request for "${request.tripTitle || 'this trip'}". A documented justification reason is required.`;
      requiresReason = true;
    }

    setOverrideModal({
      isOpen: true,
      request,
      action,
      title,
      description,
      requiresReason,
    });
  };

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal.request) return;

    if (overrideModal.requiresReason && !reasonInput.trim()) {
      setModalError('Please enter a detailed reason for this moderation action.');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      const res = await adminApi.joinRequests.updateStatus(overrideModal.request.id || overrideModal.request._id, {
        action: overrideModal.action,
        reason: reasonInput.trim(),
      });

      setFeedback({
        type: 'success',
        message: `Action executed successfully: ${overrideModal.action.replace('_', ' ')}`,
      });
      setOverrideModal((prev) => ({ ...prev, isOpen: false }));
      fetchRequests();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to execute moderation override');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenDetails = async (reqItem: any) => {
    setSelectedRequestDetails(reqItem);
    setDetailsModalOpen(true);
    try {
      const full = await adminApi.joinRequests.getById(reqItem.id || reqItem._id);
      if (full) {
        setSelectedRequestDetails(full);
      }
    } catch (e) {
      // Use existing item as fallback
    }
  };

  const safeRequests = Array.isArray(requests) ? requests : [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-emerald-600" />
            Trip Join Requests & Participation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Monitor applicant participation, enforce group capacity, and review administrative moderator overrides.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by applicant, email, trip destination or ID..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-subtle"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : safeRequests.length === 0 ? (
        <AdminEmptyState
          title="No join requests recorded"
          description="Requests submitted by travellers wishing to join shared trips will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Target Trip</th>
                  <th className="py-3.5 px-4">Message / Intro</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Moderator Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeRequests.map((r) => {
                  const applicantName = r.user?.name || r.userName || 'Traveller';
                  const applicantAvatar =
                    r.user?.avatarUrl ||
                    r.userAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80';
                  const applicantId = r.userId || r.user?.id || '';
                  const tripId = r.tripId || r.trip?.id || '';
                  const tripTitle = r.trip?.name || r.tripTitle || tripId;
                  const tripDestination = r.tripDestination || r.trip?.destination || '';
                  const leaderName = r.tripLeaderName || r.trip?.leader?.name || 'Trip Leader';
                  const leaderAvatar = r.tripLeaderAvatar || r.trip?.leader?.avatarUrl || '';

                  const currentCount = r.currentParticipants ?? (r.trip?.members?.length || 0);
                  const maxCap = r.maxCapacity ?? (r.trip?.maxMembers || 0);
                  const isFull = r.isTripFull ?? (maxCap > 0 && currentCount >= maxCap);

                  const normalizedStatus = (r.status || 'pending').toLowerCase();
                  const isApproved = normalizedStatus === 'approved' || normalizedStatus === 'accepted';
                  const isPending = normalizedStatus === 'pending';
                  const isRejected = normalizedStatus === 'rejected' || normalizedStatus === 'declined';
                  const isCancelled = normalizedStatus === 'cancelled';
                  const isWithdrawn = normalizedStatus === 'withdrawn';

                  return (
                    <tr key={r.id || r._id} className="hover:bg-slate-50/60 transition">
                      {/* Applicant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={applicantAvatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                          />
                          <div>
                            {applicantId ? (
                              <Link
                                to={`/admin/users/${applicantId}`}
                                className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1"
                              >
                                {applicantName}
                              </Link>
                            ) : (
                              <span className="font-bold text-slate-900">{applicantName}</span>
                            )}
                            <p className="text-[10px] text-slate-400">ID: {applicantId || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Target Trip */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div>
                          {tripId ? (
                            <Link
                              to={`/admin/trips/${tripId}`}
                              className="font-bold text-slate-800 hover:text-emerald-700 line-clamp-1"
                            >
                              {tripTitle}
                            </Link>
                          ) : (
                            <span className="font-bold text-slate-800 line-clamp-1">{tripTitle}</span>
                          )}

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            {tripDestination && (
                              <span className="flex items-center gap-0.5 text-slate-400">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {tripDestination}
                              </span>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                              Leader: {leaderName}
                            </span>
                          </div>

                          {/* Capacity Indicator */}
                          {maxCap > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isFull
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {currentCount}/{maxCap} Confirmed
                              </span>
                              {isFull && (
                                <span className="text-[10px] font-extrabold uppercase text-red-600">
                                  Full
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Message / Intro */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 italic">
                          "{r.message || 'No personal message attached'}"
                        </p>
                        {r.user?.travelStyle && (
                          <span className="inline-block mt-1 text-[10px] text-slate-400">
                            Style: {r.user.travelStyle} • Budget: {r.user.budget || 'Flexible'}
                          </span>
                        )}
                      </td>

                      {/* Current Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isRejected
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isCancelled
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {isApproved
                            ? 'Approved'
                            : isRejected
                            ? 'Rejected'
                            : isPending
                            ? 'Pending'
                            : isCancelled
                            ? 'Cancelled'
                            : isWithdrawn
                            ? 'Withdrawn'
                            : r.status}
                        </span>

                        {r.moderatorOverride && (
                          <span
                            className="block text-[9px] text-slate-400 mt-0.5"
                            title={`Action: ${r.moderatorOverride.action} by ${r.moderatorOverride.adminName}`}
                          >
                            Mod Override
                          </span>
                        )}
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Moderator Override Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PENDING State: Approve & Reject */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(r, 'APPROVE')}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                title="Approve Request"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(r, 'REJECT')}
                                className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* APPROVED State: View Details & Revoke Approval */}
                          {isApproved && (
                            <>
                              <button
                                onClick={() => handleOpenDetails(r)}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Details
                              </button>
                              {canOverride && (
                                <button
                                  onClick={() => handleOpenActionModal(r, 'REVOKE_APPROVAL')}
                                  className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                                  title="Revoke Approval with Reason"
                                >
                                  Revoke Approval
                                </button>
                              )}
                            </>
                          )}

                          {/* REJECTED State: View Details & Override Decision */}
                          {isRejected && (
                            <>
                              <button
                                onClick={() => handleOpenDetails(r)}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Details
                              </button>
                              {canOverride && (
                                <button
                                  onClick={() => handleOpenActionModal(r, 'OVERRIDE_APPROVE')}
                                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1"
                                  title="Override Leader Rejection with Reason"
                                >
                                  <RotateCcw className="w-3 h-3" /> Override Decision
                                </button>
                              )}
                            </>
                          )}

                          {/* CANCELLED / WITHDRAWN: View Details only */}
                          {(isCancelled || isWithdrawn) && (
                            <button
                              onClick={() => handleOpenDetails(r)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {safeRequests.length} of {totalCount} join requests
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

      {/* Confirmation & Override Dialog */}
      {overrideModal.isOpen && overrideModal.request && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">{overrideModal.title}</h3>
              </div>
              <button
                onClick={() => setOverrideModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOverride} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">{overrideModal.description}</p>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Applicant:</span>
                  <span className="font-bold text-slate-800">
                    {overrideModal.request.userName || overrideModal.request.user?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trip:</span>
                  <span className="font-bold text-slate-800">
                    {overrideModal.request.tripTitle || overrideModal.request.trip?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {overrideModal.request.status}
                  </span>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {overrideModal.requiresReason ? (
                    <span className="flex items-center gap-1 text-slate-900">
                      Reason for Override / Action <span className="text-red-500">*</span>
                    </span>
                  ) : (
                    <span>Internal Administrative Reason / Note (Optional)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder={
                    overrideModal.requiresReason
                      ? 'State the specific safety, policy, or verification reason for this override...'
                      : 'Add an optional internal moderation note...'
                  }
                  required={overrideModal.requiresReason}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={modalSubmitting}
                  onClick={() => setOverrideModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className={`px-5 py-2 rounded-xl text-white font-bold transition shadow-sm ${
                    overrideModal.action === 'REVOKE_APPROVAL' || overrideModal.action === 'REJECT'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {modalSubmitting ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {detailsModalOpen && selectedRequestDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Join Request Inspection</h3>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5 text-xs">
              {/* Applicant Profile Header */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <img
                  src={
                    selectedRequestDetails.userAvatar ||
                    selectedRequestDetails.user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
                  }
                  alt=""
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedRequestDetails.userName || selectedRequestDetails.user?.name}
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    User ID: {selectedRequestDetails.userId || selectedRequestDetails.user?.id}
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Location: {selectedRequestDetails.user?.city || selectedRequestDetails.user?.location || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Message from Applicant */}
              <div>
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1.5">
                  Applicant's Personal Note
                </h5>
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-700 italic border border-slate-100">
                  "{selectedRequestDetails.message || 'No personal message provided.'}"
                </div>
              </div>

              {/* Trip Information */}
              <div>
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1.5">
                  Target Trip Overview
                </h5>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trip Name:</span>
                    <span className="font-bold text-slate-900">
                      {selectedRequestDetails.tripTitle || selectedRequestDetails.trip?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trip Leader:</span>
                    <span className="font-bold text-slate-800">
                      {selectedRequestDetails.tripLeaderName || selectedRequestDetails.trip?.leader?.name || 'Leader'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confirmed Capacity:</span>
                    <span className="font-bold text-emerald-700">
                      {(selectedRequestDetails.currentParticipants ?? selectedRequestDetails.trip?.members?.length) || 0} / {(selectedRequestDetails.maxCapacity ?? selectedRequestDetails.trip?.maxMembers) || 0} spots
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trip Status:</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {selectedRequestDetails.tripStatus || selectedRequestDetails.trip?.status || 'Open'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderation History */}
              {selectedRequestDetails.moderationHistory && selectedRequestDetails.moderationHistory.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1.5">
                    Moderation History
                  </h5>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-3 bg-slate-50 space-y-2">
                    {selectedRequestDetails.moderationHistory.map((m: any, idx: number) => (
                      <div key={idx} className="pt-2 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{m.action} by {m.adminName}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(m.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] italic">Reason: "{m.reason}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
