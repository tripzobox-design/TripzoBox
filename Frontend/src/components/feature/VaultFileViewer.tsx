import { confirmAction } from '../../lib/confirmAction';
import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Globe, Upload, WifiOff } from 'lucide-react';
import { VaultDocument } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import { getBackendOrigin } from '../../lib/api';
import { loadVaultFile, validateVaultFile } from '../../lib/vaultFiles';
import { Button } from '../ui/Button';

const resolveOnlineFileUrl = (rawUrl?: string): string | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/uploads/')) {
    return `${getBackendOrigin()}${trimmed}`;
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  return null;
};

const inferMimeFromDoc = (doc: VaultDocument, url: string): string => {
  if (doc.fileMime) return doc.fileMime;
  if (url.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(url) || /\.pdf$/i.test(doc.fileName || '')) {
    return 'application/pdf';
  }
  return 'image/jpeg';
};

export interface VaultFileViewerProps {
  document: VaultDocument;
  readOnly?: boolean;
  allowDownload?: boolean;
}

export const VaultFileViewer: React.FC<VaultFileViewerProps> = ({
  document,
  readOnly = false,
  allowDownload = true,
}) => {
  const { user } = useAuth();
  const { attachDocumentFile } = useVault();
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<{
    url: string;
    type: string;
    name: string;
    mode: 'offline' | 'online';
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setSource(null);
    setMessage('');
    setBusy(true);

    (async () => {
      try {
        // 1. Check local offline IndexedDB original if owned by current user
        if (!readOnly && document.fileKey?.startsWith(`${user.id}:`)) {
          const stored = await loadVaultFile(document.fileKey).catch(() => undefined);
          if (stored && active) {
            objectUrl = URL.createObjectURL(stored.blob);
            setSource({
              url: objectUrl,
              type: stored.type || 'image/jpeg',
              name: stored.name || document.fileName || document.name,
              mode: 'offline',
            });
            return;
          }
        }

        // 2. Fallback / Online viewing: check remote backend fileUrl (or fallback thumbnailUrl)
        const remoteUrl = resolveOnlineFileUrl(document.fileUrl) || resolveOnlineFileUrl(document.thumbnailUrl);
        if (remoteUrl && active) {
          if (remoteUrl.startsWith('data:') || remoteUrl.startsWith('blob:')) {
            const blob = await (await fetch(remoteUrl)).blob();
            objectUrl = URL.createObjectURL(blob);
            if (active) {
              setSource({
                url: objectUrl,
                type: blob.type || document.fileMime || 'image/jpeg',
                name: document.fileName || document.name,
                mode: 'online',
              });
            }
          } else {
            setSource({
              url: remoteUrl,
              type: inferMimeFromDoc(document, remoteUrl),
              name: document.fileName || document.name,
              mode: 'online',
            });
          }
        }
      } catch {
        if (active) {
          setMessage('Unable to load the document preview right now. Please try again.');
        }
      } finally {
        if (active) setBusy(false);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document.id, document.fileKey, document.fileUrl, document.thumbnailUrl, document.fileName, document.fileMime, user.id, readOnly]);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || readOnly) return;
    if ((document.fileKey || document.fileUrl) && !(await confirmAction('replace', 'the original for ' + document.name))) {
      return;
    }
    setMessage('');
    try {
      validateVaultFile(file);
      setBusy(true);
      await attachDocumentFile(document.id, file);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save this file. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Document Summary Metadata */}
      {(document.referenceNumber || document.validTill || document.issuingCountry || (document.details && Object.keys(document.details).length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-left">
          {document.issuingCountry && (
            <div>
              <span className="text-gray-400 block">Issuing Country / Authority</span>
              <span className="font-semibold text-gray-900">
                {document.details?.issuingAuthority
                  ? `${document.details.issuingAuthority} (${document.issuingCountry})`
                  : document.issuingCountry}
              </span>
            </div>
          )}
          {document.referenceNumber && (
            <div>
              <span className="text-gray-400 block">Document Reference / Number</span>
              <span className="font-semibold text-gray-900 font-mono">{document.referenceNumber}</span>
            </div>
          )}
          {document.validTill && (
            <div>
              <span className="text-gray-400 block">Validity / Expiry</span>
              <span className="font-semibold text-gray-900">{document.validTill}</span>
            </div>
          )}
          {document.details?.idSubType && (
            <div>
              <span className="text-gray-400 block">Document Subtype</span>
              <span className="font-semibold text-gray-900">{document.details.idSubType}</span>
            </div>
          )}
        </div>
      )}

      {busy && <p role="status" className="text-sm text-text-muted">Loading document…</p>}

      {source ? (
        <>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-primary">
            {source.mode === 'offline' ? (
              <span className="inline-flex items-center gap-1.5">
                <WifiOff className="w-4 h-4" />
                Saved on this device · Available offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                Available online via TripzoBox Vault
              </span>
            )}
            {document.fileUrl && source.mode === 'offline' && (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Globe className="w-4 h-4" />
                Synced online
              </span>
            )}
          </div>

          {source.type === 'application/pdf' ? (
            <object
              data={source.url}
              type="application/pdf"
              aria-label={`Document PDF: ${document.name}`}
              className="w-full h-[55dvh] min-h-[280px] rounded-xl border border-border"
            >
              <p className="p-4 text-sm text-text-muted">
                Your browser cannot embed this PDF inline.
                {allowDownload && ' Use Download original below to open it.'}
              </p>
            </object>
          ) : (
            <img
              src={source.url}
              alt={`Document: ${document.name}`}
              className="w-full max-h-[60dvh] object-contain rounded-xl bg-light-bg border border-border"
            />
          )}

          {allowDownload && (
            <a
              href={source.url}
              download={source.name}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              <Download className="w-4 h-4" />
              Download document
            </a>
          )}
        </>
      ) : (
        !busy && (
          <div className="rounded-2xl border border-dashed border-border bg-light-bg p-5 text-center">
            <FileText className="w-9 h-9 text-primary mx-auto mb-3" />
            <h3 className="font-heading font-bold text-base text-text">
              {readOnly ? 'No online file attached yet' : 'Attach the original document'}
            </h3>
            <p className="text-sm text-text-muted mt-2">
              {readOnly
                ? 'The document owner only shared the metadata details without uploading a file.'
                : 'Upload your real ID image or PDF so it is available both online and offline.'}
            </p>
          </div>
        )
      )}

      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}

      {!readOnly && (
        <>
          <input
            ref={input}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={upload}
            aria-label="Attach original document"
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            icon={<Upload className="w-4 h-4" />}
            onClick={() => input.current?.click()}
          >
            {source ? 'Replace original file' : 'Upload ID image or PDF'}
          </Button>
          <p className="text-xs text-text-muted">
            PDF, JPG, PNG, or WebP · Up to 10 MB. Stored securely online in TripzoBox Vault and cached offline on your device.
          </p>
        </>
      )}
    </div>
  );
};
