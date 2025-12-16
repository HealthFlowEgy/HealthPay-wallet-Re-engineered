'use client'

import { useState } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  DollarSign,
  Activity,
  PieChart,
  FileText,
  Filter
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<'overview' | 'users' | 'merchants' | 'transactions' | 'financial'>('overview')
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [dateFrom, setDateFrom] = useState('2024-01-01')
  const [dateTo, setDateTo] = useState('2024-02-11')

  // Mock data for charts
  const revenueData = [
    { month: 'يناير', revenue: 450000, fees: 12000, users: 15000 },
    { month: 'فبراير', revenue: 520000, fees: 14500, users: 18500 },
    { month: 'مارس', revenue: 480000, fees: 13200, users: 17200 },
    { month: 'أبريل', revenue: 610000, fees: 16800, users: 21000 },
    { month: 'مايو', revenue: 580000, fees: 15900, users: 19500 },
    { month: 'يونيو', revenue: 720000, fees: 19800, users: 24000 }
  ]

  const userGrowthData = [
    { month: 'يناير', new: 2500, active: 12000, churned: 500 },
    { month: 'فبراير', new: 3500, active: 15000, churned: 450 },
    { month: 'مارس', new: 2800, active: 17000, churned: 800 },
    { month: 'أبريل', new: 4200, active: 20500, churned: 700 },
    { month: 'مايو', new: 3100, active: 23000, churned: 600 },
    { month: 'يونيو', new: 5000, active: 27500, churned: 500 }
  ]

  const categoryDistribution = [
    { name: 'صيدليات', value: 45, color: '#0d9488' },
    { name: 'عيادات', value: 30, color: '#14b8a6' },
    { name: 'مستشفيات', value: 15, color: '#2dd4bf' },
    { name: 'معامل', value: 10, color: '#5eead4' }
  ]

  const transactionTypeData = [
    { type: 'دفع للتجار', count: 45000, amount: 12500000 },
    { type: 'شحن المحفظة', count: 28000, amount: 8900000 },
    { type: 'تحويل بين مستخدمين', count: 15000, amount: 3200000 },
    { type: 'سحب', count: 8000, amount: 2100000 }
  ]

  const topMerchants = [
    { id: 'MER-001', name: 'صيدلية العافية', transactions: 1247, revenue: 345678 },
    { id: 'MER-002', name: 'عيادة النيل', transactions: 456, revenue: 156000 },
    { id: 'MER-003', name: 'مستشفى الصحة', transactions: 234, revenue: 289000 },
    { id: 'MER-004', name: 'معمل المدينة', transactions: 567, revenue: 134000 },
    { id: 'MER-005', name: 'صيدلية السلام', transactions: 892, revenue: 234000 }
  ]

  const performanceMetrics = {
    totalRevenue: 3360000,
    revenueGrowth: 12.5,
    totalUsers: 125847,
    userGrowth: 8.3,
    totalMerchants: 4562,
    merchantGrowth: 15.7,
    totalTransactions: 456789,
    transactionGrowth: 10.2,
    avgTransactionValue: 277,
    avgGrowth: -2.1,
    successRate: 98.7,
    customerSatisfaction: 4.6
  }

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement export functionality
    console.log('Exporting report as', format)
    alert(`جاري تصدير التقرير بصيغة ${format.toUpperCase()}...`)
  }

  const handleGenerateReport = () => {
    // TODO: Generate custom report
    console.log('Generating report...', { reportType, timeRange, dateFrom, dateTo })
    alert('جاري إنشاء التقرير...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
          <p className="text-gray-500 mt-1">رؤى شاملة عن أداء المنصة</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleExportReport('pdf')}
          >
            <FileText className="w-4 h-4 ml-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('excel')}
          >
            <Download className="w-4 h-4 ml-2" />
            Excel
          </Button>
          <Button onClick={handleGenerateReport}>
            <BarChart3 className="w-4 h-4 ml-2" />
            إنشاء تقرير
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع التقرير
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="overview">نظرة عامة</option>
                <option value="users">المستخدمون</option>
                <option value="merchants">التجار</option>
                <option value="transactions">المعاملات</option>
                <option value="financial">المالية</option>
              </select>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفترة الزمنية
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="day">يومي</option>
                <option value="week">أسبوعي</option>
                <option value="month">شهري</option>
                <option value="quarter">ربع سنوي</option>
                <option value="year">سنوي</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {performanceMetrics.revenueGrowth}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">إجمالي الإيرادات</p>
            <p className="text-3xl font-bold">{performanceMetrics.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">EGP</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {performanceMetrics.userGrowth}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
            <p className="text-3xl font-bold">{performanceMetrics.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">مستخدم نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {performanceMetrics.merchantGrowth}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">إجمالي التجار</p>
            <p className="text-3xl font-bold">{performanceMetrics.totalMerchants.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">تاجر نشط</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {performanceMetrics.transactionGrowth}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">إجمالي المعاملات</p>
            <p className="text-3xl font-bold">{performanceMetrics.totalTransactions.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">معاملة</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Fees Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            الإيرادات والعمولات الشهرية
          </CardTitle>
          <CardDescription>تتبع نمو الإيرادات والعمولات على مدار الأشهر</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1"
                stroke="#0d9488" 
                fill="#0d9488" 
                name="الإيرادات"
              />
              <Area 
                type="monotone" 
                dataKey="fees" 
                stackId="1"
                stroke="#14b8a6" 
                fill="#14b8a6" 
                name="العمولات"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Growth & Merchant Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              نمو قاعدة المستخدمين
            </CardTitle>
            <CardDescription>المستخدمون الجدد والنشطون والمتوقفون</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="new" fill="#10b981" name="جدد" />
                <Bar dataKey="active" fill="#0d9488" name="نشطون" />
                <Bar dataKey="churned" fill="#ef4444" name="متوقفون" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Merchant Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              توزيع التجار حسب الفئة
            </CardTitle>
            <CardDescription>نسبة التجار في كل فئة</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            تحليل المعاملات حسب النوع
          </CardTitle>
          <CardDescription>عدد وقيمة المعاملات لكل نوع</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactionTypeData.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{type.type}</p>
                    <p className="text-sm text-gray-500">{type.count.toLocaleString()} معاملة</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full"
                      style={{
                        width: `${(type.amount / 12500000) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="mr-6 text-left">
                  <p className="text-xl font-bold">{type.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">EGP</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Merchants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            أفضل التجار أداءً
          </CardTitle>
          <CardDescription>التجار الخمسة الأوائل من حيث الإيرادات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right p-3 font-medium text-gray-700">الترتيب</th>
                  <th className="text-right p-3 font-medium text-gray-700">التاجر</th>
                  <th className="text-right p-3 font-medium text-gray-700">عدد المعاملات</th>
                  <th className="text-right p-3 font-medium text-gray-700">الإيرادات</th>
                  <th className="text-right p-3 font-medium text-gray-700">متوسط المعاملة</th>
                </tr>
              </thead>
              <tbody>
                {topMerchants.map((merchant, index) => (
                  <tr key={merchant.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center font-bold text-teal-600">
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{merchant.name}</p>
                        <p className="text-sm text-gray-500">{merchant.id}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{merchant.transactions.toLocaleString()}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold">{merchant.revenue.toLocaleString()} EGP</p>
                    </td>
                    <td className="p-3">
                      <p className="text-gray-600">
                        {(merchant.revenue / merchant.transactions).toFixed(0)} EGP
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">متوسط قيمة المعاملة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold">{performanceMetrics.avgTransactionValue}</p>
              <p className="text-gray-500 mb-2">EGP</p>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                {Math.abs(performanceMetrics.avgGrowth)}% عن الشهر الماضي
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معدل نجاح المعاملات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold">{performanceMetrics.successRate}</p>
              <p className="text-gray-500 mb-2">%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-green-600 h-3 rounded-full"
                style={{ width: `${performanceMetrics.successRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">رضا العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold">{performanceMetrics.customerSatisfaction}</p>
              <p className="text-gray-500 mb-2">/ 5.0</p>
            </div>
            <div className="flex gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className={`w-6 h-6 ${
                    star <= performanceMetrics.customerSatisfaction
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
