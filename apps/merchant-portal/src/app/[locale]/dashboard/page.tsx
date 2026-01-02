'use client'

import { useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  ShoppingCart,
  Activity,
  Key,
  Settings,
  Download,
  Eye,
  Copy,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function MerchantDashboardPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week')

  // Mock merchant data
  const merchantInfo = {
    businessName: 'صيدلية العافية',
    merchantId: 'MER-12345',
    apiKey: 'sk_live_51H8i2K2eZvKYlo2C0000000',
    apiSecret: '***************************',
    status: 'active',
    category: 'صيدلية',
    registeredAt: '2024-01-15'
  }

  const stats = {
    todayRevenue: 12450.00,
    todayGrowth: 8.5,
    monthRevenue: 345678.00,
    monthGrowth: 12.3,
    totalTransactions: 1247,
    transactionGrowth: 5.7,
    avgTransaction: 277.00,
    avgGrowth: -2.1
  }

  // Chart data
  const revenueData = [
    { name: 'السبت', revenue: 8500 },
    { name: 'الأحد', revenue: 12000 },
    { name: 'الاثنين', revenue: 10500 },
    { name: 'الثلاثاء', revenue: 15000 },
    { name: 'الأربعاء', revenue: 13500 },
    { name: 'الخميس', revenue: 16500 },
    { name: 'الجمعة', revenue: 14000 }
  ]

  const transactionData = [
    { name: 'السبت', count: 45 },
    { name: 'الأحد', count: 52 },
    { name: 'الاثنين', count: 48 },
    { name: 'الثلاثاء', count: 61 },
    { name: 'الأربعاء', count: 55 },
    { name: 'الخميس', count: 67 },
    { name: 'الجمعة', count: 58 }
  ]

  const recentTransactions = [
    {
      id: 'TXN-001',
      customer: 'أحمد محمد',
      amount: 450.00,
      method: 'HealthPay Wallet',
      status: 'completed',
      time: '10 دقائق'
    },
    {
      id: 'TXN-002',
      customer: 'سارة علي',
      amount: 780.00,
      method: 'HealthPay Wallet',
      status: 'completed',
      time: '25 دقيقة'
    },
    {
      id: 'TXN-003',
      customer: 'محمد حسن',
      amount: 320.00,
      method: 'HealthPay Wallet',
      status: 'pending',
      time: '45 دقيقة'
    }
  ]

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend,
    currency = false
  }: { 
    title: string
    value: string | number
    change: number
    icon: any
    trend: 'up' | 'down'
    currency?: boolean
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold">
              {currency && typeof value === 'number' ? value.toLocaleString() : value}
              {currency && ' EGP'}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500">عن الأسبوع الماضي</span>
            </div>
          </div>
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-teal-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('تم النسخ!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{merchantInfo.businessName}</h1>
          <p className="text-gray-500 mt-1">لوحة تحكم التاجر • {merchantInfo.merchantId}</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button>
            <Settings className="w-4 h-4 ml-2" />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إيرادات اليوم"
          value={stats.todayRevenue}
          change={stats.todayGrowth}
          icon={DollarSign}
          trend="up"
          currency
        />
        <StatCard
          title="إيرادات الشهر"
          value={stats.monthRevenue}
          change={stats.monthGrowth}
          icon={TrendingUp}
          trend="up"
          currency
        />
        <StatCard
          title="إجمالي المعاملات"
          value={stats.totalTransactions}
          change={stats.transactionGrowth}
          icon={ShoppingCart}
          trend="up"
        />
        <StatCard
          title="متوسط المعاملة"
          value={stats.avgTransaction}
          change={stats.avgGrowth}
          icon={CreditCard}
          trend="down"
          currency
        />
      </div>

      {/* API Credentials */}
      <Card className="border-2 border-teal-200 bg-teal-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            بيانات API الخاصة بك
          </CardTitle>
          <CardDescription>
            استخدم هذه البيانات لدمج HealthPay في نظامك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Merchant ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={merchantInfo.merchantId}
                  className="flex-1 px-4 py-2 border rounded-lg bg-white"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(merchantInfo.merchantId)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={merchantInfo.apiKey}
                  className="flex-1 px-4 py-2 border rounded-lg bg-white font-mono"
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(merchantInfo.apiKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>تحذير:</strong> احتفظ ببيانات API في مكان آمن. لا تشاركها مع أحد ولا تضعها في الكود العام.
              </p>
            </div>

            <Button className="w-full">
              <Key className="w-4 h-4 ml-2" />
              إعادة توليد API Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              الإيرادات اليومية
            </CardTitle>
            <CardDescription>آخر 7 أيام</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transactions Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              عدد المعاملات اليومية
            </CardTitle>
            <CardDescription>آخر 7 أيام</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              آخر المعاملات
            </CardTitle>
            <Button variant="outline" size="sm">
              عرض الكل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium">{txn.customer}</p>
                    <p className="text-sm text-gray-500">
                      {txn.id} • {txn.method} • منذ {txn.time}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold">{txn.amount.toLocaleString()} EGP</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    txn.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {txn.status === 'completed' ? '✓ مكتمل' : '⏱ قيد المعالجة'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <DollarSign className="w-6 h-6" />
              <span>طلب سحب</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              <span>التقارير</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Key className="w-6 h-6" />
              <span>إدارة API</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Settings className="w-6 h-6" />
              <span>الإعدادات</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>دليل التكامل</CardTitle>
          <CardDescription>
            كيفية دمج HealthPay في موقعك أو تطبيقك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. قم بتثبيت SDK</h4>
              <pre className="p-3 bg-gray-900 text-white rounded-lg overflow-x-auto">
                npm install @healthpay/sdk
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. قم بتهيئة SDK</h4>
              <pre className="p-3 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`import HealthPay from '@healthpay/sdk'

const healthpay = new HealthPay({
  merchantId: '${merchantInfo.merchantId}',
  apiKey: '${merchantInfo.apiKey}'
})`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. أنشئ طلب دفع</h4>
              <pre className="p-3 bg-gray-900 text-white rounded-lg overflow-x-auto text-sm">
{`const payment = await healthpay.createPayment({
  amount: 500,
  currency: 'EGP',
  description: 'شراء أدوية',
  callbackUrl: 'https://yoursite.com/callback'
})`}
              </pre>
            </div>

            <Button className="w-full">
              عرض الوثائق الكاملة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
