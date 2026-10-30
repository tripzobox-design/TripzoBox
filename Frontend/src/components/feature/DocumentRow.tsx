import React, { useState } from 'react';
import {
  FileText,
  CreditCard,
  Shield,
  Plane,
  Building,
  MoreVertical,
  Eye,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { VaultDocument } from '../../types';

export interface DocumentRowProps {
  document: VaultDocument;
  onView: (doc: VaultDocument) => void;
  onEdit?: (doc: VaultDocument) => void;
  onDelete: (id: string) => void;
  onShare: (doc: VaultDocument) => void;
}

export const DocumentRow: React.FC<DocumentRowProps> = ({
  document,
  onView,
  onEdit,
  onDelete,
  onShare,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getDocTypeIcon = (type: VaultDocument['type']) => {
    switch (type) {
      case 'Passport':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'Aadhaar':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'DrivingLicense':
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      case 'Insurance':
        return <Shield className="w-5 h-5 text-orange-600" />;
      case 'FlightTicket':
        return <Plane className="w-5 h-5 text-amber-600" />;
      case 'HotelBooking':
        return <Building className="w-5 h-5 text-teal-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const isVerified = document.isVerified ?? true;

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500/40 hover:shadow-2xs transition-all duration-200 gap-3">
      {/* Left: Thumbnail & Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Document Thumbnail / Icon */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200/80 shrink-0 flex items-center justify-center">
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt={document.name}
              className="w-full h-full object-cover"
            />
          ) : (
            getDocTypeIcon(document.type)
          )}
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0 text-left">
          <h4 className="text-sm font-bold text-gray-900 truncate font-heading">
            {document.name}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {document.referenceNumber || document.type}{' '}
            {document.validTill && (
              <>
                <span className="text-gray-300 mx-1">•</span>
                <span>Expires {document.validTill}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Middle: Verified Badge & Upload Date */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 pl-15 sm:pl-0">
        {/* Status Badge */}
        {isVerified ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            <span>Verified</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
            <span>Not Verified</span>
          </span>
        )}

        {/* Upload Date */}
        <span className="text-xs text-gray-400 hidden md:inline-block min-w-[110px] text-right">
          Uploaded {document.uploadedAt}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* View Icon Button */}
          <button
            type="button"
            onClick={() => onView(document)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            title="View document"
            aria-label="View document"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit Icon Button */}
          <button
            type="button"
            onClick={() => onEdit?.(document)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            title="Edit details"
            aria-label="Edit details"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-30 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onView(document);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Original</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onShare(document);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-emerald-700 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(document.id);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
