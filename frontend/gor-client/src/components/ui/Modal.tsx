import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  'data-testid'?: string;
}

export function Modal({ open, onClose, title, children, size = 'md', 'data-testid': dataTestId }: ModalProps) {
  // Escape key + body scroll lock
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" data-testid={dataTestId}>
      <div className="fixed inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className={clsx(
        'relative z-50 bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in animate-fade-in',
        { 'w-full max-w-sm': size === 'sm', 'w-full max-w-lg': size === 'md', 'w-full max-w-2xl': size === 'lg', 'w-full max-w-4xl': size === 'xl' }
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {title && <h2 className="text-lg font-semibold text-dark-900">{title}</h2>}
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}