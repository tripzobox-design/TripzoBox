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
} from 'lucide-react';
import { VaultDocument } from '../../types';
import { Button } from '../ui/Button';

export interface DocumentRowProps {
  document: VaultDocument;
  onView: (doc: VaultDocument) => void;
  onDelete: (id: string) => void;
  onShare: (doc: VaultDocument) => void;
}

export const DocumentRow: React.FC<DocumentRowProps> = ({
  document,
  onView,
  onDelete,
  onShare,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getDocTypeBadge = (type: VaultDocument['type']) => {
    switch (type) {
      case 'Passport':
        return {
          icon: <FileText className="w-5 h-5 text-blue-600" />,
          bg: 'bg-blue-100',
        };
      case 'Aadhaar':
        return {
          icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-100',
        };
      case 'DrivingLicense':
        return {
          icon: <CreditCard className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-100',
        };
      case 'Insurance':
        return {
          icon: <Shield className="w-5 h-5 text-orange-600" />,
          bg: 'bg-orange-100',
        };
      case 'FlightTicket':
        return {
          icon: <Plane className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-100',
        };
      case 'HotelBooking':
        return {
          icon: <Building className="w-5 h-5 text-teal-600" />,
          bg: 'bg-teal-100',
        };
      default:
        return {
          icon: <FileText className="w-5 h-5 text-gray-600" />,
          bg: 'bg-gray-100',
        };
    }
  };

  const badge = getDocTypeBadge(document.type);

  return (
    <div className="relative flex items-center justify-between p-4 bg-white rounded-2xl border border-border/80 shadow-subtle hover:border-primary/40 hover:shadow-card transition-all duration-200">
      {/* Icon + Info */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl ${badge.bg} flex items-center justify-center shrink-0`}
        >
          {badge.icon}
        </div>
        <div className="min-w-0 text-left">
          <h4 className="text-sm sm:text-base font-semibold text-text truncate font-heading">
            {document.name}
          </h4>
          <p className="text-xs text-text-muted mt-0.5 truncate">
            {document.validTill
              ? `Valid till: ${document.validTill}`
              : document.referenceNumber || `Uploaded: ${document.uploadedAt}`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onView(document)}
          className="text-xs px-3 py-1.5 h-8 font-medium"
        >
          View
        </Button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-text-subtle hover:text-text hover:bg-light-bg transition-colors"
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
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-float border border-border py-1.5 z-30 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onView(document);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-light-bg hover:text-primary transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(document);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-light-bg hover:text-primary transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Securely
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(document.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
