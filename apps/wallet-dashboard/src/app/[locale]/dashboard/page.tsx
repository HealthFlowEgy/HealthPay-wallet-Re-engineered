'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/layouts';
import { Card, Badge, ProgressBar, SkeletonWalletCard, SkeletonTransaction, EmptyState } from '@/components/ui';
import { GET_WALLET, GET_TRANSACTIONS } from '@/lib/graphql/queries';
import { formatCurrency, formatRelativeTime, getTransactionTypeIcon, getTransactionStatusColor, isDebitTransaction } from '@/lib/utils';
import { Transaction, Wallet } from '@/types';

export default function DashboardPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const t = locale === 'ar' ? {
    availableBalance: 'الرصيد المتاح', pendingBalance: 'رصيد معلق', quickActions: 'إجراءات سريعة',
    sendMoney: 'تحويل', payBills: 'الفواتير', topUp: 'شحن', scanQr: 'QR مسح', dailyLimit: 'الحد اليومي',
    spent: 'تم صرف', remaining: 'متبقي', recentTransactions: 'آخر المعاملات', viewAll: 'عرض الكل',
    noTransactions: 'لا توجد معاملات حتى الآن', startNow: 'ابدأ أول معاملة',
  } : {
    availableBalance: 'Available Balance', pendingBalance: 'Pending Balance', quickActions: 'Quick Actions',
    sendMoney: 'Transfer', payBills: 'Pay Bills', topUp: 'Top Up', scanQr: 'Scan QR', dailyLimit: 'Daily Limit',
    spent: 'Spent', remaining: 'Remaining', recentTransactions: 'Recent Transactions', viewAll: 'View All',
    noTransactions: 'No transactions yet', startNow: 'Start your first transaction',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const walletId = user?.wallet?.id;
  const { data: walletData, loading: walletLoading } = useQuery(GET_WALLET, { variables: { id: walletId }, skip: !walletId });
  const { data: txData, loading: txLoading } = useQuery(GET_TRANSACTIONS, { variables: { walletId, limit: 5 }, skip: !walletId });

  const wallet: Wallet | null = walletData?.wallet || user?.wallet;
  const transactions: Transaction[] = txData?.transactionsByWallet || [];
  const dailyLimit = 10000, dailySpent = 0, dailyRemaining = dailyLimit - dailySpent;

  if (authLoading) return <div className="min-h-screen bg-gray-50"><div className="bg-gradient-to-br from-primary-500 to-primary-600 px-4 py-6 pt-safe"><div className="h-16" /></div><div className="px-4 -mt-8"><SkeletonWalletCard /></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader userName={user?.name} locale={locale} onNotificationClick={() => router.push(`/${locale}/notifications`)} notificationCount={3} />
      <div className="px-4 -mt-4 space-y-6 pb-6">
        {walletLoading ? <SkeletonWalletCard /> : (
          <Card variant="gradient" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <p className="text-primary-100 text-sm mb-1">{t.availableBalance}</p>
              <p className="text-3xl font-bold mb-4">{formatCurrency(wallet?.balance || 0, locale)}</p>
              {wallet?.pendingBalance && wallet.pendingBalance > 0 && <p className="text-primary-100 text-sm">{t.pendingBalance}: {formatCurrency(wallet.pendingBalance, locale)}</p>}
            </div>
          </Card>
        )}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t.quickActions}</h2>
          <div className="grid grid-cols-4 gap-3">
            {[{ href: '/transfer', icon: '↗️', label: t.sendMoney, color: 'bg-blue-50 text-blue-600' }, { href: '/bills', icon: '📄', label: t.payBills, color: 'bg-green-50 text-green-600' }, { href: '/topup', icon: '💳', label: t.topUp, color: 'bg-purple-50 text-purple-600' }, { href: '/scan', icon: '📷', label: t.scanQr, color: 'bg-amber-50 text-amber-600' }].map((action) => (
              <Link key={action.href} href={`/${locale}${action.href}`} className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center text-2xl mb-2`}>{action.icon}</div>
                <span className="text-xs text-gray-600 text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-600">{t.dailyLimit}</span><span className="text-sm font-medium text-gray-800">{formatCurrency(dailyLimit, locale)}</span></div>
          <ProgressBar value={dailySpent} max={dailyLimit} color="primary" />
          <div className="flex justify-between mt-2 text-xs"><span className="text-gray-500">{t.spent}: {formatCurrency(dailySpent, locale)}</span><span className="text-primary-600 font-medium">{t.remaining}: {formatCurrency(dailyRemaining, locale)}</span></div>
        </Card>
        <div>
          <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-gray-800">{t.recentTransactions}</h2><Link href={`/${locale}/transactions`} className="text-sm text-primary-600 hover:underline">{t.viewAll}</Link></div>
          <Card padding="none">
            {txLoading ? <div className="divide-y">{[1,2,3].map((i) => <SkeletonTransaction key={i} />)}</div>
            : transactions.length === 0 ? <EmptyState icon="📭" title={t.noTransactions} description={t.startNow} />
            : <div className="divide-y divide-gray-100">{transactions.map((tx) => (
              <Link key={tx.id} href={`/${locale}/transactions?id=${tx.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDebitTransaction(tx.type) ? 'bg-danger-50' : 'bg-success-50'}`}><span>{getTransactionTypeIcon(tx.type)}</span></div>
                <div className="flex-1 min-w-0"><p className="font-medium text-gray-800 truncate">{tx.merchant?.businessName || tx.description || tx.type}</p><p className="text-xs text-gray-500">{formatRelativeTime(tx.createdAt, locale)}</p></div>
                <div className="text-left"><p className={`font-bold ${isDebitTransaction(tx.type) ? 'text-danger-600' : 'text-success-600'}`}>{isDebitTransaction(tx.type) ? '-' : '+'}{formatCurrency(tx.amount, locale)}</p><Badge variant={getTransactionStatusColor(tx.status) as any} size="sm">{tx.status}</Badge></div>
              </Link>
            ))}</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
