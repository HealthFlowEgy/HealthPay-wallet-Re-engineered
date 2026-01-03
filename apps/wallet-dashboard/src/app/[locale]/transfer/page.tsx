'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useLazyQuery } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Header } from '@/components/layouts';
import { Card, Button, SuccessModal, PINModal } from '@/components/ui';
import { PhoneInput, AmountInput } from '@/components/ui/Input';
import { TRANSFER_MONEY, VALIDATE_RECIPIENT } from '@/lib/graphql/queries';
import { formatCurrency, validatePhoneNumber, formatPhoneNumber } from '@/lib/utils';

type Step = 'recipient' | 'amount' | 'review' | 'success';

export default function TransferPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  
  const [step, setStep] = useState<Step>('recipient');
  const [phone, setPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [transferResult, setTransferResult] = useState<any>(null);

  const t = locale === 'ar' ? {
    title: 'تحويل أموال', recipient: 'المستلم', enterPhone: 'أدخل رقم هاتف المستلم',
    validating: 'جاري التحقق...', recipientFound: 'تم العثور على المستلم',
    invalidRecipient: 'رقم الهاتف غير مسجل', amount: 'المبلغ', availableBalance: 'الرصيد المتاح',
    note: 'ملاحظة (اختياري)', addNote: 'أضف ملاحظة للمستلم', continue: 'متابعة',
    review: 'مراجعة التحويل', sendingTo: 'تحويل إلى', transferAmount: 'مبلغ التحويل',
    transferFee: 'رسوم التحويل', totalAmount: 'المبلغ الإجمالي', confirmTransfer: 'تأكيد التحويل',
    enterPin: 'أدخل رمز PIN', transferSuccess: 'تم التحويل بنجاح!', reference: 'رقم المرجع',
    done: 'تم', insufficientBalance: 'الرصيد غير كافي', invalidPin: 'رمز PIN غير صحيح',
    minAmount: 'الحد الأدنى 1 جنيه', maxAmount: 'الحد الأقصى 10,000 جنيه', free: 'مجاني',
  } : {
    title: 'Send Money', recipient: 'Recipient', enterPhone: 'Enter recipient phone number',
    validating: 'Validating...', recipientFound: 'Recipient found',
    invalidRecipient: 'Phone number not registered', amount: 'Amount', availableBalance: 'Available Balance',
    note: 'Note (optional)', addNote: 'Add a note for recipient', continue: 'Continue',
    review: 'Review Transfer', sendingTo: 'Sending to', transferAmount: 'Transfer Amount',
    transferFee: 'Transfer Fee', totalAmount: 'Total Amount', confirmTransfer: 'Confirm Transfer',
    enterPin: 'Enter PIN', transferSuccess: 'Transfer Successful!', reference: 'Reference',
    done: 'Done', insufficientBalance: 'Insufficient balance', invalidPin: 'Invalid PIN',
    minAmount: 'Minimum 1 EGP', maxAmount: 'Maximum 10,000 EGP', free: 'Free',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const [validateRecipient, { loading: validating }] = useLazyQuery(VALIDATE_RECIPIENT);
  const [transferMoney, { loading: transferring }] = useMutation(TRANSFER_MONEY);

  const balance = user?.wallet?.balance || 0;
  const transferFee = 0;
  const amountNum = parseFloat(amount) || 0;
  const totalAmount = amountNum + transferFee;

  useEffect(() => {
    const validate = async () => {
      const cleanPhone = phone.replace(/\s/g, '');
      if (validatePhoneNumber(cleanPhone) && cleanPhone !== user?.phoneNumber) {
        const { data } = await validateRecipient({ variables: { phoneNumber: cleanPhone } });
        setRecipientName(data?.validateRecipient?.valid ? (data.validateRecipient.name || cleanPhone) : '');
      } else setRecipientName('');
    };
    const timeout = setTimeout(validate, 500);
    return () => clearTimeout(timeout);
  }, [phone, user?.phoneNumber, validateRecipient]);

  const handleContinue = () => {
    if (step === 'recipient') {
      if (!recipientName) { toast.error(t.invalidRecipient); return; }
      setStep('amount');
    } else if (step === 'amount') {
      if (amountNum < 1) { toast.error(t.minAmount); return; }
      if (amountNum > 10000) { toast.error(t.maxAmount); return; }
      if (totalAmount > balance) { toast.error(t.insufficientBalance); return; }
      setStep('review');
    }
  };

  const handlePinSubmit = async (pin: string) => {
    setPinError('');
    try {
      const { data } = await transferMoney({
        variables: { input: { fromWalletId: user?.wallet?.id, toPhoneNumber: phone.replace(/\s/g, ''), amount: amountNum, description: note, pin } },
      });
      if (data?.transferMoney?.success) { setTransferResult(data.transferMoney); setShowPinModal(false); setStep('success'); }
      else setPinError(data?.transferMoney?.message || t.invalidPin);
    } catch (error: any) { setPinError(error.message || t.invalidPin); }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} showBack locale={locale} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} showBack backHref={step === 'recipient' ? `/${locale}/dashboard` : undefined} locale={locale} />
      <div className="px-4 py-6">
        {step === 'recipient' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t.recipient}</h2>
              <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} label={t.enterPhone} />
              {validating && <p className="text-sm text-gray-500 mt-2">{t.validating}</p>}
              {recipientName && !validating && (
                <div className="mt-4 p-3 bg-success-50 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center text-white font-bold">{recipientName.charAt(0)}</div>
                  <div><p className="font-medium text-success-800">{recipientName}</p><p className="text-xs text-success-600">{t.recipientFound}</p></div>
                </div>
              )}
            </Card>
            <Button fullWidth onClick={handleContinue} disabled={!recipientName || validating}>{t.continue}</Button>
          </div>
        )}
        {step === 'amount' && (
          <div className="space-y-6">
            <Card className="text-center py-8">
              <AmountInput value={amount} onChange={setAmount} max={balance} />
              <p className="text-sm text-gray-500 mt-4">{t.availableBalance}: <span className="font-medium text-gray-800">{formatCurrency(balance, locale)}</span></p>
            </Card>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 200, 500].map((amt) => (
                <button key={amt} onClick={() => setAmount(amt.toString())} className={`py-3 rounded-xl text-sm font-medium transition-colors ${amount === amt.toString() ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-500'}`}>{amt}</button>
              ))}
            </div>
            <Card>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.note}</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.addNote} className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500" rows={3} />
            </Card>
            <Button fullWidth onClick={handleContinue} disabled={amountNum < 1}>{t.continue}</Button>
          </div>
        )}
        {step === 'review' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t.review}</h2>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">{recipientName.charAt(0)}</div>
                <div><p className="text-sm text-gray-500">{t.sendingTo}</p><p className="font-bold text-gray-800">{recipientName}</p><p className="text-sm text-gray-500" dir="ltr">{formatPhoneNumber(phone)}</p></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.transferAmount}</span><span className="font-medium">{formatCurrency(amountNum, locale)}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.transferFee}</span><span className="font-medium text-success-600">{t.free}</span></div>
                <div className="flex justify-between py-2"><span className="font-bold text-gray-800">{t.totalAmount}</span><span className="font-bold text-primary-600">{formatCurrency(totalAmount, locale)}</span></div>
              </div>
            </Card>
            <Button fullWidth onClick={() => setShowPinModal(true)}>{t.confirmTransfer}</Button>
          </div>
        )}
      </div>
      <PINModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPinError(''); }} onSubmit={handlePinSubmit} title={t.enterPin} loading={transferring} error={pinError} />
      <SuccessModal isOpen={step === 'success'} onClose={() => router.push(`/${locale}/dashboard`)} title={t.transferSuccess} buttonText={t.done}>
        <div className="space-y-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{formatCurrency(amountNum, locale)}</p>
          <p className="text-gray-500">{t.sendingTo} {recipientName}</p>
          {transferResult?.reference && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-sm text-gray-500">{t.reference}</p><p className="font-mono font-medium text-gray-800">{transferResult.reference}</p></div>}
        </div>
      </SuccessModal>
    </div>
  );
}
