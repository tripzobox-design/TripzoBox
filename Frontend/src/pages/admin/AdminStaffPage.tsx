import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  User,
  X,
  Mail,
  Lock,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminUser, AdminRole } from '../../types/admin';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminStaffPage: React.FC = () => {
  const { admin: currentAdmin } = useAdminAuth();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as AdminRole,
  });

  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<AdminRole>('admin');

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await adminApi.admins.getAll();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setAlertMsg('Failed to fetch administrator accounts: ' + e?.message);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await adminApi.admins.create(newAdminData);
      setAlertMsg(`Administrator account provisioned for ${newAdminData.email}`);
      setCreateModalOpen(false);
      setNewAdminData({ name: '', email: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch (err: any) {
      alert('Failed to create administrator: ' + err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChangeConfirm = async () => {
    if (!roleChangeTarget) return;
    setActionLoading(true);
    try {
      await adminApi.admins.updateRole(roleChangeTarget.id, selectedNewRole);
      setAlertMsg(`Role for ${roleChangeTarget.name} updated to ${selectedNewRole}.`);
      setRoleChangeTarget(null);
      fetchAdmins();
    } catch (err: any) {
      alert('Failed to change role: ' + err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminApi.admins.delete(deleteTarget.id);
      setAlertMsg(`Administrator ${deleteTarget.name} removed from platform.`);
      setDeleteTarget(null);
      fetchAdmins();
    } catch (err: any) {
      alert('Failed to delete administrator: ' + err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const roleBadges: Record<string, string> = {
    superadmin: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-blue-50 text-blue-700 border-blue-200',
    moderator: 'bg-amber-50 text-amber-700 border-amber-200',
    support: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    content_manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Administrator & Staff Accounts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Superadmin management of operations staff, privileges, and credential access.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Provision Admin
        </button>
      </div>

      {alertMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {alertMsg}
          </span>
          <button onClick={() => setAlertMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Staff Table */}
      {loading ? (
        <AdminTableSkeleton rows={4} />
      ) : admins.length === 0 ? (
        <AdminEmptyState
          title="No admin accounts discovered"
          description="Click 'Provision Admin' to grant staff credentials."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {admins.map((adm) => {
                  const isSelf = adm.id === currentAdmin?.id;
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={adm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">
                              {adm.name} {isSelf && <span className="text-[10px] text-emerald-600 font-bold">(You)</span>}
                            </p>
                            <p className="text-[11px] text-slate-400">{adm.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            roleBadges[adm.role] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {adm.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {adm.isSuspended ? (
                          <span className="text-red-700 font-bold">Suspended</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Active</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(adm.createdAt || '').toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => {
                                  setRoleChangeTarget(adm);
                                  setSelectedNewRole(adm.role);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                              >
                                Modify Role
                              </button>
                              <button
                                onClick={() => setDeleteTarget(adm)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Remove Staff Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision Admin Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Provision Administrator Account</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Initial Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={newAdminData.password}
                  onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                  placeholder="At least 8 characters..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Role Privilege *</label>
                <select
                  value={newAdminData.role}
                  onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value as AdminRole })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="admin">Administrator (Operations)</option>
                  <option value="moderator">Moderator (Trust & Safety)</option>
                  <option value="content_manager">Content Manager (CMS)</option>
                  <option value="support">Support Agent (Inquiries)</option>
                  <option value="superadmin">Super Administrator (Full Ownership)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {actionLoading ? 'Creating...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Change Role: {roleChangeTarget.name}</h3>
            <p className="text-xs text-slate-500">
              Select the updated privilege hierarchy for this staff member.
            </p>

            <select
              value={selectedNewRole}
              onChange={(e) => setSelectedNewRole(e.target.value as AdminRole)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="admin">Administrator</option>
              <option value="moderator">Moderator</option>
              <option value="content_manager">Content Manager</option>
              <option value="support">Support Agent</option>
              <option value="superadmin">Super Administrator</option>
            </select>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeConfirm}
                disabled={actionLoading}
                className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                {actionLoading ? 'Updating...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Modal */}
      {deleteTarget && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={`Remove Administrator: ${deleteTarget.name}`}
          message="Are you sure you want to revoke administrator access and delete this staff account?"
          confirmText="Delete Account"
          variant="danger"
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

