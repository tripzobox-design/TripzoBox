import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Star,
  RefreshCw,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Clock,
  Sparkles
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminEmptyState, AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

interface TravelPkg {
  _id: string;
  id?: string;
  title: string;
  slug?: string;
  destination: string;
  state?: string;
  country: string;
  durationDays: number;
  durationNights: number;
  price: number;
  discountPrice?: number;
  coverImageUrl: string;
  galleryImages?: string[];
  description: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  maxBookings?: number;
  currentBookings?: number;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export const AdminPackagesPage: React.FC = () => {
  const { hasPermission } = useAdminAuth();
  const canEdit = hasPermission('canManageContent');

  const [packages, setPackages] = useState<TravelPkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured'>('all');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<TravelPkg | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete modal
  const [deletePkgId, setDeletePkgId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    state: '',
    country: 'India',
    durationDays: 3,
    durationNights: 2,
    price: 9999,
    discountPrice: 7999,
    coverImageUrl: '',
    description: '',
    highlights: '',
    inclusions: '',
    exclusions: '',
    maxBookings: 20,
    status: 'published' as 'published' | 'draft' | 'archived',
    featured: false,
  });

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await adminApi.packages.getAll();
      setPackages(data as TravelPkg[]);
    } catch (err: any) {
      console.error('Failed to load travel packages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setFormData({
      title: '',
      destination: '',
      state: '',
      country: 'India',
      durationDays: 3,
      durationNights: 2,
      price: 9999,
      discountPrice: 7999,
      coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      description: '',
      highlights: 'Scenic Trekking, Bonfire Night, Local Cuisine, Guided Tour',
      inclusions: 'Accommodation, Breakfast & Dinner, Sightseeing transfers, Tour guide',
      exclusions: 'Personal expenses, Flight/train tickets, Travel insurance',
      maxBookings: 20,
      status: 'published',
      featured: false,
    });
    setErrorMsg('');
    setIsEditorOpen(true);
  };

  const openEditModal = (pkg: TravelPkg) => {
    setEditingPkg(pkg);
    setFormData({
      title: pkg.title || '',
      destination: pkg.destination || '',
      state: pkg.state || '',
      country: pkg.country || 'India',
      durationDays: pkg.durationDays || 3,
      durationNights: pkg.durationNights || 2,
      price: pkg.price || 0,
      discountPrice: pkg.discountPrice || 0,
      coverImageUrl: pkg.coverImageUrl || '',
      description: pkg.description || '',
      highlights: (pkg.highlights || []).join(', '),
      inclusions: (pkg.inclusions || []).join(', '),
      exclusions: (pkg.exclusions || []).join(', '),
      maxBookings: pkg.maxBookings || 20,
      status: pkg.status || 'draft',
      featured: !!pkg.featured,
    });
    setErrorMsg('');
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.destination || !formData.coverImageUrl || !formData.description) {
      setErrorMsg('Please fill in all required fields (Title, Destination, Cover Image, and Description).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      ...formData,
      highlights: formData.highlights.split(',').map((s) => s.trim()).filter(Boolean),
      inclusions: formData.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
      exclusions: formData.exclusions.split(',').map((s) => s.trim()).filter(Boolean),
    };

    try {
      if (editingPkg) {
        await adminApi.packages.update(editingPkg._id, payload);
      } else {
        await adminApi.packages.create(payload);
      }
      setIsEditorOpen(false);
      await loadPackages();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save travel package.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reason: string) => {
    if (!deletePkgId) return;
    setIsDeleting(true);
    try {
      await adminApi.packages.delete(deletePkgId);
      setPackages((prev) => prev.filter((p) => p._id !== deletePkgId));
      setDeletePkgId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete package');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFeatured = async (pkg: TravelPkg) => {
    if (!canEdit) return;
    try {
      await adminApi.packages.update(pkg._id, { featured: !pkg.featured });
      setPackages((prev) =>
        prev.map((p) => (p._id === pkg._id ? { ...p, featured: !p.featured } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update featured flag');
    }
  };

  const toggleStatus = async (pkg: TravelPkg) => {
    if (!canEdit) return;
    const nextStatus = pkg.status === 'published' ? 'draft' : 'published';
    try {
      await adminApi.packages.update(pkg._id, { status: nextStatus });
      setPackages((prev) =>
        prev.map((p) => (p._id === pkg._id ? { ...p, status: nextStatus } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.state && pkg.state.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    const matchesFeatured = featuredFilter === 'all' || (featuredFilter === 'featured' && pkg.featured);

    return matchesSearch && matchesStatus && matchesFeatured;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-emerald-600" />
            Curated Travel Packages
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hand-crafted itineraries, seasonal holiday deals, pricing, and visibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPackages}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
            title="Refresh packages"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {canEdit && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              Create Package
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by package title, destination or state..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value as any)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Packages</option>
            <option value="featured">Featured Only</option>
          </select>
        </div>
      </div>

      {/* Packages Grid / List */}
      {loading ? (
        <AdminTableSkeleton rows={6} cols={5} />
      ) : filteredPackages.length === 0 ? (
        <AdminEmptyState
          title="No travel packages found"
          description={searchTerm ? "No packages match your search filter." : "Get started by publishing your first curated package."}
          actionText={canEdit && !searchTerm ? "Create Package" : undefined}
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg._id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Image Cover */}
                <div className="relative h-48 bg-gray-100 overflow-hidden group">
                  <img
                    src={pkg.coverImageUrl}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm ${
                        pkg.status === 'published'
                          ? 'bg-emerald-500 text-white'
                          : pkg.status === 'draft'
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      {pkg.status.toUpperCase()}
                    </span>

                    {pkg.featured && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-400 text-amber-950 shadow-sm">
                        <Sparkles className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-gray-800 shadow-sm">
                    {pkg.durationDays}D / {pkg.durationNights}N
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {pkg.destination}
                      {pkg.state ? `, ${pkg.state}` : ''}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-2">
                    {pkg.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Pricing and Bookings */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{pkg.discountPrice ? pkg.discountPrice.toLocaleString() : pkg.price.toLocaleString()}
                    </span>
                    {pkg.discountPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{pkg.price.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">/ person</span>
                  </div>

                  {/* Highlights Pill */}
                  {pkg.highlights && pkg.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {pkg.highlights.slice(0, 3).map((h, i) => (
                        <span key={i} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {h}
                        </span>
                      ))}
                      {pkg.highlights.length > 3 && (
                        <span className="text-[11px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">
                          +{pkg.highlights.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(pkg)}
                    disabled={!canEdit}
                    className={`font-medium ${
                      pkg.status === 'published' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    {pkg.status === 'published' ? 'Set as Draft' : 'Publish'}
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={() => toggleFeatured(pkg)}
                    disabled={!canEdit}
                    className="text-gray-500 hover:text-amber-600 font-medium"
                  >
                    {pkg.featured ? 'Unfeature' : 'Feature'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="p-1.5 rounded hover:bg-white text-gray-600 hover:text-emerald-600 border border-transparent hover:border-gray-200 transition"
                      title="Edit package"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => setDeletePkgId(pkg._id)}
                      className="p-1.5 rounded hover:bg-white text-gray-400 hover:text-rose-600 border border-transparent hover:border-gray-200 transition"
                      title="Delete package"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Package Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl my-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {editingPkg ? 'Edit Travel Package' : 'Create New Travel Package'}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Fill in package itinerary details, pricing, cover image, and inclusions.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Package Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 5-Day Magical Manali & Rohtang Pass Getaway"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Manali"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    State / Region
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Himachal Pradesh"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Duration (Nights) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.durationNights}
                    onChange={(e) => setFormData({ ...formData, durationNights: Number(e.target.value) })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Discounted Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cover Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide an overview of this travel experience..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Highlights (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.highlights}
                    onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                    placeholder="Paragliding in Solang, Camping under Stars, Atal Tunnel Drive"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Inclusions (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.inclusions}
                    onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                    placeholder="Hotel Stay, Breakfast, SUV Transfers, Permits"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Exclusions (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.exclusions}
                    onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                    placeholder="Airfare, Personal shopping, Tip"
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featuredCheckbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="featuredCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Feature on Homepage Showcase
                  </label>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingPkg ? 'Update Package' : 'Publish Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(deletePkgId)}
        title="Delete Travel Package"
        message="Are you sure you want to delete this travel package? It will no longer be visible to travellers on TripzoBox."
        confirmText="Delete Package"
        variant="danger"
        requireReason={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeletePkgId(null)}
      />
    </div>
  );
};
