import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  Power,
  RotateCcw,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { PlatformSettingsData } from '../../types/admin';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminApi.system.getSettings();
      setSettings(data);
    } catch (e: any) {
      alert('Failed to load platform settings: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveConfirmed = async (reason: string) => {
    if (!settings) return;
    setSaving(true);
    setAlertMsg(null);
    try {
      const updated = await adminApi.system.updateSettings(settings);
      setSettings(updated);
      setAlertMsg('Platform configuration updated and applied globally!');
      setConfirmOpen(false);
    } catch (err: any) {
      alert('Failed to save settings: ' + err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <AdminTableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Platform Settings & Feature Switches
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Control global application preferences, maintenance windows, and user feature availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
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

      {/* Settings Form */}
      <div className="space-y-6 text-xs">
        {/* General Branding */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            General Branding & Organization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.websiteName}
                onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Brand Tagline</label>
              <input
                type="text"
                value={settings.websiteTagline}
                onChange={(e) => setSettings({ ...settings, websiteTagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Primary Support Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Support Phone Helpline</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Global Operational Feature Toggles */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Operational Feature Switches & Maintenance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Maintenance Mode */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              settings.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <p className="font-bold text-slate-900">Platform Maintenance Mode</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When enabled, public site access is restricted to administrative staff only.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 text-red-600 rounded"
              />
            </div>

            {/* Registration Enabled */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">New User Registrations</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Allow public travellers to register new accounts.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded"
              />
            </div>

            {/* Trip Creation Enabled */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Public Trip Creation</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Allow travellers to create and publish shared trips.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.tripCreationEnabled}
                onChange={(e) => setSettings({ ...settings, tripCreationEnabled: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded"
              />
            </div>

            {/* Public Diary Enabled */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Travel Diary Community Posts</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Allow users to publish public diary entries & stories.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.publicDiaryEnabled}
                onChange={(e) => setSettings({ ...settings, publicDiaryEnabled: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded"
              />
            </div>
          </div>
        </div>

        {/* Emergency Helpline Numbers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Safety & Emergency Contact Configurations
          </h3>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">National Emergency Helpline Hotline</label>
            <input
              type="text"
              value={settings.emergencyHelpline || '112 / 100'}
              onChange={(e) => setSettings({ ...settings, emergencyHelpline: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 max-w-md font-mono"
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleSaveConfirmed}
          title="Apply Global Platform Settings"
          message="These settings will take effect immediately across the live application and will be audit-logged."
          confirmText="Apply Global Changes"
          variant="warning"
          requireReason={true}
          reasonPlaceholder="Specify administrative reason for settings modification..."
          isLoading={saving}
        />
      )}
    </div>
  );
};

