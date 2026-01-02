'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useWebSocket } from '@/hooks/useWebSocket'
import { formatCurrency } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  locale: string
}

export default function DashboardLayout({ children, locale }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const pathname = usePathname()
  const t = useTranslations()
  const { user, wallet, logout } = useAuth()
  const ws = useWebSocket()

  // Subscribe to wallet updates
  useEffect(() => {
    if (wallet?.id && ws) {
      const unsubscribe = ws.onWalletUpdate(wallet.id, (update) => {
        // Wallet balance updated in real-time
        console.log('Wallet updated:', update)
      })

      return unsubscribe
    }
  }, [wallet?.id, ws])

  const navigation = [
    {
      name: t('nav.dashboard'),
      href: `/${locale}/dashboard`,
      icon: Wallet,
      current: pathname === `/${locale}/dashboard`
    },
    {
      name: t('nav.transactions'),
      href: `/${locale}/transactions`,
      icon: ArrowLeftRight,
      current: pathname === `/${locale}/transactions`
    },
    {
      name: t('nav.medcard'),
      href: `/${locale}/medcard`,
      icon: CreditCard,
      current: pathname === `/${locale}/medcard`
    },
    {
      name: t('nav.settings'),
      href: `/${locale}/settings`,
      icon: Settings,
      current: pathname === `/${locale}/settings`
    }
  ]

  const toggleLanguage = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    window.location.href = pathname.replace(`/${locale}`, `/${newLocale}`)
  }

  return (
    <div className={cn("min-h-screen bg-gray-50", locale === 'ar' && 'rtl')} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md lg:hidden hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">HealthPay</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Balance Badge */}
            {wallet && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-lg border border-teal-200">
                <Wallet className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-bold text-teal-900">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </span>
              </div>
            )}

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={locale === 'ar' ? 'English' : 'العربية'}
            >
              <Globe className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.phone}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 z-40 w-64 bg-white border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            locale === 'ar' ? "right-0 border-l" : "left-0 border-r"
          )}
          style={{ top: '64px' }}
        >
          <nav className="flex flex-col gap-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    item.current
                      ? "bg-teal-50 text-teal-900 shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all mt-auto"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('nav.logout')}</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
