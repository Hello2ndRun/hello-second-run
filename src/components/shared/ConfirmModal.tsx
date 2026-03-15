import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b ${isDanger ? 'border-red-100' : 'border-gray-100'}`}>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-red-50' : 'bg-[#f7f9f7]'}`}>
            <AlertTriangle size={18} className={isDanger ? 'text-red-500' : 'text-[#1a472a]'} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-tight flex-1">{title}</h3>
          <button onClick={onCancel} className="p-1 text-gray-300 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-gray-400 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] transition-all ${
              isDanger
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-[#1a472a] text-white hover:bg-[#8cc63f] hover:text-[#1a472a]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
