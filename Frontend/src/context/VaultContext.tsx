import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultDocument, EmergencyContact } from '../types';
import { mockDocuments } from '../data/mockDocuments';
import { mockEmergencyContacts, mockTrustedContacts, TrustedContact } from '../data/mockEmergency';

interface VaultContextType {
  documents: VaultDocument[];
  emergencyContacts: EmergencyContact[];
  trustedContacts: TrustedContact[];
  offlineAccessSettings: Record<string, boolean>;
  addDocument: (doc: Omit<VaultDocument, 'id' | 'uploadedAt'>) => VaultDocument;
  deleteDocument: (id: string) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => EmergencyContact;
  deleteEmergencyContact: (id: string) => void;
  toggleTrustedContactVaultAccess: (id: string) => void;
  toggleOfflineDocType: (type: string) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<VaultDocument[]>(() => {
    const saved = localStorage.getItem('tripzobox_vault_documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((d: VaultDocument) => d.id));
        const newDocs = mockDocuments.filter((m) => !existingIds.has(m.id));
        if (newDocs.length > 0) {
          const merged = [...parsed, ...newDocs];
          localStorage.setItem('tripzobox_vault_documents', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch (e) {
        return mockDocuments;
      }
    }
    return mockDocuments;
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('tripzobox_emergency_contacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockEmergencyContacts;
      }
    }
    return mockEmergencyContacts;
  });

  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>(() => {
    const saved = localStorage.getItem('tripzobox_trusted_contacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockTrustedContacts;
      }
    }
    return mockTrustedContacts;
  });

  const [offlineAccessSettings, setOfflineAccessSettings] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('tripzobox_offline_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          Passport: false,
          Aadhaar: false,
          DrivingLicense: true,
          Insurance: true,
          FlightTicket: true,
          HotelBooking: true,
        };
      }
    }
    return {
      Passport: false,
      Aadhaar: false,
      DrivingLicense: true,
      Insurance: true,
      FlightTicket: true,
      HotelBooking: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('tripzobox_vault_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('tripzobox_emergency_contacts', JSON.stringify(emergencyContacts));
  }, [emergencyContacts]);

  useEffect(() => {
    localStorage.setItem('tripzobox_trusted_contacts', JSON.stringify(trustedContacts));
  }, [trustedContacts]);

  useEffect(() => {
    localStorage.setItem('tripzobox_offline_settings', JSON.stringify(offlineAccessSettings));
  }, [offlineAccessSettings]);

  const addDocument = (doc: Omit<VaultDocument, 'id' | 'uploadedAt'>): VaultDocument => {
    const newDoc: VaultDocument = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>): EmergencyContact => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `em_${Date.now()}`,
    };
    setEmergencyContacts((prev) => [...prev, newContact]);
    return newContact;
  };

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleTrustedContactVaultAccess = (id: string) => {
    setTrustedContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, canViewVault: !c.canViewVault } : c))
    );
  };

  const toggleOfflineDocType = (type: string) => {
    setOfflineAccessSettings((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <VaultContext.Provider
      value={{
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
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within VaultProvider');
  return context;
};
