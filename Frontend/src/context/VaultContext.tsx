import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultDocument, EmergencyContact, SharedAccessRecord } from '../types';
import { mockDocuments } from '../data/mockDocuments';
import {
  mockEmergencyContacts,
  mockTrustedContacts,
  mockSharedAccessRecords,
  TrustedContact,
} from '../data/mockEmergency';
import { useAuth } from './AuthContext';
import { saveVaultFile, deleteVaultFile, validateVaultFile } from '../lib/vaultFiles';
import { vaultApi } from '../lib/api';

export interface EmergencyAccessConfig {
  includedDocTypes: string[];
  primaryContact: string;
  secondaryContact: string;
}

export interface SecuritySettingsState {
  twoFactorEnabled: boolean;
  autoLockTime: string;
}

interface VaultContextType {
  documents: VaultDocument[];
  emergencyContacts: EmergencyContact[];
  trustedContacts: TrustedContact[];
  sharedAccessRecords: SharedAccessRecord[];
  emergencyAccessConfig: EmergencyAccessConfig;
  securitySettings: SecuritySettingsState;
  offlineAccessSettings: Record<string, boolean>;
  addDocument: (doc: Omit<VaultDocument, 'id' | 'uploadedAt'>) => VaultDocument;
  updateDocument: (id: string, updates: Partial<VaultDocument>) => void;
  deleteDocument: (id: string) => void;
  attachDocumentFile: (id: string, file: File) => Promise<void>;
  addDocumentWithFile: (
    doc: Omit<VaultDocument, 'id' | 'uploadedAt'>,
    file: File
  ) => Promise<VaultDocument>;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => EmergencyContact;
  deleteEmergencyContact: (id: string) => void;
  toggleTrustedContactVaultAccess: (id: string) => void;
  toggleOfflineDocType: (type: string) => void;
  addSharedAccess: (
    record: Omit<SharedAccessRecord, 'id' | 'createdAt' | 'active'>
  ) => SharedAccessRecord;
  revokeSharedAccess: (id: string) => void;
  updateEmergencyAccessConfig: (config: Partial<EmergencyAccessConfig>) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettingsState>) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

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

  const [sharedAccessRecords, setSharedAccessRecords] = useState<SharedAccessRecord[]>(() => {
    const saved = localStorage.getItem('tripzobox_shared_access');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockSharedAccessRecords;
      }
    }
    return mockSharedAccessRecords;
  });

  const [emergencyAccessConfig, setEmergencyAccessConfig] = useState<EmergencyAccessConfig>(() => {
    const saved = localStorage.getItem('tripzobox_emergency_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          includedDocTypes: ['Passport', 'Insurance'],
          primaryContact: '+91 98765 43210',
          secondaryContact: '+91 98765 43211',
        };
      }
    }
    return {
      includedDocTypes: ['Passport', 'Insurance'],
      primaryContact: '+91 98765 43210',
      secondaryContact: '+91 98765 43211',
    };
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsState>(() => {
    const saved = localStorage.getItem('tripzobox_vault_security_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          twoFactorEnabled: true,
          autoLockTime: '15 minutes',
        };
      }
    }
    return {
      twoFactorEnabled: true,
      autoLockTime: '15 minutes',
    };
  });

  const [offlineAccessSettings, setOfflineAccessSettings] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('tripzobox_offline_access_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          Passport: true,
          DrivingLicense: true,
          Insurance: false,
          Tickets: true,
          Other: false,
        };
      }
    }
    return {
      Passport: true,
      DrivingLicense: true,
      Insurance: false,
      Tickets: true,
      Other: false,
    };
  });

  // Fetch initial Vault data from backend API
  useEffect(() => {
    vaultApi
      .getDocuments()
      .then((serverDocs) => {
        if (Array.isArray(serverDocs) && serverDocs.length > 0) {
          setDocuments(serverDocs);
        }
      })
      .catch(() => {});

    vaultApi
      .getEmergencyContacts()
      .then((serverContacts) => {
        if (Array.isArray(serverContacts) && serverContacts.length > 0) {
          setEmergencyContacts(serverContacts);
        }
      })
      .catch(() => {});

    vaultApi
      .getSharedAccess()
      .then((serverShared) => {
        if (Array.isArray(serverShared) && serverShared.length > 0) {
          setSharedAccessRecords(serverShared);
        }
      })
      .catch(() => {});

    vaultApi
      .getSettings()
      .then((serverSettings) => {
        if (serverSettings) {
          if (serverSettings.emergencyConfig) setEmergencyAccessConfig(serverSettings.emergencyConfig);
          if (serverSettings.securitySettings) setSecuritySettings(serverSettings.securitySettings);
        }
      })
      .catch(() => {});
  }, []);

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
    localStorage.setItem('tripzobox_shared_access', JSON.stringify(sharedAccessRecords));
  }, [sharedAccessRecords]);

  useEffect(() => {
    localStorage.setItem('tripzobox_emergency_config', JSON.stringify(emergencyAccessConfig));
  }, [emergencyAccessConfig]);

  useEffect(() => {
    localStorage.setItem('tripzobox_vault_security_settings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  useEffect(() => {
    localStorage.setItem('tripzobox_offline_access_settings', JSON.stringify(offlineAccessSettings));
  }, [offlineAccessSettings]);

  const addDocument = (doc: Omit<VaultDocument, 'id' | 'uploadedAt'>): VaultDocument => {
    const newDoc: VaultDocument = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isVerified: doc.isVerified ?? false,
    };
    setDocuments((prev) => [newDoc, ...prev]);

    vaultApi.createDocument(newDoc).catch((err) => {
      console.warn('[VaultContext] Server createDocument sync failed:', err);
    });

    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<VaultDocument>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
    );
    vaultApi.updateDocument(id, updates).catch(() => {});
  };

  const deleteDocument = (id: string) => {
    const document = documents.find((item) => item.id === id);
    if (document?.fileKey?.startsWith(`${user.id}:`)) {
      void deleteVaultFile(document.fileKey).catch(() => {});
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    vaultApi.deleteDocument(id).catch(() => {});
  };

  const attachDocumentFile = async (id: string, file: File) => {
    validateVaultFile(file);
    const fileKey = `${user.id}:${id}:${crypto.randomUUID()}`;
    const previousKey = documents.find((doc) => doc.id === id)?.fileKey;
    await saveVaultFile(fileKey, file);
    const next = documents.map((doc) =>
      doc.id === id
        ? {
            ...doc,
            fileKey,
            fileName: file.name,
            fileMime: file.type,
            fileUrl: undefined,
          }
        : doc
    );
    try {
      localStorage.setItem('tripzobox_vault_documents', JSON.stringify(next));
    } catch {
      await deleteVaultFile(fileKey);
      throw new Error('Device storage is full. Free some browser storage and try again.');
    }
    setDocuments(next);
    if (previousKey?.startsWith(`${user.id}:`)) {
      void deleteVaultFile(previousKey).catch(() => {});
    }
    void navigator.storage?.persist?.().catch(() => {});
  };

  const addDocumentWithFile = async (
    doc: Omit<VaultDocument, 'id' | 'uploadedAt'>,
    file: File
  ) => {
    validateVaultFile(file);
    const id = `doc_${crypto.randomUUID()}`;
    const fileKey = `${user.id}:${id}`;
    await saveVaultFile(fileKey, file);
    const newDoc: VaultDocument = {
      ...doc,
      id,
      fileKey,
      fileName: file.name,
      fileMime: file.type,
      uploadedAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isVerified: doc.isVerified ?? false,
    };
    const next = [newDoc, ...documents];
    try {
      localStorage.setItem('tripzobox_vault_documents', JSON.stringify(next));
    } catch {
      await deleteVaultFile(fileKey);
      throw new Error('Device storage is full. Free some browser storage and try again.');
    }
    setDocuments(next);
    vaultApi.createDocument(newDoc).catch(() => {});
    void navigator.storage?.persist?.().catch(() => {});
    return newDoc;
  };

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>): EmergencyContact => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `em_${Date.now()}`,
    };
    setEmergencyContacts((prev) => [...prev, newContact]);
    vaultApi.createEmergencyContact(newContact).catch(() => {});
    return newContact;
  };

  const deleteEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
    vaultApi.deleteEmergencyContact(id).catch(() => {});
  };

  const toggleTrustedContactVaultAccess = (id: string) => {
    setTrustedContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, canViewVault: !c.canViewVault } : c))
    );
    vaultApi.toggleTrustedContactAccess(id).catch(() => {});
  };

  const toggleOfflineDocType = (type: string) => {
    setOfflineAccessSettings((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const addSharedAccess = (
    record: Omit<SharedAccessRecord, 'id' | 'createdAt' | 'active'>
  ): SharedAccessRecord => {
    const newShare: SharedAccessRecord = {
      ...record,
      id: `share_${Date.now()}`,
      createdAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      active: true,
    };
    setSharedAccessRecords((prev) => [newShare, ...prev]);
    vaultApi.createSharedAccess(newShare).catch(() => {});
    return newShare;
  };

  const revokeSharedAccess = (id: string) => {
    setSharedAccessRecords((prev) => prev.filter((r) => r.id !== id));
    vaultApi.revokeSharedAccess(id).catch(() => {});
  };

  const updateEmergencyAccessConfig = (config: Partial<EmergencyAccessConfig>) => {
    setEmergencyAccessConfig((prev) => ({ ...prev, ...config }));
    vaultApi.updateEmergencyConfig(config).catch(() => {});
  };

  const updateSecuritySettings = (settings: Partial<SecuritySettingsState>) => {
    setSecuritySettings((prev) => ({ ...prev, ...settings }));
    vaultApi.updateSecuritySettings(settings).catch(() => {});
  };

  return (
    <VaultContext.Provider
      value={{
        documents,
        emergencyContacts,
        trustedContacts,
        sharedAccessRecords,
        emergencyAccessConfig,
        securitySettings,
        offlineAccessSettings,
        addDocument,
        updateDocument,
        deleteDocument,
        attachDocumentFile,
        addDocumentWithFile,
        addEmergencyContact,
        deleteEmergencyContact,
        toggleTrustedContactVaultAccess,
        toggleOfflineDocType,
        addSharedAccess,
        revokeSharedAccess,
        updateEmergencyAccessConfig,
        updateSecuritySettings,
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
