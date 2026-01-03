'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layouts';
import { Card, Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { GET_MEDICAL_CARD } from '@/lib/graphql/queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MedicalCard, Beneficiary } from '@/types';

export default function MedCardPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const t = locale === 'ar' ? {
    title: 'البطاقة الطبية', cardNumber: 'رقم البطاقة', balance: 'الرصيد', dailyLimit: 'الحد اليومي',
    expiryDate: 'تاريخ الانتهاء', status: 'الحالة', beneficiaries: 'المستفيدين', addBeneficiary: 'إضافة مستفيد',
    qrCode: 'كود QR', scanToUse: 'امسح للاستخدام في الصيدلية', noCard: 'لا توجد بطاقة طبية',
    applyNow: 'تقديم طلب', active: 'نشطة', suspended: 'موقوفة', expired: 'منتهية',
  } : {
    title: 'Medical Card', cardNumber: 'Card Number', balance: 'Balance', dailyLimit: 'Daily Limit',
    expiryDate: 'Expiry Date', status: 'Status', beneficiaries: 'Beneficiaries', addBeneficiary: 'Add Beneficiary',
    qrCode: 'QR Code', scanToUse: 'Scan to use at pharmacy', noCard: 'No medical card',
    applyNow: 'Apply Now', active: 'Active', suspended: 'Suspended', expired: 'Expired',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const { data, loading } = useQuery(GET_MEDICAL_CARD, { variables: { userId: user?.id }, skip: !user?.id });
  const card: MedicalCard | null = data?.medicalCard;

  const statusColors = { ACTIVE: 'success', SUSPENDED: 'warning', EXPIRED: 'danger' };
  const statusLabels = { ACTIVE: t.active, SUSPENDED: t.suspended, EXPIRED: t.expired };

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} locale={locale} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} locale={locale} />
      <div className="px-4 py-6 space-y-6">
        {loading ? <Skeleton className="h-48 rounded-2xl" />
        : !card ? <EmptyState icon="💳" title={t.noCard} action={<Button>{t.applyNow}</Button>} />
        : <>
          {/* Card Visual */}
          <Card variant="gradient" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div><p className="text-primary-100 text-sm">HealthPay</p><p className="text-xl font-bold">{t.title}</p></div>
                <Badge variant={statusColors[card.status] as any}>{statusLabels[card.status]}</Badge>
              </div>
              <p className="text-lg font-mono tracking-widest mb-4">{card.cardNumber.replace(/(.{4})/g, '$1 ').trim()}</p>
              <div className="flex justify-between text-sm">
                <div><p className="text-primary-100">{t.expiryDate}</p><p className="font-medium">{formatDate(card.expiryDate, locale)}</p></div>
                <div className="text-left"><p className="text-primary-100">{t.balance}</p><p className="font-bold text-lg">{formatCurrency(card.balance, locale)}</p></div>
              </div>
            </div>
          </Card>

          {/* QR Code */}
          <Card className="text-center">
            <h3 className="font-bold text-gray-800 mb-4">{t.qrCode}</h3>
            <div className="bg-white p-4 rounded-xl inline-block"><QRCodeSVG value={card.cardNumber} size={160} /></div>
            <p className="text-sm text-gray-500 mt-4">{t.scanToUse}</p>
          </Card>

          {/* Card Details */}
          <Card>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t.cardNumber}</span><span className="font-mono">{card.cardNumber}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{t.dailyLimit}</span><span className="font-medium">{formatCurrency(card.dailyLimit, locale)}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">{t.expiryDate}</span><span className="font-medium">{formatDate(card.expiryDate, locale)}</span></div>
            </div>
          </Card>

          {/* Beneficiaries */}
          <div>
            <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-gray-800">{t.beneficiaries}</h3><Button variant="ghost" size="sm">{t.addBeneficiary}</Button></div>
            <div className="space-y-2">
              {card.beneficiaries?.map((b: Beneficiary) => (
                <Card key={b.id}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">{b.name.charAt(0)}</div><div><p className="font-medium">{b.name}</p><p className="text-sm text-gray-500">{b.relation}</p></div></div></Card>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}
