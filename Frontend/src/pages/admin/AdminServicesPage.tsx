import React, { useState, useEffect } from 'react';
import {
  Activity,
  Mail,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Lock,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { ServiceHealthStatus } from '../../types/admin';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingService, setTestingService] = useState<'email' | 'sms' | null>(null);
  const [testResult, setTestResult] = useState<{ service: string; status: string; diagnostics: string; latencyMs: number } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await adminApi.system.getServices();
      setServices(data);
    } catch (e: any) {
      alert('Failed to fetch services status: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestService = async (service: 'email' | 'sms') => {
    setTestingService(service);
    setTestResult(null);
    try {
      const res = await adminApi.system.testService(service);
      setTestResult(res);
    } catch (e: any) {
      alert('Service diagnostic test failed: ' + e?.message);
    } finally {
      setTestingService(null);
    }
  };

  if (loading || !services) {
    return <AdminTableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            SMS, Email & Authentication Gateway Health
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Real-time status of SMTP mailers and Fast2SMS OTP infrastructure with security credential masking.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-subtle self-start sm:self-auto"
          title="Refresh Service Status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Diagnostic Result Banner */}
      {testResult && (
        <div className="p-4 rounded-3xl bg-slate-900 text-white text-xs space-y-2 border border-slate-800 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
              <CheckCircle2 className="w-4 h-4" /> Diagnostic Result: {testResult.service} ({testResult.status})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Response Time: {testResult.latencyMs}ms</span>
          </div>
          <p className="text-slate-300 font-mono text-[11px]">{testResult.diagnostics}</p>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Service Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Email Dispatch Gateway</h3>
                <p className="text-xs text-slate-400">{services.emailService.provider}</p>
              </div>
            </div>

            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                services.emailService.isConfigured
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {services.emailService.status}
            </span>
          </div>

          <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">SMTP Host:</span>
              <span className="font-bold text-slate-800">{services.emailService.host}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sender Account:</span>
              <span className="font-bold text-slate-800">{services.emailService.user}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Credential Secret:</span>
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                {services.emailService.passwordMasked}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={testingService === 'email'}
            onClick={() => handleTestService('email')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-slate-600" />
            {testingService === 'email' ? 'Testing Connection...' : 'Run SMTP Connection Ping'}
          </button>
        </div>

        {/* SMS Gateway Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">SMS OTP Gateway</h3>
                <p className="text-xs text-slate-400">{services.smsService.provider}</p>
              </div>
            </div>

            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                services.smsService.isConfigured
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {services.smsService.status}
            </span>
          </div>

          <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway Provider:</span>
              <span className="font-bold text-slate-800">{services.smsService.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Supported Country:</span>
              <span className="font-bold text-slate-800">{services.smsService.countrySupport}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">API Key Masked:</span>
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                {services.smsService.apiKeyMasked}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={testingService === 'sms'}
            onClick={() => handleTestService('sms')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-slate-600" />
            {testingService === 'sms' ? 'Testing Connection...' : 'Run Fast2SMS Ping Test'}
          </button>
        </div>
      </div>

      {/* Security Policies Overview */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Cryptographic & Session Safeguards
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] uppercase">JWT Signing Algorithm</span>
            <span className="font-bold text-slate-800">{services.security.jwtAlgorithm}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] uppercase">Session Lifetime</span>
            <span className="font-bold text-slate-800">{services.security.tokenExpiry}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] uppercase">Password Hashing</span>
            <span className="font-bold text-slate-800">{services.security.passwordHashing}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

