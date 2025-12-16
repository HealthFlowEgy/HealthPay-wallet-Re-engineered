'use client'

import { useState } from 'react'
import {
  Activity,
  Search,
  Download,
  Eye,
  RefreshCw,
  Filter,
  CheckCircle,
  Clock,
  X,
  User,
  CreditCard,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function MerchantTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed' | 'refunded'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all')

  // Mock data
  const transactions = [
    {
      id: 'TXN-001',
      customer: 'أحمد محمد',
      customerPhone: '01234567890',
      amount: 450.00,
      commission: 11.25,
      netAmount: 438.75,
      status: 'completed',
      paymentMethod: 'wallet',
      date: new Date('2024-02-11T10:30:00'),
      reference: 'REF-123456',
      items: ['دواء A', 'دواء B']
    },
    {
      id: 'TXN-002',
      customer: 'سارة علي',
      customerPhone: '01123456789',
      amount: 780.00,
      commission: 19.50,
      netAmount: 760.50,
      status: 'completed',
      paymentMethod: 'wallet',
      date: new Date('2024-02-11T10:15:00'),
      reference: 'REF-123457',
      items: ['كشف طبي', 'تحاليل']
    },
    {
      id: 'TXN-003',
      customer: 'محمد حسن',
      customerPhone: '01234567899',
      amount: 320.00,
      commission: 8.00,
      netAmount: 312.00,
      status: 'pending',
      paymentMethod: 'wallet',
      date: new Date('2024-02-11T10:00:00'),
      reference: 'REF-123458',
      items: ['فيتامينات']
    },
    {
      id: 'TXN-004',
      customer: 'فاطمة أحمد',
      customerPhone: '01198765432',
      amount: 560.00,
      commission: 14.00,
      netAmount: 546.00,
      status: 'completed',
      paymentMethod: 'wallet',
      date: new Date('2024-02-10T15:20:00'),
      reference: 'REF-123459',
      items: ['أدوية مزمنة']
    },
    {
      id: 'TXN-005',
      customer: 'علي محمود',
      customerPhone: '01187654321',
      amount: 890.00,
      commission: 22.25,
      netAmount: 867.75,
      status: 'completed',
      paymentMethod: 'wallet',
      date: new Date('2024-02-10T14:10:00'),
      reference: 'REF-123460',
      items: ['كشف', 'علاج فيزيائي']
    }
  ]

  // Statistics
  const stats = {
    totalTransactions: transactions.length,
    completedToday: transactions.filter(t => {
      const today = new Date()
      return t.date.toDateString() === today.toDateString() && t.status === 'completed'
    }).length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    todayRevenue: transactions
      .filter(t => {
        const today = new Date()
        return t.date.toDateString() === today.toDateString() && t.status === 'completed'
      })
      .reduce((sum, t) => sum + t.netAmount, 0)
  }

  // Chart data (last 7 days)
  const chartData = [
    { day: 'السبت', transactions: 12, revenue: 3250 },
    { day: 'الأحد', transactions: 18, revenue: 4800 },
    { day: 'الاثنين', transactions: 15, revenue: 4200 },
    { day: 'الثلاثاء', transactions: 22, revenue: 6100 },
    { day: 'الأربعاء', transactions: 19, revenue: 5400 },
    { day: 'الخميس', transactions: 25, revenue: 7200 },
    { day: 'الجمعة', transactions: 16, revenue: 4500 }
  ]

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.customerPhone.includes(searchTerm)

    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter

    const today = new Date()
    const txnDate = txn.date
    let matchesDate = true
    if (dateFilter === 'today') {
      matchesDate = txnDate.toDateString() === today.toDateString()
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = txnDate >= weekAgo
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchesDate = txnDate >= monthAgo
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800'
    }
    const icons = {
      completed: <CheckCircle className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      failed: <X className="w-3 h-3" />,
      refunded: <RefreshCw className="w-3 h-3" />
    }
    const labels = {
      completed: 'مكتمل',
      pending: 'قيد المعالجة',
      failed: 'فشل',
      refunded: 'مسترجع'
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">سجل المعاملات</h1>
          <p className="text-gray-500 mt-1">جميع معاملات الدفع الخاصة بمتجرك</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المعاملات</p>
                <p className="text-3xl font-bold">{stats.totalTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مكتملة اليوم</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">قيد المعالجة</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إيرادات اليوم</p>
                <p className="text-2xl font-bold">{stats.todayRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">EGP</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>اتجاه المعاملات - آخر 7 أيام</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="transactions" fill="#0d9488" name="عدد المعاملات" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث برقم المعاملة، العميل، أو الهاتف..."
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="completed">مكتمل</option>
                <option value="pending">قيد المعالجة</option>
                <option value="failed">فشل</option>
                <option value="refunded">مسترجع</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">جميع الأوقات</option>
                <option value="today">اليوم</option>
                <option value="week">آخر 7 أيام</option>
                <option value="month">آخر 30 يوم</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((txn) => (
          <Card key={txn.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-teal-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{txn.customer}</h3>
                        <p className="text-sm text-gray-500">{txn.id} • {txn.reference}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold">{txn.amount.toLocaleString()} EGP</p>
                        <p className="text-sm text-gray-500">
                          صافي: {txn.netAmount.toLocaleString()} EGP
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{txn.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(txn.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CreditCard className="w-4 h-4" />
                        <span>محفظة HealthPay</span>
                      </div>
                      <div>
                        {getStatusBadge(txn.status)}
                      </div>
                    </div>

                    {txn.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-2">المنتجات / الخدمات:</p>
                        <div className="flex flex-wrap gap-2">
                          {txn.items.map((item, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span>العمولة: </span>
                        <span className="font-medium text-red-600">-{txn.commission.toLocaleString()} EGP</span>
                        <span className="text-gray-500"> (2.5%)</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 ml-2" />
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          عرض 1-{filteredTransactions.length} من {filteredTransactions.length} معاملة
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>السابق</Button>
          <Button variant="outline" size="sm">1</Button>
          <Button variant="outline" size="sm" disabled>التالي</Button>
        </div>
      </div>
    </div>
  )
}
