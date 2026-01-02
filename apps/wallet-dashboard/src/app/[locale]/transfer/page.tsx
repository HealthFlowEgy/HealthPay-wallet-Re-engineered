'use client';

import React, { useState, useEffect, useCallback } from 'react';

// =============================================================================
// CONFIGURATION
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';

// =============================================================================
// GRAPHQL QUERIES & MUTATIONS
// =============================================================================

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

const SAVED_RECIPIENTS_QUERY = `
  query SavedRecipients {
    savedRecipients {
      id
      fullName
      phoneNumber
      lastTransfer
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
// MAIN COMPONENT
// =============================================================================

export default function TransferPage() {
  const [step, setStep] = useState<'recipient' | 'amount' | 'pin' | 'success'>('recipient');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [savedRecipients, setSavedRecipients] = useState<any[]>([]);
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionResult, setTransactionResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletData] = await Promise.all([
        graphqlRequest(WALLET_QUERY),
      ]);
      setWallet(walletData.myWallet);
      
      // Try to load saved recipients
      try {
        const recipientsData = await graphqlRequest(SAVED_RECIPIENTS_QUERY);
        setSavedRecipients(recipientsData.savedRecipients || []);
      } catch (e) {
        // Saved recipients might not be implemented
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

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
        setStep('amount');
      } else {
        setError(data.lookupRecipient.message || 'لم يتم العثور على المستخدم');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSavedRecipient = (saved: any) => {
    setPhoneNumber(saved.phoneNumber);
    setRecipient(saved);
    setStep('amount');
  };

  const handleAmountSubmit = () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }
    
    if (wallet && amountNum > wallet.availableBalance) {
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
      } else {
        setError(data.sendMoney.message || 'فشل التحويل');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحويل');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('recipient');
    setPhoneNumber('');
    setAmount('');
    setNote('');
    setPin('');
    setRecipient(null);
    setError('');
    setTransactionResult(null);
    setSaveRecipient(false);
  };

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
          <h1 className="text-xl font-bold">تحويل أموال</h1>
          <div className="w-10" />
        </div>
        
        {wallet && (
          <div className="text-center">
            <p className="text-teal-100 text-sm">الرصيد المتاح</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet.availableBalance)}</p>
          </div>
        )}
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Progress Steps */}
        <div className="flex justify-center mb-6">
          {['recipient', 'amount', 'pin', 'success'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? 'bg-teal-500 text-white' : 
                ['recipient', 'amount', 'pin', 'success'].indexOf(step) > i ? 'bg-teal-200 text-teal-700' : 
                'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className={`w-8 h-1 ${['recipient', 'amount', 'pin', 'success'].indexOf(step) > i ? 'bg-teal-200' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Recipient */}
        {step === 'recipient' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4">إلى من تريد التحويل؟</h2>
            
            <div className="relative mb-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="رقم الهاتف"
                className="w-full p-4 pr-12 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">📱</span>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLookupRecipient}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'جاري البحث...' : 'بحث'}
            </button>

            {/* Saved Recipients */}
            {savedRecipients.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">المستلمون المحفوظون</h3>
                <div className="space-y-2">
                  {savedRecipients.map((saved) => (
                    <button
                      key={saved.id}
                      onClick={() => handleSelectSavedRecipient(saved)}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
                    >
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold">
                        {saved.fullName?.charAt(0)}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{saved.fullName}</p>
                        <p className="text-sm text-gray-500">{saved.phoneNumber}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && recipient && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            {/* Recipient Info */}
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl mb-6">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {recipient.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">{recipient.fullName}</p>
                <p className="text-sm text-gray-500">{recipient.phoneNumber}</p>
              </div>
            </div>

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

            <div className="mb-4">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ملاحظة (اختياري)"
                className="w-full p-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={saveRecipient}
                onChange={(e) => setSaveRecipient(e.target.checked)}
                className="w-5 h-5 text-teal-500 rounded"
              />
              <span className="text-sm text-gray-600">حفظ هذا المستلم للمرات القادمة</span>
            </label>

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

            <button
              onClick={() => { setStep('recipient'); setRecipient(null); }}
              className="w-full mt-4 py-3 text-gray-600 hover:text-teal-600"
            >
              ← تغيير المستلم
            </button>
          </div>
        )}

        {/* Step 3: PIN */}
        {step === 'pin' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-2">أدخل رمز PIN</h2>
            <p className="text-gray-500 mb-6">أدخل رمز PIN الخاص بك لتأكيد التحويل</p>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">المستلم</span>
                <span className="font-semibold">{recipient?.fullName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">المبلغ</span>
                <span className="font-bold text-teal-600">{formatCurrency(parseFloat(amount))}</span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ملاحظة</span>
                  <span>{note}</span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    pin.length > i ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                  }`}
                >
                  {pin[i] ? '●' : ''}
                </div>
              ))}
            </div>

            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              maxLength={4}
              className="opacity-0 absolute"
              autoFocus
            />

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (num === '⌫') setPin(pin.slice(0, -1));
                    else if (num !== '') setPin((pin + num).slice(0, 4));
                  }}
                  className={`p-4 text-xl font-bold rounded-xl ${
                    num === '' ? 'invisible' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSendMoney}
              disabled={loading || pin.length < 4}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'جاري التحويل...' : 'تأكيد التحويل'}
            </button>

            <button
              onClick={() => { setStep('amount'); setPin(''); }}
              className="w-full mt-4 py-3 text-gray-600 hover:text-teal-600"
            >
              ← رجوع
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && transactionResult && (
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">تم التحويل بنجاح!</h2>
            <p className="text-gray-500 mb-4">تم تحويل {formatCurrency(parseFloat(amount))} إلى {recipient?.fullName}</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">رقم المرجع</span>
                <span className="font-mono text-sm">{transactionResult.transaction?.reference}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">الرسوم</span>
                <span>{formatCurrency(transactionResult.transaction?.fee || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الرصيد الجديد</span>
                <span className="font-bold text-teal-600">{formatCurrency(transactionResult.newBalance)}</span>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold"
            >
              تحويل آخر
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
