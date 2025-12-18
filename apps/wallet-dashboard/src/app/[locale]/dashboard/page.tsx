'use client';

import React, { useState, useEffect, useCallback } from 'react';

// =============================================================================
// CONFIGURATION - Set to false to use real backend
// =============================================================================
const USE_DEMO_DATA = false; // Changed to false for production
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';

// =============================================================================
// GRAPHQL QUERIES & MUTATIONS
// =============================================================================

const WALLET_DASHBOARD_QUERY = `
  query WalletDashboard {
    me {
      id
      firstName
      lastName
      fullName
      phoneNumber
      kycLevel
    }
    myWallet {
      id
      balance
      availableBalance
      pendingBalance
      currency
      dailyLimit
      monthlyLimit
      dailyUsed
      monthlyUsed
    }
    myTransactions(pagination: { limit: 10 }) {
      items {
        id
        reference
        type
        status
        amount
        fee
        netAmount
        description
        createdAt
        sender { id fullName phoneNumber }
        recipient { id fullName phoneNumber }
        merchant { id businessName }
      }
    }
  }
`;

const LOOKUP_RECIPIENT_QUERY = `
  query LookupRecipient($phoneNumber: String!) {
    lookupRecipient(phoneNumber: $phoneNumber) {
      found
      user {
        id
        fullName
        phoneNumber
      }
      message
    }
  }
`;

const SEND_MONEY_MUTATION = `
  mutation SendMoney($input: SendMoneyInput!) {
    sendMoney(input: $input) {
      success
      message
      transaction {
        id
        reference
        amount
        fee
        netAmount
        status
        createdAt
      }
      newBalance
    }
  }
`;

const TOP_UP_MUTATION = `
  mutation TopUpWallet($input: TopUpInput!) {
    topUpWallet(input: $input) {
      success
      message
      transaction {
        id
        reference
        status
      }
      paymentUrl
    }
  }
`;

// =============================================================================
// API HELPER
// =============================================================================

async function graphqlRequest(query: string, variables?: any) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('healthpay_token') : null;
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL error');
  }
  
  return result.data;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getTransactionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    TOPUP: '💳', WITHDRAWAL: '🏦', TRANSFER_SENT: '📤',
    TRANSFER_RECEIVED: '📥', PAYMENT: '🛒', REFUND: '↩️',
  };
  return icons[type] || '💰';
};

const getTransactionColor = (type: string): string => {
  const colors: Record<string, string> = {
    TOPUP: 'text-green-600', WITHDRAWAL: 'text-red-600',
    TRANSFER_SENT: 'text-red-600', TRANSFER_RECEIVED: 'text-green-600',
    PAYMENT: 'text-red-600', REFUND: 'text-green-600',
  };
  return colors[type] || 'text-gray-600';
};

const getTransactionSign = (type: string): string => {
  return ['TOPUP', 'TRANSFER_RECEIVED', 'REFUND'].includes(type) ? '+' : '-';
};

const getStatusBadge = (status: string): { label: string; color: string } => {
  const badges: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: 'مكتمل', color: 'bg-green-100 text-green-700' },
    PENDING: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
    PROCESSING: { label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-700' },
    FAILED: { label: 'فشل', color: 'bg-red-100 text-red-700' },
  };
  return badges[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
};

// =============================================================================
// DEMO DATA (fallback only)
// =============================================================================

const DEMO_DATA = {
  user: { id: 'demo', firstName: 'أحمد', lastName: 'محمد', fullName: 'أحمد محمد', phoneNumber: '+201234567890', kycLevel: 'LEVEL_1' },
  wallet: { id: 'demo-wallet', balance: 15250.50, availableBalance: 15250.50, pendingBalance: 0, currency: 'EGP', dailyLimit: 10000, monthlyLimit: 50000, dailyUsed: 2500, monthlyUsed: 12500 },
  transactions: [],
};

