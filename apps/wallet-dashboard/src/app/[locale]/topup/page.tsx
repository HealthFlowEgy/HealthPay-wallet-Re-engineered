'use client';

import React, { useState, useEffect } from 'react';

// =============================================================================
// CONFIGURATION
// =============================================================================
const USE_DEMO_DATA = false;
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';

// =============================================================================
// GRAPHQL MUTATIONS
// =============================================================================

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

const WALLET_QUERY = `
  query MyWallet {
    myWallet {
      id
      balance
      availableBalance
      currency
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

// =============================================================================
// PAYMENT METHODS
// =============================================================================

const PAYMENT_METHODS = [
  { id: 'card', name: 'بطاقة ائتمان/خصم', nameEn: 'Credit/Debit Card', icon: '💳', fee: '2.5%' },
  { id: 'fawry', name: 'فوري', nameEn: 'Fawry', icon: '🏪', fee: '5 ج.م' },
  { id: 'vodafone', name: 'فودافون كاش', nameEn: 'Vodafone Cash', icon: '📱', fee: '1%' },
  { id: 'instapay', name: 'انستاباي', nameEn: 'InstaPay', icon: '🏦', fee: 'مجاني' },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TopUpPage() {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [step, setStep] = useState<'amount' | 'method' | 'confirm' | 'success'>('amount');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const data = await graphqlRequest(WALLET_QUERY);
      setWallet(data.myWallet);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    }
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleAmountSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (amountNum < 10) {
      setError('الحد الأدنى للشحن 10 ج.م');
      return;
    }
    if (amountNum > 50000) {
      setError('الحد الأقصى للشحن 50,000 ج.م');
      return;
    }
    setError('');
    setStep('method');
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep('confirm');
  };

  const handleTopUp = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await graphqlRequest(TOP_UP_MUTATION, {
        input: {
          amount: parseFloat(amount),
          paymentMethod: selectedMethod,
        },
      });

      if (data.topUpWallet.success) {
        setSuccess(true);
        setStep('success');
        if (data.topUpWallet.paymentUrl) {
          window.open(data.topUpWallet.paymentUrl, '_blank');
        }
      } else {
        setError(data.topUpWallet.message || 'فشل الشحن');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الشحن');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setSelectedMethod('');
    setStep('amount');
    setError('');
    setSuccess(false);
  };

  const selectedMethodInfo = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/20 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">شحن المحفظة</h1>
          <div className="w-10" />
        </div>
        
        {wallet && (
          <div className="text-center">
            <p className="text-teal-100 text-sm">الرصيد الحالي</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet.availableBalance)}</p>
          </div>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Progress Steps */}
        <div className="flex justify-center mb-6">
          {['amount', 'method', 'confirm', 'success'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-teal-500 text-white' : 
                ['amount', 'method', 'confirm', 'success'].indexOf(step) > i ? 'bg-teal-200 text-teal-700' : 
                'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className={`w-8 h-1 ${['amount', 'method', 'confirm', 'success'].indexOf(step) > i ? 'bg-teal-200' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Amount */}
        {step === 'amount' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4">أدخل المبلغ</h2>
            
            <div className="relative mb-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-3xl font-bold text-center p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">ج.م</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  onClick={() => handleQuickAmount(value)}
                  className={`p-3 rounded-xl border-2 font-semibold transition-all ${
                    amount === value.toString() 
                      ? 'border-teal-500 bg-teal-50 text-teal-700' 
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {value} ج.م
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAmountSubmit}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
            >
              التالي
            </button>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 'method' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4">اختر طريقة الدفع</h2>
            <p className="text-gray-500 mb-4">المبلغ: {formatCurrency(parseFloat(amount))}</p>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-semibold">{method.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">رسوم: {method.fee}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('amount')}
              className="w-full mt-4 py-3 text-gray-600 hover:text-teal-600"
            >
              ← رجوع
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedMethodInfo && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4">تأكيد الشحن</h2>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-gray-500">المبلغ</span>
                <span className="font-bold">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-gray-500">طريقة الدفع</span>
                <span className="font-semibold">{selectedMethodInfo.icon} {selectedMethodInfo.name}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-gray-500">الرسوم</span>
                <span>{selectedMethodInfo.fee}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold">الإجمالي</span>
                <span className="font-bold text-teal-600">{formatCurrency(parseFloat(amount))}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleTopUp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'جاري الشحن...' : 'تأكيد الشحن'}
            </button>

            <button
              onClick={() => setStep('method')}
              className="w-full mt-4 py-3 text-gray-600 hover:text-teal-600"
            >
              ← رجوع
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">تم الشحن بنجاح!</h2>
            <p className="text-gray-500 mb-6">تم إضافة {formatCurrency(parseFloat(amount))} إلى محفظتك</p>

            <button
              onClick={resetForm}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold"
            >
              شحن مرة أخرى
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full mt-3 py-3 text-teal-600 font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
