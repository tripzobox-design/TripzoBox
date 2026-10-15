import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, Upload, X } from 'lucide-react';
import { getConfirmation, subscribeConfirmation, resolveConfirmation } from '../../lib/confirmAction';
import { Button } from '../ui/Button';

export const ConfirmationDialog: React.FC = () => {
  const pending = useSyncExternalStore(subscribeConfirmation, getConfirmation, () => null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!pending || !dialog.current) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [pending]);
  if (!pending) return null;
  const destructive = pending.action !== 'edit';
  const Icon = pending.action === 'delete' ? Trash2 : pending.action === 'edit' ? Pencil : Upload;
  const label = pending.action === 'delete' ? 'Delete' : pending.action === 'edit' ? 'Continue editing' : 'Replace file';
  return createPortal(
    <dialog ref={dialog} aria-labelledby="confirmation-title" aria-describedby="confirmation-description"
      className="m-auto w-[calc(100%-32px)] max-w-sm rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-float backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
      onCancel={(event) => { event.preventDefault(); event.stopPropagation(); resolveConfirmation(false); }}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) resolveConfirmation(false); } }}>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex rounded-xl p-3 ${destructive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-primary'}`}><Icon className="w-5 h-5" /></span>
        <button type="button" aria-label="Close confirmation" onClick={() => resolveConfirmation(false)} className="rounded-lg p-2 text-text-muted hover:bg-light-bg"><X className="w-4 h-4" /></button>
      </div>
      <h2 id="confirmation-title" className="mt-4 font-heading font-bold text-xl text-text">{pending.action === 'delete' ? 'Confirm deletion' : pending.action === 'edit' ? 'Edit details?' : 'Replace original?'}</h2>
      <p id="confirmation-description" className="mt-2 text-sm text-text-muted leading-relaxed break-words">{pending.action === 'delete' ? `Delete ${pending.item}? This cannot be undone.` : pending.action === 'edit' ? `Edit ${pending.item}? You can review your changes before saving.` : `Replace ${pending.item}? The previous saved file will be removed.`}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button type="button" variant="secondary" autoFocus onClick={() => resolveConfirmation(false)}>Cancel</Button>
        <Button type="button" className={destructive ? '!bg-red-600 hover:!bg-red-700' : ''} onClick={() => resolveConfirmation(true)}>{label}</Button>
      </div>
    </dialog>, document.body
  );
};
