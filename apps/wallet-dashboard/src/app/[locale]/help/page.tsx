'use client';

import React, { useState } from 'react';

// =============================================================================
// FAQ DATA
// =============================================================================

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'كيف أشحن محفظتي؟',
    answer: 'يمكنك شحن محفظتك من خلال عدة طرق: البطاقات البنكية (فيزا/ماستركارد)، فوري، فودافون كاش، أو انستاباي. اذهب إلى صفحة "شحن المحفظة" واختر الطريقة المناسبة لك.',
  },
  {
    id: '2',
    question: 'ما هي رسوم التحويل؟',
    answer: 'التحويلات بين مستخدمي HealthPay مجانية تماماً. رسوم الشحن تختلف حسب طريقة الدفع: البطاقات 2.5%، فوري 5 ج.م، فودافون كاش 1%، انستاباي مجاني.',
  },
  {
    id: '3',
    question: 'كيف أوثق حسابي؟',
    answer: 'لتوثيق حسابك، اذهب إلى الإعدادات > توثيق الحساب، ثم قم برفع صورة من بطاقة الرقم القومي وصورة شخصية. سيتم مراجعة طلبك خلال 24-48 ساعة.',
  },
  {
    id: '4',
    question: 'ما هي حدود المعاملات؟',
    answer: 'الحساب غير الموثق: 5,000 ج.م يومياً و 20,000 ج.م شهرياً. الحساب الموثق: 50,000 ج.م يومياً و 200,000 ج.م شهرياً.',
  },
  {
    id: '5',
    question: 'كيف أسترد أموالي؟',
    answer: 'يمكنك سحب أموالك إلى حسابك البنكي أو محفظة إلكترونية أخرى. اذهب إلى "سحب" واختر الطريقة المناسبة. يتم تنفيذ السحب خلال 1-3 أيام عمل.',
  },
  {
    id: '6',
    question: 'نسيت رمز PIN، ماذا أفعل؟',
    answer: 'اذهب إلى الإعدادات > الأمان > إعادة تعيين رمز PIN. ستحتاج للتحقق من هويتك عبر رمز OTP يُرسل لرقم هاتفك المسجل.',
  },
];

const CONTACT_OPTIONS = [
  { id: 'whatsapp', name: 'واتساب', nameEn: 'WhatsApp', icon: '💬', value: '+201234567890', color: 'bg-green-500' },
  { id: 'phone', name: 'اتصل بنا', nameEn: 'Call Us', icon: '📞', value: '16XXX', color: 'bg-blue-500' },
  { id: 'email', name: 'البريد الإلكتروني', nameEn: 'Email', icon: '📧', value: 'support@healthpay.eg', color: 'bg-purple-500' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQ_ITEMS.filter(
    faq => faq.question.includes(searchQuery) || faq.answer.includes(searchQuery)
  );

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
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
          <h1 className="text-xl font-bold">المساعدة والدعم</h1>
          <div className="w-10" />
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في الأسئلة الشائعة..."
            className="w-full p-4 pr-12 rounded-xl text-gray-800 placeholder-gray-400"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Quick Contact */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">تواصل معنا</h2>
          <div className="grid grid-cols-3 gap-3">
            {CONTACT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === 'whatsapp') {
                    window.open(`https://wa.me/${option.value.replace('+', '')}`, '_blank');
                  } else if (option.id === 'phone') {
                    window.location.href = `tel:${option.value}`;
                  } else if (option.id === 'email') {
                    window.location.href = `mailto:${option.value}`;
                  }
                }}
                className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center text-2xl text-white mb-2`}>
                  {option.icon}
                </div>
                <span className="text-sm font-semibold text-gray-700">{option.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">الأسئلة الشائعة</h2>
          
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🔍</span>
              <p>لم يتم العثور على نتائج</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-4 text-right hover:bg-gray-50 transition-all"
                  >
                    <span className="font-semibold text-gray-800">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedFaq === faq.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="p-4 pt-0 text-gray-600 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Useful Links */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">روابط مفيدة</h2>
          <div className="space-y-3">
            <a
              href="/terms"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <span className="font-semibold">الشروط والأحكام</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <a
              href="/privacy"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <span className="font-semibold">سياسة الخصوصية</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <a
              href="https://healthpay.eg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <span className="font-semibold">موقعنا الإلكتروني</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center text-gray-400 text-sm">
          <p>HealthPay Wallet v2.0.0</p>
          <p>© 2025 HealthPay. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}
