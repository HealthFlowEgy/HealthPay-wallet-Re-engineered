'use client'

import { useState } from 'react'
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week')

  // Mock data - replace with real API calls
  const stats = {
    totalUsers: 125847,
    userGrowth: 12.5,
    activeWallets: 98234,
    walletGrowth: 8.3,
    totalTransactions: 456789,
    transactionGrowth: 15.7,
    totalVolume: 45678900,
    volumeGrowth: -3.2
  }

  const recentTransactions = [
    {
      id: 'TXN001',
      user: 'أحمد محمد',
      type: 'payment',
      amount: 500,
      status: 'completed',
      time: '10 دقائق'
    },
    {
      id: 'TXN002',
      user: 'سارة علي',
      type: 'topup',
      amount: 1000,
      status: 'completed',
      time: '25 دقيقة'
    },
    {
      id: 'TXN003',
      user: 'محمد حسن',
      type: 'withdrawal',
      amount: 750,
      status: 'pending',
      time: '35 دقيقة'
    },
    {
      id: 'TXN004',
      user: 'فاطمة أحمد',
      type: 'payment',
      amount: 300,
      status: 'failed',
      time: 'ساعة'
    }
  ]

  const systemHealth = [
    { name: 'API Server', status: 'healthy', uptime: '99.9%', responseTime: '45ms' },
    { name: 'Database', status: 'healthy', uptime: '99.8%', responseTime: '12ms' },
    { name: 'Payment Gateway', status: 'warning', uptime: '98.5%', responseTime: '250ms' },
    { name: 'SMS Service', status: 'healthy', uptime: '99.7%', responseTime: '180ms' }
  ]

  // Chart data
  const transactionData = [
    { name: 'السبت', value: 45000 },
    { name: 'الأحد', value: 52000 },
    { name: 'الاثنين', value: 48000 },
    { name: 'الثلاثاء', value: 61000 },
    { name: 'الأربعاء', value: 55000 },
    { name: 'الخميس', value: 67000 },
    { name: 'الجمعة', value: 58000 }
  ]

  const userActivityData = [
    { name: 'Jan', users: 4000, transactions: 2400 },
    { name: 'Feb', users: 3000, transactions: 1398 },
    { name: 'Mar', users: 2000, transactions: 9800 },
    { name: 'Apr', users: 2780, transactions: 3908 },
    { name: 'May', users: 1890, transactions: 4800 },
    { name: 'Jun', users: 2390, transactions: 3800 }
  ]

  const transactionTypeData = [
    { name: 'دفع للتجار', value: 45, color: '#0d9488' },
    { name: 'تحويل بين مستخدمين', value: 25, color: '#14b8a6' },
    { name: 'شحن المحفظة', value: 20, color: '#2dd4bf' },
    { name: 'سحب', value: 10, color: '#5eead4' }
  ]

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend 
  }: { 
    title: string
    value: string | number
    change: number
    icon: any
    trend: 'up' | 'down'
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
          <p className="text-gray-500 mt-1">نظرة شاملة على النظام</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === 'day' && 'يوم'}
              {range === 'week' && 'أسبوع'}
              {range === 'month' && 'شهر'}
              {range === 'year' && 'سنة'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المستخدمين"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={Users}
          trend="up"
        />
        <StatCard
          title="المحافظ النشطة"
          value={stats.activeWallets}
          change={stats.walletGrowth}
          icon={Wallet}
          trend="up"
        />
        <StatCard
          title="إجمالي المعاملات"
          value={stats.totalTransactions}
          change={stats.transactionGrowth}
          icon={Activity}
          trend="up"
        />
        <StatCard
          title="حجم المعاملات (EGP)"
          value={stats.totalVolume.toLocaleString()}
          change={stats.volumeGrowth}
          icon={DollarSign}
          trend="down"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              حجم المعاملات اليومية
            </CardTitle>
            <CardDescription>آخر 7 أيام</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              أنواع المعاملات
            </CardTitle>
            <CardDescription>توزيع المعاملات</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={transactionTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {transactionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            نشاط المستخدمين والمعاملات
          </CardTitle>
          <CardDescription>آخر 6 أشهر</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#0d9488" name="المستخدمون" />
              <Line type="monotone" dataKey="transactions" stroke="#14b8a6" name="المعاملات" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              آخر المعاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      txn.type === 'payment' ? 'bg-red-100' : 
                      txn.type === 'topup' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {txn.type === 'payment' ? <ArrowDown className="w-5 h-5 text-red-600" /> :
                       txn.type === 'topup' ? <ArrowUp className="w-5 h-5 text-green-600" /> :
                       <DollarSign className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{txn.user}</p>
                      <p className="text-sm text-gray-500">{txn.id} • منذ {txn.time}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{txn.amount.toLocaleString()} EGP</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                      txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {txn.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                       txn.status === 'pending' ? <Clock className="w-3 h-3" /> :
                       <AlertCircle className="w-3 h-3" />}
                      {txn.status === 'completed' ? 'مكتمل' :
                       txn.status === 'pending' ? 'قيد المعالجة' : 'فشل'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              عرض جميع المعاملات
            </Button>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              صحة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((service) => (
                <div key={service.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{service.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.status === 'healthy' ? 'bg-green-100 text-green-800' :
                      service.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.status === 'healthy' ? '✓ يعمل بشكل طبيعي' :
                       service.status === 'warning' ? '⚠ تحذير' : '✗ متوقف'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">معدل التشغيل</p>
                      <p className="font-semibold">{service.uptime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">زمن الاستجابة</p>
                      <p className="font-semibold">{service.responseTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>إدارة المستخدمين</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2">
              <ShoppingBag className="w-6 h-6" />
              <span>إدارة التجار</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2">
              <Activity className="w-6 h-6" />
              <span>مراجعة المعاملات</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              <span>التقارير</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
