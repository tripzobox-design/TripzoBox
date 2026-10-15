const databaseName = 'tripzobox-vault-files';
const storeName = 'originals';
export interface StoredVaultFile { blob: Blob; name: string; type: string }

const database = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(databaseName, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Local file storage is unavailable.'));
});
export const saveVaultFile = async (key: string, file: File) => {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put({ blob: file, name: file.name, type: file.type }, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not save this file on your device.'));
      transaction.onabort = () => reject(transaction.error || new Error('File storage was interrupted.'));
    });
  } finally { db.close(); }
};
export const loadVaultFile = async (key: string): Promise<StoredVaultFile | undefined> => {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(storeName).objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
};
export const deleteVaultFile = async (key: string) => {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally { db.close(); }
};
export const validateVaultFile = (file: File) => {
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a PDF, JPG, PNG, or WebP file.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Choose a file up to 20 MB.');
};
