import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield,
  FileText,
  PhoneCall,
  Users,
  Lock,
  Plus,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Download,
  Calendar,
  CreditCard,
  Plane,
  Building,
  HeartPulse,
  Folder,
  X,
  ChevronRight,
  Smartphone,
  ExternalLink,
  LifeBuoy,
  ShieldCheck,
  Info,
  Clock,
  Compass,
  MessageSquare,
  Settings as SettingsIcon,
  HelpCircle,
  Globe,
  Loader2,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DocumentRow } from '../components/feature/DocumentRow';
import { VaultFileViewer } from '../components/feature/VaultFileViewer';
import { DocumentOtpModal } from '../components/feature/DocumentOtpModal';
import { Modal } from '../components/ui/Modal';
import { Logo } from '../components/ui/Logo';
import {
  VaultDocument,
  SharedAccessRecord,
  TripzoBoxVaultContact,
  SharedWithMeItem,
} from '../types';
import { confirmAction } from '../lib/confirmAction';
import { vaultApi } from '../lib/api';
import { validateVaultFile } from '../lib/vaultFiles';

type VaultView =
  | 'dashboard' // Screen 1
  | 'add-category' // Screen 2
  | 'add-details' // Screen 3
  | 'documents' // Screen 4
  | 'share' // Screen 5
  | 'shared' // Screen 6
  | 'emergency' // Screen 7
  | 'emergency-edit' // Screen 8
  | 'security' // Screen 9
  | 'emergency-view'; // Screen 10

const CATEGORIES = [
  {
    id: 'Passport',
    name: 'Passport',
    desc: 'Passport & travel docs',
    icon: FileText,
    type: 'Passport' as const,
  },
  {
    id: 'ID Card',
    name: 'ID Card',
    desc: 'Government issued ID',
    icon: CreditCard,
    type: 'Aadhaar' as const,
  },
  {
    id: 'Tickets & Bookings',
    name: 'Tickets & Bookings',
    desc: 'Flights, trains, hotels',
    icon: Plane,
    type: 'FlightTicket' as const,
  },
  {
    id: 'Insurance',
    name: 'Insurance',
    desc: 'Travel & health insurance',
    icon: HeartPulse,
    type: 'Insurance' as const,
  },
  {
    id: 'Emergency Contacts',
    name: 'Emergency Contacts',
    desc: 'Important phone numbers',
    icon: PhoneCall,
    type: 'Other' as const,
  },
  {
    id: 'Other',
    name: 'Other',
    desc: 'Other important documents',
    icon: Folder,
    type: 'Other' as const,
  },
];

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'United Arab Emirates',
  'France',
  'Japan',
];

interface DocumentFieldSchema {
  defaultName: string;
  defaultNumber: string;
  defaultExpiry: string;
  nameLabel: string;
  namePlaceholder: string;
  countryLabel: string;
  numberLabel: string;
  numberPlaceholder: string;
  numberRequired: boolean;
  expiryLabel: string;
  expiryPlaceholder: string;
  allowLifetime: boolean;
  extraLabel: string;
  extraPlaceholder: string;
  subTypes?: Array<{ label: string; docType: VaultDocument['type'] }>;
}

const DOCUMENT_FIELD_SCHEMAS: Record<string, DocumentFieldSchema> = {
  Passport: {
    defaultName: 'Indian Passport',
    defaultNumber: '',
    defaultExpiry: '',
    nameLabel: 'Passport Name / Label *',
    namePlaceholder: 'e.g. Indian Passport',
    countryLabel: 'Nationality / Issuing Country *',
    numberLabel: 'Passport Number *',
    numberPlaceholder: 'e.g. R21234567',
    numberRequired: true,
    expiryLabel: 'Passport Expiry Date *',
    expiryPlaceholder: 'e.g. 17 May 2030',
    allowLifetime: false,
    extraLabel: 'Place of Issue (Optional)',
    extraPlaceholder: 'e.g. RPO Bengaluru',
  },
  'ID Card': {
    defaultName: 'Aadhaar Card',
    defaultNumber: '',
    defaultExpiry: 'Lifetime',
    nameLabel: 'ID Card Type / Name *',
    namePlaceholder: 'e.g. Aadhaar Card, Driving License, College ID',
    countryLabel: 'Issuing Country *',
    numberLabel: 'ID / Card Number *',
    numberPlaceholder: 'e.g. XXXX-XXXX-9214 or ID No.',
    numberRequired: true,
    expiryLabel: 'Validity / Expiry Date',
    expiryPlaceholder: 'e.g. Lifetime or 31 Dec 2032',
    allowLifetime: true,
    extraLabel: 'Issuing Authority / Organization (Optional)',
    extraPlaceholder: 'e.g. UIDAI / Transport Authority / University',
    subTypes: [
      { label: 'Aadhaar Card', docType: 'Aadhaar' },
      { label: 'Driving License', docType: 'DrivingLicense' },
      { label: 'Voter ID', docType: 'Aadhaar' },
      { label: 'PAN Card', docType: 'Aadhaar' },
      { label: 'College / Work ID', docType: 'Other' },
      { label: 'National ID', docType: 'Aadhaar' },
    ],
  },
  'Tickets & Bookings': {
    defaultName: 'Flight Ticket (Bengaluru → Delhi)',
    defaultNumber: '',
    defaultExpiry: '',
    nameLabel: 'Ticket / Booking Name *',
    namePlaceholder: 'e.g. IndiGo 6E-217 Bengaluru → Delhi',
    countryLabel: 'Destination Country *',
    numberLabel: 'PNR / Booking Reference Number *',
    numberPlaceholder: 'e.g. PNR XK92LM or BKG-8841',
    numberRequired: true,
    expiryLabel: 'Travel / Check-out Date *',
    expiryPlaceholder: 'e.g. 15 Oct 2026',
    allowLifetime: false,
    extraLabel: 'Airline / Hotel / Route (Optional)',
    extraPlaceholder: 'e.g. IndiGo 6E-217 • BLR → DEL',
    subTypes: [
      { label: 'Flight Ticket', docType: 'FlightTicket' },
      { label: 'Hotel Booking', docType: 'HotelBooking' },
      { label: 'Train / Bus Ticket', docType: 'FlightTicket' },
    ],
  },
  Insurance: {
    defaultName: 'Travel Insurance Policy',
    defaultNumber: '',
    defaultExpiry: '',
    nameLabel: 'Insurance Plan Name *',
    namePlaceholder: 'e.g. Comprehensive Travel Insurance',
    countryLabel: 'Coverage Country / Region *',
    numberLabel: 'Policy Number *',
    numberPlaceholder: 'e.g. POL-2026-4567',
    numberRequired: true,
    expiryLabel: 'Policy Expiry Date *',
    expiryPlaceholder: 'e.g. 25 Dec 2026',
    allowLifetime: false,
    extraLabel: 'Insurance Provider (Optional)',
    extraPlaceholder: 'e.g. HDFC Ergo / ICICI Lombard',
  },
  'Emergency Contacts': {
    defaultName: 'Emergency Contact & Medical Card',
    defaultNumber: '',
    defaultExpiry: 'Ongoing',
    nameLabel: 'Emergency Document Title *',
    namePlaceholder: 'e.g. ICE Family Contact & Blood Group Card',
    countryLabel: 'Country / Region *',
    numberLabel: 'Emergency Phone / Contact Reference *',
    numberPlaceholder: 'e.g. +91 98765 43210 • Blood Group O+',
    numberRequired: true,
    expiryLabel: 'Valid Until',
    expiryPlaceholder: 'e.g. Ongoing / Lifetime',
    allowLifetime: true,
    extraLabel: 'Relationship / Medical Notes (Optional)',
    extraPlaceholder: 'e.g. Mother • No known allergies',
  },
  Other: {
    defaultName: 'Travel Document',
    defaultNumber: '',
    defaultExpiry: 'No Expiry',
    nameLabel: 'Document Title *',
    namePlaceholder: 'e.g. Trekking Permit, Visa, Vaccination Certificate',
    countryLabel: 'Issuing Country *',
    numberLabel: 'Reference / Certificate Number',
    numberPlaceholder: 'e.g. CERT-2026-101',
    numberRequired: false,
    expiryLabel: 'Valid Till / Expiry',
    expiryPlaceholder: 'e.g. No Expiry or 31 Dec 2026',
    allowLifetime: true,
    extraLabel: 'Issuing Authority / Purpose (Optional)',
    extraPlaceholder: 'e.g. Forest Dept / Embassy',
  },
};

