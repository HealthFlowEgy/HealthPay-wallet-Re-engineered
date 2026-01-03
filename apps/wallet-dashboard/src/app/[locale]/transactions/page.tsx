'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layouts';
import { Card, Badge, Input, Button, Modal, EmptyState, SkeletonTransaction } from '@/components/ui';
import { GET_TRANSACTIONS } from '@/lib/graphql/queries';
import { formatCurrency, formatDateTime, getTransactionTypeLabel, getTransactionTypeIcon, getTransactionStatusLabel, getTransactionStatusColor, isDebitTransaction, copyToClipboard } from '@/lib/utils';
import { Transaction, TransactionStatus } from '@/types';

export default function TransactionsPage({ params }: { params: { locale: 'ar' | 'en' } }) {
  const { locale } = params;
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const t = locale === 'ar' ? {
    title: 'المعاملات', all: 'الكل', credits: 'إيداع', debits: 'سحب', search: 'بحث في المعاملات...',
    noTransactions: 'لا توجد معاملات', tryDifferentFilter: 'جرب تغيير الفلتر', transactionDetails: 'تفاصيل المعاملة',
    amount: 'المبلغ', fee: 'الرسوم', net: 'الصافي', status: 'الحالة', reference: 'المرجع', date: 'التاريخ',
    type: 'النوع', description: 'الوصف', merchant: 'التاجر', copyReference: 'نسخ المرجع',
    downloadReceipt: 'تحميل الإيصال', filterByStatus: 'فلتر بالحالة',
  } : {
    title: 'Transactions', all: 'All', credits: 'Credits', debits: 'Debits', search: 'Search transactions...',
    noTransactions: 'No transactions found', tryDifferentFilter: 'Try a different filter', transactionDetails: 'Transaction Details',
    amount: 'Amount', fee: 'Fee', net: 'Net', status: 'Status', reference: 'Reference', date: 'Date',
    type: 'Type', description: 'Description', merchant: 'Merchant', copyReference: 'Copy Reference',
    downloadReceipt: 'Download Receipt', filterByStatus: 'Filter by status',
  };

  useEffect(() => { if (!authLoading && !isAuthenticated) router.replace(`/${locale}/auth/login`); }, [authLoading, isAuthenticated, locale, router]);

  const walletId = user?.wallet?.id;
  const { data, loading } = useQuery(GET_TRANSACTIONS, { variables: { walletId, limit: 50 }, skip: !walletId });

  const allTransactions: Transaction[] = data?.transactionsByWallet || [];
  const filteredTransactions = allTransactions.filter((tx) => {
    if (filter === 'credit' && isDebitTransaction(tx.type)) return false;
    if (filter === 'debit' && !isDebitTransaction(tx.type)) return false;
    if (statusFilter && tx.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!tx.reference?.toLowerCase().includes(query) && !tx.description?.toLowerCase().includes(query) && !tx.merchant?.businessName?.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  if (authLoading) return <div className="min-h-screen bg-gray-50"><Header title={t.title} locale={locale} /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={t.title} locale={locale} />
      <div className="px-4 py-4 bg-white border-b sticky top-14 z-30">
        <div className="flex gap-2 mb-3">
          {(['all', 'credit', 'debit'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f === 'all' ? t.all : f === 'credit' ? t.credits : t.debits}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1"><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search} icon={<span>🔍</span>} iconPosition="left" /></div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TransactionStatus | '')} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
            <option value="">{t.filterByStatus}</option>
            <option value="COMPLETED">{getTransactionStatusLabel('COMPLETED', locale)}</option>
            <option value="PENDING">{getTransactionStatusLabel('PENDING', locale)}</option>
            <option value="FAILED">{getTransactionStatusLabel('FAILED', locale)}</option>
          </select>
        </div>
      </div>
      <div className="px-4 py-4">
        {loading ? <div className="space-y-2">{[1,2,3,4,5].map((i) => <Card key={i} padding="none"><SkeletonTransaction /></Card>)}</div>
        : filteredTransactions.length === 0 ? <EmptyState icon="📭" title={t.noTransactions} description={t.tryDifferentFilter} />
        : <div className="space-y-2">{filteredTransactions.map((tx) => (
          <Card key={tx.id} padding="none" onClick={() => { setSelectedTx(tx); setShowDetail(true); }} className="cursor-pointer">
            <div className="flex items-center gap-3 p-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDebitTransaction(tx.type) ? 'bg-danger-50' : 'bg-success-50'}`}><span className="text-xl">{getTransactionTypeIcon(tx.type)}</span></div>
              <div className="flex-1 min-w-0"><p className="font-medium text-gray-800 truncate">{tx.merchant?.businessName || tx.description || getTransactionTypeLabel(tx.type, locale)}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs text-gray-500">{formatDateTime(tx.createdAt, locale)}</span><Badge variant={getTransactionStatusColor(tx.status) as any} size="sm">{getTransactionStatusLabel(tx.status, locale)}</Badge></div></div>
              <div className="text-left"><p className={`font-bold ${isDebitTransaction(tx.type) ? 'text-danger-600' : 'text-success-600'}`}>{isDebitTransaction(tx.type) ? '-' : '+'}{formatCurrency(tx.amount, locale)}</p>{tx.fee > 0 && <p className="text-xs text-gray-400">{locale === 'ar' ? 'رسوم:' : 'Fee:'} {formatCurrency(tx.fee, locale)}</p>}</div>
            </div>
          </Card>
        ))}</div>}
      </div>
      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelectedTx(null); }} title={t.transactionDetails}>
        {selectedTx && (
          <div className="space-y-4">
            <div className="text-center py-4 border-b"><p className={`text-3xl font-bold ${isDebitTransaction(selectedTx.type) ? 'text-danger-600' : 'text-success-600'}`}>{isDebitTransaction(selectedTx.type) ? '-' : '+'}{formatCurrency(selectedTx.amount, locale)}</p><Badge variant={getTransactionStatusColor(selectedTx.status) as any} size="md" className="mt-2">{getTransactionStatusLabel(selectedTx.status, locale)}</Badge></div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.type}</span><span className="font-medium">{getTransactionTypeLabel(selectedTx.type, locale)}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.date}</span><span className="font-medium">{formatDateTime(selectedTx.createdAt, locale)}</span></div>
              {selectedTx.reference && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.reference}</span><div className="flex items-center gap-2"><span className="font-medium">{selectedTx.reference}</span><button onClick={() => copyToClipboard(selectedTx.reference!)} className="text-primary-600 text-sm">📋</button></div></div>}
              {selectedTx.fee > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{t.fee}</span><span className="font-medium">{formatCurrency(selectedTx.fee, locale)}</span></div>}
            </div>
            <div className="pt-4"><Button fullWidth variant="outline">{t.downloadReceipt}</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
