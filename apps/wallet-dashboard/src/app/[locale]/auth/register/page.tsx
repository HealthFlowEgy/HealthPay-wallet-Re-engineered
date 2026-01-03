'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Header } from '@/components/layouts';
import { Card, Button, Input } from '@/components/ui';
import { PINInput } from '@/components/ui/Input';

export default function RegisterPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, setUserPin, isAuthenticated } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<'info' | 'pin' | 'confirm'>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const t = locale === 'ar' ? {
    title: 'إنشاء حساب', welcome: 'مرحباً بك في HealthPay!', setupProfile: 'قم بإعداد ملفك الشخصي',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني (اختياري)', continue: 'متابعة',
    createPin: 'إنشاء رمز PIN', pinDescription: 'أنشئ رمز PIN مكون من 4 أرقام لتأمين معاملاتك',
    confirmPin: 'تأكيد رمز PIN', pinMismatch: 'رمز PIN غير متطابق', success: 'تم إنشاء حسابك بنجاح!',
  } : {
    title: 'Create Account', welcome: 'Welcome to HealthPay!', setupProfile: 'Set up your profile',
    name: 'Full Name', email: 'Email (optional)', continue: 'Continue',
    createPin: 'Create PIN', pinDescription: 'Create a 4-digit PIN to secure your transactions',
    confirmPin: 'Confirm PIN', pinMismatch: 'PINs do not match', success: 'Account created successfully!',
  };

  useEffect(() => {
    if (!isAuthenticated) router.replace(`/${locale}/auth/login`);
  }, [isAuthenticated, locale, router]);

  const handleInfoSubmit = () => {
    if (!name.trim()) { toast.error(locale === 'ar' ? 'الرجاء إدخال الاسم' : 'Please enter your name'); return; }
    setStep('pin');
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4) return;
    setStep('confirm');
  };

  const handleConfirmSubmit = async () => {
    if (confirmPin !== pin) { toast.error(t.pinMismatch); setConfirmPin(''); return; }
    setLoading(true);
    try {
      const success = await setUserPin(user?.phoneNumber || '', pin);
      if (success) { toast.success(t.success); router.push(`/${locale}/dashboard`); }
      else toast.error(locale === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (pin.length === 4 && step === 'pin') handlePinSubmit(); }, [pin]);
  useEffect(() => { if (confirmPin.length === 4 && step === 'confirm') handleConfirmSubmit(); }, [confirmPin]);

  return (
    <div className="min-h-screen bg-white">
      <Header title={t.title} locale={locale} />
      <div className="px-6 py-8">
        {step === 'info' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">👋</span></div>
              <h2 className="text-2xl font-bold text-gray-800">{t.welcome}</h2>
              <p className="text-gray-500 mt-2">{t.setupProfile}</p>
            </div>
            <Input value={name} onChange={(e) => setName(e.target.value)} label={t.name} placeholder={locale === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'} />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} label={t.email} placeholder={locale === 'ar' ? 'example@email.com' : 'example@email.com'} type="email" />
            <Button fullWidth onClick={handleInfoSubmit} disabled={!name.trim()}>{t.continue}</Button>
          </div>
        )}
        {step === 'pin' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">🔐</span></div>
              <h2 className="text-2xl font-bold text-gray-800">{t.createPin}</h2>
              <p className="text-gray-500 mt-2">{t.pinDescription}</p>
            </div>
            <PINInput value={pin} onChange={setPin} />
          </div>
        )}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div>
              <h2 className="text-2xl font-bold text-gray-800">{t.confirmPin}</h2>
              <p className="text-gray-500 mt-2">{t.pinDescription}</p>
            </div>
            <PINInput value={confirmPin} onChange={setConfirmPin} />
            {loading && <div className="flex justify-center"><div className="spinner" /></div>}
          </div>
        )}
      </div>
    </div>
  );
}
