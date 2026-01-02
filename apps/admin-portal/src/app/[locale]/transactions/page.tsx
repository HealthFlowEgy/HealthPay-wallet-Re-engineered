'use client'

import { useState } from 'react'
import {
  Activity,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Transaction {
  id: string
  type: 'payment' | 'topup' | 'withdrawal' | 'transfer' | 'refund'
  amount: number
  fee: number
  netAmount: number
  status: 'completed' | 'pending' | 'failed' | 'refunded'
  from: {
    id: string
    name: string
    type: 'user' | 'merchant'
  }
  to: {
    id: string
    name: string
    type: 'user' | 'merchant'
  }
  description: string
  reference: string
  timestamp: string
  processingTime?: number // in seconds
  errorMessage?: string
}

export default function AdminTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | Transaction['type']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Transaction['status']>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Mock data - replace with real API
  const transactions: Transaction[] = [
    {
      id: 'TXN-2024-001234',
      type: 'payment',
      amount: 500.00,
      fee: 5.00,
      netAmount: 495.00,
      status: 'completed',
      from: {
        id: 'USR-001',
        name: 'أحمد محمد علي',
        type: 'user'
      },
      to: {
        id: 'MER-001',
        name: 'صيدلية العافية',
        type: 'merchant'
      },
      description: 'دفع ثمن أدوية',
      reference: 'PAY-2024-123456',
      timestamp: '2024-02-11T10:30:00Z',
      processingTime: 2.3
    },
    {
      id: 'TXN-2024-001235',
      type: 'topup',
      amount: 1000.00,
      fee: 0,
      netAmount: 1000.00,
      status: 'completed',
      from: {
        id: 'EXT-BANK',
        name: 'بنك خارجي',
        type: 'user'
      },
      to: {
        id: 'USR-002',
        name: 'سارة أحمد حسن',
        type: 'user'
      },
      description: 'شحن المحفظة',
      reference: 'TOP-2024-123457',
      timestamp: '2024-02-11T10:25:00Z',
      processingTime: 5.1
    },
    {
      id: 'TXN-2024-001236',
      type: 'withdrawal',
      amount: 750.00,
      fee: 10.00,
      netAmount: 740.00,
      status: 'pending',
      from: {
        id: 'MER-002',
        name: 'عيادة النيل',
        type: 'merchant'
      },
      to: {
        id: 'EXT-BANK',
        name: 'بنك خارجي',
        type: 'user'
      },
      description: 'سحب أرباح',
      reference: 'WTH-2024-123458',
      timestamp: '2024-02-11T10:20:00Z'
    },
    {
      id: 'TXN-2024-001237',
      type: 'transfer',
      amount: 200.00,
      fee: 2.00,
      netAmount: 198.00,
      status: 'completed',
      from: {
        id: 'USR-003',
        name: 'محمد حسن علي',
        type: 'user'
      },
      to: {
        id: 'USR-004',
        name: 'فاطمة أحمد',
        type: 'user'
      },
      description: 'تحويل مالي',
      reference: 'TRF-2024-123459',
      timestamp: '2024-02-11T10:15:00Z',
      processingTime: 1.8
    },
    {
      id: 'TXN-2024-001238',
      type: 'payment',
      amount: 350.00,
      fee: 3.50,
      netAmount: 346.50,
      status: 'failed',
      from: {
        id: 'USR-005',
        name: 'علي محمود',
        type: 'user'
      },
      to: {
        id: 'MER-003',
        name: 'معمل المدينة',
        type: 'merchant'
      },
      description: 'دفع ثمن تحاليل',
      reference: 'PAY-2024-123460',
      timestamp: '2024-02-11T10:10:00Z',
      errorMessage: 'رصيد غير كافٍ'
    }
  ]

  // Chart data
  const volumeData = [
    { hour: '8:00', amount: 15000 },
    { hour: '9:00', amount: 28000 },
    { hour: '10:00', amount: 45000 },
    { hour: '11:00', amount: 38000 },
    { hour: '12:00', amount: 52000 },
    { hour: '13:00', amount: 35000 },
    { hour: '14:00', amount: 48000 }
  ]

  const typeDistribution = [
    { hour: '8:00', payment: 20, topup: 15, withdrawal: 8, transfer: 12 },
    { hour: '9:00', payment: 35, topup: 22, withdrawal: 12, transfer: 18 },
    { hour: '10:00', payment: 45, topup: 28, withdrawal: 15, transfer: 25 },
    { hour: '11:00', payment: 38, topup: 24, withdrawal: 11, transfer: 20 },
    { hour: '12:00', payment: 52, topup: 30, withdrawal: 18, transfer: 28 },
    { hour: '13:00', payment: 40, topup: 25, withdrawal: 14, transfer: 22 },
    { hour: '14:00', payment: 48, topup: 27, withdrawal: 16, transfer: 24 }
  ]

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.from.name.includes(searchTerm) ||
      txn.to.name.includes(searchTerm) ||
      txn.description.includes(searchTerm)

    const matchesType = typeFilter === 'all' || txn.type === typeFilter
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    totalAmount: transactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0),
    totalFees: transactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.fee : 0), 0),
    totalCount: transactions.length,
    successRate: (transactions.filter(t => t.status === 'completed').length / transactions.length * 100).toFixed(1),
    avgProcessingTime: (transactions.filter(t => t.processingTime).reduce((sum, t) => sum + (t.processingTime || 0), 0) / transactions.filter(t => t.processingTime).length).toFixed(1)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="w-4 h-4" />
      case 'topup':
        return <ArrowUp className="w-4 h-4" />
      case 'withdrawal':
        return <ArrowDown className="w-4 h-4" />
      case 'transfer':
        return <RefreshCw className="w-4 h-4" />
      case 'refund':
        return <RefreshCw className="w-4 h-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      payment: { label: 'دفع', color: 'bg-red-100 text-red-800' },
      topup: { label: 'شحن', color: 'bg-green-100 text-green-800' },
      withdrawal: { label: 'سحب', color: 'bg-blue-100 text-blue-800' },
      transfer: { label: 'تحويل', color: 'bg-purple-100 text-purple-800' },
      refund: { label: 'استرجاع', color: 'bg-orange-100 text-orange-800' }
    }

    const t = types[type] || { label: type, color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 ${t.color} rounded-full text-xs font-medium`}>
        {getTypeIcon(type)}
        {t.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            مكتمل
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            قيد المعالجة
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            فشل
          </span>
        )
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
            <RefreshCw className="w-3 h-3" />
            مسترجع
          </span>
        )
    }
  }

  const handleRefresh = () => {
    // TODO: Call API to refresh data
    console.log('Refreshing transactions...')
    alert('تم تحديث المعاملات')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مراقبة المعاملات</h1>
          <p className="text-gray-500 mt-1">مراقبة في الوقت الفعلي لجميع المعاملات</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">تحديث تلقائي</span>
          </label>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المبلغ</p>
                <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">EGP</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي العمولات</p>
                <p className="text-2xl font-bold">{stats.totalFees.toLocaleString()}</p>
                <p className="text-xs text-gray-500">EGP</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">عدد المعاملات</p>
                <p className="text-2xl font-bold">{stats.totalCount}</p>
                <p className="text-xs text-gray-500">معاملة</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">معدل النجاح</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-gray-500">من المعاملات</p>
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
                <p className="text-sm text-gray-500">زمن المعالجة</p>
                <p className="text-2xl font-bold">{stats.avgProcessingTime}s</p>
                <p className="text-xs text-gray-500">متوسط</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              حجم المعاملات بالساعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              توزيع أنواع المعاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="payment" fill="#ef4444" name="دفع" />
                <Bar dataKey="topup" fill="#10b981" name="شحن" />
                <Bar dataKey="withdrawal" fill="#3b82f6" name="سحب" />
                <Bar dataKey="transfer" fill="#8b5cf6" name="تحويل" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث برقم المعاملة، المرجع، أو الاسم..."
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="payment">دفع</option>
                <option value="topup">شحن</option>
                <option value="withdrawal">سحب</option>
                <option value="transfer">تحويل</option>
                <option value="refund">استرجاع</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="completed">مكتمل</option>
                <option value="pending">قيد المعالجة</option>
                <option value="failed">فشل</option>
                <option value="refunded">مسترجع</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="today">اليوم</option>
                <option value="week">آخر 7 أيام</option>
                <option value="month">آخر 30 يوم</option>
                <option value="all">الكل</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-4 font-medium text-gray-700">رقم المعاملة</th>
                  <th className="text-right p-4 font-medium text-gray-700">النوع</th>
                  <th className="text-right p-4 font-medium text-gray-700">من</th>
                  <th className="text-right p-4 font-medium text-gray-700">إلى</th>
                  <th className="text-right p-4 font-medium text-gray-700">المبلغ</th>
                  <th className="text-right p-4 font-medium text-gray-700">العمولة</th>
                  <th className="text-right p-4 font-medium text-gray-700">الحالة</th>
                  <th className="text-right p-4 font-medium text-gray-700">الوقت</th>
                  <th className="text-center p-4 font-medium text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{txn.id}</p>
                        <p className="text-xs text-gray-500">{txn.reference}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {getTypeBadge(txn.type)}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{txn.from.name}</p>
                        <p className="text-xs text-gray-500">{txn.from.id}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{txn.to.name}</p>
                        <p className="text-xs text-gray-500">{txn.to.id}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold">{txn.amount.toLocaleString()} EGP</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">{txn.fee.toLocaleString()} EGP</p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(txn.status)}
                      {txn.processingTime && (
                        <p className="text-xs text-gray-500 mt-1">{txn.processingTime}s</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">
                        {new Date(txn.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(txn.timestamp).toLocaleDateString('ar-EG')}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(txn)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  تفاصيل المعاملة
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">رقم المعاملة</p>
                  <p className="font-medium">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">المرجع</p>
                  <p className="font-medium">{selectedTransaction.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">النوع</p>
                  {getTypeBadge(selectedTransaction.type)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              {/* Amount Details */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">المبلغ الأصلي</span>
                  <span className="font-medium">{selectedTransaction.amount.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">العمولة</span>
                  <span className="font-medium">{selectedTransaction.fee.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">صافي المبلغ</span>
                  <span className="font-bold text-lg">{selectedTransaction.netAmount.toLocaleString()} EGP</span>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">من</p>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">{selectedTransaction.from.name}</p>
                    <p className="text-sm text-gray-500">{selectedTransaction.from.id}</p>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {selectedTransaction.from.type === 'user' ? 'مستخدم' : 'تاجر'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">إلى</p>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">{selectedTransaction.to.name}</p>
                    <p className="text-sm text-gray-500">{selectedTransaction.to.id}</p>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {selectedTransaction.to.type === 'user' ? 'مستخدم' : 'تاجر'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-500 mb-2">الوصف</p>
                <p className="p-3 border rounded-lg">{selectedTransaction.description}</p>
              </div>

              {/* Timestamp & Processing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">التاريخ والوقت</p>
                  <p className="font-medium">
                    {new Date(selectedTransaction.timestamp).toLocaleString('ar-EG')}
                  </p>
                </div>
                {selectedTransaction.processingTime && (
                  <div>
                    <p className="text-sm text-gray-500">زمن المعالجة</p>
                    <p className="font-medium">{selectedTransaction.processingTime} ثانية</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {selectedTransaction.errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">رسالة الخطأ</span>
                  </div>
                  <p className="text-red-700 mt-2">{selectedTransaction.errorMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedTransaction.status === 'pending' && (
                  <Button className="flex-1">
                    <CheckCircle className="w-4 h-4 ml-2" />
                    إتمام المعاملة
                  </Button>
                )}
                {selectedTransaction.status === 'completed' && (
                  <Button variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 ml-2" />
                    استرجاع
                  </Button>
                )}
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 ml-2" />
                  تصدير التفاصيل
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