const inferCategoryFromDoc = (doc: VaultDocument): string => {
  if (doc.category && DOCUMENT_FIELD_SCHEMAS[doc.category]) return doc.category;
  if (doc.type === 'Passport') return 'Passport';
  if (doc.type === 'Aadhaar' || doc.type === 'DrivingLicense') return 'ID Card';
  if (doc.type === 'FlightTicket' || doc.type === 'HotelBooking') return 'Tickets & Bookings';
  if (doc.type === 'Insurance') return 'Insurance';
  return 'Other';
};

export const TravelVaultPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    documents,
    emergencyContacts,
    trustedContacts,
    sharedAccessRecords,
    sharedWithMe,
    emergencyAccessConfig,
    securitySettings,
    addDocument,
    addDocumentWithFile,
    attachDocumentFile,
    updateDocument,
    deleteDocument,
    addSharedAccess,
    revokeSharedAccess,
    refreshSharedWithMe,
    updateEmergencyAccessConfig,
    updateSecuritySettings,
  } = useVault();

  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Active View (default 'dashboard' or via query param)
  const initialView = (searchParams.get('view') as VaultView) || 'dashboard';
  const [currentView, setCurrentView] = useState<VaultView>(initialView);

  const setView = (view: VaultView) => {
    setCurrentView(view);
    setSearchParams(view === 'dashboard' ? {} : { view });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals & Viewers
  const [selectedDocForViewer, setSelectedDocForViewer] = useState<VaultDocument | null>(null);
  const [viewerSharedItem, setViewerSharedItem] = useState<SharedWithMeItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [devicesModalOpen, setDevicesModalOpen] = useState(false);

  // Screen 2 & 3: Add Document State
  const [selectedCategory, setSelectedCategory] = useState<string>('Passport');
  const [selectedDocTypeOverride, setSelectedDocTypeOverride] = useState<
    VaultDocument['type'] | null
  >(null);
  const [docName, setDocName] = useState('Indian Passport');
  const [issuingCountry, setIssuingCountry] = useState('India');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [docExtraDetail, setDocExtraDetail] = useState('');
  const [docVisibility, setDocVisibility] = useState<VaultDocument['visibility']>('private');
  const [inlineShareContacts, setInlineShareContacts] = useState<TripzoBoxVaultContact[]>([]);
  const [inlineContactSearch, setInlineContactSearch] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileMime, setUploadedFileMime] = useState<string>('');
  const [savingDocBusy, setSavingDocBusy] = useState(false);

  // Screen 4: Documents filter & search state
  const [docSearch, setDocSearch] = useState('');
  const [selectedDocFilter, setSelectedDocFilter] = useState('All');

  // Screen 5: Share Document State (Real registered TripzoBox accounts)
  const [shareDoc, setShareDoc] = useState<VaultDocument | null>(documents[0] || null);
  const [selectedRecipients, setSelectedRecipients] = useState<TripzoBoxVaultContact[]>([]);
  const [eligibleContacts, setEligibleContacts] = useState<TripzoBoxVaultContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [accessDuration, setAccessDuration] = useState('Until trip end');
  const [permissionView, setPermissionView] = useState(true);
  const [permissionDownload, setPermissionDownload] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');

  // Screen 6: Shared Access Tab
  const [sharedTab, setSharedTab] = useState<'active' | 'received'>('active');

  // Screen 8: Emergency Access Edit State
  const [emergencyDocs, setEmergencyDocs] = useState<string[]>([
    'ID Card',
    'Passport',
    'Flight Tickets',
    'Travel Insurance',
  ]);
  const [emergencyPrimary, setEmergencyPrimary] = useState(
    emergencyAccessConfig.primaryContact || ''
  );
  const [emergencySecondary, setEmergencySecondary] = useState(
    emergencyAccessConfig.secondaryContact || ''
  );

  React.useEffect(() => {
    setEmergencyPrimary(emergencyAccessConfig.primaryContact || '');
    setEmergencySecondary(emergencyAccessConfig.secondaryContact || '');
  }, [emergencyAccessConfig.primaryContact, emergencyAccessConfig.secondaryContact]);

  // Screen 9: Security Settings State
  const [twoFactor, setTwoFactor] = useState(securitySettings.twoFactorEnabled);
  const [autoLock, setAutoLock] = useState(securitySettings.autoLockTime);

  // Document Editing
  const [editingDoc, setEditingDoc] = useState<VaultDocument | null>(null);

  // Active schema matching the selected document category
  const activeSchema = DOCUMENT_FIELD_SCHEMAS[selectedCategory] || DOCUMENT_FIELD_SCHEMAS.Other;

  // Load real TripzoBox account contacts for Share / Online Visibility selection
  React.useEffect(() => {
    if (currentView !== 'share' && currentView !== 'add-details') return;
    const query = currentView === 'share' ? peopleSearch : inlineContactSearch;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoadingContacts(true);
      vaultApi
        .searchEligibleContacts(query)
        .then((list) => {
          if (!cancelled && Array.isArray(list)) {
            setEligibleContacts(list);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadingContacts(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentView, peopleSearch, inlineContactSearch]);

  React.useEffect(() => {
    if (currentView === 'shared') {
      void refreshSharedWithMe();
    }
  }, [currentView]);

  // Handlers for Add Document
  const handleSelectCategory = (catName: string) => {
    const schema = DOCUMENT_FIELD_SCHEMAS[catName] || DOCUMENT_FIELD_SCHEMAS.Other;
    const catMeta = CATEGORIES.find((c) => c.name === catName);
    setSelectedCategory(catName);
    setSelectedDocTypeOverride(catMeta ? catMeta.type : null);
    setDocName(schema.defaultName);
    setDocNumber(schema.defaultNumber);
    setExpiryDate(schema.defaultExpiry);
    setDocExtraDetail('');
    setSelectedUploadFile(null);
    setUploadedFileName('');
    setUploadedFileMime('');
    setUploadedPreviewUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateVaultFile(file);
    } catch (err: any) {
      toastError(err?.message || 'Unsupported document file');
      e.target.value = '';
      return;
    }

    setSelectedUploadFile(file);
    setUploadedFileName(file.name);
    setUploadedFileMime(file.type);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedPreviewUrl('');
    }
  };

  // Document OTP Verification State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [pendingDocData, setPendingDocData] = useState<{
    name: string;
    type: VaultDocument['type'];
    category: string;
    referenceNumber?: string;
    validTill?: string;
    issuingCountry?: string;
    thumbnailUrl?: string;
    details?: Record<string, string>;
    visibility: VaultDocument['visibility'];
    existingDocId?: string;
  } | null>(null);

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toastError('Please enter a document name');
      return;
    }
    if (docVisibility === 'trusted-contacts' && inlineShareContacts.length === 0 && !editingDoc) {
      toastError('Select at least one TripzoBox contact or switch visibility to Only Me');
      return;
    }

    const catObj = CATEGORIES.find((c) => c.name === selectedCategory);
    const resolvedType = selectedDocTypeOverride || (catObj ? catObj.type : 'Other');
    const detailsPayload: Record<string, string> = {};
    if (docExtraDetail.trim()) {
      detailsPayload.issuingAuthority = docExtraDetail.trim();
    }
    if (selectedCategory === 'ID Card' && docName.trim()) {
      detailsPayload.idSubType = docName.trim();
    }

    setPendingDocData({
      name: docName.trim(),
      type: resolvedType,
      category: selectedCategory,
      referenceNumber: docNumber.trim() || undefined,
      validTill: expiryDate.trim() || undefined,
      issuingCountry,
      thumbnailUrl: uploadedPreviewUrl || undefined,
      details: detailsPayload,
      visibility: inlineShareContacts.length > 0 ? 'trusted-contacts' : docVisibility,
      existingDocId: editingDoc?.id,
    });

    // Open OTP Verification Modal
    setIsOtpModalOpen(true);
  };

  const commitPendingDocument = async (verified: boolean) => {
    if (!pendingDocData) return;
    setSavingDocBusy(true);
    try {
      let savedDoc: VaultDocument;
      if (pendingDocData.existingDocId) {
        await updateDocument(pendingDocData.existingDocId, {
          name: pendingDocData.name,
          type: pendingDocData.type,
          category: pendingDocData.category,
          referenceNumber: pendingDocData.referenceNumber,
          validTill: pendingDocData.validTill,
          issuingCountry: pendingDocData.issuingCountry,
          thumbnailUrl: pendingDocData.thumbnailUrl,
          details: pendingDocData.details,
          visibility: pendingDocData.visibility,
          isVerified: verified,
        });
        if (selectedUploadFile) {
          await attachDocumentFile(pendingDocData.existingDocId, selectedUploadFile);
        }
        savedDoc =
          documents.find((d) => d.id === pendingDocData.existingDocId) ||
          ({
            ...pendingDocData,
            id: pendingDocData.existingDocId,
            uploadedAt: 'Just now',
          } as VaultDocument);
      } else if (selectedUploadFile) {
        savedDoc = await addDocumentWithFile(
          {
            name: pendingDocData.name,
            type: pendingDocData.type,
            category: pendingDocData.category,
            referenceNumber: pendingDocData.referenceNumber,
            validTill: pendingDocData.validTill,
            issuingCountry: pendingDocData.issuingCountry,
            thumbnailUrl: pendingDocData.thumbnailUrl,
            details: pendingDocData.details,
            isVerified: verified,
            visibility: pendingDocData.visibility,
          },
          selectedUploadFile
        );
      } else {
        savedDoc = await addDocument({
          name: pendingDocData.name,
          type: pendingDocData.type,
          category: pendingDocData.category,
          referenceNumber: pendingDocData.referenceNumber,
          validTill: pendingDocData.validTill,
          issuingCountry: pendingDocData.issuingCountry,
          thumbnailUrl: pendingDocData.thumbnailUrl,
          details: pendingDocData.details,
          isVerified: verified,
          visibility: pendingDocData.visibility,
        });
      }

      if (inlineShareContacts.length > 0 && savedDoc?.id) {
        await Promise.all(
          inlineShareContacts.map((recipient) =>
            addSharedAccess({
              documentId: savedDoc.id,
              documentName: savedDoc.name,
              documentType: savedDoc.type,
              sharedWithUserId: recipient.id,
              sharedWithUsername: recipient.username,
              sharedWithName: recipient.name,
              sharedWithAvatar: recipient.avatarUrl,
              sharedWithRole: recipient.role,
              permission: 'View',
              expires: 'Until trip end',
            }).catch(() => null)
          )
        );
      }

      if (verified) {
        success(
          inlineShareContacts.length > 0
            ? `${pendingDocData.name} verified, synced online, and shared with ${inlineShareContacts.map((c) => c.name).join(', ')}!`
            : `${pendingDocData.name} verified and synced online to your Travel Vault!`,
          'Document Secured'
        );
      } else {
        success(
          `${pendingDocData.name} saved to your online vault. You can verify it anytime via OTP.`,
          'Document Stored'
        );
      }

      setPendingDocData(null);
      setIsOtpModalOpen(false);
      setEditingDoc(null);
      setSelectedUploadFile(null);
      setUploadedFileName('');
      setUploadedFileMime('');
      setInlineShareContacts([]);
      setDocVisibility('private');
      setView('documents');
    } catch (err: any) {
      toastError(err?.message || 'Could not save document. Please try again.');
    } finally {
      setSavingDocBusy(false);
    }
  };

  const handleOtpVerified = () => {
    void commitPendingDocument(true);
  };

  const handleSaveWithoutVerification = () => {
    void commitPendingDocument(false);
  };

  // Handlers for Sharing
  const handleOpenShare = (doc: VaultDocument) => {
    setShareDoc(doc);
    setSelectedRecipients([]);
    setPeopleSearch('');
    setView('share');
  };

  const handleConfirmShare = async () => {
    if (!shareDoc) {
      toastError('Please select a document to share');
      return;
    }
    if (selectedRecipients.length === 0) {
      toastError('Please select at least one TripzoBox contact to share with');
      return;
    }

    const permissionString: 'View' | 'View • Download' = permissionDownload
      ? 'View • Download'
      : 'View';

    setShareBusy(true);
    try {
      await Promise.all(
        selectedRecipients.map((person) =>
          addSharedAccess({
            documentId: shareDoc.id,
            documentName: shareDoc.name,
            documentType: shareDoc.type,
            sharedWithUserId: person.id,
            sharedWithUsername: person.username,
            sharedWithName: person.name,
            sharedWithAvatar: person.avatarUrl,
            sharedWithRole: person.role,
            permission: permissionString,
            expires: accessDuration,
          })
        )
      );

      success(
        `Shared ${shareDoc.name} online with ${selectedRecipients.map((p) => p.name).join(', ')} (${permissionString})`,
        'Access Granted'
      );
      setSharedTab('active');
      setView('shared');
    } catch (err: any) {
      toastError(err?.message || 'Unable to share document with selected contact(s).');
    } finally {
      setShareBusy(false);
    }
  };

  // Handlers for Emergency Access
  const handleSaveEmergencyDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencyAccessConfig({
      includedDocTypes: emergencyDocs,
      primaryContact: emergencyPrimary,
      secondaryContact: emergencySecondary,
    });
    success('Emergency Access settings updated successfully!', 'Emergency Ready');
    setView('emergency');
  };

  // Filtered documents for Screen 4
  const visibleDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search query
      if (docSearch.trim()) {
        const q = docSearch.toLowerCase();
        const matches =
          doc.name.toLowerCase().includes(q) ||
          doc.type.toLowerCase().includes(q) ||
          (doc.referenceNumber && doc.referenceNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      // Pill filter
      if (selectedDocFilter !== 'All') {
        if (selectedDocFilter === 'Passport' && doc.type !== 'Passport') return false;
        if (selectedDocFilter === 'ID Card' && doc.type !== 'Aadhaar' && doc.type !== 'DrivingLicense')
          return false;
        if (selectedDocFilter === 'Tickets' && doc.type !== 'FlightTicket' && doc.type !== 'HotelBooking')
          return false;
        if (selectedDocFilter === 'Insurance' && doc.type !== 'Insurance') return false;
        if (selectedDocFilter === 'Other' && doc.type !== 'Other') return false;
      }
      return true;
    });
  }, [documents, docSearch, selectedDocFilter]);

  // If in Screen 10 (Emergency Access - View When Needed), render dedicated full portal overlay
  if (currentView === 'emergency-view') {
    return (
      <div className="fixed inset-0 z-50 bg-[#07382B] text-white flex flex-col justify-between overflow-y-auto">
        {/* Top Bar with Brand & Close Button */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <Logo asLink to="/" size="md" variant="horizontal" inverted={true} />
          <button
            type="button"
            onClick={() => setView('emergency')}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close Emergency View"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Emergency Card (Matching Screen 10) */}
        <div className="w-full max-w-xl mx-auto px-4 py-8">
          <div className="bg-white text-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            {/* Top Shield Icon */}
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900">
                Emergency Access
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
                Here are your essential documents and contacts for quick access.
              </p>
            </div>

            {/* 3 Main Action Rows */}
            <div className="space-y-3 pt-2 text-left">
              {/* Row 1: View Documents */}
              <button
                type="button"
                onClick={() => setView('documents')}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-sm text-gray-900 group-hover:text-emerald-800 truncate">
                      View Documents
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">Passport, ID, Tickets, Insurance...</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-700 transition-colors shrink-0 ml-2" />
              </button>

              {/* Row 2: Emergency Contacts */}
              <div className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 space-y-3 text-left">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-sm text-gray-900 truncate">
                      Emergency Contacts
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">Family, friends, local emergency...</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                  {emergencyPrimary ? (
                    <a
                      href={`tel:${emergencyPrimary}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-xs font-semibold text-gray-800 transition-colors"
                    >
                      <span className="truncate">Primary: {emergencyPrimary}</span>
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setView('emergency-edit')}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-xs font-semibold text-gray-500 transition-colors cursor-pointer text-left"
                    >
                      <span className="truncate">Primary contact not set</span>
                      <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                    </button>
                  )}
                  <a
                    href="tel:112"
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition-colors"
                  >
                    <span className="truncate">Helpline: 112 (Police/Med)</span>
                    <PhoneCall className="w-3.5 h-3.5 text-red-600 shrink-0 ml-1.5" />
                  </a>
                </div>
              </div>

              {/* Row 3: Trip Itinerary */}
              <button
                type="button"
                onClick={() => navigate('/app/trips')}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h4 className="font-heading font-bold text-sm text-gray-900 group-hover:text-emerald-800 truncate">
                      Trip Itinerary
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">Flights, hotels, important notes...</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-700 transition-colors shrink-0 ml-2" />
              </button>
            </div>

            {/* Bottom Disclaimer */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>This information is available only for emergency use.</span>
            </div>

            <button
              type="button"
              onClick={() => setView('emergency')}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 hover:underline cursor-pointer block mx-auto pt-2"
            >
              Go Back
            </button>
          </div>
        </div>

        <div className="py-4 text-center text-xs text-emerald-200/80">
          Tripzobox Encrypted Travel Vault · Offline Safe
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto py-2 sm:py-6 px-3 sm:px-6 text-left space-y-6">
      {/* Main Content Area */}
      <main className="w-full space-y-6">
        {/* ===================================================================== */}
        {/* SCREEN 1: TRAVEL VAULT - DASHBOARD */}
        {/* ===================================================================== */}
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Panoramic Green Hero Banner */}
            <div className="relative rounded-3xl bg-[#0B543F] p-6 sm:p-8 text-white shadow-xs overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Background Scenic Landscape */}
              <div
                className="absolute inset-0 bg-cover bg-right opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B543F] via-[#0B543F]/90 to-transparent" />

              {/* Left Banner Content */}
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>
                <div>
                  <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                    Travel Vault
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-md">
                    Your essential travel documents, securely stored and always within reach.
                  </p>
                </div>
              </div>

              {/* Right Action Buttons in Banner */}
              <div className="relative z-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setView('add-category')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView('emergency-view')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Emergency View</span>
                </button>
              </div>
            </div>

            {/* 4 Feature Action Cards (4-col on lg, 2-col on mobile & tablet) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
              {/* Card 1: My Documents */}
              <div
                onClick={() => setView('documents')}
                className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 p-3 sm:p-5 hover:border-emerald-500/60 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100/70 text-emerald-800">
                    {documents.length} Files
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors leading-snug">
                    My Documents
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
                    Manage passports, visas, tickets & bookings
                  </p>
                </div>
              </div>

              {/* Card 2: Emergency Info */}
              <div
                onClick={() => setView('emergency')}
                className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 p-3 sm:p-5 hover:border-emerald-500/60 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100/70 text-emerald-800">
                    {emergencyContacts.length} Contacts
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors leading-snug">
                    Emergency Info
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
                    Emergency contacts, medical notes & blood group
                  </p>
                </div>
              </div>

              {/* Card 3: Shared Access */}
              <div
                onClick={() => setView('shared')}
                className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 p-3 sm:p-5 hover:border-emerald-500/60 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100/70 text-emerald-800">
                    {sharedAccessRecords.length} Shared{sharedWithMe.length > 0 ? ` · ${sharedWithMe.length} Received` : ''}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors leading-snug">
                    Shared Access
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
                    Share selected docs with trusted family & companions
                  </p>
                </div>
              </div>

              {/* Card 4: Security Settings */}
              <div
                onClick={() => setView('security')}
                className="group bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 p-3 sm:p-5 hover:border-emerald-500/60 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2.5 sm:mb-4">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100/70 text-emerald-800">
                    Protected
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xs sm:text-base text-gray-900 group-hover:text-primary transition-colors leading-snug">
                    Security Settings
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
                    Passcode lock, biometrics, trusted devices & recovery
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Secured Documents Section */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Secured Travel Documents
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Quick access to your travel credentials, passes and IDs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView('documents')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <span>View All ({documents.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {documents.length > 0 ? (
                  documents.slice(0, 4).map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      document={doc}
                      onView={(item) => {
                        setSelectedDocForViewer(item);
                        setIsViewerOpen(true);
                      }}
                      onShare={(item) => handleOpenShare(item)}
                      onDelete={async (id) => {
                        if (
                          !(await confirmAction(
                            'delete',
                            'this document from your secure vault'
                          ))
                        )
                          return;
                        deleteDocument(id);
                        success('Document removed from your vault.');
                      }}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 space-y-2.5">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">No documents in your vault yet</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Add your passport, ID card, tickets, or travel insurance to keep them safe offline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setView('add-category')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Document</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Trust & Security Banner */}
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4 flex items-center justify-between flex-wrap gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <span>
                  Zero-Knowledge Architecture: All records are AES-256 encrypted. Only you and designated trusted companions hold the decryption keys.
                </span>
              </div>
              <Link
                to="/safety"
                className="text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0"
              >
                Read Safety Guidelines &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 2: ADD DOCUMENT – CHOOSE CATEGORY */}
        {/* ===================================================================== */}
        {currentView === 'add-category' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-4 sm:p-8 shadow-xs space-y-4 sm:space-y-6 animate-in fade-in duration-200 text-left">
            {/* Header */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView('documents')}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-heading font-extrabold text-lg sm:text-2xl text-gray-900">
                  Add Document
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select the category for your document.
                </p>
              </div>
            </div>

            {/* 6 Category Cards Grid: 2 in a row on mobile, 3 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.name)}
                    className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[105px] sm:min-h-[140px] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600/30'
                        : 'border-gray-200/90 bg-white hover:border-emerald-500/40 hover:bg-gray-50/50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-gray-900 leading-snug truncate sm:whitespace-normal">
                        {cat.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setView('documents')}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setView('add-details')}
                className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 3: ADD DOCUMENT – UPLOAD & DETAILS */}
        {/* ===================================================================== */}
        {currentView === 'add-details' && (
          <form
            onSubmit={handleSaveDocument}
            className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200"
          >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                      {editingDoc ? `Edit ${selectedCategory}` : selectedCategory}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload your {selectedCategory.toLowerCase()} document and complete the details below.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Available Online & Offline</span>
                  </span>
                </div>

                {/* 2-Column Upload & Form Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                  {/* Left: Upload Box & Preview */}
                  <div className="space-y-4">
                    {/* Drag & Drop Upload Container */}
                    <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                        <Shield className="w-6 h-6 stroke-[2]" />
                      </div>
                      <h4 className="font-heading font-bold text-sm text-gray-900">
                        Upload {selectedCategory} File
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        JPG, PNG, WebP or PDF (Max 10MB)
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Synced online to your TripzoBox Vault and cached offline
                      </p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-2xs">
                        {selectedUploadFile || uploadedFileName ? 'Change File' : 'Choose File'}
                      </span>
                    </label>

                    {/* Document Preview Box (Image or PDF) */}
                    {uploadedFileMime === 'application/pdf' ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-emerald-700" />
                          </div>
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {uploadedFileName || 'PDF Document Ready'}
                            </p>
                            <p className="text-[11px] text-emerald-700">
                              PDF attached · Will be viewable online & offline
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                          PDF
                        </span>
                      </div>
                    ) : uploadedPreviewUrl ? (
                      <div className="rounded-2xl border border-gray-200/90 overflow-hidden bg-gray-100 p-2 text-center">
                        <div className="relative aspect-[3/4] max-h-56 mx-auto rounded-xl overflow-hidden shadow-xs border border-gray-300">
                          <img
                            src={uploadedPreviewUrl}
                            alt="Document Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                            Preview
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Right: Document-Specific Dynamic Form Fields */}
                  <div className="space-y-4">
                    {/* Optional Document Sub-type Chips (e.g. Aadhaar / Driving License / College ID) */}
                    {activeSchema.subTypes && (
                      <div>
                        <span className="block text-xs font-medium text-gray-700 mb-1.5">
                          Select {selectedCategory} Type
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSchema.subTypes.map((sub) => {
                            const active = docName.trim().toLowerCase() === sub.label.toLowerCase();
                            return (
                              <button
                                key={sub.label}
                                type="button"
                                onClick={() => {
                                  setDocName(sub.label);
                                  setSelectedDocTypeOverride(sub.docType);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-primary text-white shadow-2xs'
                                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Field 1: Document Name (Category-specific label) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        {activeSchema.nameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder={activeSchema.namePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    {/* Field 2: Issuing Country / Coverage */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        {activeSchema.countryLabel}
                      </label>
                      <select
                        value={issuingCountry}
                        onChange={(e) => setIssuingCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field 3: Document-Specific Number / Identifier (NOT hardcoded Passport Number!) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        {activeSchema.numberLabel}
                      </label>
                      <input
                        type="text"
                        required={activeSchema.numberRequired}
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder={activeSchema.numberPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    {/* Field 4: Validity / Expiry Date with Lifetime support */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-gray-700">
                          {activeSchema.expiryLabel}
                        </label>
                        {activeSchema.allowLifetime && (
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={expiryDate === 'Lifetime' || expiryDate === 'No Expiry'}
                              onChange={(e) =>
                                setExpiryDate(e.target.checked ? 'Lifetime' : '')
                              }
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span>Lifetime / No Expiry</span>
                          </label>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required={!activeSchema.allowLifetime}
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          placeholder={activeSchema.expiryPlaceholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                        <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Field 5: Document-Specific Issuing Authority / Carrier / Provider */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        {activeSchema.extraLabel}
                      </label>
                      <input
                        type="text"
                        value={docExtraDetail}
                        onChange={(e) => setDocExtraDetail(e.target.value)}
                        placeholder={activeSchema.extraPlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    {/* Field 6: Online Visibility & Eligible TripzoBox Contact Access */}
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2.5">
                      <label className="block text-xs font-bold text-gray-800">
                        Online Visibility & Eligible Contacts
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDocVisibility('private');
                            setInlineShareContacts([]);
                          }}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            docVisibility === 'private'
                              ? 'bg-white border-emerald-600 text-emerald-950 font-semibold shadow-2xs'
                              : 'bg-white/70 border-gray-200 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Only Me</span>
                          </div>
                          <span className="block text-[10px] text-gray-500 mt-0.5">
                            Visible only in your online/offline vault
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDocVisibility('trusted-contacts')}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            docVisibility === 'trusted-contacts'
                              ? 'bg-white border-emerald-600 text-emerald-950 font-semibold shadow-2xs'
                              : 'bg-white/70 border-gray-200 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Eligible TripzoBox Contacts</span>
                          </div>
                          <span className="block text-[10px] text-gray-500 mt-0.5">
                            Select registered TripzoBox users who can view
                          </span>
                        </button>
                      </div>

                      {docVisibility === 'trusted-contacts' && (
                        <div className="pt-2 space-y-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={inlineContactSearch}
                              onChange={(e) => setInlineContactSearch(e.target.value)}
                              placeholder="Search TripzoBox account holders by name or @username..."
                              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-1 bg-white rounded-xl border border-gray-200 p-1.5">
                            {loadingContacts ? (
                              <div className="py-3 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Finding TripzoBox accounts...</span>
                              </div>
                            ) : eligibleContacts.length > 0 ? (
                              eligibleContacts.map((person) => {
                                const picked = inlineShareContacts.some((p) => p.id === person.id);
                                return (
                                  <button
                                    key={person.id}
                                    type="button"
                                    onClick={() =>
                                      setInlineShareContacts((prev) =>
                                        picked
                                          ? prev.filter((p) => p.id !== person.id)
                                          : [...prev, person]
                                      )
                                    }
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                      picked ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {person.avatarUrl ? (
                                        <img
                                          src={person.avatarUrl}
                                          alt={person.name}
                                          className="w-6 h-6 rounded-full object-cover shrink-0"
                                        />
                                      ) : (
                                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                          {person.name.charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                      <div className="min-w-0">
                                        <p className="font-semibold truncate">{person.name}</p>
                                        <p className="text-[10px] text-gray-400 truncate">
                                          @{person.username} • {person.role}
                                        </p>
                                      </div>
                                    </div>
                                    <span
                                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                        picked
                                          ? 'bg-primary border-primary text-white'
                                          : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {picked && <Check className="w-3 h-3 stroke-[3]" />}
                                    </span>
                                  </button>
                                );
                              })
                            ) : (
                              <p className="py-3 text-center text-[11px] text-gray-400">
                                No matching TripzoBox account holders found.
                              </p>
                            )}
                          </div>
                          {inlineShareContacts.length > 0 && (
                            <p className="text-[11px] text-emerald-800 font-medium">
                              Selected ({inlineShareContacts.length}):{' '}
                              {inlineShareContacts.map((c) => c.name).join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={savingDocBusy}
                    onClick={() => {
                      setEditingDoc(null);
                      setView('add-category');
                    }}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={savingDocBusy}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <span>{savingDocBusy ? 'Saving...' : 'Save & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

        {/* ===================================================================== */}
        {/* SCREEN 4: DOCUMENT ADDED – VIEW & MANAGE (MY DOCUMENTS) */}
        {/* ===================================================================== */}
        {currentView === 'documents' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
                {/* Header with + Add Document Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setView('dashboard')}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Back to Overview"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                        My Documents
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        All your uploaded documents in one place.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {sharedWithMe.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSharedTab('received');
                          setView('shared');
                        }}
                        className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>Shared With Me ({sharedWithMe.length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setView('add-category')}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Document</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                  {docSearch && (
                    <button
                      type="button"
                      onClick={() => setDocSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Pills Strip */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
                  {[
                    'All',
                    'Passport',
                    'ID Card',
                    'Tickets',
                    'Insurance',
                    'Emergency',
                    'Other',
                  ].map((filter) => {
                    const isSelected = selectedDocFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setSelectedDocFilter(filter)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0D5A46] text-white font-semibold shadow-2xs'
                            : 'border border-gray-200 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>

                {/* Document Rows List */}
                <div className="space-y-3">
                  {visibleDocuments.length > 0 ? (
                    visibleDocuments.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        document={doc}
                        onView={(item) => {
                          setSelectedDocForViewer(item);
                          setIsViewerOpen(true);
                        }}
                        onEdit={(item) => {
                          setEditingDoc(item);
                          setSelectedCategory(inferCategoryFromDoc(item));
                          setSelectedDocTypeOverride(item.type);
                          setDocName(item.name);
                          setDocNumber(item.referenceNumber || '');
                          setExpiryDate(item.validTill || '');
                          setIssuingCountry(item.issuingCountry || 'India');
                          setDocExtraDetail(item.details?.issuingAuthority || '');
                          setDocVisibility(item.visibility || 'private');
                          setUploadedPreviewUrl(item.thumbnailUrl || item.fileUrl || '');
                          setUploadedFileName(item.fileName || '');
                          setUploadedFileMime(item.fileMime || '');
                          setSelectedUploadFile(null);
                          setView('add-details');
                        }}
                        onDelete={async (id) => {
                          if (
                            !(await confirmAction(
                              'delete',
                              'this document from your secure vault'
                            ))
                          )
                            return;
                          deleteDocument(id);
                          success('Document removed from your vault.');
                        }}
                        onShare={(item) => handleOpenShare(item)}
                        onVerify={(item) => {
                          setPendingDocData({
                            name: item.name,
                            type: item.type,
                            category: inferCategoryFromDoc(item),
                            referenceNumber: item.referenceNumber,
                            validTill: item.validTill,
                            issuingCountry: item.issuingCountry,
                            thumbnailUrl: item.thumbnailUrl,
                            details: item.details,
                            visibility: item.visibility,
                            existingDocId: item.id,
                          });
                          setIsOtpModalOpen(true);
                        }}
                      />
                    ))
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
                      <p className="text-xs text-gray-500">No documents found matching your filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDocSearch('');
                          setSelectedDocFilter('All');
                        }}
                        className="mt-2 text-xs font-semibold text-primary hover:underline"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

        {/* ===================================================================== */}
        {/* SCREEN 5: SHARE DOCUMENT – SELECT PEOPLE */}
        {/* ===================================================================== */}
        {currentView === 'share' && shareDoc && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                    Share Document Online
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select eligible TripzoBox account holders who can view this document online.
                  </p>
                </div>

                {/* Selected Document Info Banner */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                    {shareDoc.thumbnailUrl ? (
                      <img
                        src={shareDoc.thumbnailUrl}
                        alt={shareDoc.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-emerald-700" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-sm text-gray-900">
                      {shareDoc.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {shareDoc.referenceNumber || shareDoc.type}{' '}
                      {shareDoc.validTill && `• ${shareDoc.validTill}`}
                    </p>
                  </div>
                </div>

                {/* 2-Column Select Eligible TripzoBox Contacts & Set Access Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                  {/* Left Column: Select Registered TripzoBox Contacts */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Select TripzoBox account holders
                    </label>

                    {/* Search TripzoBox Users Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search registered TripzoBox users by name, @username, or email..."
                        value={peopleSearch}
                        onChange={(e) => setPeopleSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Eligible TripzoBox Account List */}
                    <div className="space-y-2 border border-gray-200 rounded-2xl p-2 bg-white max-h-72 overflow-y-auto">
                      {loadingContacts ? (
                        <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Loading eligible TripzoBox accounts...</span>
                        </div>
                      ) : eligibleContacts.length > 0 ? (
                        eligibleContacts.map((person) => {
                          const isChecked = selectedRecipients.some((r) => r.id === person.id);
                          return (
                            <div
                              key={person.id}
                              onClick={() => {
                                setSelectedRecipients((prev) =>
                                  prev.some((r) => r.id === person.id)
                                    ? prev.filter((r) => r.id !== person.id)
                                    : [...prev, person]
                                );
                              }}
                              className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-emerald-50/70 border border-emerald-200'
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {person.avatarUrl ? (
                                  <img
                                    src={person.avatarUrl}
                                    alt={person.name}
                                    className="w-9 h-9 rounded-full object-cover border border-white shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                                    {person.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                                      {person.name}
                                    </h5>
                                    {person.isCoTraveler && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        Trip companion
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 truncate">
                                    @{person.username}
                                    {person.city ? ` • ${person.city}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                  isChecked
                                    ? 'bg-primary border-primary text-white'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 px-4 text-center text-xs text-gray-500">
                          No active TripzoBox account holders match your search.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Set Access */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Set access
                    </label>

                    {/* Access Duration Dropdown */}
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">Access duration</span>
                      <select
                        value={accessDuration}
                        onChange={(e) => setAccessDuration(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-800 bg-white focus:outline-none focus:border-primary"
                      >
                        <option value="Until trip end">Until trip end</option>
                        <option value="24 hours">24 hours</option>
                        <option value="7 days">7 days</option>
                        <option value="Forever">Forever</option>
                      </select>
                    </div>

                    {/* Permissions Checkboxes */}
                    <div>
                      <span className="block text-xs text-gray-500 mb-2">Permissions</span>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={permissionView}
                            onChange={(e) => setPermissionView(e.target.checked)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                          />
                          <span className="font-medium">View Online</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={permissionDownload}
                            onChange={(e) => setPermissionDownload(e.target.checked)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                          />
                          <span className="font-medium">Download Original</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={shareBusy}
                    onClick={() => setView('documents')}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={shareBusy}
                    onClick={handleConfirmShare}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {shareBusy ? 'Sharing...' : 'Share Document'}
                  </button>
                </div>
              </div>
            )}

        {/* ===================================================================== */}
        {/* SCREEN 6: SHARED ACCESS – MANAGE */}
        {/* ===================================================================== */}
        {currentView === 'shared' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
                {/* Header with + Share Document Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setView('dashboard')}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Back to Overview"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                        Shared Access
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Manage who can access your documents.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (documents.length > 0) {
                        handleOpenShare(documents[0]);
                      } else {
                        setView('add-category');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Share Document</span>
                  </button>
                </div>

                {/* Tabs: Shared By Me & Shared With Me */}
                <div className="flex items-center gap-6 border-b border-gray-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSharedTab('active')}
                    className={`pb-2.5 transition-colors relative cursor-pointer ${
                      sharedTab === 'active' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Shared By Me ({sharedAccessRecords.length})
                    {sharedTab === 'active' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSharedTab('received');
                      void refreshSharedWithMe();
                    }}
                    className={`pb-2.5 transition-colors relative cursor-pointer ${
                      sharedTab === 'received' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Shared With Me ({sharedWithMe.length})
                    {sharedTab === 'received' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                </div>

                {/* Shared By Me vs Shared With Me Online Table */}
                {sharedTab === 'active' ? (
                  <div className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-5 py-3">Document</th>
                            <th className="px-5 py-3">Shared With</th>
                            <th className="px-5 py-3">Permission</th>
                            <th className="px-5 py-3">Expires</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sharedAccessRecords.length > 0 ? (
                            sharedAccessRecords.map((record) => (
                              <tr key={record.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-5 py-3.5 font-medium text-gray-900 flex items-center gap-2.5">
                                  <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                                  <span>{record.documentName}</span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-700">
                                  {record.sharedWithName}
                                  {record.sharedWithUsername && (
                                    <span className="text-[11px] text-gray-400 ml-1">
                                      @{record.sharedWithUsername}
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                    <Eye className="w-3 h-3 text-emerald-600" />
                                    <span>{record.permission}</span>
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-500">{record.expires}</td>
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (
                                        !(await confirmAction(
                                          'delete',
                                          `access for ${record.sharedWithName}`
                                        ))
                                      )
                                        return;
                                      revokeSharedAccess(record.id);
                                      success(`Revoked access for ${record.sharedWithName}.`);
                                    }}
                                    className="text-red-500 hover:text-red-700 font-semibold text-xs cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">
                                No documents shared yet. Share a vault document with an eligible TripzoBox contact.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-5 py-3">Document</th>
                            <th className="px-5 py-3">Shared By</th>
                            <th className="px-5 py-3">Permission</th>
                            <th className="px-5 py-3">Expires</th>
                            <th className="px-5 py-3 text-right">View Online</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sharedWithMe.length > 0 ? (
                            sharedWithMe.map((item) => (
                              <tr key={item.shareId} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-5 py-3.5 font-medium text-gray-900">
                                  <div className="flex items-center gap-2.5">
                                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <div>
                                      <span className="block">{item.document.name}</span>
                                      <span className="text-[11px] text-gray-400 font-normal">
                                        {item.document.referenceNumber || item.document.type}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-gray-700">
                                  {item.owner.name}
                                  {item.owner.username && (
                                    <span className="text-[11px] text-gray-400 ml-1">
                                      @{item.owner.username}
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                    <Globe className="w-3 h-3 text-emerald-600" />
                                    <span>{item.permission}</span>
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-gray-500">{item.expires}</td>
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewerSharedItem(item);
                                      setSelectedDocForViewer(item.document);
                                      setIsViewerOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Online</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500">
                                No documents have been shared with your TripzoBox account yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

        {/* ===================================================================== */}
        {/* SCREEN 7: EMERGENCY ACCESS – SETUP */}
        {/* ===================================================================== */}
        {currentView === 'emergency' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setView('dashboard')}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Back to Overview"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                        Emergency Access
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Add essential documents and contacts for emergency situations.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView('emergency-view')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
                  >
                    View Emergency Portal
                  </button>
                </div>

                {/* Center Hero Card (Matching Screen 7) */}
                <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
                  {/* Left Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-gray-900">
                        Be prepared for the unexpected
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 max-w-md leading-relaxed">
                        Quick access to your key documents and contacts in case of an emergency.
                      </p>
                      <button
                        type="button"
                        onClick={() => setView('emergency-edit')}
                        className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all shadow-xs cursor-pointer"
                      >
                        Set Up Emergency Access
                      </button>
                    </div>
                  </div>

                  {/* Right Phone Graphic Illustration */}
                  <div className="w-36 h-48 bg-white rounded-2xl border-2 border-gray-300 shadow-md p-2 flex flex-col justify-between shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
                    <div className="bg-emerald-50 rounded-xl p-2 text-center space-y-1">
                      <Plane className="w-5 h-5 text-emerald-700 mx-auto" />
                      <span className="block text-[10px] font-bold text-gray-800">
                        Flight Pass
                      </span>
                      <span className="block text-[8px] text-gray-400">Emergency Ready</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-[10px]">
                      <Shield className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Bottom: "What you can include" */}
                <div>
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-gray-500 mb-3">
                    What you can include
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl border border-gray-200 bg-white text-center space-y-2">
                      <FileText className="w-6 h-6 text-emerald-700 mx-auto" />
                      <span className="block text-xs font-bold text-gray-800">Passport & ID</span>
                    </div>
                    <div className="p-4 rounded-2xl border border-gray-200 bg-white text-center space-y-2">
                      <PhoneCall className="w-6 h-6 text-emerald-700 mx-auto" />
                      <span className="block text-xs font-bold text-gray-800">
                        Emergency Contacts
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl border border-gray-200 bg-white text-center space-y-2">
                      <Plane className="w-6 h-6 text-emerald-700 mx-auto" />
                      <span className="block text-xs font-bold text-gray-800">Travel Itinerary</span>
                    </div>
                    <div className="p-4 rounded-2xl border border-gray-200 bg-white text-center space-y-2">
                      <HeartPulse className="w-6 h-6 text-emerald-700 mx-auto" />
                      <span className="block text-xs font-bold text-gray-800">
                        Insurance Details
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* ===================================================================== */}
        {/* SCREEN 8: EMERGENCY ACCESS – ADD DETAILS */}
        {/* ===================================================================== */}
        {currentView === 'emergency-edit' && (
          <form
            onSubmit={handleSaveEmergencyDetails}
            className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200"
          >
                {/* Header */}
                <div>
                  <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                    Emergency Access
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select what information to include and add emergency contacts.
                  </p>
                </div>

                {/* Section 1: Choose documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900">
                      1. Choose documents
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        setEmergencyDocs([
                          'ID Card',
                          'Passport',
                          'Flight Tickets',
                          'Hotel Bookings',
                          'Travel Insurance',
                        ])
                      }
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                  </div>

                  <div className="space-y-2 border border-gray-200 rounded-2xl p-4 bg-white">
                    {[
                      'ID Card',
                      'Passport',
                      'Flight Tickets',
                      'Hotel Bookings',
                      'Travel Insurance',
                    ].map((docName) => {
                      const isChecked = emergencyDocs.includes(docName);
                      return (
                        <label
                          key={docName}
                          onClick={() => {
                            setEmergencyDocs((prev) =>
                              prev.includes(docName)
                                ? prev.filter((d) => d !== docName)
                                : [...prev, docName]
                            );
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer select-none"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isChecked
                                ? 'bg-primary border-primary text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-medium text-gray-800">{docName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Add emergency contacts */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900">
                    2. Add emergency contacts
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Primary Contact</label>
                      <input
                        type="text"
                        required
                        value={emergencyPrimary}
                        onChange={(e) => setEmergencyPrimary(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Secondary Contact (Optional)
                      </label>
                      <input
                        type="text"
                        value={emergencySecondary}
                        onChange={(e) => setEmergencySecondary(e.target.value)}
                        placeholder="+91 90101 43211"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setView('emergency')}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Save & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

        {/* ===================================================================== */}
        {/* SCREEN 9: SECURITY SETTINGS */}
        {/* ===================================================================== */}
        {currentView === 'security' && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView('dashboard')}
                    className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900">
                      Security Settings
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage your privacy and device access.
                    </p>
                  </div>
                </div>

                {/* Settings Items Card (Matching Screen 9) */}
                <div className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-gray-100">
                  {/* Row 1: Two-Factor Authentication */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-gray-900">
                        Two-Factor Authentication
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Add an extra layer of security to your account.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !twoFactor;
                        setTwoFactor(next);
                        updateSecuritySettings({ twoFactorEnabled: next });
                        success(
                          next
                            ? 'Two-Factor Authentication enabled!'
                            : 'Two-Factor Authentication disabled.'
                        );
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFactor ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          twoFactor ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 2: Trusted Devices */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-gray-900">
                        Trusted Devices
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Manage devices that can access your vault.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDevicesModalOpen(true)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Devices</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Row 3: Recovery Options */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-gray-900">
                        Recovery Options
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Set up recovery email and phone number.
                      </p>
                    </div>
                    <Link
                      to="/app/account-security"
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Row 4: Auto Lock */}
                  <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-gray-900">Auto Lock</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Lock your vault after a period of inactivity.
                      </p>
                    </div>
                    <select
                      value={autoLock}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAutoLock(val);
                        updateSecuritySettings({ autoLockTime: val });
                        success(`Auto lock set to ${val}.`);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-primary"
                    >
                      <option value="Immediately">Immediately</option>
                      <option value="5 minutes">5 minutes</option>
                      <option value="15 minutes">15 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="Never">Never</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Trust Callout */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Your documents are encrypted with AES-256 and stored securely. We never share
                    your data without your permission.
                  </p>
                </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: VIEW ORIGINAL DOCUMENT (ONLINE + OFFLINE) */}
      {/* ========================================================================= */}
      {selectedDocForViewer && (
        <Modal
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setViewerSharedItem(null);
          }}
          maxWidth="2xl"
          title={selectedDocForViewer.name}
          description={
            viewerSharedItem
              ? `Shared by ${viewerSharedItem.owner.name} · Type: ${selectedDocForViewer.type} · Access: ${viewerSharedItem.permission}`
              : `Type: ${selectedDocForViewer.type} · Uploaded: ${selectedDocForViewer.uploadedAt}`
          }
        >
          <div className="space-y-4">
            <VaultFileViewer
              document={
                viewerSharedItem
                  ? viewerSharedItem.document
                  : documents.find((d) => d.id === selectedDocForViewer.id) || selectedDocForViewer
              }
              readOnly={Boolean(viewerSharedItem)}
              allowDownload={
                viewerSharedItem ? viewerSharedItem.permission === 'View • Download' : true
              }
            />
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW TRUSTED DEVICES */}
      {/* ========================================================================= */}
      <Modal
        isOpen={devicesModalOpen}
        onClose={() => setDevicesModalOpen(false)}
        title="Trusted Devices"
        description="Devices currently authenticated to decrypt and view your vault."
      >
        <div className="space-y-3 pt-2 text-left">
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-emerald-700" />
              <div>
                <h5 className="font-semibold text-xs text-gray-900">Chrome on Windows (Current)</h5>
                <p className="text-[11px] text-emerald-800 font-medium">Active now · IP: 103.21.x.x</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
              This Device
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-500" />
              <div>
                <h5 className="font-semibold text-xs text-gray-900">Safari on iPhone 15 Pro</h5>
                <p className="text-[11px] text-gray-400">Bengaluru · Last active 2 days ago</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => success('Device access revoked.')}
              className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
            >
              Revoke
            </button>
          </div>
        </div>
      </Modal>

      {/* OTP Document Verification Modal */}
      <DocumentOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => {
          setIsOtpModalOpen(false);
          setPendingDocData(null);
        }}
        documentName={pendingDocData?.name || docName || 'Document'}
        documentType={pendingDocData?.type || 'Passport'}
        documentId={pendingDocData?.existingDocId}
        onVerified={handleOtpVerified}
        onSaveWithoutVerification={handleSaveWithoutVerification}
      />
    </div>
  );
};
export default TravelVaultPage;
