'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface Transaction {
  id: string
  type: 'credit' | 'debit' | 'transfer'
  amount: number
  fee: number
  description: string
  reference: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  from?: string
  to?: string
  gateway?: string
}

export default function TransactionsPage() {
  const t = useTranslations()
  const { wallet } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 15

  useEffect(() => {
    fetchTransactions()
  }, [wallet?.id])

  useEffect(() => {
    filterTransactions()
  }, [searchQuery, selectedType, selectedStatus, dateRange, transactions])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      const mockData: Transaction[] = Array.from({ length: 50 }, (_, i) => {
        const types: ('credit' | 'debit' | 'transfer')[] = ['credit', 'debit', 'transfer']
        const statuses: ('pending' | 'completed' | 'failed' | 'cancelled')[] = ['completed', 'completed', 'completed', 'pending', 'failed']
        const type = types[Math.floor(Math.random() * types.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        return {
          id: `TXN-${Date.now()}-${i}`,
          type,
          amount: Math.floor(Math.random() * 1000) + 50,
          fee: Math.floor(Math.random() * 10),
          description: type === 'credit' 
            ? 'شحن المحفظة - فوري' 
            : type === 'debit'
            ? `دفع - ${['صيدلية العزبي', 'معمل البرج', 'د. أحمد محمد', 'مستشفى النيل'][Math.floor(Math.random() * 4)]}`
            : 'تحويل إلى محمد علي',
          reference: `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          status,
          from: type === 'debit' ? wallet?.id : undefined,
          to: type === 'credit' ? wallet?.id : undefined,
          gateway: type === 'credit' ? ['fawry', 'paymob', 'vodafone'][Math.floor(Math.random() * 3)] : undefined
        }
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setTransactions(mockData)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(txn =>
        txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(txn => txn.type === selectedType)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(txn => txn.status === selectedStatus)
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.timestamp)
        switch (dateRange) {
          case 'today':
            return txnDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return txnDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return txnDate >= monthAgo
          default:
            return true
        }
      })
    }

    setFilteredTransactions(filtered)
    setCurrentPage(1)
  }

  const exportTransactions = () => {
    // Create CSV
    const headers = ['التاريخ', 'النوع', 'المبلغ', 'الرسوم', 'الإجمالي', 'الوصف', 'المرجع', 'الحالة']
    const rows = filteredTransactions.map(txn => [
      formatDate(txn.timestamp),
      t(`transactions.${txn.type}`),
      txn.amount,
      txn.fee,
      txn.amount + txn.fee,
      txn.description,
      txn.reference,
      t(`transactions.${txn.status}`)
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') return Clock
    if (status === 'failed') return XCircle
    if (status === 'cancelled') return AlertCircle
    return type === 'credit' ? ArrowDownLeft : ArrowUpRight
  }

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'pending') return 'text-amber-600 bg-amber-50'
    if (status === 'failed') return 'text-red-600 bg-red-50'
    if (status === 'cancelled') return 'text-gray-600 bg-gray-50'
    return type === 'credit' ? 'text-green-600 bg-green-50' : 'text-gray-900 bg-gray-50'
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || colors.completed
  }

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.transactions')}</h1>
          <p className="text-gray-500 mt-1">
            عرض وإدارة جميع معاملاتك المالية
          </p>
        </div>
        <Button onClick={exportTransactions} className="gap-2">
          <Download className="w-4 h-4" />
          {t('common.export')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">إجمالي المعاملات</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filteredTransactions.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">إجمالي الوارد</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.type === 'credit' && t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">إجمالي الصادر</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.type === 'debit' && t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">معلقة</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {filteredTransactions.filter(t => t.status === 'pending').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              البحث والتصفية
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'إخفاء' : 'عرض'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث بالوصف أو المرجع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="credit">إيداع</option>
                <option value="debit">سحب</option>
                <option value="transfer">تحويل</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="completed">مكتمل</option>
                <option value="pending">معلق</option>
                <option value="failed">فشل</option>
                <option value="cancelled">ملغي</option>
              </select>

              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">كل الفترات</option>
                <option value="today">اليوم</option>
                <option value="week">آخر 7 أيام</option>
                <option value="month">آخر 30 يوم</option>
              </select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            المعاملات ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد معاملات مطابقة للفلاتر المحددة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentTransactions.map((txn) => {
                const Icon = getTransactionIcon(txn.type, txn.status)
                const colorClass = getTransactionColor(txn.type, txn.status)
                const total = txn.type === 'debit' ? txn.amount + txn.fee : txn.amount

                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{txn.description}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(txn.status)}`}>
                            {t(`transactions.${txn.status}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(txn.timestamp)}
                          </span>
                          <span>•</span>
                          <span>{txn.reference}</span>
                          {txn.gateway && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{txn.gateway}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <p className={`text-lg font-bold ${
                        txn.status === 'failed' ? 'text-red-600' :
                        txn.status === 'pending' ? 'text-amber-600' :
                        txn.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </p>
                      {txn.fee > 0 && (
                        <p className="text-xs text-gray-500">
                          رسوم: {formatCurrency(txn.fee)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                عرض {startIndex + 1} - {Math.min(endIndex, filteredTransactions.length)} من {filteredTransactions.length}
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('common.previous')}
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