// =============================================================================
// SEND MONEY MODAL
// =============================================================================

interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

function SendMoneyModal({ isOpen, onClose, availableBalance, onSuccess }: SendMoneyModalProps) {
  const [step, setStep] = useState<'phone' | 'confirm' | 'pin' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [recipient, setRecipient] = useState<{ id: string; fullName: string; phoneNumber: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [saveRecipient, setSaveRecipient] = useState(false);

  const resetModal = useCallback(() => {
    setStep('phone');
    setPhoneNumber('');
    setAmount('');
    setNote('');
    setPin('');
    setRecipient(null);
    setError('');
    setLoading(false);
    setTransactionResult(null);
    setSaveRecipient(false);
  }, []);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // REAL GraphQL lookup
  const handleLookupRecipient = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await graphqlRequest(LOOKUP_RECIPIENT_QUERY, { phoneNumber });
      
      if (data.lookupRecipient.found && data.lookupRecipient.user) {
        setRecipient(data.lookupRecipient.user);
        setStep('confirm');
      } else {
        setError(data.lookupRecipient.message || 'لم يتم العثور على المستخدم');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAmount = () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    if (amountNum > availableBalance) {
      setError('المبلغ أكبر من الرصيد المتاح');
      return;
    }
    
    if (amountNum < 1) {
      setError('الحد الأدنى للتحويل 1 ج.م');
      return;
    }

    setError('');
    setStep('pin');
  };

  // REAL GraphQL send money
  const handleSendMoney = async () => {
    if (pin.length < 4) {
      setError('يرجى إدخال رمز PIN كامل');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await graphqlRequest(SEND_MONEY_MUTATION, {
        input: {
          recipientPhone: recipient?.phoneNumber,
          amount: parseFloat(amount),
          pin,
          note: note || undefined,
          saveRecipient,
        },
      });

      if (data.sendMoney.success) {
        setTransactionResult(data.sendMoney);
        setStep('success');
        onSuccess();
      } else {
        setError(data.sendMoney.message || 'فشل التحويل');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحويل');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">تحويل أموال</h2>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress Steps */}
          <div className="flex mt-4">
            {['phone', 'confirm', 'pin', 'success'].map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === s ? 'bg-white text-teal-600' : 
                  ['phone', 'confirm', 'pin', 'success'].indexOf(step) > i ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'
                }`}>
                  {i + 1}
                </div>
                {i < 3 && <div className={`flex-1 h-1 mx-2 rounded ${
                  ['phone', 'confirm', 'pin', 'success'].indexOf(step) > i ? 'bg-white/50' : 'bg-white/10'
                }`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Phone */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف المستلم</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🇪🇬</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full pr-12 pl-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg"
                    dir="ltr"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={handleLookupRecipient}
                disabled={loading || !phoneNumber}
                className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'جاري البحث...' : 'متابعة'}
              </button>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 'confirm' && recipient && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-sm text-teal-600 mb-1">المستلم</p>
                <p className="font-bold text-teal-900 text-lg">{recipient.fullName}</p>
                <p className="text-sm text-teal-700" dir="ltr">{recipient.phoneNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (ج.م)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-2xl font-bold text-center"
                  dir="ltr"
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  الرصيد المتاح: {formatCurrency(availableBalance)}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className="py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    {amt}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظة (اختياري)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: سداد دين، هدية..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveRecipient}
                  onChange={(e) => setSaveRecipient(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded"
                />
                <span className="text-sm text-gray-700">حفظ هذا المستلم</span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => { setStep('phone'); setRecipient(null); }} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">رجوع</button>
                <button onClick={handleConfirmAmount} disabled={!amount || parseFloat(amount) <= 0} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50">متابعة</button>
              </div>
            </div>
          )}

          {/* Step 3: PIN */}
          {step === 'pin' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">المبلغ</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(parseFloat(amount))}</p>
                <p className="text-sm text-gray-600 mt-2">إلى: {recipient?.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">أدخل رمز PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="••••"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-3xl font-bold text-center tracking-[0.5em]"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStep('confirm'); setPin(''); }} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">رجوع</button>
                <button onClick={handleSendMoney} disabled={loading || pin.length < 4} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 disabled:opacity-50">
                  {loading ? 'جاري التحويل...' : 'تأكيد التحويل'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && transactionResult && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">تم التحويل بنجاح!</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">المبلغ المحول</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(transactionResult.transaction.amount)}</p>
                <p className="text-sm text-gray-600 mt-2">إلى: {recipient?.fullName}</p>
              </div>
              <p className="text-sm text-gray-500">رقم المرجع: {transactionResult.transaction.reference}</p>
              <button onClick={handleClose} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TOP UP MODAL
// =============================================================================

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'success'>('amount');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetModal = () => {
    setStep('amount');
    setAmount('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSelectAmount = () => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum < 10) {
      setError('الحد الأدنى للشحن 10 ج.م');
      return;
    }
    setError('');
    setStep('method');
  };

  const handleSelectMethod = async (method: string) => {
    setLoading(true);
    setStep('processing');

    try {
      const data = await graphqlRequest(TOP_UP_MUTATION, {
        input: { amount: parseFloat(amount), paymentMethod: method },
      });

      if (data.topUpWallet.paymentUrl) {
        // Redirect to payment page
        window.location.href = data.topUpWallet.paymentUrl;
      } else if (data.topUpWallet.success) {
        setStep('success');
        onSuccess();
      } else {
        setError(data.topUpWallet.message || 'فشل الشحن');
        setStep('method');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'CARD', name: 'بطاقة ائتمان/خصم', icon: '💳', desc: 'Visa, Mastercard, Meeza' },
    { id: 'FAWRY', name: 'فوري', icon: '🏪', desc: 'الدفع من أي فرع فوري' },
    { id: 'VODAFONE_CASH', name: 'فودافون كاش', icon: '📱', desc: 'التحويل من المحفظة' },
    { id: 'INSTAPAY', name: 'إنستاباي', icon: '🏦', desc: 'التحويل البنكي الفوري' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">شحن المحفظة</h2>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ الشحن (ج.م)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-3xl font-bold text-center" dir="ltr" autoFocus />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button key={amt} onClick={() => setAmount(amt.toString())} className={`py-3 border rounded-xl text-sm font-bold ${amount === amt.toString() ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <button onClick={handleSelectAmount} disabled={!amount || parseFloat(amount) < 10} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50">متابعة</button>
            </div>
          )}

          {step === 'method' && (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">مبلغ الشحن</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(amount))}</p>
              </div>
              <p className="text-sm text-gray-600 text-center">اختر طريقة الدفع</p>
              <div className="space-y-2">
                {paymentMethods.map((m) => (
                  <button key={m.id} onClick={() => handleSelectMethod(m.id)} disabled={loading} className="w-full p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 flex items-center gap-4 text-right">
                    <span className="text-3xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{m.name}</p>
                      <p className="text-sm text-gray-500">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('amount')} className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium">رجوع</button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">جاري معالجة الدفع...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">تم الشحن بنجاح!</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">المبلغ المضاف</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(amount))}</p>
              </div>
              <button onClick={handleClose} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================

export default function WalletDashboard() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showSendModal, setShowSendModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (USE_DEMO_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser(DEMO_DATA.user);
        setWallet(DEMO_DATA.wallet);
        setTransactions(DEMO_DATA.transactions);
      } else {
        const data = await graphqlRequest(WALLET_DASHBOARD_QUERY);
        setUser(data.me);
        setWallet(data.myWallet);
        setTransactions(data.myTransactions?.items || []);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تحميل البيانات');
      // Fallback to demo data on error
      setUser(DEMO_DATA.user);
      setWallet(DEMO_DATA.wallet);
      setTransactions(DEMO_DATA.transactions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleTransactionSuccess = () => {
    loadDashboard(); // Reload data after successful transaction
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const dailyProgress = wallet ? (wallet.dailyUsed / wallet.dailyLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                {user?.firstName?.charAt(0) || '؟'}
              </div>
              <div>
                <p className="text-teal-100 text-sm">مرحباً</p>
                <p className="font-bold text-lg">{user?.fullName || 'مستخدم'}</p>
              </div>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-300/30 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-teal-100 text-sm mb-1">الرصيد المتاح</p>
            <p className="text-4xl font-bold mb-4">{wallet ? formatCurrency(wallet.availableBalance) : '...'}</p>
            {wallet && wallet.pendingBalance > 0 && (
              <p className="text-teal-200 text-sm">معلق: {formatCurrency(wallet.pendingBalance)}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 -mt-16 pb-24">
        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowSendModal(true)} className="flex flex-col items-center gap-2 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="font-medium text-teal-700">تحويل أموال</span>
            </button>
            <button onClick={() => setShowTopUpModal(true)} className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-medium text-green-700">شحن المحفظة</span>
            </button>
          </div>
        </div>

        {/* Daily Limit */}
        {wallet && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">الحد اليومي</span>
              <span className="text-sm font-medium">
                {formatCurrency(wallet.dailyUsed || 0)} / {formatCurrency(wallet.dailyLimit)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${dailyProgress > 80 ? 'bg-red-500' : dailyProgress > 50 ? 'bg-yellow-500' : 'bg-teal-500'}`} 
                style={{ width: `${Math.min(dailyProgress, 100)}%` }} 
              />
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-900">آخر المعاملات</h2>
            <button className="text-teal-600 text-sm font-medium hover:text-teal-700">عرض الكل</button>
          </div>
          <div className="divide-y">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد معاملات بعد</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id}>
                  <button 
                    onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)} 
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-medium text-gray-900">
                        {tx.description || 
                          (tx.type === 'TRANSFER_SENT' ? `تحويل إلى ${tx.recipient?.fullName}` : 
                           tx.type === 'TRANSFER_RECEIVED' ? `تحويل من ${tx.sender?.fullName}` : 
                           tx.type === 'PAYMENT' ? tx.merchant?.businessName : 
                           tx.type === 'TOPUP' ? 'شحن المحفظة' : 'معاملة')}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-left">
                      <p className={`font-bold ${getTransactionColor(tx.type)}`}>
                        {getTransactionSign(tx.type)}{formatCurrency(tx.amount)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(tx.status).color}`}>
                        {getStatusBadge(tx.status).label}
                      </span>
                    </div>
                  </button>
                  {expandedTx === tx.id && (
                    <div className="px-4 pb-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">رقم المرجع</p>
                          <p className="font-mono">{tx.reference}</p>
                        </div>
                        {tx.fee > 0 && (
                          <div>
                            <p className="text-gray-500">الرسوم</p>
                            <p>{formatCurrency(tx.fee)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mode indicator */}
        <div className={`mt-6 ${USE_DEMO_DATA ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} border rounded-xl p-4 text-center`}>
          <p className={`${USE_DEMO_DATA ? 'text-yellow-800' : 'text-green-800'} font-medium`}>
            {USE_DEMO_DATA ? '🎮 وضع العرض التجريبي' : '✅ متصل بالخادم'}
          </p>
        </div>
      </main>

      <SendMoneyModal 
        isOpen={showSendModal} 
        onClose={() => setShowSendModal(false)} 
        availableBalance={wallet?.availableBalance || 0} 
        onSuccess={handleTransactionSuccess} 
      />
      <TopUpModal 
        isOpen={showTopUpModal} 
        onClose={() => setShowTopUpModal(false)} 
        onSuccess={handleTransactionSuccess} 
      />
    </div>
  );
}
