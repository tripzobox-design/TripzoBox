import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultDocument, EmergencyContact, SharedAccessRecord, SharedWithMeItem } from '../types';
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
  sharedWithMe: SharedWithMeItem[];
  emergencyAccessConfig: EmergencyAccessConfig;
  securitySettings: SecuritySettingsState;
  offlineAccessSettings: Record<string, boolean>;
  addDocument: (doc: Omit<VaultDocument, 'id' | 'uploadedAt'>) => Promise<VaultDocument>;
  updateDocument: (id: string, updates: Partial<VaultDocument>) => Promise<void>;
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
  ) => Promise<SharedAccessRecord>;
  revokeSharedAccess: (id: string) => void;
  refreshSharedWithMe: () => Promise<void>;
  updateEmergencyAccessConfig: (config: Partial<EmergencyAccessConfig>) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettingsState>) => void;
}

const DEFAULT_EMERGENCY_CONFIG: EmergencyAccessConfig = {
  includedDocTypes: ['Passport', 'Insurance'],
  primaryContact: '',
  secondaryContact: '',
};

const DEFAULT_SECURITY_SETTINGS: SecuritySettingsState = {
  twoFactorEnabled: true,
  autoLockTime: '15 minutes',
};

const DEFAULT_OFFLINE_ACCESS: Record<string, boolean> = {
  Passport: true,
  DrivingLicense: true,
  Insurance: false,
  Tickets: true,
  Other: false,
};

const DEMO_USER_ID = 'user_mubarak';

const scopedKey = (base: string, userId?: string): string =>
  userId && userId !== DEMO_USER_ID ? `${base}:${userId}` : base;

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

