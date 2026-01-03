'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Header } from '@/components/layouts';
import { Card, Button, SuccessModal, PINModal } from '@/components/ui';
import { AmountInput } from '@/components/ui/Input';
import { TOP_UP_WALLET } from '@/lib/graphql/queries';
import { formatCurrency, copyToClipboard } from '@/lib/utils';
import { TopUpMethod } from '@/types';

const topUpMethods = [
  { id: 'CARD' as TopUpMethod, icon: '💳', labelAr: 'بطاقة بنكية', labelEn: 'Bank Card' },
  { id: 'FAWRY' as TopUpMethod, icon: '🏪', labelAr: 'فوري', labelEn: 'Fawry' },
  { id: 'VODAFONE_CASH' as TopUpMethod, icon: '📱', labelAr: 'فودافون كاش', labelEn: 'Vodafone Cash' },
  { id: 'INSTAPAY' as TopUpMethod, icon: '⚡', labelAr: 'إنستاباي', labelEn: 'InstaPay' },
];

export default function TopUpPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [method, setMethod] = useState<TopUpMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fawryCode, setFawryCode] = useState('');
  const [result, setResult] = useState<any>(null);

  const t = locale === 'ar' ? {
    title: 'شحن الرصيد', selectMethod: 'اختر طريقة الشحن', amount: 'المبلغ', quickAmounts: 'مبالغ سريعة',
    continue: 'متابعة', currentBalance: 'الرصيد الحالي', enterPin: 'أدخل رمز PIN',
    topupSuccess: 'تم شحن الرصيد بنجاح!', newBalance: 'الرصيد الجديد', fawryCode: 'كود فوري',
    fawryInstructions: 'اذهب لأي فرع فوري واستخدم الكود التالي', codeExpires: 'ينتهي الكود خلال 24 ساعة',
    copyCode: 'نسخ الكود', done: 'تم', minAmount: 'الحد الأدنى 10 جنيه', maxAmount: 'الحد الأقصى 5000 جنيه',
  } : {
    title: 'Top Up Wallet', selectMethod: 'Select top-up method', amount: 'Amount', quickAmounts: 'Quick amounts',
    continue: 'Continue', currentBalance: 'Current Balance', enterPin: 'Enter PIN',
    topupSuccess: 'Top-up Successful!', newBalance: 'New Balance', fawryCode: 'Fawry Code',
    fawryInstructions: 'Go to any Fawry outlet and use this code', codeExpires: 'Code expires in 24 hours',
    copyCode: 'Copy Code', done: 'Done', minAmount: 'Minimum 10 EGP', maxAmount: 'Maximum 5000 EGP',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const [topUpWallet, { loading }] = useMutation(TOP_UP_WALLET);
  const amountNum = parseFloat(amount) || 0;
  const balance = user?.wallet?.balance || 0;

  const handleContinue = () => {
    if (!method) { toast.error(t.selectMethod); return; }
    if (amountNum < 10) { toast.error(t.minAmount); return; }
    if (amountNum > 5000) { toast.error(t.maxAmount); return; }
    if (method === 'FAWRY') { const code = Math.random().toString().slice(2, 16); setFawryCode(code); setResult({ newBalance: balance + amountNum }); setShowSuccess(true); }
    else { setShowPinModal(true); }
  };

  const handlePinSubmit = async (pin: string) => {
    try {
      const { data } = await topUpWallet({ variables: { walletId: user?.wallet?.id, amount: amountNum, method } });
      if (data?.topUpWallet?.success) { setResult(data.topUpWallet); setShowPinModal(false); setShowSuccess(true); }
      else toast.error(data?.topUpWallet?.message);
    } catch (error: any) { toast.error(error.message); }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} showBack locale={locale} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} showBack backHref={`/${locale}/dashboard`} locale={locale} />
      <div className="px-4 py-6 space-y-6">
        <Card variant="gradient"><p className="text-primary-100 text-sm">{t.currentBalance}</p><p className="text-2xl font-bold">{formatCurrency(balance, locale)}</p></Card>
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t.selectMethod}</h2>
          <div className="grid grid-cols-2 gap-3">
            {topUpMethods.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`p-4 rounded-xl border-2 transition-all ${method === m.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-300'}`}>
                <span className="text-3xl block mb-2">{m.icon}</span><span className="text-sm font-medium text-gray-800">{locale === 'ar' ? m.labelAr : m.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
        <Card>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t.amount}</h2>
          <AmountInput value={amount} onChange={setAmount} />
          <div className="mt-4"><p className="text-sm text-gray-500 mb-2">{t.quickAmounts}</p>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                <button key={amt} onClick={() => setAmount(amt.toString())} className={`py-2 rounded-xl text-sm font-medium transition-colors ${amount === amt.toString() ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{amt}</button>
              ))}
            </div>
          </div>
        </Card>
        <Button fullWidth onClick={handleContinue} disabled={!method || amountNum < 10} loading={loading}>{t.continue}</Button>
      </div>
      <PINModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSubmit={handlePinSubmit} title={t.enterPin} loading={loading} />
      <SuccessModal isOpen={showSuccess} onClose={() => router.push(`/${locale}/dashboard`)} title={t.topupSuccess} buttonText={t.done}>
        <div className="space-y-4">
          {method === 'FAWRY' && fawryCode ? (
            <div className="text-center"><p className="text-gray-500 mb-2">{t.fawryCode}</p><div className="p-4 bg-gray-100 rounded-xl"><p className="text-2xl font-mono font-bold tracking-wider">{fawryCode}</p></div><p className="text-sm text-gray-500 mt-2">{t.fawryInstructions}</p><p className="text-xs text-warning-600 mt-1">{t.codeExpires}</p><Button variant="outline" className="mt-3" onClick={() => copyToClipboard(fawryCode)}>{t.copyCode}</Button></div>
          ) : (
            <div className="text-center"><p className="text-3xl font-bold text-gray-800">{formatCurrency(amountNum, locale)}</p><p className="text-gray-500 mt-2">{t.newBalance}</p><p className="text-xl font-bold text-primary-600">{formatCurrency(result?.newBalance || balance + amountNum, locale)}</p></div>
          )}
        </div>
      </SuccessModal>
    </div>
  );
}
