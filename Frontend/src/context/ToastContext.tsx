import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: Toast = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast container - positioned below mobile header (top-16) to avoid blocking brand logo, top-right on desktop */}
      <div 
        className="fixed top-16 sm:top-4 inset-x-0 sm:inset-x-auto sm:right-4 z-50 flex flex-col items-center sm:items-end gap-1.5 pointer-events-none px-3 w-fit sm:w-full sm:max-w-sm mx-auto sm:mx-0"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-3 rounded-full sm:rounded-2xl shadow-float border backdrop-blur-md max-w-[92vw] sm:max-w-none transition-all ${
                toast.type === 'success'
                  ? 'bg-white/95 border-emerald-500/30 text-slate-800'
                  : toast.type === 'error'
                  ? 'bg-white/95 border-red-300 text-slate-800'
                  : 'bg-white/95 border-slate-200 text-slate-800'
              }`}
            >
              <div className="shrink-0 flex items-center">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />}
                {toast.type === 'info' && <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                {toast.title && (
                  <h4 className="font-semibold text-slate-900 text-[11px] sm:text-xs leading-tight mb-0.5 truncate">
                    {toast.title}
                  </h4>
                )}
                <p className="text-[11px] sm:text-xs text-slate-600 leading-snug truncate sm:whitespace-normal">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 sm:p-1 rounded-full transition-colors shrink-0 ml-0.5"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
