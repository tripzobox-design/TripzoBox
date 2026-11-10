import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { MediaFileItem } from '../../types/admin';
import { AdminConfirmModal } from '../../components/admin/AdminConfirmModal';
import { AdminTableSkeleton, AdminEmptyState } from '../../components/admin/AdminEmptyState';

export const AdminMediaPage: React.FC = () => {
  const [files, setFiles] = useState<MediaFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await adminApi.media.getAll();
      setFiles(data);
    } catch (e: any) {
      setFeedback('Failed to load media assets: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Only JPG, PNG, WebP, and GIF images are permitted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Maximum allowable file size is 10MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await adminApi.media.upload(file);
      setFeedback(`File "${res.filename}" uploaded successfully!`);
      fetchFiles();
    } catch (err: any) {
      alert('Upload failed: ' + err?.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminApi.media.delete(deleteTarget);
      setFeedback(`File "${deleteTarget}" deleted.`);
      setDeleteTarget(null);
      fetchFiles();
    } catch (err: any) {
      alert('Failed to delete file: ' + err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Media Asset Library
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Upload, preview, and securely manage images for hero banners, destinations, and packages.
          </p>
        </div>

        {/* Upload Trigger Button */}
        <label className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto">
          <UploadCloud className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <AdminTableSkeleton rows={6} />
      ) : files.length === 0 ? (
        <AdminEmptyState
          title="No uploaded media assets found"
          description="Upload JPEG, PNG, or WebP images to generate asset URLs for CMS pages."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.filename}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-card transition flex flex-col group"
            >
              <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={file.url}
                  alt={file.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <button
                  type="button"
                  onClick={() => setDeleteTarget(file.filename)}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/80 text-white hover:bg-red-600 transition opacity-0 group-hover:opacity-100 shadow"
                  title="Delete Media File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800 truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatBytes(file.size)} • {file.mimeType.split('/')[1]?.toUpperCase()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(file.url)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition mt-2"
                >
                  {copiedUrl === file.url ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Asset URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <AdminConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          title={`Delete File: ${deleteTarget}`}
          message="Are you sure you want to delete this media file from disk? Any pages or trips referencing this URL will fail to load the image."
          confirmText="Delete File"
          variant="danger"
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

