import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { safetyApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { UserReportItem, ModerationAuditLog, ReportStatus, ReportCategory } from '../../types';

export const AdminModerationPanel: React.FC = () => {
  const { success, error, info } = useToast();
  const [reports, setReports] = useState<UserReportItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReport, setSelectedReport] = useState<UserReportItem | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [targetUserToSuspend, setTargetUserToSuspend] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
      const res = await safetyApi.getAdminReports(params);
      setReports(res.reports || []);
      setAuditLogs(res.auditLogs || []);
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to fetch moderation reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId: string, status: ReportStatus) => {
    try {
      await safetyApi.updateReportStatus(reportId, status, moderatorNotes);
      success(`Report updated to ${status}`);
      setModeratorNotes('');
      fetchReports();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to update report status');
    }
  };

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserToSuspend || !suspensionReason.trim()) {
      error('Please provide a reason for account suspension.');
      return;
    }

    try {
      await safetyApi.suspendUser(targetUserToSuspend, suspensionReason.trim(), selectedReport?.id);
      success('User suspended successfully. Their session has been revoked.');
      setShowSuspendModal(false);
      setSuspensionReason('');
      setTargetUserToSuspend(null);
      fetchReports();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to suspend user');
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      await safetyApi.restoreUser(userId, 'Account restored by administrator review');
      success('User account access restored.');
      fetchReports();
    } catch (err: any) {
      error(err?.response?.data?.message || err?.message || 'Failed to restore user');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Admin Moderation Console</h2>
            <p className="text-xs text-gray-600">
              Community safety enforcement, complaint investigations, and user suspensions.
            </p>
          </div>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              statusFilter === st
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Reports Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">Active Incident Reports ({reports.length})</h3>
          <span className="text-xs text-gray-500">Confidential reports by TripzoBox travellers</span>
        </div>

        {reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No incident reports found for this filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((rep) => (
              <div key={rep.id} className="p-4 sm:p-5 space-y-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rep.status === 'OPEN'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : rep.status === 'UNDER_REVIEW'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : rep.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rep.status}
                    </span>
                    <span className="text-xs font-bold text-gray-900 capitalize">
                      Category: {rep.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Target: <strong className="text-gray-700">{rep.targetName || rep.targetType}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Reported on {new Date(rep.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-700 space-y-1">
                  <div className="font-semibold text-gray-800">Allegation Details:</div>
                  <p className="whitespace-pre-wrap">{rep.description}</p>
                  {rep.evidenceUrl && (
                    <div className="text-[11px] text-blue-600 mt-1">
                      Evidence URL: <a href={rep.evidenceUrl} target="_blank" rel="noreferrer" className="underline">{rep.evidenceUrl}</a>
                    </div>
                  )}
                </div>

                {/* Moderator Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      onClick={() => handleUpdateStatus(rep.id, 'UNDER_REVIEW')}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors"
                    >
                      Mark Under Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(rep.id, 'RESOLVED')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg transition-colors"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(rep.id, 'DISMISSED')}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>

                  {rep.targetType === 'user' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedReport(rep);
                          setTargetUserToSuspend(rep.targetId);
                          setShowSuspendModal(true);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <UserX className="w-3.5 h-3.5" /> Suspend Accused
                      </button>
                      <button
                        onClick={() => handleRestore(rep.targetId)}
                        className="px-2.5 py-1 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        Restore
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log */}
      {auditLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h3 className="font-bold text-gray-800 text-sm">Moderation Audit Trail</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gray-800">
                    <span className="uppercase text-red-600 font-mono text-[11px] mr-2">[{log.action}]</span>
                    {log.targetType} ({log.targetId})
                  </div>
                  <div className="text-[11px] text-gray-500">{log.reason}</div>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-gray-900">Confirm Account Suspension</h3>
            </div>
            <p className="text-xs text-gray-600">
              Suspending this user will immediately revoke all active JWT tokens, block them from signing in, and prevent them from attending trips.
            </p>

            <form onSubmit={handleSuspend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Suspension Reason (Required for Audit)
                </label>
                <textarea
                  required
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="e.g. Confirmed fraudulent payment solicitation during Goa expedition"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  Confirm Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

