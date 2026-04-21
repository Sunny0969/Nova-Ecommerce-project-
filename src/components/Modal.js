import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Reusable confirmation / dialog modal (Tailwind).
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.confirmLabel='Confirm']
 * @param {string} [props.cancelLabel='Cancel']
 * @param {() => void} [props.onConfirm]
 * @param {boolean} [props.danger=false] — red confirm button
 * @param {boolean} [props.hideCancel=false]
 * @param {string} [props.className]
 */

export default function Modal({
  isOpen,
  onClose,
  title = 'Confirm',
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  danger = false,
  hideCancel = false,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const confirmClasses = danger
    ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600'
    : 'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900';

  const node = (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative z-[1001] flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white shadow-2xl sm:rounded-2xl ${className}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="modal-title" className="text-base font-semibold text-neutral-900 sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {children != null && (
          <div className="overflow-y-auto px-4 py-3 text-sm leading-relaxed text-neutral-600 sm:px-5 sm:py-4 sm:text-base">
            {children}
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-5 sm:py-4">
          {!hideCancel && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:min-h-0 sm:w-auto"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onConfirm?.()}
            className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-h-0 sm:w-auto ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
