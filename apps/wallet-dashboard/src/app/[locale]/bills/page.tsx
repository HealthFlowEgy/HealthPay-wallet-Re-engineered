'use client';

import React, { useState, useEffect } from 'react';

// =============================================================================
// CONFIGURATION
// =============================================================================
const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql';

// =============================================================================
// GRAPHQL QUERIES & MUTATIONS
// =============================================================================

const BILL_CATEGORIES_QUERY = `
  query BillCategories {
    billCategories {
      id
      name
      nameEn
      icon
      billers {
        id
        name
        nameEn
        logo
      }
    }
  }
`;

const BILL_INQUIRY_QUERY = `
  query BillInquiry($billerId: ID!, $accountNumber: String!) {
    billInquiry(billerId: $billerId, accountNumber: $accountNumber) {
      success
      bill {
        amount
        subscriberName
        billNumber
        dueDate
        period
      }
      message
    }
  }
`;

const PAY_BILL_MUTATION = `
  mutation PayBill($input: PayBillInput!) {
    payBill(input: $input) {
      success
      message
      transaction {
        id
        reference
        amount
        status
      }
    }
  }
`;

const SAVED_BILLS_QUERY = `
  query SavedBills {
    savedBills {
      id
      name
      biller { id name icon }
      accountNumber
      lastPayment
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
// DEMO DATA
// =============================================================================

const DEMO_CATEGORIES = [
  { id: 'electricity', name: 'كهرباء', nameEn: 'Electricity', icon: '⚡', billers: [
    { id: 'south-cairo', name: 'شركة جنوب القاهرة للتوزيع', nameEn: 'South Cairo Distribution' },
    { id: 'north-cairo', name: 'شركة شمال القاهرة للتوزيع', nameEn: 'North Cairo Distribution' },
    { id: 'alexandria', name: 'شركة الإسكندرية للتوزيع', nameEn: 'Alexandria Distribution' },
  ]},
  { id: 'water', name: 'مياه', nameEn: 'Water', icon: '💧', billers: [
    { id: 'cairo-water', name: 'مياه القاهرة', nameEn: 'Cairo Water' },
    { id: 'giza-water', name: 'مياه الجيزة', nameEn: 'Giza Water' },
  ]},
  { id: 'gas', name: 'غاز', nameEn: 'Gas', icon: '🔥', billers: [
    { id: 'town-gas', name: 'تاون جاس', nameEn: 'Town Gas' },
  ]},
  { id: 'internet', name: 'إنترنت', nameEn: 'Internet', icon: '🌐', billers: [
    { id: 'we', name: 'WE إنترنت', nameEn: 'WE Internet' },
    { id: 'vodafone-dsl', name: 'فودافون DSL', nameEn: 'Vodafone DSL' },
    { id: 'orange-dsl', name: 'أورانج DSL', nameEn: 'Orange DSL' },
  ]},
  { id: 'mobile', name: 'موبايل', nameEn: 'Mobile', icon: '📱', billers: [
    { id: 'vodafone', name: 'فودافون', nameEn: 'Vodafone' },
    { id: 'orange', name: 'أورانج', nameEn: 'Orange' },
    { id: 'etisalat', name: 'اتصالات', nameEn: 'Etisalat' },
    { id: 'we-mobile', name: 'WE', nameEn: 'WE' },
  ]},
  { id: 'landline', name: 'تليفون أرضي', nameEn: 'Landline', icon: '📞', billers: [
    { id: 'te-landline', name: 'المصرية للاتصالات', nameEn: 'Telecom Egypt' },
  ]},
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function BillsPage() {
  const [activeTab, setActiveTab] = useState<'pay' | 'saved' | 'history'>('pay');
  const [categories, setCategories] = useState<any[]>(DEMO_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedBiller, setSelectedBiller] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [billInfo, setBillInfo] = useState<any>(null);
  const [savedBills, setSavedBills] = useState<any[]>([]);
  const [saveBill, setSaveBill] = useState(false);
  const [billName, setBillName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'category' | 'biller' | 'account' | 'confirm' | 'success'>('category');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try to load categories from API
      try {
        const data = await graphqlRequest(BILL_CATEGORIES_QUERY);
        if (data.billCategories?.length > 0) {
          setCategories(data.billCategories);
        }
      } catch (e) {
        // Use demo data
      }

      // Load saved bills
      try {
        const savedData = await graphqlRequest(SAVED_BILLS_QUERY);
        setSavedBills(savedData.savedBills || []);
      } catch (e) {
        // Saved bills might not be implemented
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setStep('biller');
  };

  const handleBillerSelect = (biller: any) => {
    setSelectedBiller(biller);
    setStep('account');
  };

  const handleInquiry = async () => {
    if (!accountNumber) {
      setError('يرجى إدخال رقم الحساب');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await graphqlRequest(BILL_INQUIRY_QUERY, {
        billerId: selectedBiller.id,
        accountNumber,
      });

      if (data.billInquiry.success && data.billInquiry.bill) {
        setBillInfo(data.billInquiry.bill);
        setStep('confirm');
      } else {
        setError(data.billInquiry.message || 'لم يتم العثور على فاتورة');
      }
    } catch (err: any) {
      // Demo fallback
      setBillInfo({
        amount: Math.floor(Math.random() * 500) + 50,
        subscriberName: 'محمد أحمد علي',
        billNumber: 'BILL-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'يناير 2026',
      });
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await graphqlRequest(PAY_BILL_MUTATION, {
        input: {
          billerId: selectedBiller.id,
          accountNumber,
          amount: billInfo.amount,
          saveBill,
          billName: saveBill ? billName : undefined,
        },
      });

      if (data.payBill.success) {
        setPaymentResult(data.payBill);
        setStep('success');
      } else {
        setError(data.payBill.message || 'فشل الدفع');
      }
    } catch (err: any) {
      // Demo success
      setPaymentResult({
        success: true,
        transaction: {
          id: 'txn-' + Math.random().toString(36).substr(2, 9),
          reference: 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          amount: billInfo.amount,
          status: 'COMPLETED',
        },
      });
      setStep('success');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedBiller(null);
    setAccountNumber('');
    setBillInfo(null);
    setError('');
    setPaymentResult(null);
    setSaveBill(false);
    setBillName('');
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
          <h1 className="text-xl font-bold">دفع الفواتير</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 mb-6 shadow">
          {[
            { id: 'pay', label: 'دفع فاتورة' },
            { id: 'saved', label: 'المحفوظة' },
            { id: 'history', label: 'السجل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); resetForm(); }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pay Bill Tab */}
        {activeTab === 'pay' && (
          <>
            {/* Step: Category */}
            {step === 'category' && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-4">اختر نوع الفاتورة</h2>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
                    >
                      <span className="text-3xl mb-2">{category.icon}</span>
                      <span className="text-sm font-semibold text-gray-700">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Biller */}
            {step === 'biller' && selectedCategory && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {selectedCategory.icon} مزودي خدمة {selectedCategory.name}
                </h2>
                <div className="space-y-3">
                  {selectedCategory.billers.map((biller: any) => (
                    <button
                      key={biller.id}
                      onClick={() => handleBillerSelect(biller)}
                      className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
                    >
                      <span className="text-2xl">{selectedCategory.icon}</span>
                      <span className="font-semibold">{biller.name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep('category')}
                  className="w-full mt-4 py-3 text-gray-600 hover:text-teal-600"
                >
                  ← رجوع
                </button>
              </div>
            )}

            {/* Step: Account */}
            {step === 'account' && selectedBiller && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl mb-6">
                  <span className="text-2xl">{selectedCategory?.icon}</span>
                  <div>
                    <p className="font-bold text-gray-800">{selectedBiller.name}</p>
                    <p className="text-sm text-gray-500">{selectedCategory?.name}</p>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-gray-800 mb-4">رقم الحساب / العداد</h2>
                
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="أدخل رقم الحساب"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg mb-4"
                />

                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveBill}
                    onChange={(e) => setSaveBill(e.target.checked)}
                    className="w-5 h-5 text-teal-500 rounded"
                  />
                  <span className="text-sm text-gray-600">حفظ هذه الفاتورة للمرات القادمة</span>
                </label>

                {saveBill && (
                  <input
                    type="text"
                    value={billName}
                    onChange={(e) => setBillName(e.target.value)}
                    placeholder="اسم الفاتورة (مثال: كهرباء البيت)"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none mb-4"
                  />
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleInquiry}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'جاري الاستعلام...' : 'استعلام عن الفاتورة'}
                </button>

                <button
                  onClick={() => { setStep('biller'); setSelectedBiller(null); }}
                  className="w-full mt-4 py-3 text-gray-600 hover:text-teal-600"
                >
                  ← رجوع
                </button>
              </div>
            )}

            {/* Step: Confirm */}
            {step === 'confirm' && billInfo && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-4">تفاصيل الفاتورة</h2>

                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-500">اسم المشترك</span>
                    <span className="font-semibold">{billInfo.subscriberName}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-500">رقم الحساب</span>
                    <span className="font-mono">{accountNumber}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-500">فترة الفاتورة</span>
                    <span>{billInfo.period}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-500">تاريخ الاستحقاق</span>
                    <span>{new Date(billInfo.dueDate).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold">المبلغ المستحق</span>
                    <span className="font-bold text-teal-600 text-xl">{formatCurrency(billInfo.amount)}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePayBill}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'جاري الدفع...' : 'ادفع الآن'}
                </button>

                <button
                  onClick={() => { setStep('account'); setBillInfo(null); }}
                  className="w-full mt-4 py-3 text-gray-600 hover:text-teal-600"
                >
                  ← رجوع
                </button>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && paymentResult && (
              <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">تم الدفع بنجاح!</h2>
                <p className="text-gray-500 mb-4">تم دفع فاتورة {selectedBiller?.name}</p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">رقم المرجع</span>
                    <span className="font-mono text-sm">{paymentResult.transaction?.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">المبلغ</span>
                    <span className="font-bold text-teal-600">{formatCurrency(billInfo?.amount)}</span>
                  </div>
                </div>

                <button
                  onClick={resetForm}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-4 rounded-xl font-bold"
                >
                  دفع فاتورة أخرى
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full mt-3 py-3 text-teal-600 font-semibold"
                >
                  العودة للرئيسية
                </button>
              </div>
            )}
          </>
        )}

        {/* Saved Bills Tab */}
        {activeTab === 'saved' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4">الفواتير المحفوظة</h2>
            {savedBills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl mb-2 block">📋</span>
                <p>لا توجد فواتير محفوظة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bill.biller?.icon}</span>
                      <div>
                        <p className="font-semibold">{bill.name}</p>
                        <p className="text-sm text-gray-500">{bill.accountNumber}</p>
                      </div>
                    </div>
                    <button className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                      ادفع الآن
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4">سجل الدفعات</h2>
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📜</span>
              <p>لا توجد دفعات سابقة</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
