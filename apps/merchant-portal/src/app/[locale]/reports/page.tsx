'use client'

import { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Percent
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function MerchantReportsPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [reportType, setReportType] = useState<'revenue' | 'transactions' | 'customers'>('revenue')

  // Mock data for charts
  const revenueData = [
    { month: 'يناير', revenue: 125000, transactions: 450 },
    { month: 'فبراير', revenue: 145000, transactions: 520 },
    { month: 'مارس', revenue: 135000, transactions: 480 },
    { month: 'أبريل', revenue: 165000, transactions: 590 },
    { month: 'مايو', revenue: 180000, transactions: 640 },
    { month: 'يونيو', revenue: 195000, transactions: 720 }
  ]

  const hourlyData = [
    { hour: '9am', transactions: 12 },
    { hour: '10am', transactions: 18 },
    { hour: '11am', transactions: 25 },
    { hour: '12pm', transactions: 35 },
    { hour: '1pm', transactions: 28 },
    { hour: '2pm', transactions: 32 },
    { hour: '3pm', transactions: 30 },
    { hour: '4pm', transactions: 26 },
    { hour: '5pm', transactions: 22 },
    { hour: '6pm', transactions: 15 }
  ]

  const categoryData = [
    { name: 'أدوية', value: 45, color: '#0d9488' },
    { name: 'فيتامينات', value: 25, color: '#14b8a6' },
    { name: 'مستلزمات طبية', value: 20, color: '#2dd4bf' },
    { name: 'أخرى', value: 10, color: '#5eead4' }
  ]

  const stats = {
    totalRevenue: 1245000,
    revenueGrowth: 12.5,
    avgTransaction: 325,
    avgGrowth: -3.2,
    totalTransactions: 3830,
    transactionGrowth: 8.7,
    uniqueCustomers: 1547,
    customerGrowth: 15.3,
    conversionRate: 68.5,
    repeatCustomerRate: 42.3
  }

  const topProducts = [
    { name: 'باراسيتامول 500mg', sales: 234, revenue: 5850 },
    { name: 'فيتامين د 5000 وحدة', sales: 189, revenue: 6615 },
    { name: 'أوميجا 3', sales: 156, revenue: 7020 },
    { name: 'مضاد حيوي أموكسيسيلين', sales: 134, revenue: 8710 },
    { name: 'شراب كحة', sales: 98, revenue: 2450 }
  ]

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend,
    suffix = ''
  }: {
    title: string
    value: string | number
    change: number
    icon: any
    trend: 'up' | 'down'
    suffix?: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
              {suffix}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500">عن الشهر الماضي</span>
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
          <h1 className="text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
          <p className="text-gray-500 mt-1">متابعة أداء متجرك وتحليل المبيعات</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="week">آخر 7 أيام</option>
            <option value="month">آخر 30 يوم</option>
            <option value="quarter">آخر 3 أشهر</option>
            <option value="year">آخر سنة</option>
          </select>
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الإيرادات"
          value={stats.totalRevenue}
          change={stats.revenueGrowth}
          icon={DollarSign}
          trend="up"
          suffix=" EGP"
        />
        <StatCard
          title="متوسط المعاملة"
          value={stats.avgTransaction}
          change={stats.avgGrowth}
          icon={Target}
          trend="down"
          suffix=" EGP"
        />
        <StatCard
          title="عدد المعاملات"
          value={stats.totalTransactions}
          change={stats.transactionGrowth}
          icon={ShoppingCart}
          trend="up"
        />
        <StatCard
          title="العملاء الفريدون"
          value={stats.uniqueCustomers}
          change={stats.customerGrowth}
          icon={Users}
          trend="up"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">معدل التحويل</p>
                <p className="text-4xl font-bold">{stats.conversionRate}%</p>
                <p className="text-sm text-gray-500 mt-1">من الزيارات إلى معاملات</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Percent className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">معدل العملاء المتكررين</p>
                <p className="text-4xl font-bold">{stats.repeatCustomerRate}%</p>
                <p className="text-sm text-gray-500 mt-1">عملاء عادوا للشراء مرة أخرى</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Transactions Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            الإيرادات والمعاملات - آخر 6 أشهر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#0d9488"
                strokeWidth={3}
                name="الإيرادات (EGP)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="transactions"
                stroke="#14b8a6"
                strokeWidth={2}
                name="عدد المعاملات"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly Activity & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط حسب الساعة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المبيعات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>أكثر المنتجات مبيعاً</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="font-bold text-teal-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} عملية بيع</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold">{product.revenue.toLocaleString()} EGP</p>
                  <p className="text-sm text-gray-500">إجمالي الإيرادات</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Download Reports */}
      <Card className="border-2 border-teal-200 bg-teal-50">
        <CardHeader>
          <CardTitle>تحميل التقارير الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex flex-col gap-2">
              <Download className="w-6 h-6" />
              <span>تقرير المبيعات PDF</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2">
              <Download className="w-6 h-6" />
              <span>تقرير المعاملات Excel</span>
            </Button>
            <Button className="h-20 flex flex-col gap-2">
              <Download className="w-6 h-6" />
              <span>تقرير العملاء CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
