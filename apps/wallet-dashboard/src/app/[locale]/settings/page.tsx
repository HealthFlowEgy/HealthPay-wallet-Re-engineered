'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Header } from '@/components/layouts';
import { Card, Button, Modal, ConfirmModal } from '@/components/ui';
import { PINInput } from '@/components/ui/Input';

export default function SettingsPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);

  const t = locale === 'ar' ? {
    title: 'الإعدادات', account: 'الحساب', profile: 'الملف الشخصي', security: 'الأمان',
    changePin: 'تغيير رمز PIN', biometric: 'الدخول بالبصمة', preferences: 'التفضيلات',
    language: 'اللغة', arabic: 'العربية', english: 'English', notifications: 'الإشعارات',
    support: 'الدعم', help: 'المساعدة', privacy: 'سياسة الخصوصية', terms: 'شروط الخدمة',
    contactUs: 'اتصل بنا', rateApp: 'قيّم التطبيق', logout: 'تسجيل الخروج',
    logoutConfirm: 'هل أنت متأكد من تسجيل الخروج؟', deleteAccount: 'حذف الحساب',
    deleteWarning: 'سيتم حذف حسابك وجميع بياناتك نهائياً. هذا الإجراء لا يمكن التراجع عنه.',
    version: 'الإصدار', cancel: 'إلغاء', confirm: 'تأكيد', delete: 'حذف',
  } : {
    title: 'Settings', account: 'Account', profile: 'Profile', security: 'Security',
    changePin: 'Change PIN', biometric: 'Biometric Login', preferences: 'Preferences',
    language: 'Language', arabic: 'العربية', english: 'English', notifications: 'Notifications',
    support: 'Support', help: 'Help', privacy: 'Privacy Policy', terms: 'Terms of Service',
    contactUs: 'Contact Us', rateApp: 'Rate App', logout: 'Logout',
    logoutConfirm: 'Are you sure you want to logout?', deleteAccount: 'Delete Account',
    deleteWarning: 'Your account and all data will be permanently deleted. This action cannot be undone.',
    version: 'Version', cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const handleLogout = () => { logout(); };
  const toggleLanguage = () => { const newLocale = locale === 'ar' ? 'en' : 'ar'; router.push(`/${newLocale}/settings`); };

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} locale={locale} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title={t.title} locale={locale} />
      <div className="px-4 py-4 space-y-4">
        {/* Account Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">{t.account}</h2>
          <Card padding="none">
            <Link href={`/${locale}/profile`} className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3"><span className="text-xl">👤</span><span className="text-gray-800">{t.profile}</span></div>
              <span className="text-gray-400">›</span>
            </Link>
          </Card>
        </div>

        {/* Security Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">{t.security}</h2>
          <Card padding="none">
            <button onClick={() => setShowPinChange(true)} className="flex items-center justify-between p-4 border-b border-gray-100 w-full">
              <div className="flex items-center gap-3"><span className="text-xl">🔐</span><span className="text-gray-800">{t.changePin}</span></div>
              <span className="text-gray-400">›</span>
            </button>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3"><span className="text-xl">👆</span><span className="text-gray-800">{t.biometric}</span></div>
              <button onClick={() => setBiometric(!biometric)} className={`w-12 h-6 rounded-full transition-colors ${biometric ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${biometric ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </Card>
        </div>

        {/* Preferences Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">{t.preferences}</h2>
          <Card padding="none">
            <button onClick={toggleLanguage} className="flex items-center justify-between p-4 border-b border-gray-100 w-full">
              <div className="flex items-center gap-3"><span className="text-xl">🌐</span><span className="text-gray-800">{t.language}</span></div>
              <span className="text-primary-600">{locale === 'ar' ? t.arabic : t.english}</span>
            </button>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3"><span className="text-xl">🔔</span><span className="text-gray-800">{t.notifications}</span></div>
              <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </Card>
        </div>

        {/* Support Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">{t.support}</h2>
          <Card padding="none">
            <Link href={`/${locale}/help`} className="flex items-center justify-between p-4 border-b border-gray-100"><div className="flex items-center gap-3"><span className="text-xl">❓</span><span className="text-gray-800">{t.help}</span></div><span className="text-gray-400">›</span></Link>
            <Link href={`/${locale}/privacy`} className="flex items-center justify-between p-4 border-b border-gray-100"><div className="flex items-center gap-3"><span className="text-xl">🔒</span><span className="text-gray-800">{t.privacy}</span></div><span className="text-gray-400">›</span></Link>
            <Link href={`/${locale}/terms`} className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><span className="text-xl">📋</span><span className="text-gray-800">{t.terms}</span></div><span className="text-gray-400">›</span></Link>
          </Card>
        </div>

        {/* Logout */}
        <Button fullWidth variant="outline" onClick={() => setShowLogoutConfirm(true)} className="mt-4">🚪 {t.logout}</Button>

        {/* Delete Account */}
        <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-center text-danger-600 text-sm py-2">{t.deleteAccount}</button>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 mt-4">{t.version} 2.0.0</p>
      </div>

      <ConfirmModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} title={t.logout} message={t.logoutConfirm} confirmText={t.confirm} cancelText={t.cancel} />
      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => {}} title={t.deleteAccount} message={t.deleteWarning} confirmText={t.delete} cancelText={t.cancel} variant="danger" />
    </div>
  );
}
