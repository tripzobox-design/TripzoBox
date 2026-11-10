import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Shield,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminAuditLogItem } from '../../types/admin';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.system.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter,
      });
      setLogs(Array.isArray(res?.logs) ? res.logs : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      alert('Failed to load audit logs: ' + e?.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'AdminName', 'AdminEmail', 'Action', 'TargetType', 'TargetID', 'Details', 'IPAddress', 'Timestamp'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.adminName}"`,
      l.adminEmail,
      l.action,
      l.targetType,
      l.targetId || '',
      `"${l.details?.replace(/"/g, '""') || ''}"`,
      l.ipAddress || '',
      l.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tripzobox_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Administrative Audit Trail & Security Logs
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Immutable log of all administrative actions, suspension events, and credential access.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-subtle self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-400" /> Export Audit Log
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle flex items-center justify-between">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Actions</option>
          <option value="ADMIN_LOGIN">Admin Login</option>
          <option value="ADMIN_LOGIN_FAILED">Failed Login Attempt</option>
          <option value="USER_SUSPEND">User Suspension</option>
          <option value="USER_REACTIVATE">User Reactivation</option>
          <option value="USER_REQUIRE_PASSWORD_RESET">Require Password Reset</option>
          <option value="USER_REVOKE_SESSIONS">Revoke User Sessions</option>
          <option value="TRIP_STATUS_CHANGE">Trip Status Change</option>
          <option value="TRIP_DELETE">Trip Deletion</option>
          <option value="UPDATE_CMS_CONTENT">CMS Content Update</option>
          <option value="UPDATE_PLATFORM_SETTINGS">Settings Change</option>
          <option value="VERIFICATION_REVIEW">Verification Review</option>
          <option value="BROADCAST_NOTIFICATION">Broadcast Notification</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <AdminEmptyState
          title="No audit logs recorded for this action"
          description="Administrative actions executed on the platform will be recorded here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Details / Justification</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{log.adminName}</p>
                      <p className="text-[10px] text-slate-400">{log.adminEmail}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold uppercase text-[10px] text-slate-500 block">{log.targetType}</span>
                      {log.targetId && (
                        <span className="font-mono text-[10px] text-slate-400 truncate block max-w-[120px]">
                          {log.targetId}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="text-slate-700 text-xs leading-relaxed">{log.details || '—'}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.ipAddress || 'local'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-right">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {logs.length} of {totalCount} log entries
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
    </div>
  );
};

