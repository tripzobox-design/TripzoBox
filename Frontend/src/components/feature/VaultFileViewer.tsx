import { confirmAction } from '../../lib/confirmAction';
import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, Upload, WifiOff } from 'lucide-react';
import { VaultDocument } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useVault } from '../../context/VaultContext';
import { loadVaultFile, validateVaultFile } from '../../lib/vaultFiles';
import { Button } from '../ui/Button';

export const VaultFileViewer: React.FC<{ document: VaultDocument }> = ({ document }) => {
  const { user } = useAuth();
  const { attachDocumentFile } = useVault();
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<{ url: string; type: string; name: string } | null>(null);
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
        let stored;
        if (document.fileKey?.startsWith(`${user.id}:`)) stored = await loadVaultFile(document.fileKey);
        else if (document.fileUrl?.startsWith('data:') || document.fileUrl?.startsWith('blob:')) {
          const blob = await (await fetch(document.fileUrl)).blob();
          stored = { blob, type: blob.type, name: document.fileName || document.name };
        }
        if (stored && active) {
          objectUrl = URL.createObjectURL(stored.blob);
          setSource({ url: objectUrl, type: stored.type, name: stored.name });
        }
      } catch { if (active) setMessage('The original file is not available on this device. Attach it below.'); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [document.id, document.fileKey, document.fileUrl, document.fileName, user.id]);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (document.fileKey && !await confirmAction('replace', 'the original for ' + document.name)) return;
    setMessage('');
    try {
      validateVaultFile(file);
      setBusy(true);
      await attachDocumentFile(document.id, file);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save this file. Please try again.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    {busy && <p role="status" className="text-sm text-text-muted">Opening your original document…</p>}
    {source ? <>
      <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><WifiOff className="w-4 h-4" />Saved on this device · Available offline</p>
      {source.type === 'application/pdf' ? <object data={source.url} type="application/pdf" aria-label={`Original PDF: ${document.name}`} className="w-full h-[55dvh] min-h-[280px] rounded-xl border border-border"><p className="p-4 text-sm text-text-muted">Your browser cannot preview this PDF here. Use Download original to open it in a PDF viewer.</p></object> : <img src={source.url} alt={`Original document: ${document.name}`} className="w-full max-h-[60dvh] object-contain rounded-xl bg-light-bg border border-border" />}
      <a href={source.url} download={source.name} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover"><Download className="w-4 h-4" />Download original</a>
    </> : !busy && <div className="rounded-2xl border border-dashed border-border bg-light-bg p-5 text-center"><FileText className="w-9 h-9 text-primary mx-auto mb-3" /><h3 className="font-heading font-bold text-base text-text">Attach the original document</h3><p className="text-sm text-text-muted mt-2">This record has no ID image or PDF attached. Upload your real file to view it here, including offline.</p></div>}
    {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
    <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={upload} aria-label="Attach original document" className="hidden" />
    <Button type="button" variant="secondary" disabled={busy} icon={<Upload className="w-4 h-4" />} onClick={() => input.current?.click()}>{source ? 'Replace original file' : 'Upload ID image or PDF'}</Button>
    <p className="text-xs text-text-muted">PDF, JPG, PNG, or WebP · Up to 20 MB. Files are stored in this browser on this device; clearing site data removes them.</p>
  </div>;
};
