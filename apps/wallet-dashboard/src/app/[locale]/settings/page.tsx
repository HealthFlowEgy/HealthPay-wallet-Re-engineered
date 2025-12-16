'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  User,
  Lock,
  Bell,
  Globe,
  Shield,
  Trash2,
  Save,
  Camera,
  Eye,
  EyeOff,
  Mail,
  Phone,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const t = useTranslations()
  const { user, updateProfile, changePassword, deleteAccount } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  // Profile form
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationalId: user?.nationalId || ''
  })

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    transactions: true,
    marketing: false
  })

  // Language & appearance
  const [preferences, setPreferences] = useState({
    language: 'ar',
    theme: 'light',
    currency: 'EGP'
  })

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile(profileData)
      // Show success toast
      alert(t('success.profileUpdated'))
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert(t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('كلمات المرور غير متطابقة')
      return
    }
    if (passwordData.newPassword.length < 8) {
      alert('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }

    setSaving(true)
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      alert(t('success.passwordReset'))
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Failed to change password:', error)
      alert(t('errors.generic'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه.'
    )
    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'تأكيد نهائي: سيتم حذف جميع بياناتك ومعاملاتك نهائياً. هل تريد المتابعة؟'
    )
    if (!doubleConfirm) return

    try {
      await deleteAccount()
      // Redirect to goodbye page
      window.location.href = '/goodbye'
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert(t('errors.generic'))
    }
  }

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'security', label: 'الأمان', icon: Lock },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'preferences', label: 'التفضيلات', icon: Globe }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('nav.settings')}</h1>
        <p className="text-gray-500 mt-1">
          إدارة حسابك وتفضيلاتك
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>الصورة الشخصية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-teal-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {user?.fullName?.charAt(0) || 'A'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50">
                    <Camera className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  JPG, PNG أقل من 5MB
                </p>
                <Button variant="outline" className="mt-4" size="sm">
                  تحميل صورة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
              <CardDescription>
                قم بتحديث معلومات حسابك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    لتغيير رقم الهاتف، تواصل مع الدعم
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرقم القومي
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.nationalId}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg bg-gray-50"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    الرقم القومي لا يمكن تعديله
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveProfile} loading={saving}>
                  <Save className="w-4 h-4 ml-2" />
                  {t('common.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                تغيير كلمة المرور
              </CardTitle>
              <CardDescription>
                قم بتحديث كلمة المرور لحسابك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور الحالية
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pr-10 pl-10 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pr-10 pl-10 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    يجب أن تكون 8 أحرف على الأقل
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                <Button onClick={handleChangePassword} loading={saving} className="w-full">
                  تحديث كلمة المرور
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                المصادقة الثنائية
              </CardTitle>
              <CardDescription>
                أضف طبقة حماية إضافية لحسابك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">رسائل SMS</p>
                    <p className="text-sm text-gray-500">
                      رمز التحقق عبر رسالة نصية
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      نشط
                    </span>
                    <Button variant="outline" size="sm">
                      إيقاف
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">تطبيق المصادقة</p>
                    <p className="text-sm text-gray-500">
                      Google Authenticator أو مشابه
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    تفعيل
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">الأجهزة الموثوقة</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">iPhone 15 Pro</p>
                        <p className="text-xs text-gray-500">آخر استخدام: الآن</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="lg:col-span-2 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                منطقة الخطر
              </CardTitle>
              <CardDescription>
                إجراءات لا يمكن التراجع عنها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">حذف الحساب</p>
                  <p className="text-sm text-gray-500">
                    حذف حسابك نهائياً وجميع بياناتك
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف الحساب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              إعدادات الإشعارات
            </CardTitle>
            <CardDescription>
              اختر كيف تريد أن نتواصل معك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">إشعارات البريد الإلكتروني</p>
                  <p className="text-sm text-gray-500">
                    استلام الإشعارات عبر البريد الإلكتروني
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">إشعارات SMS</p>
                  <p className="text-sm text-gray-500">
                    استلام الإشعارات عبر الرسائل النصية
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">إشعارات فورية</p>
                  <p className="text-sm text-gray-500">
                    استلام الإشعارات على الهاتف
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">أنواع الإشعارات</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">إشعارات المعاملات</p>
                      <p className="text-sm text-gray-500">
                        عمليات الإيداع والسحب
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.transactions}
                        onChange={(e) => setNotifications({ ...notifications, transactions: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">العروض والتسويق</p>
                      <p className="text-sm text-gray-500">
                        العروض الخاصة والأخبار
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.marketing}
                        onChange={(e) => setNotifications({ ...notifications, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التفضيلات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                اللغة والمنطقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللغة
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العملة
                  </label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المظهر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوضع
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, theme: 'light' })}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                        preferences.theme === 'light'
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-white border-2 rounded-lg"></div>
                      <span className="text-sm font-medium">فاتح</span>
                    </button>
                    <button
                      onClick={() => setPreferences({ ...preferences, theme: 'dark' })}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                        preferences.theme === 'dark'
                          ? 'border-teal-600 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-12 h-12 bg-gray-900 border-2 rounded-lg"></div>
                      <span className="text-sm font-medium">داكن</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
