'use client'

import { useState } from 'react'
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Bell,
  Lock,
  Save,
  Camera,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MerchantSettingsPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'banking' | 'notifications' | 'security'>('business')
  const [saving, setSaving] = useState(false)

  // Business profile data
  const [businessData, setBusinessData] = useState({
    businessName: 'صيدلية العافية',
    ownerName: 'أحمد محمد',
    category: 'pharmacy',
    phone: '+201234567890',
    email: 'alafya@pharmacy.com',
    website: 'https://alafya-pharmacy.com',
    address: 'ش المعادي الرئيسي، المعادي',
    city: 'القاهرة',
    postalCode: '11728',
    taxId: '123-456-789',
    commercialRegister: 'CR-12345',
    description: 'صيدلية متخصصة في الأدوية والمستلزمات الطبية منذ 2010'
  })

  // Banking data
  const [bankingData, setBankingData] = useState({
    bankName: 'بنك مصر',
    accountName: 'صيدلية العافية',
    accountNumber: '1234567890123',
    iban: 'EG380002000156789012345180002',
    swiftCode: 'BMISEGCX',
    settlementPeriod: 'daily'
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailTransactions: true,
    emailSettlements: true,
    emailDisputes: true,
    smsTransactions: true,
    smsSettlements: false,
    pushTransactions: true,
    pushSettlements: true
  })

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorAuth: true,
    loginNotifications: true,
    apiAccessLogging: true,
    webhookSignature: true
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert('تم حفظ الإعدادات بنجاح!')
    } catch (error) {
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'business', label: 'معلومات المتجر', icon: Building },
    { id: 'banking', label: 'الحساب البنكي', icon: DollarSign },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'security', label: 'الأمان', icon: Lock }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة معلومات متجرك وإعداداتك</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Business Profile Tab */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>شعار المتجر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-teal-500 rounded-lg flex items-center justify-center text-white text-4xl font-bold relative">
                  {businessData.businessName.charAt(0)}
                  <button className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50">
                    <Camera className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    JPG, PNG أو SVG، أقصى حجم 5MB
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">تحميل صورة</Button>
                    <Button variant="outline" size="sm"><X className="w-4 h-4 ml-1" />حذف</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المتجر *
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={businessData.businessName}
                      onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المالك *
                  </label>
                  <input
                    type="text"
                    value={businessData.ownerName}
                    onChange={(e) => setBusinessData({ ...businessData, ownerName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    فئة المتجر *
                  </label>
                  <select
                    value={businessData.category}
                    onChange={(e) => setBusinessData({ ...businessData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="pharmacy">صيدلية</option>
                    <option value="clinic">عيادة</option>
                    <option value="hospital">مستشفى</option>
                    <option value="lab">معمل تحاليل</option>
                    <option value="optical">محل نظارات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف *
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={businessData.phone}
                      onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={businessData.email}
                      onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الموقع الإلكتروني
                  </label>
                  <div className="relative">
                    <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={businessData.website}
                      onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>العنوان</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان الكامل *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                    <textarea
                      value={businessData.address}
                      onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                      className="w-full pr-10 pl-4 py-2 border rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المدينة *
                  </label>
                  <input
                    type="text"
                    value={businessData.city}
                    onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرمز البريدي
                  </label>
                  <input
                    type="text"
                    value={businessData.postalCode}
                    onChange={(e) => setBusinessData({ ...businessData, postalCode: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات القانونية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرقم الضريبي *
                  </label>
                  <input
                    type="text"
                    value={businessData.taxId}
                    onChange={(e) => setBusinessData({ ...businessData, taxId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السجل التجاري *
                  </label>
                  <input
                    type="text"
                    value={businessData.commercialRegister}
                    onChange={(e) => setBusinessData({ ...businessData, commercialRegister: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف المتجر
                  </label>
                  <textarea
                    value={businessData.description}
                    onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} size="lg">
              <Save className="w-5 h-5 ml-2" />
              حفظ التغييرات
            </Button>
          </div>
        </div>
      )}

      {/* Banking Tab */}
      {activeTab === 'banking' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب البنكي</CardTitle>
              <CardDescription>سيتم تحويل الأرباح إلى هذا الحساب</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم البنك *
                  </label>
                  <input
                    type="text"
                    value={bankingData.bankName}
                    onChange={(e) => setBankingData({ ...bankingData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم صاحب الحساب *
                  </label>
                  <input
                    type="text"
                    value={bankingData.accountName}
                    onChange={(e) => setBankingData({ ...bankingData, accountName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الحساب *
                  </label>
                  <input
                    type="text"
                    value={bankingData.accountNumber}
                    onChange={(e) => setBankingData({ ...bankingData, accountNumber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={bankingData.iban}
                    onChange={(e) => setBankingData({ ...bankingData, iban: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    value={bankingData.swiftCode}
                    onChange={(e) => setBankingData({ ...bankingData, swiftCode: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    فترة التسوية
                  </label>
                  <select
                    value={bankingData.settlementPeriod}
                    onChange={(e) => setBankingData({ ...bankingData, settlementPeriod: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="daily">يومياً</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="monthly">شهرياً</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    تأكد من صحة معلومات الحساب البنكي. أي خطأ قد يؤدي إلى تأخير في استلام الأموال.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} size="lg">
              <Save className="w-5 h-5 ml-2" />
              حفظ التغييرات
            </Button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>اختر كيف تريد أن نتواصل معك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">إشعارات البريد الإلكتروني</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailTransactions', label: 'المعاملات الجديدة' },
                    { key: 'emailSettlements', label: 'تسوية الحسابات' },
                    { key: 'emailDisputes', label: 'النزاعات والمشاكل' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">إشعارات SMS</h3>
                <div className="space-y-3">
                  {[
                    { key: 'smsTransactions', label: 'المعاملات الجديدة' },
                    { key: 'smsSettlements', label: 'تسوية الحسابات' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">إشعارات التطبيق (Push)</h3>
                <div className="space-y-3">
                  {[
                    { key: 'pushTransactions', label: 'المعاملات الجديدة' },
                    { key: 'pushSettlements', label: 'تسوية الحسابات' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.key as keyof typeof notifications] as boolean}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} size="lg">
              <Save className="w-5 h-5 ml-2" />
              حفظ التغييرات
            </Button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
              <CardDescription>تعزيز أمان حسابك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { 
                  key: 'twoFactorAuth', 
                  label: 'المصادقة الثنائية',
                  description: 'إضافة طبقة حماية إضافية عند تسجيل الدخول'
                },
                { 
                  key: 'loginNotifications', 
                  label: 'إشعارات تسجيل الدخول',
                  description: 'احصل على إشعار عند كل تسجيل دخول جديد'
                },
                { 
                  key: 'apiAccessLogging', 
                  label: 'تسجيل الوصول إلى API',
                  description: 'تتبع جميع طلبات API لحسابك'
                },
                { 
                  key: 'webhookSignature', 
                  label: 'توقيع Webhook',
                  description: 'التحقق من صحة طلبات Webhook'
                }
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {security[item.key as keyof typeof security] ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                      <p className="font-medium text-gray-900">{item.label}</p>
                    </div>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={security[item.key as keyof typeof security]}
                      onChange={(e) => setSecurity({ ...security, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">منطقة الخطر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-red-900 mb-1">إلغاء الحساب</p>
                  <p className="text-sm text-red-700 mb-3">
                    إلغاء حساب التاجر سيؤدي إلى إيقاف جميع المعاملات وحذف جميع البيانات
                  </p>
                  <Button variant="destructive">
                    <X className="w-4 h-4 ml-2" />
                    إلغاء الحساب
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} size="lg">
              <Save className="w-5 h-5 ml-2" />
              حفظ التغييرات
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
