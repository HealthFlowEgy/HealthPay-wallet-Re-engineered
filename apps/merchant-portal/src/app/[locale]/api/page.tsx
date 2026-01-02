'use client'

import { useState } from 'react'
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Zap,
  Code,
  Book,
  Shield,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MerchantAPIPage() {
  const [showLiveKey, setShowLiveKey] = useState(false)
  const [showTestKey, setShowTestKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs' | 'logs'>('keys')

  // Mock API keys
  const apiKeys = {
    merchantId: 'MER-12345',
    live: {
      publishable: 'pk_live_51H8i2K2eZvKYlo2C0000000',
      secret: 'sk_live_51H8i2K2eZvKYlo2C0000000',
      createdAt: '2024-01-15'
    },
    test: {
      publishable: 'pk_test_51H8i2K2eZvKYlo2C0000000',
      secret: 'sk_test_51H8i2K2eZvKYlo2C0000000',
      createdAt: '2024-01-15'
    }
  }

  // Mock webhooks
  const [webhooks, setWebhooks] = useState([
    {
      id: 'wh_001',
      url: 'https://yoursite.com/webhooks/healthpay',
      events: ['payment.success', 'payment.failed', 'refund.created'],
      status: 'active',
      lastTriggered: '2024-02-11T10:30:00'
    }
  ])

  // Mock API logs
  const apiLogs = [
    {
      id: 'log_001',
      endpoint: '/api/v1/payments/create',
      method: 'POST',
      status: 200,
      responseTime: '245ms',
      timestamp: '2024-02-11T10:30:00'
    },
    {
      id: 'log_002',
      endpoint: '/api/v1/payments/verify',
      method: 'GET',
      status: 200,
      responseTime: '120ms',
      timestamp: '2024-02-11T10:29:00'
    },
    {
      id: 'log_003',
      endpoint: '/api/v1/refunds/create',
      method: 'POST',
      status: 400,
      responseTime: '180ms',
      timestamp: '2024-02-11T10:28:00'
    }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('تم النسخ إلى الحافظة!')
  }

  const regenerateKey = (type: 'live' | 'test') => {
    if (confirm(`هل أنت متأكد من إعادة توليد مفتاح ${type === 'live' ? 'الإنتاج' : 'الاختبار'}؟ سيتوقف المفتاح القديم عن العمل فوراً.`)) {
      alert('تم إعادة توليد المفتاح بنجاح!')
    }
  }

  const testWebhook = (webhookId: string) => {
    alert(`جاري إرسال حدث اختباري إلى ${webhookId}...`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إدارة API</h1>
        <p className="text-gray-500 mt-1">إدارة مفاتيح API والـ Webhooks والتوثيق</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { id: 'keys', label: 'مفاتيح API', icon: Key },
            { id: 'webhooks', label: 'Webhooks', icon: Zap },
            { id: 'docs', label: 'التوثيق', icon: Book },
            { id: 'logs', label: 'السجلات', icon: Globe }
          ].map((tab) => {
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

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          {/* Merchant ID */}
          <Card className="border-2 border-teal-200 bg-teal-50">
            <CardHeader>
              <CardTitle>معرف التاجر (Merchant ID)</CardTitle>
              <CardDescription>استخدم هذا المعرف في جميع طلبات API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiKeys.merchantId}
                  className="flex-1 px-4 py-2 border rounded-lg bg-white font-mono"
                  readOnly
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(apiKeys.merchantId)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    مفاتيح الإنتاج (Live Keys)
                  </CardTitle>
                  <CardDescription>استخدم هذه المفاتيح في بيئة الإنتاج</CardDescription>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  نشط
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Publishable Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publishable Key (يمكن مشاركته)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiKeys.live.publishable}
                    className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(apiKeys.live.publishable)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  يمكن استخدامه في الكود العام (Frontend)
                </p>
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Key (سري - لا تشاركه)
                </label>
                <div className="flex gap-2">
                  <input
                    type={showLiveKey ? 'text' : 'password'}
                    value={apiKeys.live.secret}
                    className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowLiveKey(!showLiveKey)}
                  >
                    {showLiveKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(apiKeys.live.secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  احتفظ به في مكان آمن - للاستخدام من الـ Backend فقط
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-500">
                  تم الإنشاء: {apiKeys.live.createdAt}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => regenerateKey('live')}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة توليد المفتاح
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-yellow-600" />
                    مفاتيح الاختبار (Test Keys)
                  </CardTitle>
                  <CardDescription>استخدم هذه المفاتيح في بيئة التطوير</CardDescription>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  اختبار
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publishable Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiKeys.test.publishable}
                    className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(apiKeys.test.publishable)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secret Key
                </label>
                <div className="flex gap-2">
                  <input
                    type={showTestKey ? 'text' : 'password'}
                    value={apiKeys.test.secret}
                    className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 font-mono text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowTestKey(!showTestKey)}
                  >
                    {showTestKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(apiKeys.test.secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-500">
                  تم الإنشاء: {apiKeys.test.createdAt}
                </p>
                <Button
                  variant="outline"
                  onClick={() => regenerateKey('test')}
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة توليد
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Best Practices */}
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Shield className="w-5 h-5" />
                ممارسات الأمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-red-900">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>لا تشارك Secret Keys أبداً في الكود العام أو GitHub</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>استخدم متغيرات البيئة (Environment Variables) لتخزين المفاتيح</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>قم بإعادة توليد المفاتيح فوراً في حالة التعرض للاختراق</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>استخدم HTTPS فقط في جميع طلبات API</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إعدادات Webhooks</CardTitle>
                  <CardDescription>
                    احصل على إشعارات فورية عند حدوث معاملات
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-medium font-mono text-sm">{webhook.url}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          آخر تشغيل: {new Date(webhook.lastTriggered).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">الأحداث المشمولة:</p>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <span key={event} className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs">
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        webhook.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {webhook.status === 'active' ? 'نشط' : 'متوقف'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhook(webhook.id)}
                      >
                        <Zap className="w-4 h-4 ml-2" />
                        اختبار Webhook
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Events */}
          <Card>
            <CardHeader>
              <CardTitle>الأحداث المتاحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { event: 'payment.success', description: 'عند نجاح عملية الدفع' },
                  { event: 'payment.failed', description: 'عند فشل عملية الدفع' },
                  { event: 'refund.created', description: 'عند إنشاء استرجاع' },
                  { event: 'refund.completed', description: 'عند اكتمال الاسترجاع' },
                  { event: 'payment.pending', description: 'عندما تكون المعاملة قيد الانتظار' },
                  { event: 'dispute.created', description: 'عند فتح نزاع' }
                ].map((item) => (
                  <div key={item.event} className="p-3 border rounded-lg">
                    <p className="font-mono text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>البدء السريع</CardTitle>
              <CardDescription>دليل سريع لدمج HealthPay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">1. تثبيت SDK</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
                  npm install @healthpay/sdk
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. تهيئة SDK</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`import HealthPay from '@healthpay/sdk'

const healthpay = new HealthPay({
  merchantId: '${apiKeys.merchantId}',
  apiKey: '${apiKeys.live.secret}'
})`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. إنشاء طلب دفع</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`const payment = await healthpay.createPayment({
  amount: 500,
  currency: 'EGP',
  description: 'شراء منتجات',
  customer: {
    phone: '+201234567890',
    name: 'أحمد محمد'
  },
  callbackUrl: 'https://yoursite.com/callback'
})`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. التحقق من الدفع</h3>
                <pre className="p-4 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`const verified = await healthpay.verifyPayment(
  payment.id
)

if (verified.status === 'completed') {
  // تم الدفع بنجاح
}`}
                </pre>
              </div>

              <Button className="w-full">
                <Book className="w-4 h-4 ml-2" />
                عرض الوثائق الكاملة
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>سجل طلبات API</CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {apiLogs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                          log.status === 200
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {log.method}
                        </span>
                        <span className="font-mono text-sm">{log.endpoint}</span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{log.responseTime}</p>
                        <p className="text-xs">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
