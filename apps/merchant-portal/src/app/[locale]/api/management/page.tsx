'use client'

import { useState } from 'react'
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  Globe,
  Code,
  Book,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Webhook {
  id: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'failed'
  lastTriggered?: string
  successRate: number
}

interface ApiLog {
  id: string
  method: string
  endpoint: string
  status: number
  responseTime: number
  timestamp: string
}

export default function MerchantApiManagementPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [showApiSecret, setShowApiSecret] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'keys' | 'webhooks' | 'logs' | 'docs'>('keys')
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: 'WHK-001',
      url: 'https://example.com/webhooks/healthpay',
      events: ['payment.completed', 'payment.failed'],
      status: 'active',
      lastTriggered: '2024-02-11T10:30:00Z',
      successRate: 98.5
    }
  ])
  const [showAddWebhook, setShowAddWebhook] = useState(false)
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[]
  })

  // Mock merchant data
  const merchantData = {
    merchantId: 'MER-12345',
    apiKey: 'sk_live_51H8i2K2eZvKYlo2C0000000',
    apiSecret: 'sk_secret_51H8i2K2eZvKYlo2C0000000',
    environment: 'production' as 'production' | 'sandbox',
    rateLimit: {
      current: 145,
      limit: 1000,
      resetAt: '2024-02-11T12:00:00Z'
    }
  }

  // Mock API logs
  const apiLogs: ApiLog[] = [
    {
      id: 'LOG-001',
      method: 'POST',
      endpoint: '/api/v1/payments',
      status: 200,
      responseTime: 245,
      timestamp: '2024-02-11T10:30:00Z'
    },
    {
      id: 'LOG-002',
      method: 'GET',
      endpoint: '/api/v1/transactions',
      status: 200,
      responseTime: 156,
      timestamp: '2024-02-11T10:25:00Z'
    },
    {
      id: 'LOG-003',
      method: 'POST',
      endpoint: '/api/v1/payments',
      status: 400,
      responseTime: 89,
      timestamp: '2024-02-11T10:20:00Z'
    }
  ]

  const availableEvents = [
    { value: 'payment.completed', label: 'اكتمال الدفع' },
    { value: 'payment.failed', label: 'فشل الدفع' },
    { value: 'payment.pending', label: 'دفع قيد المعالجة' },
    { value: 'payment.refunded', label: 'استرجاع الدفع' },
    { value: 'settlement.completed', label: 'اكتمال التسوية' }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('تم النسخ!')
  }

  const handleRegenerateKey = (type: 'api' | 'secret') => {
    if (confirm(`هل أنت متأكد من إعادة توليد ${type === 'api' ? 'API Key' : 'API Secret'}؟ سيتوقف المفتاح القديم عن العمل.`)) {
      // TODO: API call to regenerate
      console.log('Regenerating', type)
      alert('تم إعادة التوليد بنجاح')
    }
  }

  const handleAddWebhook = () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      alert('يرجى إدخال URL واختيار حدث واحد على الأقل')
      return
    }

    const webhook: Webhook = {
      id: `WHK-${webhooks.length + 1}`.padStart(7, '0'),
      url: newWebhook.url,
      events: newWebhook.events,
      status: 'active',
      successRate: 0
    }

    setWebhooks([...webhooks, webhook])
    setNewWebhook({ url: '', events: [] })
    setShowAddWebhook(false)
    alert('تم إضافة Webhook بنجاح')
  }

  const handleDeleteWebhook = (webhookId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا Webhook؟')) {
      setWebhooks(webhooks.filter(w => w.id !== webhookId))
      alert('تم الحذف بنجاح')
    }
  }

  const handleTestWebhook = (webhookId: string) => {
    // TODO: API call to test webhook
    console.log('Testing webhook', webhookId)
    alert('جاري إرسال اختبار...')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            نشط
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            غير نشط
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <X className="w-3 h-3" />
            فشل
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة API</h1>
          <p className="text-gray-500 mt-1">مفاتيح API، Webhooks، والوثائق</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { id: 'keys', label: 'مفاتيح API', icon: Key },
            { id: 'webhooks', label: 'Webhooks', icon: Globe },
            { id: 'logs', label: 'سجل الطلبات', icon: Code },
            { id: 'docs', label: 'الوثائق', icon: Book }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 transition-colors ${
                  selectedTab === tab.id
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

      {/* API Keys Tab */}
      {selectedTab === 'keys' && (
        <div className="space-y-6">
          {/* Rate Limit Status */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-blue-900">معدل الاستخدام الحالي</h3>
                  <p className="text-sm text-blue-700">
                    {merchantData.rateLimit.current} / {merchantData.rateLimit.limit} طلب في الساعة
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {((merchantData.rateLimit.current / merchantData.rateLimit.limit) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${(merchantData.rateLimit.current / merchantData.rateLimit.limit) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                سيتم إعادة التعيين في: {new Date(merchantData.rateLimit.resetAt).toLocaleTimeString('ar-EG')}
              </p>
            </CardContent>
          </Card>

          {/* Merchant ID */}
          <Card>
            <CardHeader>
              <CardTitle>Merchant ID</CardTitle>
              <CardDescription>معرفك الفريد في HealthPay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={merchantData.merchantId}
                  className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono"
                  readOnly
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(merchantData.merchantId)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Key */}
          <Card>
            <CardHeader>
              <CardTitle>API Key</CardTitle>
              <CardDescription>
                استخدم هذا المفتاح للمصادقة على طلبات API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={merchantData.apiKey}
                    className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(merchantData.apiKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">تحذير أمني</p>
                      <p>
                        لا تشارك API Key مع أحد. احتفظ به في مكان آمن ولا تضعه في الكود العام.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleRegenerateKey('api')}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة توليد API Key
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Secret */}
          <Card>
            <CardHeader>
              <CardTitle>API Secret</CardTitle>
              <CardDescription>
                مفتاح سري للتوقيع الرقمي وتشفير Webhooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type={showApiSecret ? 'text' : 'password'}
                    value={merchantData.apiSecret}
                    className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                  >
                    {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(merchantData.apiSecret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleRegenerateKey('secret')}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة توليد API Secret
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Environment */}
          <Card>
            <CardHeader>
              <CardTitle>البيئة</CardTitle>
              <CardDescription>البيئة الحالية لمفاتيح API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  merchantData.environment === 'production'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {merchantData.environment === 'production' ? 'إنتاج' : 'اختبار'}
                </span>
                <p className="text-sm text-gray-600">
                  {merchantData.environment === 'production'
                    ? 'جميع المعاملات حقيقية ويتم تحصيلها فعلياً'
                    : 'بيئة اختبار - لا يتم تحصيل المعاملات'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks Tab */}
      {selectedTab === 'webhooks' && (
        <div className="space-y-6">
          {/* Add Webhook Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowAddWebhook(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة Webhook
            </Button>
          </div>

          {/* Webhooks List */}
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold">{webhook.url}</h3>
                        {getStatusBadge(webhook.status)}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">الأحداث المشتركة:</p>
                          <div className="flex flex-wrap gap-2">
                            {webhook.events.map((event) => (
                              <span
                                key={event}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                              >
                                {event}
                              </span>
                            ))}
                          </div>
                        </div>

                        {webhook.lastTriggered && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              آخر تشغيل: {new Date(webhook.lastTriggered).toLocaleString('ar-EG')}
                            </span>
                            <span>
                              معدل النجاح: <strong>{webhook.successRate}%</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook.id)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {webhooks.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">لم تقم بإضافة أي Webhooks بعد</p>
                  <Button onClick={() => setShowAddWebhook(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة أول Webhook
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add Webhook Modal */}
          {showAddWebhook && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>إضافة Webhook جديد</CardTitle>
                  <CardDescription>
                    سنرسل إشعارات HTTP POST إلى URL الخاص بك عند حدوث الأحداث المحددة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL *
                    </label>
                    <input
                      type="url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://example.com/webhooks/healthpay"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الأحداث *
                    </label>
                    <div className="space-y-2">
                      {availableEvents.map((event) => (
                        <label key={event.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newWebhook.events.includes(event.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: [...newWebhook.events, event.value]
                                })
                              } else {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: newWebhook.events.filter(ev => ev !== event.value)
                                })
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span>{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>ملاحظة:</strong> تأكد من أن URL الخاص بك يقبل طلبات POST ويمكنه
                      معالجة البيانات المشفرة JSON.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleAddWebhook} className="flex-1">
                      <Check className="w-4 h-4 ml-2" />
                      إضافة Webhook
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowAddWebhook(false)
                        setNewWebhook({ url: '', events: [] })
                      }}
                    >
                      <X className="w-4 h-4 ml-2" />
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* API Logs Tab */}
      {selectedTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>سجل طلبات API</CardTitle>
            <CardDescription>آخر 100 طلب API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-3 font-medium text-gray-700">الطريقة</th>
                    <th className="text-right p-3 font-medium text-gray-700">Endpoint</th>
                    <th className="text-right p-3 font-medium text-gray-700">الحالة</th>
                    <th className="text-right p-3 font-medium text-gray-700">زمن الاستجابة</th>
                    <th className="text-right p-3 font-medium text-gray-700">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
                          log.method === 'POST' ? 'bg-green-100 text-green-800' :
                          log.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-sm">{log.endpoint}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.status === 200 ? 'bg-green-100 text-green-800' :
                          log.status >= 400 ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{log.responseTime}ms</td>
                      <td className="p-3 text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation Tab */}
      {selectedTab === 'docs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>دليل التكامل السريع</CardTitle>
              <CardDescription>ابدأ التكامل مع HealthPay في دقائق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Installation */}
              <div>
                <h3 className="font-semibold mb-3">1. تثبيت SDK</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto">
                  npm install @healthpay/sdk
                </pre>
              </div>

              {/* Initialization */}
              <div>
                <h3 className="font-semibold mb-3">2. تهيئة SDK</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`import HealthPay from '@healthpay/sdk'

const healthpay = new HealthPay({
  merchantId: '${merchantData.merchantId}',
  apiKey: '${merchantData.apiKey}',
  environment: '${merchantData.environment}'
})`}
                </pre>
              </div>

              {/* Create Payment */}
              <div>
                <h3 className="font-semibold mb-3">3. إنشاء طلب دفع</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`const payment = await healthpay.payments.create({
  amount: 500,
  currency: 'EGP',
  description: 'شراء أدوية',
  customerId: 'USR-001',
  callbackUrl: 'https://yoursite.com/callback'
})

console.log('Payment URL:', payment.paymentUrl)
// إعادة توجيه العميل إلى payment.paymentUrl`}
                </pre>
              </div>

              {/* Webhook Handling */}
              <div>
                <h3 className="font-semibold mb-3">4. معالجة Webhooks</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`app.post('/webhooks/healthpay', (req, res) => {
  const signature = req.headers['x-healthpay-signature']
  const payload = req.body
  
  // التحقق من التوقيع
  if (!healthpay.webhooks.verify(payload, signature)) {
    return res.status(401).send('Invalid signature')
  }
  
  // معالجة الحدث
  switch (payload.event) {
    case 'payment.completed':
      // تحديث قاعدة البيانات
      break
    case 'payment.failed':
      // إرسال إشعار للعميل
      break
  }
  
  res.status(200).send('OK')
})`}
                </pre>
              </div>

              {/* Links */}
              <div className="flex gap-4 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <Book className="w-4 h-4 ml-2" />
                  الوثائق الكاملة
                </Button>
                <Button variant="outline" className="flex-1">
                  <Code className="w-4 h-4 ml-2" />
                  أمثلة الكود
                </Button>
                <Button variant="outline" className="flex-1">
                  <Globe className="w-4 h-4 ml-2" />
                  API Reference
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
