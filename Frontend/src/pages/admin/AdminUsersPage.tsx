import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ShieldAlert,
  UserX,
  UserCheck,
  KeyRound,
  LogOut,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Shield,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { User } from '../../types';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminUsersPage: React.FC = () => {
  const { role, hasPermission } = useAdminAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal Action State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<'suspend' | 'reactivate' | 'resetPassword' | 'revokeSessions' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.users.getAll({
        page,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter,
        verification: verificationFilter,
      });
      setUsers(Array.isArray(res?.users) ? res.users : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      setFeedbackMessage({ type: 'error', text: e?.message || 'Failed to fetch users' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, verificationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleConfirmAction = async (reason: string) => {
    if (!selectedUser || !modalType) return;
    setActionLoading(true);

    try {
      if (modalType === 'suspend') {
        await adminApi.users.toggleSuspend(selectedUser.id, true, reason);
        setFeedbackMessage({ type: 'success', text: `Account for ${selectedUser.name} has been suspended.` });
      } else if (modalType === 'reactivate') {
        await adminApi.users.toggleSuspend(selectedUser.id, false, reason);
        setFeedbackMessage({ type: 'success', text: `Account for ${selectedUser.name} has been reactivated.` });
      } else if (modalType === 'resetPassword') {
        await adminApi.users.requirePasswordReset(selectedUser.id, reason);
        setFeedbackMessage({ type: 'success', text: `Password reset requirement enforced for ${selectedUser.name}.` });
      } else if (modalType === 'revokeSessions') {
        await adminApi.users.revokeSessions(selectedUser.id, reason);
        setFeedbackMessage({ type: 'success', text: `All active sessions revoked for ${selectedUser.name}.` });
      } else if (modalType === 'delete') {
        await adminApi.users.deleteUser(selectedUser.id);
        setFeedbackMessage({ type: 'success', text: `User account deleted successfully.` });
      }
      setModalType(null);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Administrative operation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'EmailVerified', 'PhoneVerified', 'Created'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      u.username,
      u.email || '',
      u.phone || '',
      u.role || 'user',
      u.isSuspended ? 'Suspended' : 'Active',
      u.emailVerified ? 'Yes' : 'No',
      u.phoneVerified ? 'Yes' : 'No',
      u.createdAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tripzobox_users_${Date.now()}.csv`);
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
            Traveller & User Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Inspect traveller profiles, verification flags, and enforce trust & safety actions.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-subtle self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-400" />
          Export CSV
        </button>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or user ID..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
              <option value="moderator">Moderator</option>
              <option value="support">Support</option>
              <option value="content_manager">Content Manager</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Verifications</option>
              <option value="email_verified">Email Verified</option>
              <option value="phone_verified">Phone Verified</option>
              <option value="identity_verified">Govt ID Verified</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <AdminEmptyState
          title="No users match your criteria"
          description="Try broadening your search query or reset the applied status filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('');
            setRoleFilter('');
            setVerificationFilter('');
            setPage(1);
          }}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Trust & Verification</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition group">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                          />
                          <div>
                            <Link
                              to={`/admin/users/${u.id}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition"
                            >
                              {u.name}
                            </Link>
                            <p className="text-[11px] text-slate-400">@{u.username} • ID: {u.id}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              {u.email && <span className="truncate max-w-[150px]">{u.email}</span>}
                              {u.phone && <span>• {u.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {u.role || 'user'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {u.isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Verification Badges */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.emailVerified ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" /> Email
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                              Email Unverified
                            </span>
                          )}

                          {u.phoneVerified && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> Phone
                            </span>
                          )}

                          {u.identityVerificationStatus === 'VERIFIED' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5" /> ID Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(u.createdAt || '').toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition"
                            title="Inspect Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Suspend / Reactivate Button */}
                          {u.isSuspended ? (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setModalType('reactivate');
                              }}
                              className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
                              title="Reactivate Account"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setModalType('suspend');
                              }}
                              className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 transition"
                              title="Suspend Account"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          {/* Require Password Reset */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('resetPassword');
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Enforce Password Reset"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Revoke Sessions */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalType('revokeSessions');
                            }}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Revoke Active Sessions"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>

                          {/* Delete (Superadmin only) */}
                          {role === 'superadmin' && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setModalType('delete');
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {users.length} of {totalCount} travellers
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
      {modalType === 'suspend' && selectedUser && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmAction}
          title={`Suspend Account: ${selectedUser.name}`}
          message="Suspending this traveller will immediately revoke their ability to login, create trips, or send messages. All active sessions will be terminated."
          confirmText="Confirm Suspension"
          variant="danger"
          requireReason={true}
          reasonPlaceholder="Specify community safety policy violation..."
          isLoading={actionLoading}
        />
      )}

      {modalType === 'reactivate' && selectedUser && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmAction}
          title={`Reactivate Account: ${selectedUser.name}`}
          message="This will restore normal account privileges for this traveller."
          confirmText="Reactivate Account"
          variant="info"
          requireReason={true}
          reasonPlaceholder="Document reinstatement review justification..."
          isLoading={actionLoading}
        />
      )}

      {modalType === 'resetPassword' && selectedUser && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmAction}
          title={`Require Password Reset: ${selectedUser.name}`}
          message="The user will be required to configure a new password immediately upon their next login attempt."
          confirmText="Enforce Reset"
          variant="warning"
          requireReason={true}
          reasonPlaceholder="Reason for requiring password reset..."
          isLoading={actionLoading}
        />
      )}

      {modalType === 'revokeSessions' && selectedUser && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmAction}
          title={`Revoke Active Sessions: ${selectedUser.name}`}
          message="All existing JWT sessions and device tokens for this user will be invalidated immediately."
          confirmText="Revoke All Sessions"
          variant="warning"
          requireReason={true}
          reasonPlaceholder="Reason for terminating active sessions..."
          isLoading={actionLoading}
        />
      )}

      {modalType === 'delete' && selectedUser && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmAction}
          title={`Permanently Delete User: ${selectedUser.name}`}
          message="This action is irreversible. The account and its associated private credentials will be permanently erased."
          confirmText="Permanently Erase"
          variant="danger"
          requireReason={true}
          reasonPlaceholder="Legal or operational reason for permanent account deletion..."
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

