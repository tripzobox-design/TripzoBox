import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Compass,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertOctagon,
  Calendar,
  ArrowUpRight,
  UserCheck,
  Smartphone,
  FileCheck2,
  BookOpen,
  UserX,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminDashboardData } from '../../types/admin';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { AdminTrendChart } from '../../components/admin/AdminTrendChart';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [range, setRange] = useState<string>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { range };
      if (range === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      const res = await adminApi.dashboard.getStats(params);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load live database metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchStats();
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse p-4" />
          ))}
        </div>
        <AdminTableSkeleton rows={4} />
      </div>
    );
  }

  const counts = data?.counts;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Date Range Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Admin Overview & Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time platform metrics aggregated directly from MongoDB.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center shadow-subtle">
            {(['today', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  range === r
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-subtle disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state alert if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>Failed to refresh metrics: {error}</span>
          <button onClick={fetchStats} className="underline font-bold ml-2">Retry</button>
        </div>
      )}

      {/* 1. Core Platform Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Registered Users"
          value={counts?.totalUsers ?? 0}
          subtitle={`${counts?.newUsersInRange ?? 0} joined in current window`}
          icon={Users}
          color="emerald"
          trend={{ value: `+${counts?.newUsersInRange ?? 0}`, isPositive: true }}
        />
        <AdminStatCard
          title="Active Open Trips"
          value={counts?.openTrips ?? 0}
          subtitle={`${counts?.totalTrips ?? 0} total trips created`}
          icon={Compass}
          color="blue"
        />
        <AdminStatCard
          title="Trip Participants"
          value={counts?.totalParticipants ?? 0}
          subtitle={`${counts?.pendingJoinRequests ?? 0} requests awaiting review`}
          icon={UserCheck}
          color="purple"
        />
        <AdminStatCard
          title="Pending Trust Reports"
          value={counts?.pendingReports ?? 0}
          subtitle={`${counts?.totalReports ?? 0} total reports lodged`}
          icon={AlertOctagon}
          color={counts?.pendingReports ? 'red' : 'emerald'}
        />
      </div>

      {/* 2. Secondary Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Email Verified</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{counts?.verifiedEmailUsers ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Phone Verified</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{counts?.verifiedPhoneUsers ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">ID Verified</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{counts?.verifiedIdentityUsers ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Stories Published</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{counts?.totalStories ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Completed Trips</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{counts?.completedTrips ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Suspended / Blocked</p>
          <p className="mt-1 text-xl font-bold text-red-600">
            {(counts?.suspendedUsers ?? 0) + (counts?.blockedUsers ?? 0)}
          </p>
        </div>
      </div>

      {/* 3. Trend Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trends Chart */}
        <AdminTrendChart
          title="User Registration Trend"
          subtitle="Live database counts aggregated by timeline"
          data={data?.charts.userGrowth}
          color="emerald"
          timeframe={range}
          unitLabel="users"
          totalCount={counts?.totalUsers}
        />

        {/* Trip Creation Trends Chart */}
        <AdminTrendChart
          title="Trip Creation Trend"
          subtitle="New trips scheduled across current timeframe"
          data={data?.charts.tripGrowth}
          color="blue"
          timeframe={range}
          unitLabel="trips"
          totalCount={counts?.totalTrips}
        />
      </div>

      {/* 4. Distribution Breakdown Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trip Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle">
          <h3 className="text-base font-bold text-slate-900 mb-4">Trip Status Distribution</h3>
          <div className="space-y-3">
            {data?.charts.tripStatusDistribution.map((item) => {
              const total = counts?.totalTrips || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 capitalize">
                    <span>{item.status}</span>
                    <span>{item.count} trips ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        item.status === 'open'
                          ? 'bg-emerald-500'
                          : item.status === 'full'
                          ? 'bg-purple-500'
                          : item.status === 'closed'
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle">
          <h3 className="text-base font-bold text-slate-900 mb-4">Traveller Verification Breakdown</h3>
          <div className="space-y-3">
            {data?.charts.verificationDistribution.map((item) => {
              const total = counts?.totalUsers || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.status}</span>
                    <span>{item.count} users ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        item.status.includes('ID')
                          ? 'bg-teal-500'
                          : item.status.includes('Email')
                          ? 'bg-emerald-500'
                          : item.status.includes('Phone')
                          ? 'bg-blue-500'
                          : 'bg-amber-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Recent Activity Queues (Users, Trips, Reports, Admin Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent User Registrations */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Registrations</h3>
            <Link to="/admin/users" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data?.recentUsers && data.recentUsers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentUsers.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <Link to={`/admin/users/${u.id}`} className="text-xs font-bold text-slate-900 hover:text-emerald-600">
                        {u.name}
                      </Link>
                      <p className="text-[11px] text-slate-400">{u.email || u.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.emailVerified && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Verified</span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(u.createdAt || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No users found</div>
          )}
        </div>

        {/* Recent Safety Reports */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Trust & Safety Reports</h3>
            <Link to="/admin/reports" className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
              View Queue <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data?.recentReports && data.recentReports.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentReports.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 uppercase">
                      {r.category?.replace(/_/g, ' ')}
                    </span>
                    <p className="mt-1 text-xs text-slate-700 line-clamp-1">{r.description}</p>
                    <p className="text-[10px] text-slate-400">Reported by {r.reporterName}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {new Date(r.createdAt || '').toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No pending reports</div>
          )}
        </div>
      </div>

      {/* 6. Recent Administrative Audit Logs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Staff Actions & Security Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable operations log with operator credentials and IP address</p>
          </div>
          <Link to="/admin/audit-logs" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Complete Audit Logs <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 rounded-r-xl">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.adminName}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] text-slate-500">{log.targetType}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{log.ipAddress || 'local'}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No administrative logs recorded yet</div>
        )}
      </div>
    </div>
  );
};

