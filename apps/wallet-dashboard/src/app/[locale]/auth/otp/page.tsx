'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui';
import { OTPInput } from '@/components/ui/Input';
import { Header } from '@/components/layouts';
import { formatPhoneNumber } from '@/lib/utils';

export default function OTPPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { sendOTP, verifyOTP } = useAuth();
  const toast = useToast();
  
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [devOtp, setDevOtp] = useState('');

  const t = locale === 'ar' ? {
    title: 'تحقق من الرمز', subtitle: 'أدخل رمز التحقق المرسل إلى', verify: 'تحقق',
    resend: 'إعادة الإرسال', resendIn: 'إعادة الإرسال خلال', seconds: 'ثانية',
    invalidOtp: 'رمز التحقق غير صحيح', resendSuccess: 'تم إرسال رمز جديد', devOtpHint: 'للتجربة، استخدم الرمز:',
  } : {
    title: 'Verify Code', subtitle: 'Enter the verification code sent to', verify: 'Verify',
    resend: 'Resend', resendIn: 'Resend in', seconds: 'seconds',
    invalidOtp: 'Invalid verification code', resendSuccess: 'New code sent', devOtpHint: 'For testing, use code:',
  };

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('healthpay_phone');
    const storedDevOtp = sessionStorage.getItem('healthpay_dev_otp');
    if (!storedPhone) { router.replace(`/${locale}/auth/login`); return; }
    setPhone(storedPhone);
    if (storedDevOtp) setDevOtp(storedDevOtp);
  }, [locale, router]);

  useEffect(() => {
    if (resendTimer > 0) { const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000); return () => clearTimeout(timer); }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setError(''); setLoading(true);
    try {
      const result = await verifyOTP(phone, otp);
      if (result.success) {
        sessionStorage.removeItem('healthpay_phone'); sessionStorage.removeItem('healthpay_dev_otp');
        router.push(result.isNewUser ? `/${locale}/auth/register` : `/${locale}/dashboard`);
      } else { setError(result.message || t.invalidOtp); toast.error(result.message || t.invalidOtp); }
    } catch (err: any) { setError(err.message || t.invalidOtp); toast.error(err.message || t.invalidOtp); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const result = await sendOTP(phone);
      if (result.success) { setResendTimer(60); setOtp(''); setError(''); toast.success(t.resendSuccess); if (result.devOTP) setDevOtp(result.devOTP); }
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (otp.length === 6 && !loading) handleVerify(); }, [otp]);

  return (
    <div className="min-h-screen bg-white">
      <Header title={t.title} showBack backHref={`/${locale}/auth/login`} locale={locale} />
      <div className="px-6 py-8">
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-2">{t.subtitle}</p>
          <p className="text-lg font-bold text-gray-800" dir="ltr">{formatPhoneNumber(phone)}</p>
        </div>
        <div className="mb-8"><OTPInput value={otp} onChange={setOtp} error={error} /></div>
        {devOtp && <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 text-center"><p className="text-sm text-primary-700">{t.devOtpHint}</p><p className="text-2xl font-bold text-primary-600 mt-1" dir="ltr">{devOtp}</p></div>}
        <Button fullWidth loading={loading} disabled={otp.length !== 6} onClick={handleVerify}>{t.verify}</Button>
        <div className="text-center mt-6">
          {resendTimer > 0 ? <p className="text-gray-500">{t.resendIn} <span className="font-bold text-primary-600">{resendTimer}</span> {t.seconds}</p>
          : <button onClick={handleResend} disabled={loading} className="text-primary-600 font-medium hover:underline">{t.resend}</button>}
        </div>
      </div>
    </div>
  );
}
