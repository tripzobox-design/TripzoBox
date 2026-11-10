import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminNotificationsPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'alert',
    targetGroup: 'all' as 'all' | 'verified_only' | 'trip_leaders',
    linkUrl: '',
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await adminApi.notifications.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setAlertMsg('Failed to load broadcast history: ' + e?.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    setBroadcasting(true);
    setAlertMsg(null);
    try {
      await adminApi.notifications.broadcast(form);
      setAlertMsg(`Announcement "${form.title}" broadcasted successfully!`);
      setForm({
        title: '',
        message: '',
        type: 'info',
        targetGroup: 'all',
        linkUrl: '',
      });
      fetchHistory();
    } catch (err: any) {
      alert('Broadcast failed: ' + err?.message);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          Platform Broadcasts & Notifications
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Dispatch platform-wide alerts, safety advisories, and targeted messages to verified user cohorts.
        </p>
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

      {/* Broadcast Composer */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-600" /> Compose New Announcement
        </h3>

        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Announcement Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Weather Advisory: High Altitude Passes in Himachal"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Target Audience</label>
              <select
                value={form.targetGroup}
                onChange={(e) => setForm({ ...form, targetGroup: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="all">All Registered Travellers</option>
                <option value="verified_only">Verified Members Only</option>
                <option value="trip_leaders">Active Trip Leaders</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Alert Severity</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="info">Information (Blue)</option>
                <option value="warning">Safety Warning (Amber)</option>
                <option value="alert">Critical Alert (Red)</option>
                <option value="success">Feature Update (Green)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">Action Link URL (Optional)</label>
              <input
                type="text"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://tripzobox.com/safety or /trips"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Notification Body Message *</label>
            <textarea
              rows={3}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Provide clear, concise details for travellers..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={broadcasting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {broadcasting ? 'Broadcasting...' : 'Broadcast Announcement'}
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" /> Platform Announcement History
        </h3>

        {loading ? (
          <AdminTableSkeleton rows={4} />
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No broadcast announcements recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((ann) => (
              <div key={ann.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        ann.type === 'alert'
                          ? 'bg-red-50 text-red-700'
                          : ann.type === 'warning'
                          ? 'bg-amber-50 text-amber-700'
                          : ann.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {ann.type}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600">{ann.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(ann.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

