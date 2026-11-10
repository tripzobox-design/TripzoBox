import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Clock,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Shield,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminSystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<{
    status?: string;
    serverTime?: string;
    uptimeSeconds?: number;
    database?: { status?: string; connected?: boolean; name?: string } | string;
    process?: { nodeVersion?: string; platform?: string; pid?: number };
    nodeVersion?: string;
    platform?: string;
    memory?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await adminApi.system.getHealth();
      setHealth(data);
    } catch (e: any) {
      alert('Failed to load system health: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  const formatMB = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading || !health) return <AdminTableSkeleton rows={6} />;

  const isDbConnected =
    typeof health.database === 'object' && health.database !== null
      ? Boolean(health.database.connected)
      : health.database === 'Connected';

  const dbStatusText =
    typeof health.database === 'object' && health.database !== null
      ? health.database.status || (health.database.connected ? 'Connected' : 'Disconnected')
      : String(health.database || 'Connected');

  const dbName =
    typeof health.database === 'object' && health.database !== null
      ? health.database.name || 'tripzobox'
      : 'tripzobox';

  const platformName = health.process?.platform || health.platform || 'Node.js Server';
  const nodeVersionText = health.process?.nodeVersion || health.nodeVersion || 'v20.x';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            System Infrastructure & Runtime Health
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time status of Node.js cluster processes, memory pools, and MongoDB connectivity.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-subtle self-start sm:self-auto"
          title="Refresh Health"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database Connectivity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Database Engine</h3>
                <p className="text-xs text-slate-400">{dbName}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold flex items-center gap-1 ${isDbConnected ? 'text-emerald-600' : 'text-red-600'}`}>
                {isDbConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {dbStatusText}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database Name:</span>
              <span className="font-bold text-slate-800">{dbName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Driver:</span>
              <span className="font-bold text-slate-800">Mongoose ODM 8.x</span>
            </div>
          </div>
        </div>

        {/* Runtime & Process Info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Process & Uptime</h3>
                <p className="text-xs text-slate-400">{platformName}</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Server Uptime:</span>
              <span className="font-bold text-slate-800">{formatUptime(health.uptimeSeconds || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Node Runtime:</span>
              <span className="font-bold text-slate-800">{nodeVersionText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Platform OS:</span>
              <span className="font-bold text-slate-800">{platformName}</span>
            </div>
          </div>
        </div>

        {/* Memory Footprint */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">RAM Consumption</h3>
                <p className="text-xs text-slate-400">V8 Heap Allocations</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Heap Used:</span>
              <span className="font-bold text-slate-800">{formatMB(health.memory?.heapUsed || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RSS Resident:</span>
              <span className="font-bold text-slate-800">{formatMB(health.memory?.rss || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

