import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminDestinationsPage: React.FC = () => {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal / Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    category: 'Mountains',
    imageUrl: '',
    shortDescription: '',
    longDescription: '',
    bestTimeToVisit: '',
    topAttractions: '',
    isHiddenSpot: false,
    isPublic: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await adminApi.destinations.getAll({
        page,
        limit: 10,
        search,
        category: categoryFilter,
      });
      setDestinations(Array.isArray(res?.destinations) ? res.destinations : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      setAlertMsg('Failed to load destinations: ' + e?.message);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [page, categoryFilter]);

  const handleOpenCreate = () => {
    setEditingDest(null);
    setFormData({
      name: '',
      state: '',
      category: 'Mountains',
      imageUrl: '',
      shortDescription: '',
      longDescription: '',
      bestTimeToVisit: '',
      topAttractions: '',
      isHiddenSpot: false,
      isPublic: true,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (dest: any) => {
    setEditingDest(dest);
    setFormData({
      name: dest.name || '',
      state: dest.state || '',
      category: dest.category || 'Mountains',
      imageUrl: dest.imageUrl || '',
      shortDescription: dest.shortDescription || '',
      longDescription: dest.longDescription || '',
      bestTimeToVisit: dest.bestTimeToVisit || '',
      topAttractions: Array.isArray(dest.topAttractions) ? dest.topAttractions.join(', ') : '',
      isHiddenSpot: Boolean(dest.isHiddenSpot),
      isPublic: dest.isPublic !== false,
    });
    setIsEditorOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        topAttractions: formData.topAttractions
          ? formData.topAttractions.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingDest) {
        await adminApi.destinations.update(editingDest.id || editingDest._id, payload);
        setAlertMsg(`Destination "${formData.name}" updated successfully.`);
      } else {
        await adminApi.destinations.create(payload);
        setAlertMsg(`Destination "${formData.name}" added to explore catalog.`);
      }
      setIsEditorOpen(false);
      fetchDestinations();
    } catch (err: any) {
      alert('Failed to save destination: ' + err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminApi.destinations.delete(deleteTarget.id || deleteTarget._id);
      setAlertMsg(`Destination "${deleteTarget.name}" removed from catalog.`);
      setDeleteTarget(null);
      fetchDestinations();
    } catch (err: any) {
      alert('Failed to delete: ' + err?.message);
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
            Destinations & Explore Guide CMS
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Publish secret spots, maintain travel guides, and curate top regional attractions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Destination
        </button>
      </div>

      {alertMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchDestinations();
              }
            }}
            placeholder="Search destinations by name or state..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
        >
          <option value="">All Categories</option>
          <option value="Mountains">Mountains</option>
          <option value="Beaches">Beaches</option>
          <option value="Cities">Cities</option>
          <option value="Culture">Culture</option>
          <option value="Nature">Nature</option>
          <option value="Hidden Spots">Hidden Spots</option>
        </select>
      </div>

      {/* Destinations Table */}
      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : destinations.length === 0 ? (
        <AdminEmptyState
          title="No destinations found"
          description="Click 'Add Destination' to author your first guide entry."
          actionText="Add Destination"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Hidden Spot</th>
                  <th className="py-3.5 px-4">Public Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {destinations.map((d) => (
                  <tr key={d.id || d._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={d.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80'}
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{d.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{d.shortDescription}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">{d.state}</td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {d.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {d.isHiddenSpot ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Hidden Gem 🌿
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {d.isPublic ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition"
                          title="Edit Destination"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Destination"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal Drawer */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDest ? `Edit Destination: ${editingDest.name}` : 'Create New Destination'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Destination Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  >
                    <option value="Mountains">Mountains</option>
                    <option value="Beaches">Beaches</option>
                    <option value="Cities">Cities</option>
                    <option value="Culture">Culture</option>
                    <option value="Nature">Nature</option>
                    <option value="Hidden Spots">Hidden Spots</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Cover Image URL *</label>
                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Short Summary (Card Description) *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Top Attractions (Comma separated)</label>
                <input
                  type="text"
                  value={formData.topAttractions}
                  onChange={(e) => setFormData({ ...formData, topAttractions: e.target.value })}
                  placeholder="e.g. Athirappilly Falls, Chembra Peak, Banasura Dam"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHiddenSpot}
                    onChange={(e) => setFormData({ ...formData, isHiddenSpot: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Flag as Untouched / Hidden Spot</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Publish Immediately</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {actionLoading ? 'Saving...' : 'Save Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={`Remove Destination: ${deleteTarget.name}`}
          message="Are you sure you want to delete this destination guide? Any associated itineraries will remain intact."
          confirmText="Delete Destination"
          variant="danger"
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

