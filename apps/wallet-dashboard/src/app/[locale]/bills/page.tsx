'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Header } from '@/components/layouts';
import { Card, Button, Input, Badge, EmptyState, SuccessModal, PINModal, Skeleton } from '@/components/ui';
import { GET_BILL_CATEGORIES, INQUIRE_BILL, PAY_BILL, GET_SAVED_BILLERS, GET_BILL_HISTORY } from '@/lib/graphql/queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BillCategory, Biller, BillInquiry, SavedBiller, BillPayment } from '@/types';

export default function BillsPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'pay' | 'saved' | 'history'>('pay');
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [billInfo, setBillInfo] = useState<BillInquiry | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const t = locale === 'ar' ? {
    title: 'دفع الفواتير', payBill: 'دفع فاتورة', saved: 'المحفوظة', history: 'السجل',
    selectCategory: 'اختر الفئة', selectBiller: 'اختر مزود الخدمة', accountNumber: 'رقم الحساب',
    enterAccount: 'أدخل رقم الحساب', inquire: 'استعلام', inquiring: 'جاري الاستعلام...',
    billDetails: 'تفاصيل الفاتورة', subscriberName: 'اسم المشترك', billAmount: 'قيمة الفاتورة',
    dueDate: 'تاريخ الاستحقاق', pay: 'دفع الفاتورة', enterPin: 'أدخل رمز PIN',
    paymentSuccess: 'تم الدفع بنجاح!', reference: 'رقم المرجع', done: 'تم',
    noSavedBills: 'لا توجد فواتير محفوظة', noHistory: 'لا يوجد سجل مدفوعات', back: 'رجوع',
  } : {
    title: 'Pay Bills', payBill: 'Pay Bill', saved: 'Saved', history: 'History',
    selectCategory: 'Select Category', selectBiller: 'Select Provider', accountNumber: 'Account Number',
    enterAccount: 'Enter account number', inquire: 'Inquire', inquiring: 'Inquiring...',
    billDetails: 'Bill Details', subscriberName: 'Subscriber Name', billAmount: 'Bill Amount',
    dueDate: 'Due Date', pay: 'Pay Bill', enterPin: 'Enter PIN',
    paymentSuccess: 'Payment Successful!', reference: 'Reference', done: 'Done',
    noSavedBills: 'No saved bills', noHistory: 'No payment history', back: 'Back',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const { data: categoriesData, loading: loadingCategories } = useQuery(GET_BILL_CATEGORIES);
  const { data: savedData } = useQuery(GET_SAVED_BILLERS, { variables: { userId: user?.id }, skip: !user?.id });
  const { data: historyData } = useQuery(GET_BILL_HISTORY, { variables: { userId: user?.id, limit: 20 }, skip: !user?.id });
  const [inquireBill, { loading: inquiring }] = useLazyQuery(INQUIRE_BILL);
  const [payBill, { loading: paying }] = useMutation(PAY_BILL);

  const categories: BillCategory[] = categoriesData?.billCategories || [];
  const savedBillers: SavedBiller[] = savedData?.savedBillers || [];
  const billHistory: BillPayment[] = historyData?.billPaymentHistory || [];

  const handleInquire = async () => {
    if (!selectedBiller || !accountNumber) return;
    const { data } = await inquireBill({ variables: { billerId: selectedBiller.id, accountNumber } });
    if (data?.inquireBill?.success) setBillInfo(data.inquireBill);
    else toast.error(data?.inquireBill?.message || 'Failed to inquire bill');
  };

  const handlePaySubmit = async (pin: string) => {
    try {
      const { data } = await payBill({ variables: { input: { userId: user?.id, billerId: selectedBiller?.id, accountNumber, amount: billInfo?.amount, pin } } });
      if (data?.payBill?.success) { setPaymentResult(data.payBill); setShowPinModal(false); setShowSuccess(true); }
      else toast.error(data?.payBill?.message);
    } catch (err: any) { toast.error(err.message); }
  };

  const resetFlow = () => { setSelectedCategory(null); setSelectedBiller(null); setAccountNumber(''); setBillInfo(null); };

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} locale={locale} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} locale={locale} />
      <div className="px-4 py-4">
        <div className="flex gap-2 mb-4">
          {(['pay', 'saved', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {tab === 'pay' ? t.payBill : tab === 'saved' ? t.saved : t.history}
            </button>
          ))}
        </div>

        {activeTab === 'pay' && (
          <div className="space-y-4">
            {!selectedCategory ? (
              <>
                <p className="text-sm text-gray-500 mb-2">{t.selectCategory}</p>
                <div className="grid grid-cols-3 gap-3">
                  {loadingCategories ? Array(9).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
                  : categories.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-500 transition-colors text-center">
                      <span className="text-2xl block mb-2">{cat.icon}</span>
                      <span className="text-xs text-gray-700">{locale === 'ar' ? cat.nameAr : cat.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : !selectedBiller ? (
              <>
                <button onClick={() => setSelectedCategory(null)} className="text-primary-600 text-sm mb-2">← {t.back}</button>
                <p className="text-sm text-gray-500 mb-2">{t.selectBiller}</p>
                <div className="space-y-2">
                  {selectedCategory.billers?.map((biller) => (
                    <button key={biller.id} onClick={() => setSelectedBiller(biller)} className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-primary-500 transition-colors text-right flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">{selectedCategory.icon}</div>
                      <span className="font-medium text-gray-800">{locale === 'ar' ? biller.nameAr : biller.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : !billInfo ? (
              <>
                <button onClick={() => setSelectedBiller(null)} className="text-primary-600 text-sm mb-2">← {t.back}</button>
                <Card>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-xl">{selectedCategory.icon}</div>
                    <div><p className="font-bold text-gray-800">{locale === 'ar' ? selectedBiller.nameAr : selectedBiller.name}</p><p className="text-sm text-gray-500">{locale === 'ar' ? selectedCategory.nameAr : selectedCategory.name}</p></div>
                  </div>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} label={t.accountNumber} placeholder={selectedBiller.accountHint || t.enterAccount} />
                  <Button fullWidth className="mt-4" onClick={handleInquire} loading={inquiring} disabled={!accountNumber}>{inquiring ? t.inquiring : t.inquire}</Button>
                </Card>
              </>
            ) : (
              <>
                <button onClick={() => setBillInfo(null)} className="text-primary-600 text-sm mb-2">← {t.back}</button>
                <Card>
                  <h3 className="font-bold text-gray-800 mb-4">{t.billDetails}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t.subscriberName}</span><span className="font-medium">{billInfo.subscriberName}</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t.billAmount}</span><span className="font-bold text-primary-600">{formatCurrency(billInfo.amount || 0, locale)}</span></div>
                    {billInfo.dueDate && <div className="flex justify-between py-2"><span className="text-gray-500">{t.dueDate}</span><span className="font-medium">{formatDate(billInfo.dueDate, locale)}</span></div>}
                  </div>
                  <Button fullWidth className="mt-4" onClick={() => setShowPinModal(true)}>{t.pay}</Button>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          savedBillers.length === 0 ? <EmptyState icon="📄" title={t.noSavedBills} />
          : <div className="space-y-2">{savedBillers.map((sb) => (
            <Card key={sb.id} onClick={() => { setSelectedBiller(sb.biller!); setAccountNumber(sb.accountNumber); setActiveTab('pay'); }}>
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">{sb.category?.icon}</div><div><p className="font-medium">{sb.nickname || sb.accountNumber}</p><p className="text-sm text-gray-500">{locale === 'ar' ? sb.biller?.nameAr : sb.biller?.name}</p></div></div>
            </Card>
          ))}</div>
        )}

        {activeTab === 'history' && (
          billHistory.length === 0 ? <EmptyState icon="📋" title={t.noHistory} />
          : <div className="space-y-2">{billHistory.map((payment) => (
            <Card key={payment.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">{payment.category?.icon}</div><div><p className="font-medium">{locale === 'ar' ? payment.biller?.nameAr : payment.biller?.name}</p><p className="text-sm text-gray-500">{payment.accountNumber}</p></div></div>
                <div className="text-left"><p className="font-bold text-gray-800">{formatCurrency(payment.amount, locale)}</p><p className="text-xs text-gray-500">{formatDate(payment.paidAt || '', locale)}</p></div>
              </div>
            </Card>
          ))}</div>
        )}
      </div>

      <PINModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSubmit={handlePaySubmit} title={t.enterPin} loading={paying} />
      <SuccessModal isOpen={showSuccess} onClose={() => { setShowSuccess(false); resetFlow(); }} title={t.paymentSuccess} buttonText={t.done}>
        <div className="text-center space-y-2"><p className="text-2xl font-bold">{formatCurrency(billInfo?.amount || 0, locale)}</p>{paymentResult?.reference && <p className="text-sm text-gray-500">{t.reference}: {paymentResult.reference}</p>}</div>
      </SuccessModal>
    </div>
  );
}
