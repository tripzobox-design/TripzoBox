import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Check,
  X,
  Users,
  Compass,
  FileText,
  AlertOctagon,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { RoleDefinitionItem } from '../../types/admin';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleDefinitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.system.getRolePermissions().then((data) => {
      setRoles(data);
      setLoading(false);
    });
  }, []);

  const permissionMatrix: Array<{
    category: string;
    permission: string;
    description: string;
  }> = [
    { category: 'User Management', permission: 'users.view', description: 'View traveller profiles and registration details' },
    { category: 'User Management', permission: 'users.edit', description: 'Edit traveller profile information' },
    { category: 'User Management', permission: 'users.suspend', description: 'Suspend or restore violating accounts' },
    { category: 'User Management', permission: 'users.delete', description: 'Permanently remove traveller accounts' },
    { category: 'Trip Operations', permission: 'trips.view', description: 'Inspect all public and private trips' },
    { category: 'Trip Operations', permission: 'trips.moderate', description: 'Hide, unpublish, or cancel trips for safety' },
    { category: 'Trip Operations', permission: 'trips.delete', description: 'Permanently delete trip records' },
    { category: 'Trust & Safety', permission: 'safety.reports.manage', description: 'Investigate and resolve incident complaints' },
    { category: 'Trust & Safety', permission: 'safety.verifications.manage', description: 'Approve or reject government identity submissions' },
    { category: 'Trust & Safety', permission: 'safety.blocks.manage', description: 'Manage peer-to-peer user blocks' },
    { category: 'Content & CMS', permission: 'cms.edit', description: 'Update homepage banners and static page content' },
    { category: 'Content & CMS', permission: 'cms.publish', description: 'Publish live CMS edits to public application' },
    { category: 'Content & CMS', permission: 'media.manage', description: 'Upload and delete media assets' },
    { category: 'Content & CMS', permission: 'destinations.manage', description: 'Create and modify destination travel guides' },
    { category: 'System Operations', permission: 'system.settings.edit', description: 'Modify global platform toggles and maintenance mode' },
    { category: 'System Operations', permission: 'system.health.view', description: 'Inspect infrastructure health and diagnostic checks' },
    { category: 'Staff Administration', permission: 'admins.create', description: 'Provision new administrator accounts' },
    { category: 'Staff Administration', permission: 'admins.edit_role', description: 'Change administrator role privileges' },
    { category: 'Staff Administration', permission: 'admins.delete', description: 'Deactivate administrator staff accounts' },
    { category: 'Security & Audits', permission: 'audit_logs.view', description: 'Access immutable administrative audit logs' },
  ];

  if (loading) return <AdminTableSkeleton rows={8} />;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          Role-Based Access Control (RBAC) Matrix
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Strict backend-enforced permission mapping across the 5 administrative tiers.
        </p>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {roles.map((r) => (
          <div key={r.role} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle space-y-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {r.role.replace('_', ' ')}
            </span>
            <h4 className="text-xs font-bold text-slate-900">{r.name}</h4>
            <p className="text-[11px] text-slate-500 leading-snug">{r.description}</p>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Permission Matrix & Privilege Boundaries
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            ✓ Backend Enforced via Express Middleware
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Permission Key</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Super Admin</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Moderator</th>
                <th className="py-3 px-4 text-center">Support</th>
                <th className="py-3 px-4 text-center">Content Mgr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissionMatrix.map((item) => {
                const isSuper = true;
                const isAdmin = roles.find((r) => r.role === 'admin')?.permissions.includes(item.permission);
                const isMod = roles.find((r) => r.role === 'moderator')?.permissions.includes(item.permission);
                const isSupport = roles.find((r) => r.role === 'support')?.permissions.includes(item.permission);
                const isContent = roles.find((r) => r.role === 'content_manager')?.permissions.includes(item.permission);

                return (
                  <tr key={item.permission} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                      {item.permission}
                      <p className="font-sans text-[11px] text-slate-400 font-normal">{item.description}</p>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {item.category}
                    </td>

                    {/* Checkmarks */}
                    <td className="py-2.5 px-4 text-center">
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isAdmin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isMod ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isSupport ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {isContent ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

