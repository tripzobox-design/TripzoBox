import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  KeyRound,
  LogOut,
  Star,
  Compass,
  BookOpen,
  AlertOctagon,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Send,
  Plus,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { User, Trip } from '../../types';
import { IdentityVerificationItem, AdminAuditLogItem } from '../../types/admin';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminUserDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<{
    createdTrips: Trip[];
    joinRequests: any[];
    reports: any[];
    reportsFiledByUser: any[];
    diaryEntries: any[];
    stories: any[];
    reviewsReceived: any[];
    identityRecord: IdentityVerificationItem | null;
    auditLogs: AdminAuditLogItem[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'diary' | 'reviews' | 'safety' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Modal actions
  const [modalType, setModalType] = useState<'suspend' | 'reactivate' | 'resetPassword' | 'revokeSessions' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUserDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await adminApi.users.getById(userId);
      setUser(res.user);
      setActivity(res.activity);
    } catch (e: any) {
      setFeedback('Failed to load user details: ' + (e?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newNote.trim()) return;

    setSubmittingNote(true);
    try {
      await adminApi.users.addNote(userId, newNote.trim());
      setNewNote('');
      fetchUserDetails();
    } catch (e: any) {
      alert('Failed to add internal note: ' + e?.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleConfirmAction = async (reason: string) => {
    if (!user || !modalType) return;
    setActionLoading(true);

    try {
      if (modalType === 'suspend') {
        await adminApi.users.toggleSuspend(user.id, true, reason);
      } else if (modalType === 'reactivate') {
        await adminApi.users.toggleSuspend(user.id, false, reason);
      } else if (modalType === 'resetPassword') {
        await adminApi.users.requirePasswordReset(user.id, reason);
      } else if (modalType === 'revokeSessions') {
        await adminApi.users.revokeSessions(user.id, reason);
      }
      setModalType(null);
      fetchUserDetails();
    } catch (err: any) {
      alert(err?.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-44 bg-slate-200 rounded animate-pulse" />
        <AdminTableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Travellers
        </Link>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          {feedback}
        </div>
      )}

      {/* Profile Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-subtle">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={user.name}
              className="w-20 h-20 rounded-3xl object-cover ring-4 ring-slate-100 shadow-md"
            />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                  {user.name}
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {user.role || 'user'}
                </span>
                {user.isSuspended ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    Suspended
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">@{user.username} • ID: {user.id}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {user.city}, {user.country || 'India'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {new Date(user.createdAt || '').toLocaleDateString()}
                </span>
                {user.lastLoginAt && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Last seen {new Date(user.lastLoginAt).toLocaleString()} ({user.lastLoginIp || 'local'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {user.isSuspended ? (
              <button
                onClick={() => setModalType('reactivate')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" /> Reactivate User
              </button>
            ) : (
              <button
                onClick={() => setModalType('suspend')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm"
              >
                <UserX className="w-3.5 h-3.5" /> Suspend User
              </button>
            )}

            <button
              onClick={() => setModalType('resetPassword')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" /> Require Reset
            </button>

            <button
              onClick={() => setModalType('revokeSessions')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" /> Revoke Sessions
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-8 border-b border-slate-100 overflow-x-auto">
          {[
            { id: 'overview', label: 'Profile Overview' },
            { id: 'trips', label: `Trips (${activity?.createdTrips.length || 0})` },
            { id: 'diary', label: `Travel Diary (${activity?.diaryEntries.length || 0})` },
            { id: 'reviews', label: `Reviews (${activity?.reviewsReceived.length || 0})` },
            { id: 'safety', label: `Safety & Reports (${activity?.reports.length || 0})` },
            { id: 'notes', label: `Staff Notes (${user.internalNotes?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity & Verification Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
            <h3 className="text-base font-bold text-slate-900">Trust & Identity Verifications</h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Email Address</p>
                    <p className="text-[11px] text-slate-500">{user.email || 'None'}</p>
                  </div>
                </div>
                {user.emailVerified ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Unverified
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Phone Number</p>
                    <p className="text-[11px] text-slate-500">{user.phone || 'None'}</p>
                  </div>
                </div>
                {user.phoneVerified ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Unverified
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Government ID Compliance</p>
                    <p className="text-[11px] text-slate-500">
                      Status: {user.identityVerificationStatus || 'NOT_STARTED'}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  user.identityVerificationStatus === 'VERIFIED'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {user.identityVerificationStatus || 'NOT_STARTED'}
                </span>
              </div>
            </div>
          </div>

          {/* Bio & Travel Preferences */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
            <h3 className="text-base font-bold text-slate-900">Travel Preferences & Bio</h3>
            <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl">
              "{user.bio || 'No bio provided'}"
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase">Travel Style</span>
                <span className="font-bold text-slate-800">{user.travelStyle || 'Solo'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase">Budget Style</span>
                <span className="font-bold text-slate-800 capitalize">{user.budgetStyle || 'comfort'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase">Gender</span>
                <span className="font-bold text-slate-800 capitalize">{user.gender || 'Not specified'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <span className="text-slate-400 block text-[10px] uppercase">Languages</span>
                <span className="font-bold text-slate-800">{user.languages?.join(', ') || 'English'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Trips Tab */}
      {activeTab === 'trips' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900">Trips Created by {user.name}</h3>
          {activity?.createdTrips && activity.createdTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activity.createdTrips.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <Link to={`/admin/trips/${t.id}`} className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700">
                      {t.name}
                    </Link>
                    <p className="text-xs text-slate-500">{t.destination} • ₹{t.budgetPerPerson}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 uppercase mt-1 inline-block">
                      {t.status}
                    </span>
                  </div>
                  <Link to={`/admin/trips/${t.id}`} className="text-xs font-bold text-emerald-600 hover:underline">
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No trips created by this user.</p>
          )}
        </div>
      )}

      {/* 3. Travel Diary Tab */}
      {activeTab === 'diary' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900">Travel Diary Entries</h3>
          {activity?.diaryEntries && activity.diaryEntries.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activity.diaryEntries.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{e.title || 'Untitled Experience'}</h4>
                    <p className="text-xs text-slate-500">{e.location} • {new Date(e.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    e.isPublic ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {e.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No travel diary entries recorded.</p>
          )}
        </div>
      )}

      {/* 4. Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900">Traveller Reputation & Reviews</h3>
          <div className="p-4 rounded-2xl bg-slate-50 flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Average Rating</p>
              <p className="text-3xl font-extrabold text-slate-900 flex items-center gap-1.5 mt-1">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                {user.reputation?.averageRating ? user.reputation.averageRating.toFixed(1) : '5.0'}
              </p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Completed Trips</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {user.reputation?.completedTripsCount || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Safety & Reports Tab */}
      {activeTab === 'safety' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900">Reports Against This Account</h3>
          {activity?.reports && activity.reports.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activity.reports.map((r) => (
                <div key={r.id} className="py-3 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 uppercase">
                      {r.category?.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-slate-700 mt-1">{r.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reported by: {r.reporterName}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{r.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-700 py-4 font-semibold">
              ✓ Clean record. No safety violations or complaints lodged against this user.
            </p>
          )}
        </div>
      )}

      {/* 6. Staff Moderation Notes Tab */}
      {activeTab === 'notes' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-6">
          <h3 className="text-base font-bold text-slate-900">Internal Staff Moderation Notes</h3>

          {/* Add note form */}
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add confidential internal note regarding identity check, phone call, or complaint investigation..."
              className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
            <button
              type="submit"
              disabled={submittingNote || !newNote.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {submittingNote ? 'Saving Note...' : 'Add Internal Note'}
            </button>
          </form>

          {/* Notes list */}
          <div className="divide-y divide-slate-100 pt-4">
            {user.internalNotes && user.internalNotes.length > 0 ? (
              user.internalNotes.map((n, idx) => (
                <div key={idx} className="py-3">
                  <p className="text-xs text-slate-800">{n.note}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Recorded by <span className="font-semibold text-slate-600">{n.author}</span> on{' '}
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4">No internal moderation notes recorded for this user.</p>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {modalType && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setModalType(null)}
          onConfirm={handleConfirmAction}
          title={
            modalType === 'suspend'
              ? `Suspend User: ${user.name}`
              : modalType === 'reactivate'
              ? `Reactivate User: ${user.name}`
              : modalType === 'resetPassword'
              ? `Require Password Reset: ${user.name}`
              : `Revoke All Sessions: ${user.name}`
          }
          message="Confirm this administrative operation. An immutable record will be stored in the audit logs."
          confirmText="Confirm"
          variant={modalType === 'suspend' ? 'danger' : 'warning'}
          requireReason={true}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

