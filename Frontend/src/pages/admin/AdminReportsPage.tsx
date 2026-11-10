import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserX,
  UserCheck,
  Eye,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { UserReportItem } from '../../types';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<UserReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Resolution Modal
  const [selectedReport, setSelectedReport] = useState<UserReportItem | null>(null);
  const [resolveAction, setResolveAction] = useState<'RESOLVED' | 'DISMISSED' | 'UNDER_REVIEW' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.safety.getReports({
        page,
        limit: 10,
        status: statusFilter,
        category: categoryFilter,
      });
      setReports(Array.isArray(res?.reports) ? res.reports : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      setFeedback('Failed to load incident reports: ' + e?.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, categoryFilter]);

  const handleConfirmResolution = async (notes: string) => {
    if (!selectedReport || !resolveAction) return;
    setActionLoading(true);

    try {
      await adminApi.safety.resolveReport(selectedReport.id, {
        status: resolveAction,
        moderatorNotes: notes,
      });
      setFeedback(`Report marked as ${resolveAction} with documented staff notes.`);
      setSelectedReport(null);
      setResolveAction(null);
      fetchReports();
    } catch (err: any) {
      alert('Failed to resolve report: ' + err?.message);
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
            Trust & Safety Incident Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Investigate harassment complaints, scam reports, and inappropriate conduct flags.
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
          <option value="">All Statuses</option>
          <option value="OPEN">Open (Requires Action)</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Categories</option>
          <option value="harassment">Harassment</option>
          <option value="inappropriate_behaviour">Inappropriate Behaviour</option>
          <option value="suspicious_account">Suspicious Account</option>
          <option value="scam_fraud">Scam / Financial Fraud</option>
          <option value="fake_identity">Fake Identity</option>
          <option value="safety_concern">Safety Concern</option>
        </select>
      </div>

      {/* Reports Table */}
      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : reports.length === 0 ? (
        <AdminEmptyState
          title="No incident reports match your filter"
          description="Complaints or policy violation flags reported by community members will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Category & Subject</th>
                  <th className="py-3.5 px-4">Report Description</th>
                  <th className="py-3.5 px-4">Reporter</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Lodged At</th>
                  <th className="py-3.5 px-4 text-right">Resolve Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        {r.category?.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {r.id}</p>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="text-slate-800 line-clamp-2">{r.description}</p>
                      {r.moderatorNotes && (
                        <p className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                          Staff Note: {r.moderatorNotes}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{r.reporterName}</p>
                      <Link to={`/admin/users/${r.reporterId}`} className="text-[10px] text-slate-400 hover:text-emerald-700">
                        View Reporter
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{r.targetName || r.targetId}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{r.targetType}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          r.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'OPEN'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : r.status === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(r.createdAt || '').toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status !== 'RESOLVED' && (
                          <button
                            onClick={() => {
                              setSelectedReport(r);
                              setResolveAction('RESOLVED');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          >
                            Resolve
                          </button>
                        )}
                        {r.status !== 'DISMISSED' && (
                          <button
                            onClick={() => {
                              setSelectedReport(r);
                              setResolveAction('DISMISSED');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          >
                            Dismiss
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
              Showing {reports.length} of {totalCount} incident reports
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

      {/* Resolution Confirmation Modal */}
      {selectedReport && resolveAction && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => {
            setSelectedReport(null);
            setResolveAction(null);
          }}
          onConfirm={handleConfirmResolution}
          title={
            resolveAction === 'RESOLVED'
              ? `Resolve Safety Complaint #${selectedReport.id}`
              : `Dismiss Safety Complaint #${selectedReport.id}`
          }
          message={
            resolveAction === 'RESOLVED'
              ? 'Marking this incident as resolved requires recording the investigation outcome and actions taken.'
              : 'Dismissing this report means no policy violation was substantiated upon administrative review.'
          }
          confirmText={resolveAction === 'RESOLVED' ? 'Mark Resolved' : 'Confirm Dismissal'}
          variant={resolveAction === 'RESOLVED' ? 'info' : 'warning'}
          requireReason={true}
          reasonPlaceholder="Specify investigation resolution findings and corrective action taken..."
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

