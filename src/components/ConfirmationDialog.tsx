import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    confirmButtonRef.current?.focus();

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel, isLoading]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      iconBg: 'bg-red-500/20',
      button: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
    },
    warning: {
      icon: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      button: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
    },
    info: {
      icon: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      button: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !isLoading && onCancel()}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-xl transform transition-all"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mb-4`}>
            <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
          </div>

          {/* Title */}
          <h3
            id="dialog-title"
            className="text-lg font-semibold text-white text-center mb-2"
          >
            {title}
          </h3>

          {/* Message */}
          <p className="text-slate-400 text-center text-sm mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${styles.button}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
