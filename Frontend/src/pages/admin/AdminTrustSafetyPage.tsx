import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  FileCheck2,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { IdentityVerificationItem } from '../../types/admin';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminTrustSafetyPage: React.FC = () => {
  const [verifications, setVerifications] = useState<IdentityVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Review modal
  const [selectedVerif, setSelectedVerif] = useState<IdentityVerificationItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'VERIFIED' | 'REJECTED' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.safety.getVerifications({
        page,
        limit: 10,
        status: statusFilter,
        documentType: documentTypeFilter,
      });
      setVerifications(Array.isArray(res?.verifications) ? res.verifications : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      setFeedback(e?.message || 'Failed to load verifications queue');
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [page, statusFilter, documentTypeFilter]);

  const handleConfirmReview = async (reason: string) => {
    if (!selectedVerif || !reviewAction) return;
    setActionLoading(true);
    try {
      await adminApi.safety.reviewVerification(selectedVerif.id, reviewAction, reason);
      setFeedback(`Document successfully marked as ${reviewAction}.`);
      setSelectedVerif(null);
      setReviewAction(null);
      fetchVerifications();
    } catch (err: any) {
      alert(err?.message || 'Failed to process verification review');
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
            Trust & Safety: Identity Verification Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Verify official identity documents (Aadhaar, Passport, DL), prevent identity spoofing, and ensure community integrity.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Review</option>
          <option value="VERIFIED">Verified & Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={documentTypeFilter}
          onChange={(e) => {
            setDocumentTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Document Types</option>
          <option value="aadhaar">Aadhaar Card</option>
          <option value="passport">Passport</option>
          <option value="driving_license">Driving License</option>
          <option value="voter_id">Voter ID</option>
        </select>
      </div>

      {/* Verifications Table */}
      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : (verifications || []).length === 0 ? (
        <AdminEmptyState
          title="No verification submissions in queue"
          description="Travellers who submit official ID verifications will appear in this review queue."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Traveller</th>
                  <th className="py-3.5 px-4">Document Type</th>
                  <th className="py-3.5 px-4">Provider Reference</th>
                  <th className="py-3.5 px-4">Consent Given</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-right">Moderator Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <Link to={`/admin/users/${v.userId}`} className="font-bold text-slate-900 hover:text-emerald-700">
                            {v.user?.name || v.userId}
                          </Link>
                          <p className="text-[10px] text-slate-400">{v.user?.email || v.userId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono uppercase font-bold text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {v.documentType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {v.providerReferenceId}
                    </td>

                    <td className="py-3.5 px-4">
                      {v.consentGiven ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Explicit Consent
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold flex items-center gap-1 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Missing
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          v.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : v.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(v.submittedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status !== 'VERIFIED' && (
                          <button
                            onClick={() => {
                              setSelectedVerif(v);
                              setReviewAction('VERIFIED');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm"
                          >
                            Approve
                          </button>
                        )}
                        {v.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setSelectedVerif(v);
                              setReviewAction('REJECTED');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          >
                            Reject
                          </button>
                        )}
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
              Showing {verifications.length} of {totalCount} submissions
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

      {/* Confirmation Modal */}
      {selectedVerif && reviewAction && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => {
            setSelectedVerif(null);
            setReviewAction(null);
          }}
          onConfirm={handleConfirmReview}
          title={
            reviewAction === 'VERIFIED'
              ? `Approve Identity Verification: ${selectedVerif.user?.name || selectedVerif.userId}`
              : `Reject Identity Verification: ${selectedVerif.user?.name || selectedVerif.userId}`
          }
          message={
            reviewAction === 'VERIFIED'
              ? 'This will award the traveller a verified identity badge and update their public profile.'
              : 'The verification request will be marked as rejected and the traveller will be prompted to provide clearer documentation.'
          }
          confirmText={reviewAction === 'VERIFIED' ? 'Approve Verification' : 'Reject Verification'}
          variant={reviewAction === 'VERIFIED' ? 'info' : 'danger'}
          requireReason={true}
          reasonPlaceholder={
            reviewAction === 'VERIFIED'
              ? 'Confirming document matches user name and details...'
              : 'Specify reason for document rejection (e.g. Blurry photo, name mismatch)...'
          }
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

