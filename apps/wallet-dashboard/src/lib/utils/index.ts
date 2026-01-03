import { TransactionType, TransactionStatus, Locale } from '@/types';

// ============================================
// Currency Formatting
// ============================================

export function formatCurrency(amount: number, locale: Locale = 'ar'): string {
  const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${formatter.format(amount)} ${locale === 'ar' ? 'ج.م' : 'EGP'}`;
}

export function formatNumber(num: number, locale: Locale = 'ar'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG').format(num);
}

// ============================================
// Date Formatting
// ============================================

export function formatDate(dateStr: string, locale: Locale = 'ar'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string, locale: Locale = 'ar'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string, locale: Locale = 'ar'): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string, locale: Locale = 'ar'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === 'ar') {
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return formatDate(dateStr, locale);
  } else {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr, locale);
  }
}

// ============================================
// Phone Number Formatting
// ============================================

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Format as 010 1234 5678
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function validatePhoneNumber(phone: string): boolean {
  const pattern = /^01[0125]\d{8}$/;
  return pattern.test(phone.replace(/\s/g, ''));
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

// ============================================
// Transaction Helpers
// ============================================

export function getTransactionTypeLabel(type: TransactionType, locale: Locale = 'ar'): string {
  const labels: Record<TransactionType, { ar: string; en: string }> = {
    PAYMENT_REQUEST: { ar: 'طلب دفع', en: 'Payment Request' },
    QR: { ar: 'دفع QR', en: 'QR Payment' },
    API: { ar: 'دفع API', en: 'API Payment' },
    TRANSFER: { ar: 'تحويل', en: 'Transfer' },
    BILL_PAYMENT: { ar: 'دفع فاتورة', en: 'Bill Payment' },
    TOPUP: { ar: 'شحن رصيد', en: 'Top Up' },
    WITHDRAWAL: { ar: 'سحب', en: 'Withdrawal' },
    REFUND: { ar: 'استرداد', en: 'Refund' },
  };
  
  return labels[type]?.[locale] || type;
}

export function getTransactionTypeIcon(type: TransactionType): string {
  const icons: Record<TransactionType, string> = {
    PAYMENT_REQUEST: '📱',
    QR: '📷',
    API: '🔗',
    TRANSFER: '↔️',
    BILL_PAYMENT: '📄',
    TOPUP: '💳',
    WITHDRAWAL: '🏦',
    REFUND: '↩️',
  };
  
  return icons[type] || '💰';
}

export function getTransactionStatusLabel(status: TransactionStatus, locale: Locale = 'ar'): string {
  const labels: Record<TransactionStatus, { ar: string; en: string }> = {
    PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
    COMPLETED: { ar: 'مكتمل', en: 'Completed' },
    FAILED: { ar: 'فشل', en: 'Failed' },
    REFUNDED: { ar: 'مسترد', en: 'Refunded' },
    CANCELLED: { ar: 'ملغي', en: 'Cancelled' },
  };
  
  return labels[status]?.[locale] || status;
}

export function getTransactionStatusColor(status: TransactionStatus): string {
  const colors: Record<TransactionStatus, string> = {
    PENDING: 'warning',
    COMPLETED: 'success',
    FAILED: 'danger',
    REFUNDED: 'primary',
    CANCELLED: 'gray',
  };
  
  return colors[status] || 'gray';
}

export function isDebitTransaction(type: TransactionType): boolean {
  return ['PAYMENT_REQUEST', 'QR', 'API', 'BILL_PAYMENT', 'WITHDRAWAL', 'TRANSFER'].includes(type);
}

// ============================================
// Validation Helpers
// ============================================

export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function validateOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

export function validateAmount(amount: number, min: number = 1, max: number = 50000): boolean {
  return amount >= min && amount <= max;
}

export function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// ============================================
// Storage Helpers
// ============================================

export function setStorageItem(key: string, value: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch {
        return defaultValue;
      }
    }
  }
  return defaultValue;
}

export function removeStorageItem(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}

// ============================================
// Debounce & Throttle
// ============================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// Copy to Clipboard
// ============================================

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// ============================================
// Generate Reference
// ============================================

export function generateReference(prefix: string = 'HP'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================
// Class Names Helper
// ============================================

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
