import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-slate-900/90 border-cyan-500/50 text-cyan-100 shadow-cyan-500/10'
              : toast.type === 'error'
              ? 'bg-slate-900/90 border-rose-500/50 text-rose-100 shadow-rose-500/10'
              : 'bg-slate-900/90 border-violet-500/50 text-violet-100 shadow-violet-500/10'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />}

          <div className="flex-1 text-sm leading-relaxed">{toast.message}</div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
