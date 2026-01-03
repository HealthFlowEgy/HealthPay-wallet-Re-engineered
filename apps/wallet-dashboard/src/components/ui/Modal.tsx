'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
}: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full h-full rounded-none',
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={cn(
            'bg-white w-full rounded-t-2xl sm:rounded-2xl shadow-xl animate-slide-up overflow-hidden',
            sizes[size],
            size === 'full' && 'h-full rounded-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              {title && (
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn('p-4', size === 'full' && 'h-full overflow-y-auto pb-safe')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'primary',
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="text-center">
        <div className={cn(
          'w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4',
          variant === 'danger' ? 'bg-danger-50' : 'bg-primary-50'
        )}>
          <span className="text-3xl">
            {variant === 'danger' ? '⚠️' : '❓'}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 py-3 rounded-xl text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2',
              variant === 'danger'
                ? 'bg-danger-500 hover:bg-danger-600'
                : 'bg-primary-500 hover:bg-primary-600'
            )}
          >
            {loading && <span className="spinner border-white border-t-transparent" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Success Modal
export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'تم',
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  buttonText?: string;
  children?: React.ReactNode;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false} closeOnOverlayClick={false}>
      <div className="text-center">
        <div className="w-20 h-20 mx-auto bg-success-50 rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
          <span className="text-4xl">✓</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        {message && <p className="text-gray-500 mb-4">{message}</p>}
        {children}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}

// PIN Modal
export function PINModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'أدخل رمز PIN',
  loading = false,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  title?: string;
  loading?: boolean;
  error?: string;
}) {
  const [pin, setPin] = React.useState('');

  const handleSubmit = () => {
    if (pin.length === 4) {
      onSubmit(pin);
    }
  };

  // Auto-submit when PIN is complete
  React.useEffect(() => {
    if (pin.length === 4 && !loading) {
      handleSubmit();
    }
  }, [pin]);

  // Reset PIN on close
  React.useEffect(() => {
    if (!isOpen) {
      setPin('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="py-4">
        <div className="flex gap-3 justify-center mb-4" dir="ltr">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'w-12 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold transition-all',
                pin.length > i
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200',
                error && 'border-danger-500 bg-danger-50'
              )}
            >
              {pin[i] ? '●' : ''}
            </div>
          ))}
        </div>
        {error && (
          <p className="text-danger-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, i) => (
            <button
              key={i}
              onClick={() => {
                if (num === 'del') {
                  setPin((prev) => prev.slice(0, -1));
                } else if (num !== null && pin.length < 4) {
                  setPin((prev) => prev + num);
                }
              }}
              disabled={loading || (num !== 'del' && num !== null && pin.length >= 4)}
              className={cn(
                'py-4 text-xl font-medium rounded-xl transition-all',
                num === null
                  ? 'invisible'
                  : num === 'del'
                  ? 'text-danger-500 hover:bg-danger-50'
                  : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
              )}
            >
              {num === 'del' ? '⌫' : num}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-4 text-primary-500">
            <span className="spinner" />
            <span>جاري التحقق...</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
