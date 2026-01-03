'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layouts';
import { Card, Input } from '@/components/ui';

const faqs = {
  ar: [
    { q: 'كيف أشحن رصيدي؟', a: 'يمكنك شحن رصيدك من خلال البطاقة البنكية، فوري، فودافون كاش، أو إنستاباي. اذهب إلى "شحن الرصيد" من الشاشة الرئيسية.' },
    { q: 'كيف أرسل أموال لشخص آخر؟', a: 'اضغط على "تحويل" من الشاشة الرئيسية، أدخل رقم هاتف المستلم والمبلغ، ثم أكد التحويل برمز PIN.' },
    { q: 'هل التحويلات مجانية؟', a: 'نعم، التحويلات بين مستخدمي HealthPay مجانية تماماً.' },
    { q: 'كيف أغير رمز PIN؟', a: 'اذهب إلى الإعدادات > الأمان > تغيير رمز PIN.' },
    { q: 'ماذا أفعل إذا نسيت رمز PIN؟', a: 'تواصل مع خدمة العملاء لإعادة تعيين رمز PIN الخاص بك.' },
  ],
  en: [
    { q: 'How do I top up my wallet?', a: 'You can top up via bank card, Fawry, Vodafone Cash, or InstaPay. Go to "Top Up" from the home screen.' },
    { q: 'How do I send money?', a: 'Tap "Transfer" from home screen, enter recipient phone and amount, then confirm with PIN.' },
    { q: 'Are transfers free?', a: 'Yes, transfers between HealthPay users are completely free.' },
    { q: 'How do I change my PIN?', a: 'Go to Settings > Security > Change PIN.' },
    { q: 'What if I forgot my PIN?', a: 'Contact customer support to reset your PIN.' },
  ],
};

export default function HelpPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const t = locale === 'ar' ? {
    title: 'المساعدة', faq: 'الأسئلة الشائعة', search: 'ابحث عن مساعدة...', contactSupport: 'تواصل مع الدعم',
    email: 'البريد الإلكتروني', phone: 'الهاتف', whatsapp: 'واتساب', workingHours: 'ساعات العمل', hours: '9 ص - 9 م، السبت - الخميس',
  } : {
    title: 'Help', faq: 'FAQ', search: 'Search for help...', contactSupport: 'Contact Support',
    email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', workingHours: 'Working Hours', hours: '9 AM - 9 PM, Sat - Thu',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const faqList = faqs[locale].filter(f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} showBack backHref={`/${locale}/settings`} locale={locale} />
      <div className="px-4 py-4 space-y-6">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} icon={<span>🔍</span>} iconPosition="left" />

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t.faq}</h2>
          <div className="space-y-2">
            {faqList.map((faq, i) => (
              <Card key={i} onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} className="cursor-pointer">
                <div className="flex justify-between items-center"><p className="font-medium text-gray-800">{faq.q}</p><span className={`transition-transform ${expandedIndex === i ? 'rotate-180' : ''}`}>▼</span></div>
                {expandedIndex === i && <p className="text-gray-600 mt-3 pt-3 border-t">{faq.a}</p>}
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t.contactSupport}</h2>
          <Card>
            <div className="space-y-4">
              <a href="mailto:support@healthpay.eg" className="flex items-center gap-3 text-gray-700"><span className="text-xl">📧</span><div><p className="text-sm text-gray-500">{t.email}</p><p className="font-medium">support@healthpay.eg</p></div></a>
              <a href="tel:+201234567890" className="flex items-center gap-3 text-gray-700"><span className="text-xl">📞</span><div><p className="text-sm text-gray-500">{t.phone}</p><p className="font-medium" dir="ltr">+20 123 456 7890</p></div></a>
              <a href="https://wa.me/201234567890" className="flex items-center gap-3 text-gray-700"><span className="text-xl">💬</span><div><p className="text-sm text-gray-500">{t.whatsapp}</p><p className="font-medium" dir="ltr">+20 123 456 7890</p></div></a>
              <div className="flex items-center gap-3 text-gray-700"><span className="text-xl">🕐</span><div><p className="text-sm text-gray-500">{t.workingHours}</p><p className="font-medium">{t.hours}</p></div></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
