'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  timestamp: string
  status: 'pending' | 'completed' | 'failed'
}

export default function DashboardPage() {
  const t = useTranslations()
  const { user, wallet } = useAuth()
  const ws = useWebSocket()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    todayIn: 0,
    todayOut: 0,
    weeklyIn: 0,
    weeklyOut: 0,
    monthlyIn: 0,
    monthlyOut: 0
  })
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Fetch initial data
    fetchDashboardData()

    // Subscribe to real-time updates
    if (wallet?.id && ws) {
      const unsubscribeWallet = ws.onWalletUpdate(wallet.id, (update) => {
        console.log('Wallet balance updated:', update)
        // Update local state
      })

      const unsubscribeTxn = ws.onTransaction(wallet.id, (txn) => {
        console.log('New transaction:', txn)
        setTransactions(prev => [txn as any, ...prev.slice(0, 9)])
      })

      return () => {
        unsubscribeWallet()
        unsubscribeTxn()
      }
    }
  }, [wallet?.id, ws])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // TODO: Fetch from API
      // Mock data for now
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'credit',
          amount: 500,
          description: 'شحن المحفظة - فوري',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'completed'
        },
        {
          id: '2',
          type: 'debit',
          amount: 150,
          description: 'دفع فاتورة - صيدلية العزبي',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: 'completed'
        },
        {
          id: '3',
          type: 'debit',
          amount: 80,
          description: 'دفع استشارة - د. أحمد محمد',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          status: 'completed'
        },
        {
          id: '4',
          type: 'credit',
          amount: 200,
          description: 'استرجاع مبلغ',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          status: 'completed'
        },
        {
          id: '5',
          type: 'debit',
          amount: 120,
          description: 'دفع فحوصات - معمل البرج',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          status: 'completed'
        }
      ]

      setTransactions(mockTransactions)

      // Mock chart data (last 7 days)
      const mockChartData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' }),
        balance: 2000 + Math.random() * 1000
      }))
      setChartData(mockChartData)

      setStats({
        todayIn: 500,
        todayOut: 230,
        weeklyIn: 2500,
        weeklyOut: 1800,
        monthlyIn: 10000,
        monthlyOut: 7500
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') return Clock
    if (status === 'failed') return XCircle
    return type === 'credit' ? ArrowDownLeft : ArrowUpRight
  }

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'pending') return 'text-amber-600'
    if (status === 'failed') return 'text-red-600'
    return type === 'credit' ? 'text-green-600' : 'text-gray-900'
  }

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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          {t('dashboard.welcome')}, {user?.fullName?.split(' ')[0]}! 👋
        </h1>
        <p className="text-teal-100">
          {new Date().toLocaleDateString('ar-EG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Balance Card */}
      <Card className="border-2 border-teal-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-teal-600" />
            {t('wallet.availableBalance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(wallet?.balance || 0, wallet?.currency || 'EGP')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('wallet.walletId')}: {wallet?.id?.slice(0, 8)}...
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
                <Plus className="w-6 h-6 text-teal-600" />
                <span className="text-sm">{t('wallet.topUp')}</span>
              </Button>
              <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
                <Send className="w-6 h-6 text-teal-600" />
                <span className="text-sm">{t('wallet.send')}</span>
              </Button>
              <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
                <Download className="w-6 h-6 text-teal-600" />
                <span className="text-sm">{t('wallet.withdraw')}</span>
              </Button>
              <Button className="flex flex-col items-center gap-2 h-auto py-4" variant="outline">
                <ArrowDownLeft className="w-6 h-6 text-teal-600" />
                <span className="text-sm">{t('wallet.request')}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.today')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.todayIn)}
                </p>
                <p className="text-xs text-gray-500">وارد</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.todayOut)}
                </p>
                <p className="text-xs text-gray-500">صادر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.thisWeek')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.weeklyIn)}
                </p>
                <p className="text-xs text-gray-500">وارد</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.weeklyOut)}
                </p>
                <p className="text-xs text-gray-500">صادر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {t('dashboard.thisMonth')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.monthlyIn)}
                </p>
                <p className="text-xs text-gray-500">وارد</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.monthlyOut)}
                </p>
                <p className="text-xs text-gray-500">صادر</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>اتجاه الرصيد - آخر 7 أيام</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ fill: '#14b8a6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('wallet.recent')}</CardTitle>
            <Button variant="ghost" size="sm">
              عرض الكل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((txn) => {
              const Icon = getTransactionIcon(txn.type, txn.status)
              const color = getTransactionColor(txn.type, txn.status)

              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{txn.description}</p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(txn.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${color}`}>
                      {txn.type === 'credit' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{txn.status}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
