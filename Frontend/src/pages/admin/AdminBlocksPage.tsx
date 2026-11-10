import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserX, Search, Trash2, CheckCircle2, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminBlocksPage: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await adminApi.safety.getBlocks({ page, limit: 10 });
      setBlocks(Array.isArray(res?.blocks) ? res.blocks : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalCount(res?.pagination?.total || 0);
    } catch (e: any) {
      setMsg('Failed to load user blocks: ' + e?.message);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [page]);

  const handleUnblock = async () => {
    if (!selectedBlockId) return;
    setActionLoading(true);
    try {
      await adminApi.safety.unblockUser(selectedBlockId);
      setMsg('User block removed successfully.');
      setSelectedBlockId(null);
      fetchBlocks();
    } catch (e: any) {
      alert('Failed to remove block: ' + e?.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          User Block & Safety Restrictions
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Inspect peer-to-peer blocks placed between travellers and manage unblock appeals.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : blocks.length === 0 ? (
        <AdminEmptyState
          title="No blocked accounts"
          description="Peer-to-peer user blocks recorded on TripzoBox will be displayed here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Initiating User</th>
                  <th className="py-3.5 px-4">Blocked Target User</th>
                  <th className="py-3.5 px-4">Reason Recorded</th>
                  <th className="py-3.5 px-4">Blocked At</th>
                  <th className="py-3.5 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {blocks.map((b) => (
                  <tr key={b.id || b._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <Link to={`/admin/users/${b.userId}`} className="font-bold text-slate-900 hover:text-emerald-700">
                        {b.userName || b.userId}
                      </Link>
                      <p className="text-[10px] text-slate-400">ID: {b.userId}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <Link to={`/admin/users/${b.targetUserId}`} className="font-bold text-red-700 hover:underline">
                        {b.targetUserName || b.targetUserId}
                      </Link>
                      <p className="text-[10px] text-slate-400">Target ID: {b.targetUserId}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 italic">
                      "{b.reason || 'Personal safety boundary'}"
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBlockId(b.id || b._id)}
                        className="px-3 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Remove Block
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedBlockId && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setSelectedBlockId(null)}
          onConfirm={handleUnblock}
          title="Remove User Block"
          message="Are you sure you want to lift this user-to-user communication restriction?"
          confirmText="Remove Block"
          variant="warning"
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

