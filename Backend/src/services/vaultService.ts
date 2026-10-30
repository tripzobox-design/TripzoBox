import { VaultDocument, IVaultDocument } from '../models/VaultDocument.js';
import { VaultSettings, IVaultSettings } from '../models/VaultSettings.js';

export const vaultService = {
  /**
   * Retrieves all documents owned by a user
   */
  getUserDocuments: async (userId: string): Promise<IVaultDocument[]> => {
    return VaultDocument.find({ userId }).sort({ updatedAt: -1 });
  },

  /**
   * Checks if a user has permission to access a specific vault document
   */
  hasDocumentAccess: (doc: IVaultDocument, userId: string): boolean => {
    return doc.userId === userId;
  },

  /**
   * Retrieves or initializes vault safety settings for a user
   */
  getOrCreateSettings: async (userId: string): Promise<IVaultSettings> => {
    let settings = await VaultSettings.findOne({ userId });
    if (!settings) {
      settings = await VaultSettings.create({
        userId,
        twoFactorEnabled: false,
        autoLockMinutes: 15,
        emergencyContacts: [],
        trustedContacts: [],
        sharedAccessList: [],
      });
    }
    return settings;
  },
};
