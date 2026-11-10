import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Eye,
  EyeOff,
  Trash2,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminDiaryPage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await adminApi.diary.getAll({ page, limit: 12, search });
      setEntries(Array.isArray(res?.entries) ? res.entries : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      setAlertMsg(e?.message || 'Failed to fetch travel diary posts');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEntries();
  };

  const handleToggleVisibility = async (entry: any) => {
    try {
      await adminApi.diary.toggleVisibility(entry.id || entry._id, !entry.isPublic);
      setAlertMsg(`Visibility updated for "${entry.title || 'Entry'}"`);
      fetchEntries();
    } catch (e: any) {
      alert('Failed to update visibility: ' + e?.message);
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!selectedEntry) return;
    setActionLoading(true);
    try {
      await adminApi.diary.delete(selectedEntry.id || selectedEntry._id);
      setAlertMsg('Travel diary entry removed from community feed.');
      setDeleteModalOpen(false);
      setSelectedEntry(null);
      fetchEntries();
    } catch (e: any) {
      alert('Failed to delete entry: ' + e?.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Travel Diary & Community UGC Moderation
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Moderate community stories, enforce photo guidelines, and hide inappropriate travel posts.
          </p>
        </div>
      </div>

      {alertMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diary entries by title, location, or content keywords..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </form>
      </div>

      {/* Entries Grid */}
      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : entries.length === 0 ? (
        <AdminEmptyState
          title="No travel diary entries found"
          description="Traveller memories and experience posts will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <div
              key={entry.id || entry._id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-card transition flex flex-col justify-between"
            >
              <div>
                {/* Media Preview */}
                {entry.photos && entry.photos.length > 0 ? (
                  <div className="relative h-44 w-full bg-slate-900">
                    <img src={entry.photos[0]} alt="" className="w-full h-full object-cover" />
                    <span
                      className={`absolute top-3 right-3 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full backdrop-blur-md ${
                        entry.isPublic ? 'bg-emerald-500/90 text-white' : 'bg-slate-900/90 text-slate-200'
                      }`}
                    >
                      {entry.isPublic ? 'Public' : 'Hidden'}
                    </span>
                  </div>
                ) : (
                  <div className="h-28 bg-slate-100 flex items-center justify-center text-slate-400 p-4">
                    <span className="text-xs italic">Text-only experience post</span>
                  </div>
                )}

                {/* Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold">{entry.location || 'Unknown location'}</span>
                    <span>• {new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{entry.title || 'Untitled'}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{entry.content}</p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(entry)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                    entry.isPublic
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {entry.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {entry.isPublic ? 'Hide Post' : 'Show Post'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEntry(entry);
                    setDeleteModalOpen(true);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Remove Violating Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedEntry && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title={`Remove Post: ${selectedEntry.title || 'Diary Entry'}`}
          message="Confirm deletion of this user-generated content. This action will be recorded in the moderation audit log."
          confirmText="Delete Post"
          variant="danger"
          requireReason={true}
          reasonPlaceholder="Specify guideline violation reason..."
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

