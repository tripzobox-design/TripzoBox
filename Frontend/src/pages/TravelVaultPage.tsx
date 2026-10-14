import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Lock,
  PhoneCall,
  UserCheck,
  WifiOff,
  AlertTriangle,
  Info,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { Dropzone } from '../components/ui/Dropzone';
import { DocumentRow } from '../components/feature/DocumentRow';
import { VaultDocument } from '../types';

export const TravelVaultPage: React.FC = () => {
  const {
    documents,
    emergencyContacts,
    trustedContacts,
    offlineAccessSettings,
    addDocument,
    deleteDocument,
    addEmergencyContact,
    deleteEmergencyContact,
    toggleTrustedContactVaultAccess,
    toggleOfflineDocType,
  } = useVault();

  const { success, error: showErrorToast } = useToast();

  const [activeTab, setActiveTab] = useState<'documents' | 'emergency' | 'contacts' | 'offline'>('documents');

  // Modals state
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isViewDocOpen, setIsViewDocOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);

  // Form State for Add Document
  const [docType, setDocType] = useState<VaultDocument['type']>('Passport');
  const [docName, setDocName] = useState('');
  const [validTill, setValidTill] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [docErrors, setDocErrors] = useState<{ name?: string }>({});

  // Form State for Add Emergency Contact
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const subTabs = [
    { id: 'documents', label: 'Documents', badge: documents.length },
    { id: 'emergency', label: 'Emergency', badge: emergencyContacts.length },
    { id: 'contacts', label: 'Contacts', badge: trustedContacts.length },
    { id: 'offline', label: 'Offline Access' },
  ];

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      setDocErrors({ name: 'Document name is required' });
      return;
    }

    addDocument({
      type: docType,
      name: docName.trim(),
      validTill: validTill || undefined,
      referenceNumber: refNumber || undefined,
      fileUrl: fileUrls[0] || undefined,
      visibility: 'private',
    });

    success(`${docName} added to your Travel Vault!`, 'Document Secured');
    setIsAddDocOpen(false);

    // Reset Form
    setDocName('');
    setValidTill('');
    setRefNumber('');
    setFileUrls([]);
    setDocErrors({});
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    addEmergencyContact({
      name: contactName.trim(),
      relation: contactRelation.trim() || 'Family',
      phone: contactPhone.trim(),
      isPrimary: false,
    });

    success(`${contactName} added as emergency contact!`);
    setIsAddContactOpen(false);
    setContactName('');
    setContactRelation('');
    setContactPhone('');
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
      {/* 1. PAGE HEADER (Matching Screen 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text">
            Travel Vault
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Your important travel information, safe & secure.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddDocOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="shadow-subtle hover:shadow-hover"
        >
          Add Document
        </Button>
      </div>

      {/* 2. SUB-TABS (Documents, Emergency, Contacts, Offline Access) */}
      <Tabs
        tabs={subTabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
        variant="pills"
      />

      {/* 3. TAB CONTENT */}
      {/* TAB 1: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Privacy Disclaimer Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-left">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-primary-dark">Private & Client-Encrypted:</span>{' '}
              <span className="text-text-muted">
                Documents are stored on your device and private by default. You explicitly decide which items are cached offline or shared with trusted travel contacts.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h3 className="font-heading font-semibold text-base sm:text-lg text-text">
              My Documents ({documents.length})
            </h3>
          </div>

          {/* List Rows Matching Screen 4 */}
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onView={(item) => {
                  setSelectedDoc(item);
                  setIsViewDocOpen(true);
                }}
                onDelete={(id) => {
                  deleteDocument(id);
                  success('Document removed from your vault.');
                }}
                onShare={(item) => {
                  success(`Secure link created for ${item.name} with trusted contacts.`, 'Share Link Active');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EMERGENCY */}
      {activeTab === 'emergency' && (
        <div className="space-y-6">
          {/* Emergency Alert Card */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-red-900">
                  National Emergency Helpline: 112
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Universal emergency number for Police, Ambulance, and Fire in India.
                </p>
              </div>
            </div>
            <a
              href="tel:112"
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
            >
              Call 112 Now
            </a>
          </div>

          {/* Emergency Contacts List */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base sm:text-lg text-text">
                Designated Emergency Contacts
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddContactOpen(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Contact
              </Button>
            </div>

            <div className="divide-y divide-border">
              {emergencyContacts.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-text">{c.name}</h4>
                      {c.isPrimary && (
                        <span className="text-[10px] font-semibold bg-accent/40 text-primary-dark px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {c.relation} · {c.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${c.phone}`}
                      className="p-2 rounded-lg bg-light-bg text-primary hover:bg-accent/30 transition-colors"
                      aria-label={`Call ${c.name}`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                    {!c.isPrimary && (
                      <button
                        onClick={() => {
                          deleteEmergencyContact(c.id);
                          success('Contact removed.');
                        }}
                        className="text-xs text-red-500 hover:underline p-1"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-5">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-text">
              Trusted Travel Companions
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              People who can access your verified documents during group trips.
            </p>
          </div>

          <div className="space-y-4">
            {trustedContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-xl bg-light-bg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={contact.avatarUrl}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover border border-white"
                  />
                  <div>
                    <h4 className="font-semibold text-sm text-text">{contact.name}</h4>
                    <p className="text-xs text-text-muted">{contact.relation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contact.canViewVault}
                      onChange={() => toggleTrustedContactVaultAccess(contact.id)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>Allow Vault View</span>
                  </label>

                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
                    {contact.canViewVault ? 'Active Access' : 'Restricted'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OFFLINE ACCESS */}
      {activeTab === 'offline' && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/40 text-primary flex items-center justify-center shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-text">
                Offline Document Cache
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Keep vital travel proofs cached locally in your browser so you can display them even without an active network connection on remote mountain trails.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border pt-2">
            {Object.entries(offlineAccessSettings).map(([docType, isEnabled]) => (
              <div key={docType} className="py-3.5 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-text">{docType}</h4>
                  <p className="text-xs text-text-muted">
                    {isEnabled ? 'Cached on this device for offline review' : 'Online access only'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toggleOfflineDocType(docType);
                    success(`${docType} offline caching ${!isEnabled ? 'enabled' : 'disabled'}.`);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                    isEnabled ? 'bg-primary' : 'bg-gray-300'
                  }`}
                  aria-label={`Toggle offline access for ${docType}`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      isEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD DOCUMENT MODAL */}
      <Modal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        title="Add Document to Vault"
        description="Documents stay strictly in your local session and are never uploaded to any server."
      >
        <form onSubmit={handleSaveDocument} className="space-y-4 pt-2">
          <Select
            label="Document Type"
            value={docType}
            onChange={(e) => {
              const val = e.target.value as VaultDocument['type'];
              setDocType(val);
              if (!docName) setDocName(val);
            }}
            options={[
              { label: 'Passport', value: 'Passport' },
              { label: 'Aadhaar Card', value: 'Aadhaar' },
              { label: 'Driving License', value: 'DrivingLicense' },
              { label: 'Travel Insurance', value: 'Insurance' },
              { label: 'Flight Tickets', value: 'FlightTicket' },
              { label: 'Hotel Bookings', value: 'HotelBooking' },
              { label: 'Other Document', value: 'Other' },
            ]}
          />

          <Input
            label="Document Name"
            placeholder="e.g. Passport, Flight to Kochi"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            error={docErrors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Valid Till (Optional)"
              placeholder="e.g. 12 Jan 2030"
              value={validTill}
              onChange={(e) => setValidTill(e.target.value)}
            />
            <Input
              label="Reference / ID (Optional)"
              placeholder="e.g. Z8942014"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
            />
          </div>

          <Dropzone
            label="Select Document File"
            subtext="Accepts PDF, JPG, PNG (Local storage only)"
            multiple={false}
            onFilesSelected={setFileUrls}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" type="button" onClick={() => setIsAddDocOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Document
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DOCUMENT DETAILS MODAL */}
      {selectedDoc && (
        <Modal
          isOpen={isViewDocOpen}
          onClose={() => setIsViewDocOpen(false)}
          title={selectedDoc.name}
          description={`Type: ${selectedDoc.type} · Uploaded: ${selectedDoc.uploadedAt}`}
        >
          <div className="space-y-4 pt-2">
            <div className="bg-light-bg rounded-xl p-4 border border-border space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Status:</span>
                <span className="font-semibold text-emerald-600">Active & Verified</span>
              </div>
              {selectedDoc.validTill && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Valid Till:</span>
                  <span className="font-semibold text-text">{selectedDoc.validTill}</span>
                </div>
              )}
              {selectedDoc.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Reference:</span>
                  <span className="font-semibold text-text">{selectedDoc.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-muted">Visibility:</span>
                <span className="font-semibold capitalize text-primary">{selectedDoc.visibility}</span>
              </div>
            </div>

            {selectedDoc.fileUrl && (
              <div className="rounded-xl overflow-hidden border border-border">
                <img src={selectedDoc.fileUrl} alt={selectedDoc.name} className="w-full max-h-60 object-contain bg-black/5" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="primary" onClick={() => setIsViewDocOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD EMERGENCY CONTACT MODAL */}
      <Modal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        title="Add Emergency Contact"
      >
        <form onSubmit={handleSaveContact} className="space-y-4 pt-2">
          <Input
            label="Contact Full Name"
            placeholder="e.g. Fatima Ali"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
          <Input
            label="Relation"
            placeholder="e.g. Mother, Sibling, Friend"
            value={contactRelation}
            onChange={(e) => setContactRelation(e.target.value)}
          />
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsAddContactOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
