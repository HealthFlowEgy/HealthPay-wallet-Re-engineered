'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button, Card } from '@/components/ui';
import { PhoneInput } from '@/components/ui/Input';
import { validatePhoneNumber } from '@/lib/utils';

export default function LoginPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { sendOTP } = useAuth();
  const toast = useToast();
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = locale === 'ar' ? {
    title: 'مرحباً بك في', subtitle: 'محفظتك الرقمية للرعاية الصحية', phone: 'رقم الهاتف',
    sendOtp: 'إرسال رمز التحقق', invalidPhone: 'رقم الهاتف غير صحيح',
    terms: 'بالمتابعة، أنت توافق على', termsLink: 'شروط الخدمة', privacy: 'سياسة الخصوصية', and: 'و',
  } : {
    title: 'Welcome to', subtitle: 'Your digital healthcare wallet', phone: 'Phone Number',
    sendOtp: 'Send Verification Code', invalidPhone: 'Invalid phone number',
    terms: 'By continuing, you agree to our', termsLink: 'Terms of Service', privacy: 'Privacy Policy', and: 'and',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\s/g, '');
    if (!validatePhoneNumber(cleanPhone)) { setError(t.invalidPhone); return; }
    setLoading(true);
    try {
      const result = await sendOTP(cleanPhone);
      if (result.success) {
        sessionStorage.setItem('healthpay_phone', cleanPhone);
        if (result.devOTP) sessionStorage.setItem('healthpay_dev_otp', result.devOTP);
        router.push(`/${locale}/auth/otp`);
      } else { setError(result.message || t.invalidPhone); toast.error(result.message || t.invalidPhone); }
    } catch (err: any) { setError(err.message || t.invalidPhone); toast.error(err.message || t.invalidPhone); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-600 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-8"><span className="text-4xl">💳</span></div>
        <h1 className="text-white text-2xl font-bold mb-2">{t.title}</h1>
        <h2 className="text-white text-3xl font-bold mb-4">HealthPay</h2>
        <p className="text-primary-100 text-center">{t.subtitle}</p>
      </div>
      <div className="bg-white rounded-t-3xl px-6 py-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} error={error} label={t.phone} autoFocus />
          <Button type="submit" fullWidth loading={loading} disabled={phone.length < 10}>{t.sendOtp}</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">{t.terms} <Link href={`/${locale}/terms`} className="text-primary-600 hover:underline">{t.termsLink}</Link> {t.and} <Link href={`/${locale}/privacy`} className="text-primary-600 hover:underline">{t.privacy}</Link></p>
        <p className="text-center text-xs text-gray-400 mt-4">v2.0.0 - © 2026 HealthPay</p>
      </div>
    </div>
  );
}
