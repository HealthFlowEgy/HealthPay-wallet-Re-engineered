'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layouts';
import { Card, Badge, Button, Avatar } from '@/components/ui';
import { formatDate, formatPhoneNumber } from '@/lib/utils';

export default function ProfilePage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const t = locale === 'ar' ? {
    title: 'الملف الشخصي', personalInfo: 'المعلومات الشخصية', name: 'الاسم', phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني', nationalId: 'الرقم القومي', kycStatus: 'حالة التحقق',
    verifyNow: 'تحقق الآن', memberSince: 'عضو منذ', editProfile: 'تعديل الملف', notSet: 'غير محدد',
    kycLevels: { NONE: 'غير متحقق', BASIC: 'أساسي', VERIFIED: 'متحقق', FULL: 'كامل' },
  } : {
    title: 'Profile', personalInfo: 'Personal Information', name: 'Name', phone: 'Phone Number',
    email: 'Email', nationalId: 'National ID', kycStatus: 'Verification Status',
    verifyNow: 'Verify Now', memberSince: 'Member since', editProfile: 'Edit Profile', notSet: 'Not set',
    kycLevels: { NONE: 'Not Verified', BASIC: 'Basic', VERIFIED: 'Verified', FULL: 'Full' },
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} showBack locale={locale} /></div>;

  const kycLevel = user?.kycLevel || 'NONE';
  const kycColors = { NONE: 'danger', BASIC: 'warning', VERIFIED: 'primary', FULL: 'success' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} showBack backHref={`/${locale}/settings`} locale={locale} />
      <div className="px-4 py-6 space-y-6">
        {/* Avatar Section */}
        <div className="text-center">
          <Avatar name={user?.name || user?.phoneNumber} size="xl" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800">{user?.name || formatPhoneNumber(user?.phoneNumber || '')}</h2>
          <p className="text-gray-500" dir="ltr">{formatPhoneNumber(user?.phoneNumber || '')}</p>
        </div>

        {/* KYC Status */}
        <Card className="text-center">
          <p className="text-sm text-gray-500 mb-2">{t.kycStatus}</p>
          <Badge variant={kycColors[kycLevel] as any} size="md">{t.kycLevels[kycLevel]}</Badge>
          {kycLevel !== 'FULL' && <Button variant="outline" className="mt-4" fullWidth>{t.verifyNow}</Button>}
        </Card>

        {/* Personal Info */}
        <Card>
          <h3 className="font-bold text-gray-800 mb-4">{t.personalInfo}</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.name}</span><span className="text-gray-800">{user?.name || t.notSet}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.phone}</span><span className="text-gray-800" dir="ltr">{formatPhoneNumber(user?.phoneNumber || '')}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.email}</span><span className="text-gray-800">{user?.email || t.notSet}</span></div>
            <div className="flex justify-between py-2"><span className="text-gray-500">{t.memberSince}</span><span className="text-gray-800">{formatDate(user?.createdAt || '', locale)}</span></div>
          </div>
        </Card>

        <Button fullWidth variant="primary">{t.editProfile}</Button>
      </div>
    </div>
  );
}