const loadDemoDocuments = (): VaultDocument[] => {
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
    } catch {
      return mockDocuments;
    }
  }
  return mockDocuments;
};

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const isDemoOfflineUser = isLoggedIn && user?.id === DEMO_USER_ID;

  const [documents, setDocuments] = useState<VaultDocument[]>(() => {
    if (!isLoggedIn) return [];
    if (user?.id === DEMO_USER_ID) return loadDemoDocuments();
    return readJson<VaultDocument[]>(scopedKey('tripzobox_vault_documents', user?.id), []);
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    if (!isLoggedIn) return [];
    if (user?.id === DEMO_USER_ID) {
      return readJson<EmergencyContact[]>('tripzobox_emergency_contacts', mockEmergencyContacts);
    }
    return readJson<EmergencyContact[]>(scopedKey('tripzobox_emergency_contacts', user?.id), []);
  });

  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>(() => {
    if (!isLoggedIn) return [];
    if (user?.id === DEMO_USER_ID) {
      return readJson<TrustedContact[]>('tripzobox_trusted_contacts', mockTrustedContacts);
    }
    return readJson<TrustedContact[]>(scopedKey('tripzobox_trusted_contacts', user?.id), []);
  });

  const [sharedAccessRecords, setSharedAccessRecords] = useState<SharedAccessRecord[]>(() => {
    if (!isLoggedIn) return [];
    if (user?.id === DEMO_USER_ID) {
      return readJson<SharedAccessRecord[]>('tripzobox_shared_access', mockSharedAccessRecords);
    }
    return readJson<SharedAccessRecord[]>(scopedKey('tripzobox_shared_access', user?.id), []);
  });

  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMeItem[]>([]);

  const [emergencyAccessConfig, setEmergencyAccessConfig] = useState<EmergencyAccessConfig>(() => {
    if (!isLoggedIn) return DEFAULT_EMERGENCY_CONFIG;
    if (user?.id === DEMO_USER_ID) {
      return readJson<EmergencyAccessConfig>('tripzobox_emergency_config', {
        includedDocTypes: ['Passport', 'Insurance'],
        primaryContact: '+91 98765 43210',
        secondaryContact: '+91 98765 43211',
      });
    }
    return readJson<EmergencyAccessConfig>(
      scopedKey('tripzobox_emergency_config', user?.id),
      DEFAULT_EMERGENCY_CONFIG
    );
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsState>(() =>
    readJson<SecuritySettingsState>(
      scopedKey('tripzobox_vault_security_settings', user?.id),
      DEFAULT_SECURITY_SETTINGS
    )
  );

  const [offlineAccessSettings, setOfflineAccessSettings] = useState<Record<string, boolean>>(() =>
    readJson<Record<string, boolean>>(
      scopedKey('tripzobox_offline_access_settings', user?.id),
      DEFAULT_OFFLINE_ACCESS
    )
  );

  // Sync Vault data whenever auth session or active user changes
  useEffect(() => {
    let active = true;

    if (!isLoggedIn || !user?.id) {
      setDocuments([]);
      setEmergencyContacts([]);
      setTrustedContacts([]);
      setSharedAccessRecords([]);
      setSharedWithMe([]);
      setEmergencyAccessConfig(DEFAULT_EMERGENCY_CONFIG);
      setSecuritySettings(DEFAULT_SECURITY_SETTINGS);
      setOfflineAccessSettings(DEFAULT_OFFLINE_ACCESS);
      return;
    }

    if (user.id === DEMO_USER_ID) {
      setDocuments(loadDemoDocuments());
      setEmergencyContacts(
        readJson<EmergencyContact[]>('tripzobox_emergency_contacts', mockEmergencyContacts)
      );
      setTrustedContacts(
        readJson<TrustedContact[]>('tripzobox_trusted_contacts', mockTrustedContacts)
      );
      setSharedAccessRecords(
        readJson<SharedAccessRecord[]>('tripzobox_shared_access', mockSharedAccessRecords)
      );
      setEmergencyAccessConfig(
        readJson<EmergencyAccessConfig>('tripzobox_emergency_config', {
          includedDocTypes: ['Passport', 'Insurance'],
          primaryContact: '+91 98765 43210',
          secondaryContact: '+91 98765 43211',
        })
      );
    } else {
      setDocuments(readJson<VaultDocument[]>(scopedKey('tripzobox_vault_documents', user.id), []));
      setEmergencyContacts(
        readJson<EmergencyContact[]>(scopedKey('tripzobox_emergency_contacts', user.id), [])
      );
      setTrustedContacts(
        readJson<TrustedContact[]>(scopedKey('tripzobox_trusted_contacts', user.id), [])
      );
      setSharedAccessRecords(
        readJson<SharedAccessRecord[]>(scopedKey('tripzobox_shared_access', user.id), [])
      );
      setEmergencyAccessConfig(
        readJson<EmergencyAccessConfig>(
          scopedKey('tripzobox_emergency_config', user.id),
          DEFAULT_EMERGENCY_CONFIG
        )
      );
      setSecuritySettings(
        readJson<SecuritySettingsState>(
          scopedKey('tripzobox_vault_security_settings', user.id),
          DEFAULT_SECURITY_SETTINGS
        )
      );
      setOfflineAccessSettings(
        readJson<Record<string, boolean>>(
          scopedKey('tripzobox_offline_access_settings', user.id),
          DEFAULT_OFFLINE_ACCESS
        )
      );
    }

    vaultApi
      .getDocuments()
      .then((serverDocs) => {
        if (active && Array.isArray(serverDocs)) {
          if (user.id !== DEMO_USER_ID || serverDocs.length > 0) {
            setDocuments(serverDocs);
          }
        }
      })
      .catch(() => {});

    vaultApi
      .getEmergencyContacts()
      .then((serverContacts) => {
        if (active && Array.isArray(serverContacts)) {
          if (user.id !== DEMO_USER_ID || serverContacts.length > 0) {
            setEmergencyContacts(serverContacts);
          }
        }
      })
      .catch(() => {});

    vaultApi
      .getTrustedContacts()
      .then((serverTrusted) => {
        if (active && Array.isArray(serverTrusted)) {
          if (user.id !== DEMO_USER_ID || serverTrusted.length > 0) {
            setTrustedContacts(serverTrusted);
          }
        }
      })
      .catch(() => {});

    vaultApi
      .getSharedAccess()
      .then((serverShared) => {
        if (active && Array.isArray(serverShared)) {
          if (user.id !== DEMO_USER_ID || serverShared.length > 0) {
            setSharedAccessRecords(serverShared);
          }
        }
      })
      .catch(() => {});

    vaultApi
      .getSettings()
      .then((serverSettings) => {
        if (active && serverSettings) {
          if (serverSettings.emergencyConfig) setEmergencyAccessConfig(serverSettings.emergencyConfig);
          if (serverSettings.securitySettings) setSecuritySettings(serverSettings.securitySettings);
        }
      })
      .catch(() => {});

    vaultApi
      .getSharedWithMe()
      .then((items) => {
        if (active && Array.isArray(items)) {
          setSharedWithMe(items);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(scopedKey('tripzobox_vault_documents', user.id), JSON.stringify(documents));
  }, [documents, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedKey('tripzobox_emergency_contacts', user.id),
      JSON.stringify(emergencyContacts)
    );
  }, [emergencyContacts, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedKey('tripzobox_trusted_contacts', user.id),
      JSON.stringify(trustedContacts)
    );
  }, [trustedContacts, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedKey('tripzobox_shared_access', user.id),
      JSON.stringify(sharedAccessRecords)
    );
  }, [sharedAccessRecords, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedKey('tripzobox_emergency_config', user.id),
      JSON.stringify(emergencyAccessConfig)
    );
  }, [emergencyAccessConfig, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedKey('tripzobox_vault_security_settings', user.id),
      JSON.stringify(securitySettings)
    );
  }, [securitySettings, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(
      scopedKey('tripzobox_offline_access_settings', user.id),
      JSON.stringify(offlineAccessSettings)
    );
  }, [offlineAccessSettings, isLoggedIn, user?.id]);

  const addDocument = async (
    doc: Omit<VaultDocument, 'id' | 'uploadedAt'>
  ): Promise<VaultDocument> => {
    const generatedId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDoc: VaultDocument = {
      ...doc,
      id: generatedId,
      uploadedAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isVerified: doc.isVerified ?? false,
    };
    setDocuments((prev) => [newDoc, ...prev]);

    try {
      const savedDoc = await vaultApi.createDocument(newDoc);
      if (savedDoc && savedDoc.id) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === generatedId ? { ...newDoc, ...savedDoc } : d))
        );
        return { ...newDoc, ...savedDoc };
      }
    } catch (err) {
      console.warn('[VaultContext] Server createDocument sync note:', err);
    }

    return newDoc;
  };

  const updateDocument = async (id: string, updates: Partial<VaultDocument>): Promise<void> => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc))
    );
    try {
      const saved = await vaultApi.updateDocument(id, updates);
      if (saved && saved.id) {
        setDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...saved } : doc)));
      }
    } catch {
      // Offline / local cache fallback already updated
    }
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

    // Also upload online so it is accessible across devices & eligible shared contacts
    let uploadedFileUrl: string | undefined;
    try {
      const uploadRes = await vaultApi.uploadFile(file);
      if (uploadRes?.url) uploadedFileUrl = uploadRes.url;
    } catch {
      // Device offline — IndexedDB offline cache still works
    }

    const fileUpdates: Partial<VaultDocument> = {
      fileKey,
      fileName: file.name,
      fileMime: file.type,
      ...(uploadedFileUrl ? { fileUrl: uploadedFileUrl } : {}),
      ...(uploadedFileUrl && file.type.startsWith('image/') ? { thumbnailUrl: uploadedFileUrl } : {}),
    };

    const next = documents.map((doc) => (doc.id === id ? { ...doc, ...fileUpdates } : doc));
    try {
      localStorage.setItem(
        scopedKey('tripzobox_vault_documents', user.id),
        JSON.stringify(next)
      );
    } catch {
      await deleteVaultFile(fileKey);
      throw new Error('Device storage is full. Free some browser storage and try again.');
    }
    setDocuments(next);
    await vaultApi.updateDocument(id, fileUpdates).catch(() => {});
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
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fileKey = `${user.id}:${id}`;
    await saveVaultFile(fileKey, file);

    let uploadedFileUrl: string | undefined = doc.fileUrl;
    try {
      const uploadRes = await vaultApi.uploadFile(file);
      if (uploadRes?.url) uploadedFileUrl = uploadRes.url;
    } catch {
      // Offline cache preserved
    }

    const newDoc: VaultDocument = {
      ...doc,
      id,
      fileKey,
      fileName: file.name,
      fileMime: file.type,
      ...(uploadedFileUrl ? { fileUrl: uploadedFileUrl } : {}),
      ...(uploadedFileUrl && file.type.startsWith('image/')
        ? { thumbnailUrl: uploadedFileUrl }
        : {}),
      uploadedAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      isVerified: doc.isVerified ?? false,
    };
    const next = [newDoc, ...documents];
    try {
      localStorage.setItem(
        scopedKey('tripzobox_vault_documents', user.id),
        JSON.stringify(next)
      );
    } catch {
      await deleteVaultFile(fileKey);
      throw new Error('Device storage is full. Free some browser storage and try again.');
    }
    setDocuments(next);
    await vaultApi.createDocument(newDoc).catch(() => {});
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

  const addSharedAccess = async (
    record: Omit<SharedAccessRecord, 'id' | 'createdAt' | 'active'>
  ): Promise<SharedAccessRecord> => {
    const newShare: SharedAccessRecord = {
      ...record,
      id: `share_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      active: true,
    };

    const serverShare = await vaultApi.createSharedAccess(newShare);
    const resolvedShare = serverShare && serverShare.id ? serverShare : newShare;

    setSharedAccessRecords((prev) => {
      const filtered = prev.filter((item) => item.id !== resolvedShare.id);
      return [resolvedShare, ...filtered];
    });
    return resolvedShare;
  };

  const refreshSharedWithMe = async () => {
    if (!isLoggedIn || !user?.id) {
      setSharedWithMe([]);
      return;
    }
    try {
      const items = await vaultApi.getSharedWithMe();
      if (Array.isArray(items)) {
        setSharedWithMe(items);
      }
    } catch {
      // Ignore transient network errors
    }
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

  // Preserve unused flag reference if needed
  void isDemoOfflineUser;

  return (
    <VaultContext.Provider
      value={{
        documents,
        emergencyContacts,
        trustedContacts,
        sharedAccessRecords,
        sharedWithMe,
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
        refreshSharedWithMe,
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
