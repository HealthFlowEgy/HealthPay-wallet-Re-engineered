// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  nationalId?: string;
  role: 'USER' | 'MERCHANT' | 'ADMIN';
  kycLevel: 'NONE' | 'BASIC' | 'VERIFIED' | 'FULL';
  createdAt: string;
  wallet?: Wallet;
}

// ============================================
// Wallet Types
// ============================================

export interface Wallet {
  id: string;
  balance: number;
  pendingBalance: number;
  currency: string;
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailySpent: number;
  monthlySpent: number;
}

export interface WalletAnalytics {
  totalIn: number;
  totalOut: number;
  transactionCount: number;
  avgTransaction: number;
  periodStart: string;
  periodEnd: string;
}

// ============================================
// Transaction Types
// ============================================

export type TransactionType = 
  | 'PAYMENT_REQUEST'
  | 'QR'
  | 'API'
  | 'TRANSFER'
  | 'BILL_PAYMENT'
  | 'TOPUP'
  | 'WITHDRAWAL'
  | 'REFUND';

export type TransactionStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fee: number;
  net: number;
  status: TransactionStatus;
  reference?: string;
  description?: string;
  fromWalletId?: string;
  toWalletId?: string;
  merchantId?: string;
  customerId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  merchant?: Merchant;
  customer?: MerchantCustomer;
}

// ============================================
// Transfer Types
// ============================================

export interface TransferInput {
  fromWalletId: string;
  toPhoneNumber: string;
  amount: number;
  description?: string;
  pin: string;
}

export interface TransferResult {
  success: boolean;
  message: string;
  transaction?: Transaction;
  reference?: string;
}

// ============================================
// Top Up Types
// ============================================

export type TopUpMethod = 'CARD' | 'FAWRY' | 'VODAFONE_CASH' | 'INSTAPAY' | 'BANK_TRANSFER';

export interface TopUpInput {
  walletId: string;
  amount: number;
  method: TopUpMethod;
  pin: string;
}

export interface TopUpResult {
  success: boolean;
  message: string;
  transaction?: Transaction;
  reference?: string;
  paymentUrl?: string;
  fawryCode?: string;
}

// ============================================
// Bill Payment Types
// ============================================

export interface BillCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  order: number;
  active: boolean;
  billers: Biller[];
}

export interface Biller {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string;
  code: string;
  accountFormat: string;
  accountHint: string;
  apiEndpoint?: string;
  active: boolean;
}

export interface BillInquiry {
  success: boolean;
  subscriberName?: string;
  amount?: number;
  dueDate?: string;
  period?: string;
  billNumber?: string;
  message?: string;
}

export interface SavedBiller {
  id: string;
  userId: string;
  billerId: string;
  accountNumber: string;
  nickname?: string;
  biller?: Biller;
  category?: BillCategory;
}

export interface BillPayment {
  id: string;
  userId: string;
  billerId: string;
  accountNumber: string;
  amount: number;
  reference: string;
  status: TransactionStatus;
  billNumber?: string;
  subscriberName?: string;
  paidAt?: string;
  biller?: Biller;
  category?: BillCategory;
}

export interface PayBillInput {
  userId: string;
  billerId: string;
  accountNumber: string;
  amount: number;
  pin: string;
}

export interface PayBillResult {
  success: boolean;
  message: string;
  reference?: string;
  newBalance?: number;
}

// ============================================
// Merchant Types
// ============================================

export interface Merchant {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  businessType?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface MerchantCustomer {
  id: string;
  merchantId: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  transactionCount: number;
  avgTransaction: number;
  firstTransaction?: string;
  lastTransaction?: string;
  tags: string[];
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = 
  | 'TRANSACTION'
  | 'PAYMENT'
  | 'TRANSFER'
  | 'BILL'
  | 'SECURITY'
  | 'PROMO'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// ============================================
// Medical Card Types
// ============================================

export interface MedicalCard {
  id: string;
  userId: string;
  cardNumber: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  balance: number;
  dailyLimit: number;
  expiryDate: string;
  beneficiaries: Beneficiary[];
}

export interface Beneficiary {
  id: string;
  cardId: string;
  name: string;
  relation: string;
  nationalId: string;
  isActive: boolean;
}

// ============================================
// Auth Types
// ============================================

export interface SendOTPInput {
  phoneNumber: string;
}

export interface SendOTPResult {
  success: boolean;
  message?: string;
  expiresIn?: number;
  devOTP?: string;
}

export interface VerifyOTPInput {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOTPResult {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  isNewUser?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// UI Types
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// ============================================
// i18n Types
// ============================================

export type Locale = 'ar' | 'en';

export interface LocaleParams {
  params: {
    locale: Locale;
  };
}
