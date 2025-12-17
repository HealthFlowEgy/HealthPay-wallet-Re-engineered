// ✅ FIXED: Toast Notification System (Replace alert())
// Location: packages/ui/src/components/toast/toast-provider.tsx

'use client'

import { Toaster, toast as sonnerToast } from 'sonner'
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react'

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-cairo, sans-serif)',
          direction: 'rtl',
          textAlign: 'right'
        },
        className: 'rtl'
      }}
    />
  )
}

// ✅ Custom toast functions with Arabic support
export const toast = {
  success: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast.success(message, {
      ...options,
      icon: <CheckCircle className="w-5 h-5" />,
      className: 'bg-green-50 border-green-200'
    })
  },

  error: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast.error(message, {
      ...options,
      icon: <XCircle className="w-5 h-5" />,
      className: 'bg-red-50 border-red-200',
      duration: options?.duration || 7000 // Errors stay longer
    })
  },

  info: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast.info(message, {
      ...options,
      icon: <Info className="w-5 h-5" />,
      className: 'bg-blue-50 border-blue-200'
    })
  },

  warning: (message: string, options?: { description?: string; duration?: number }) => {
    sonnerToast.warning(message, {
      ...options,
      icon: <AlertCircle className="w-5 h-5" />,
      className: 'bg-yellow-50 border-yellow-200'
    })
  },

  loading: (message: string) => {
    return sonnerToast.loading(message, {
      className: 'bg-gray-50 border-gray-200'
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error
    })
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  }
}

// ✅ EXAMPLE USAGE - Replace all alert() calls

// ❌ OLD CODE (BEFORE):
// alert('تم حفظ الملف الشخصي بنجاح')
// alert('حدث خطأ أثناء الحفظ')
// if (confirm('هل أنت متأكد من الحذف؟')) { ... }

// ✅ NEW CODE (AFTER):
// toast.success('تم حفظ الملف الشخصي بنجاح')
// toast.error('حدث خطأ أثناء الحفظ')
// toast.warning('هل أنت متأكد من الحذف؟', { 
//   description: 'لا يمكن التراجع عن هذا الإجراء',
//   action: {
//     label: 'حذف',
//     onClick: () => handleDelete()
//   }
// })
