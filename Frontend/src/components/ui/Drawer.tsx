import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Drawer: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode; description?: string; closeLabel?: string; id?: string; panelClassName?: string }> = ({ isOpen, onClose, title, children, footer, description = 'Choose what matters for your next adventure.', closeLabel = 'Close filters', id, panelClassName = 'w-[94vw] sm:w-[480px]' }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [present, setPresent] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (isOpen) { setPresent(true); setClosing(false); return; }
    if (!present) return;
    setClosing(true);
    const timer = window.setTimeout(() => setPresent(false), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220);
    return () => window.clearTimeout(timer);
  }, [isOpen, present]);
  useEffect(() => {
    if (!present) return;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, [present]);
  if (!present || typeof document === 'undefined') return null;
  return createPortal(
    <dialog id={id} ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }} className={`side-drawer ${closing ? 'side-drawer-closing' : ''} fixed inset-y-0 left-auto right-0 m-0 ${panelClassName} max-w-none h-[100dvh] max-h-none p-0 border-0 bg-white text-text shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm`}>
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border bg-emerald-50/60 shrink-0"><div><h2 id={titleId} className="font-heading font-bold text-xl">{title}</h2>{description && <p className="text-xs text-text-muted mt-1">{description}</p>}</div><button type="button" onClick={onClose} aria-label={closeLabel} className="rounded-full p-2 hover:bg-emerald-100"><X className="w-5 h-5" /></button></header>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        <footer className="shrink-0 border-t border-border bg-white p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</footer>
      </div>
    </dialog>, document.body,
  );
};
