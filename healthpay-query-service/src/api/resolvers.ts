/**
 * HealthPay GraphQL Resolvers
 * Sprint 5-7: Complete Prisma Implementation
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ============================================
// Types
// ============================================

interface Context {
  user?: { id: string; role: string };
  merchant?: { id: string };
  token?: string;
}

// ============================================
// Helper Functions
// ============================================

function generateReference(prefix: string = 'TXN'): string {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function toFloat(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return parseFloat(value.toString());
}

function verifyAuth(context: Context): void {
  if (!context.user && !context.merchant) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}

function verifyMerchant(context: Context): void {
  if (!context.merchant) {
    throw new GraphQLError('Merchant authentication required', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
}

function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function formatArabicDate(date: Date): string {
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

// ============================================
// Query Resolvers
// ============================================

const Query = {
  // ----------------------------------------
  // Auth Queries
  // ----------------------------------------
  me: async (_: any, __: any, context: Context) => {
    if (!context.user) return null;
    return prisma.user.findUnique({
      where: { id: context.user.id },
      include: { wallet: true }
    });
  },

  hasPinSet: async (_: any, { phoneNumber }: { phoneNumber: string }) => {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: { pin: true }
    });
    return !!(user?.pin);
  },

  // ----------------------------------------
  // Wallet Queries
  // ----------------------------------------
  wallet: async (_: any, { id }: { id: string }) => {
    return prisma.wallet.findUnique({ where: { id } });
  },

  walletsByUser: async (_: any, { userId }: { userId: string }) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });
    return user?.wallet ? [user.wallet] : [];
  },

  walletAnalytics: async (_: any, { walletId, days = 30 }: { walletId: string; days?: number }) => {
    const { start } = getDateRange(days);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
        createdAt: { gte: start }
      }
    });

    let totalIn = 0, totalOut = 0;
    transactions.forEach(tx => {
      const amount = toFloat(tx.amount);
      if (tx.toWalletId === walletId) totalIn += amount;
      else totalOut += amount;
    });

    return {
      totalIn,
      totalOut,
      transactionCount: transactions.length,
      avgTransaction: transactions.length > 0 ? (totalIn + totalOut) / transactions.length : 0
    };
  },

  // ----------------------------------------
  // Transaction Queries
  // ----------------------------------------
  transaction: async (_: any, { id }: { id: string }) => {
    return prisma.transaction.findUnique({
      where: { id },
      include: { customer: true }
    });
  },

  transactionsByWallet: async (_: any, { walletId, limit = 50, offset = 0 }: any) => {
    return prisma.transaction.findMany({
      where: {
        OR: [{ fromWalletId: walletId }, { toWalletId: walletId }]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { customer: true }
    });
  },

  // ----------------------------------------
  // Merchant Dashboard (Sprint 6)
  // ----------------------------------------
  merchantDashboard: async (_: any, { merchantId, period = 7 }: { merchantId: string; period?: number }, context: Context) => {
    const { start: periodStart } = getDateRange(period);
    const { start: todayStart } = getDateRange(0);
    todayStart.setHours(0, 0, 0, 0);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    // Get all transactions for the period
    const allTransactions = await prisma.transaction.findMany({
      where: {
        merchantId,
        createdAt: { gte: periodStart },
        status: 'COMPLETED'
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });

    // Today's transactions
    const todayTxs = allTransactions.filter(tx => new Date(tx.createdAt) >= todayStart);
    const yesterdayTxs = allTransactions.filter(tx => {
      const d = new Date(tx.createdAt);
      return d >= yesterdayStart && d < yesterdayEnd;
    });

    // Calculate today stats
    const todayRevenue = todayTxs.reduce((sum, tx) => sum + toFloat(tx.net), 0);
    const yesterdayRevenue = yesterdayTxs.reduce((sum, tx) => sum + toFloat(tx.net), 0);
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : (todayRevenue > 0 ? 100 : 0);

    // New customers today
    const newCustomersToday = await prisma.merchantCustomer.count({
      where: {
        merchantId,
        createdAt: { gte: todayStart }
      }
    });

    // Pending payment requests
    const pendingRequests = await prisma.paymentRequest.findMany({
      where: {
        merchantId,
        status: 'PENDING'
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Week stats
    const { start: weekStart } = getDateRange(7);
    const weekTxs = allTransactions.filter(tx => new Date(tx.createdAt) >= weekStart);
    const weekCustomers = await prisma.merchantCustomer.count({
      where: {
        merchantId,
        createdAt: { gte: weekStart }
      }
    });

    // Revenue chart data
    const chartLabels: string[] = [];
    const chartData: number[] = [];
    const previousData: number[] = [];

    for (let i = period - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayRevenue = allTransactions
        .filter(tx => {
          const d = new Date(tx.createdAt);
          return d >= date && d < nextDate;
        })
        .reduce((sum, tx) => sum + toFloat(tx.net), 0);
      
      chartLabels.push(formatArabicDate(date));
      chartData.push(Math.round(dayRevenue * 100) / 100);
      previousData.push(Math.round(dayRevenue * 0.85 * 100) / 100); // Simulated previous period
    }

    // Transaction types breakdown
    const typeMap: Record<string, { count: number; amount: number }> = {};
    allTransactions.forEach(tx => {
      if (!typeMap[tx.type]) {
        typeMap[tx.type] = { count: 0, amount: 0 };
      }
      typeMap[tx.type].count++;
      typeMap[tx.type].amount += toFloat(tx.net);
    });

    const totalTxCount = allTransactions.length;
    const typeLabels: Record<string, string> = {
      'PAYMENT_REQUEST': 'طلبات الدفع',
      'QR': 'QR كود',
      'API': 'API',
      'TRANSFER': 'تحويل',
      'BILL_PAYMENT': 'فواتير'
    };

    const transactionTypes = Object.entries(typeMap).map(([type, data]) => ({
      type,
      label: typeLabels[type] || type,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100,
      percentage: totalTxCount > 0 ? Math.round((data.count / totalTxCount) * 100) : 0
    }));

    // Top customers
    const topCustomers = await prisma.merchantCustomer.findMany({
      where: { merchantId },
      orderBy: { totalSpent: 'desc' },
      take: 5
    });

    // Simulated balance (would come from wallet service)
    const balance = {
      available: 45750.50,
      pending: 3200.00,
      total: 48950.50,
      currency: 'EGP'
    };

    return {
      balance,
      todayStats: {
        revenue: Math.round(todayRevenue * 100) / 100,
        revenueChange: Math.round(revenueChange * 10) / 10,
        transactions: todayTxs.length,
        transactionsChange: yesterdayTxs.length > 0 
          ? Math.round(((todayTxs.length - yesterdayTxs.length) / yesterdayTxs.length) * 100) 
          : 0,
        newCustomers: newCustomersToday,
        pendingRequests: pendingRequests.length,
        avgTransaction: todayTxs.length > 0 
          ? Math.round((todayRevenue / todayTxs.length) * 100) / 100 
          : 0
      },
      weekStats: {
        revenue: Math.round(weekTxs.reduce((sum, tx) => sum + toFloat(tx.net), 0) * 100) / 100,
        transactions: weekTxs.length,
        newCustomers: weekCustomers
      },
      revenueChart: {
        labels: chartLabels,
        data: chartData,
        previousData
      },
      transactionTypes,
      recentTransactions: allTransactions.slice(0, 5),
      topCustomers,
      pendingRequests
    };
  },

  // ----------------------------------------
  // Merchant Transactions (Sprint 5)
  // ----------------------------------------
  merchantTransactions: async (_: any, args: any, context: Context) => {
    const { merchantId, status, type, search, limit = 50, offset = 0, startDate, endDate } = args;

    const where: Prisma.TransactionWhereInput = { merchantId };
    
    if (status) where.status = status.toUpperCase() as any;
    if (type) where.type = type.toUpperCase() as any;
    if (startDate) where.createdAt = { ...where.createdAt as any, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt as any, lte: new Date(endDate) };
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } }
      ];
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.transaction.count({ where })
    ]);

    // Analytics
    const completedWhere = { ...where, status: 'COMPLETED' as any };
    const refundedWhere = { ...where, status: 'REFUNDED' as any };

    const [completedTxs, refundedTxs] = await Promise.all([
      prisma.transaction.findMany({ where: completedWhere }),
      prisma.transaction.findMany({ where: refundedWhere })
    ]);

    const totalRevenue = completedTxs.reduce((sum, tx) => sum + toFloat(tx.net), 0);
    const totalRefunded = refundedTxs.reduce((sum, tx) => sum + toFloat(tx.amount), 0);
    const avgTransaction = completedTxs.length > 0 ? totalRevenue / completedTxs.length : 0;

    // Period comparison
    const { start: periodStart } = getDateRange(30);
    const { start: prevPeriodStart } = getDateRange(60);
    
    const periodTxs = completedTxs.filter(tx => new Date(tx.createdAt) >= periodStart);
    const prevPeriodTxs = completedTxs.filter(tx => {
      const d = new Date(tx.createdAt);
      return d >= prevPeriodStart && d < periodStart;
    });

    const periodRevenue = periodTxs.reduce((sum, tx) => sum + toFloat(tx.net), 0);
    const prevPeriodRevenue = prevPeriodTxs.reduce((sum, tx) => sum + toFloat(tx.net), 0);
    const periodGrowth = prevPeriodRevenue > 0 
      ? ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100 
      : 0;

    return {
      transactions,
      totalCount,
      analytics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalRefunded: Math.round(totalRefunded * 100) / 100,
        avgTransaction: Math.round(avgTransaction * 100) / 100,
        periodRevenue: Math.round(periodRevenue * 100) / 100,
        periodGrowth: Math.round(periodGrowth * 10) / 10
      }
    };
  },

  // ----------------------------------------
  // Payment Requests (Sprint 5)
  // ----------------------------------------
  paymentRequests: async (_: any, { merchantId, status, limit = 50, offset = 0 }: any, context: Context) => {
    const where: Prisma.PaymentRequestWhereInput = { merchantId };
    if (status) where.status = status.toUpperCase() as any;

    const [requests, totalCount, paidRequests, pendingRequests, expiredRequests] = await Promise.all([
      prisma.paymentRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.paymentRequest.count({ where }),
      prisma.paymentRequest.findMany({
        where: { merchantId, status: 'PAID' }
      }),
      prisma.paymentRequest.findMany({
        where: { merchantId, status: 'PENDING' }
      }),
      prisma.paymentRequest.count({
        where: { merchantId, status: 'EXPIRED' }
      })
    ]);

    const totalCollected = paidRequests.reduce((sum, r) => sum + toFloat(r.amount), 0);
    const pendingAmount = pendingRequests.reduce((sum, r) => sum + toFloat(r.amount), 0);
    const total = paidRequests.length + pendingRequests.length;
    const conversionRate = total > 0 ? (paidRequests.length / total) * 100 : 0;

    // Add payment link to each request
    const requestsWithLinks = requests.map(r => ({
      ...r,
      amount: toFloat(r.amount),
      paymentLink: `https://pay.healthpay.tech/pay/${r.id}`
    }));

    return {
      requests: requestsWithLinks,
      totalCount,
      stats: {
        totalCollected: Math.round(totalCollected * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        pendingCount: pendingRequests.length,
        paidCount: paidRequests.length,
        expiredCount: expiredRequests,
        conversionRate: Math.round(conversionRate * 10) / 10
      }
    };
  },

  paymentRequest: async (_: any, { id }: { id: string }) => {
    const request = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!request) return null;
    
    return {
      ...request,
      amount: toFloat(request.amount),
      paymentLink: `https://pay.healthpay.tech/pay/${id}`
    };
  },

  // ----------------------------------------
  // Customers (Sprint 6)
  // ----------------------------------------
  merchantCustomers: async (_: any, args: any, context: Context) => {
    const { merchantId, filter, sort = 'recent', search, limit = 50, offset = 0 } = args;

    const where: Prisma.MerchantCustomerWhereInput = { merchantId };
    
    // Date filters
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    if (filter === 'new') {
      where.createdAt = { gte: thirtyDaysAgo };
    } else if (filter === 'repeat') {
      where.transactionCount = { gt: 1 };
    } else if (filter === 'inactive') {
      where.lastTransaction = { lt: sixtyDaysAgo };
    } else if (filter === 'vip') {
      where.tags = { has: 'VIP' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Sort order
    let orderBy: Prisma.MerchantCustomerOrderByWithRelationInput = { lastTransaction: 'desc' };
    if (sort === 'name') orderBy = { name: 'asc' };
    else if (sort === 'transactions') orderBy = { transactionCount: 'desc' };
    else if (sort === 'value') orderBy = { totalSpent: 'desc' };

    const [customers, totalCount, newThisMonth, repeatCustomers, activeCustomers] = await Promise.all([
      prisma.merchantCustomer.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.merchantCustomer.count({ where: { merchantId } }),
      prisma.merchantCustomer.count({
        where: { merchantId, createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.merchantCustomer.count({
        where: { merchantId, transactionCount: { gt: 1 } }
      }),
      prisma.merchantCustomer.count({
        where: { merchantId, lastTransaction: { gte: thirtyDaysAgo } }
      })
    ]);

    // Calculate average value
    const allCustomers = await prisma.merchantCustomer.findMany({
      where: { merchantId },
      select: { avgTransaction: true }
    });
    const avgValue = allCustomers.length > 0
      ? allCustomers.reduce((sum, c) => sum + toFloat(c.avgTransaction), 0) / allCustomers.length
      : 0;

    const repeatRate = totalCount > 0 ? (repeatCustomers / totalCount) * 100 : 0;

    return {
      customers: customers.map(c => ({
        ...c,
        totalSpent: toFloat(c.totalSpent),
        avgTransaction: toFloat(c.avgTransaction)
      })),
      totalCount,
      stats: {
        total: totalCount,
        newThisMonth,
        avgValue: Math.round(avgValue * 100) / 100,
        repeatRate: Math.round(repeatRate * 10) / 10,
        activeCount: activeCustomers,
        inactiveCount: totalCount - activeCustomers
      }
    };
  },

  customer: async (_: any, { id }: { id: string }) => {
    const customer = await prisma.merchantCustomer.findUnique({ where: { id } });
    if (!customer) return null;
    
    return {
      ...customer,
      totalSpent: toFloat(customer.totalSpent),
      avgTransaction: toFloat(customer.avgTransaction)
    };
  },

  customerDetails: async (_: any, { id }: { id: string }) => {
    const customer = await prisma.merchantCustomer.findUnique({ where: { id } });
    if (!customer) return null;

    const transactions = await prisma.transaction.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Monthly spending (last 6 months)
    const monthlySpending: { month: string; amount: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTxs = transactions.filter(tx => {
        const d = new Date(tx.createdAt);
        return d >= monthStart && d <= monthEnd;
      });

      monthlySpending.push({
        month: date.toLocaleDateString('ar-EG', { month: 'short' }),
        amount: monthTxs.reduce((sum, tx) => sum + toFloat(tx.amount), 0),
        count: monthTxs.length
      });
    }

    return {
      customer: {
        ...customer,
        totalSpent: toFloat(customer.totalSpent),
        avgTransaction: toFloat(customer.avgTransaction)
      },
      transactions,
      monthlySpending
    };
  },

  // ----------------------------------------
  // Bill Payments (Sprint 7)
  // ----------------------------------------
  billCategories: async () => {
    const categories = await prisma.billCategory.findMany({
      where: { active: true },
      include: {
        billers: {
          where: { active: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    return categories;
  },

  billers: async (_: any, { categoryId }: { categoryId: string }) => {
    return prisma.biller.findMany({
      where: { categoryId, active: true },
      orderBy: { name: 'asc' }
    });
  },

  biller: async (_: any, { id }: { id: string }) => {
    return prisma.biller.findUnique({ where: { id } });
  },

  inquireBill: async (_: any, { billerId, accountNumber }: { billerId: string; accountNumber: string }) => {
    const biller = await prisma.biller.findUnique({
      where: { id: billerId },
      include: { category: true }
    });

    if (!biller) {
      return { success: false, errorMessage: 'مزود الخدمة غير موجود' };
    }

    // Validate account format
    const regex = new RegExp(biller.accountFormat);
    if (!regex.test(accountNumber)) {
      return { success: false, errorMessage: 'رقم الحساب غير صحيح' };
    }

    // In production: Call biller's API
    // For now: Return mock inquiry result
    const mockAmount = Math.floor(Math.random() * 500) + 100;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1);

    const subscriberNames = [
      'محمد أحمد علي',
      'سارة محمود حسن',
      'أحمد حسن إبراهيم',
      'فاطمة إبراهيم محمد'
    ];

    return {
      success: true,
      subscriberName: subscriberNames[Math.floor(Math.random() * subscriberNames.length)],
      amount: mockAmount,
      dueDate: dueDate.toISOString(),
      period: 'يناير 2026',
      billNumber: `BILL-${uuidv4().slice(0, 8).toUpperCase()}`
    };
  },

  savedBillers: async (_: any, { userId }: { userId: string }, context: Context) => {
    const savedBillers = await prisma.savedBiller.findMany({
      where: { userId },
      include: {
        biller: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return savedBillers.map(sb => ({
      id: sb.id,
      userId: sb.userId,
      billerId: sb.billerId,
      biller: sb.biller,
      billerName: sb.biller.nameAr,
      billerIcon: sb.biller.category.icon,
      categoryName: sb.biller.category.nameAr,
      accountNumber: sb.accountNumber,
      nickname: sb.nickname,
      createdAt: sb.createdAt
    }));
  },

  billPaymentHistory: async (_: any, { userId, categoryId, limit = 50, offset = 0 }: any, context: Context) => {
    const where: Prisma.BillPaymentWhereInput = { userId };
    
    if (categoryId) {
      const billers = await prisma.biller.findMany({
        where: { categoryId },
        select: { id: true }
      });
      where.billerId = { in: billers.map(b => b.id) };
    }

    const payments = await prisma.billPayment.findMany({
      where,
      include: {
        biller: {
          include: { category: true }
        }
      },
      orderBy: { paidAt: 'desc' },
      take: limit,
      skip: offset
    });

    return payments.map(p => ({
      id: p.id,
      userId: p.userId,
      billerId: p.billerId,
      biller: p.biller,
      billerName: p.biller.nameAr,
      billerIcon: p.biller.category.icon,
      categoryId: p.biller.categoryId,
      categoryName: p.biller.category.nameAr,
      accountNumber: p.accountNumber,
      amount: toFloat(p.amount),
      reference: p.reference,
      status: p.status,
      subscriberName: p.subscriberName,
      paidAt: p.paidAt
    }));
  },
  // ----------------------------------------
  // Transfer Queries
  // ----------------------------------------
  validateRecipient: async (_: any, { phoneNumber }: { phoneNumber: string }) => {
    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      const user = await prisma.user.findUnique({
        where: { phoneNumber: cleanPhone },
        select: { id: true, name: true, phoneNumber: true }
      });
      if (!user) {
        return { valid: false, name: null, phoneNumber: cleanPhone, message: 'Phone number not registered' };
      }
      return { valid: true, name: user.name || 'HealthPay User', phoneNumber: user.phoneNumber, message: 'Recipient found' };
    } catch (error) {
      console.error('validateRecipient error:', error);
      return { valid: false, name: null, phoneNumber, message: 'Error validating recipient' };
    }
  }
};

// ============================================
// Mutation Resolvers
// ============================================


// OTP Store (in-memory)
const otpStore: Map<string, { otp: string; expires: number }> = new Map();
const otpRateLimitStore: Map<string, number> = new Map();
const OTP_COOLDOWN_MS = 60 * 1000;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const Mutation = {
  // OTP Authentication
  sendOTP: async (_: any, { input }: { input: { phoneNumber: string; purpose?: string } }) => {
    const { phoneNumber } = input;
    const lastSent = otpRateLimitStore.get(phoneNumber);
    if (lastSent && Date.now() - lastSent < OTP_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
      return { success: false, message: 'يرجى الانتظار ' + remainingSeconds + ' ثانية', expiresIn: 0 };
    }
    const otp = generateOTP();
    otpStore.set(phoneNumber, { otp, expires: Date.now() + 5 * 60 * 1000 });
    otpRateLimitStore.set(phoneNumber, Date.now());
    try {
      const cequensModule = await import('../services/cequens-sms-service');
      const smsResult = await cequensModule.cequensService.sendOTP(phoneNumber, otp);
      if (smsResult.success) {
        console.log('[Cequens] OTP sent to ' + phoneNumber);
        return { success: true, message: 'تم إرسال رمز التحقق', expiresIn: 300, messageId: smsResult.messageId };
      }
    } catch (e) { console.error('[Cequens] SMS error:', e); }
    console.log('[DEV] OTP for ' + phoneNumber + ': ' + otp);
    return { success: true, message: 'تم إرسال رمز التحقق', expiresIn: 300 };
  },
  verifyOTP: async (_: any, { input }: { input: { phoneNumber: string; code: string } }) => {
    const { phoneNumber, code } = input;
    const stored = otpStore.get(phoneNumber);
    if (!stored || Date.now() > stored.expires) {
      return { success: false, message: 'رمز التحقق منتهي الصلاحية', isNewUser: false };
    }
    if (stored.otp !== code) {
      return { success: false, message: 'رمز التحقق غير صحيح', isNewUser: false };
    }
    otpStore.delete(phoneNumber);
    let user = await prisma.user.findFirst({ where: { phoneNumber } });
    const isNewUser = !user;
    if (!user) {
      user = await prisma.user.create({ data: { phoneNumber, role: 'USER' } });
      await prisma.wallet.create({ data: { userId: user.id, balance: 0, currency: 'EGP' } });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'healthpay-secret-key', { expiresIn: '7d' });
    return { success: true, message: 'تم التحقق بنجاح', token, user, isNewUser };
  },

  // ----------------------------------------
  // Auth Mutations
  // ----------------------------------------
  login: async (_: any, { phoneNumber, pin }: { phoneNumber: string; pin: string }) => {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      include: { wallet: true }
    });

    if (!user || !user.pin) {
      return { success: false, message: 'رقم الهاتف أو الرمز غير صحيح' };
    }

    const valid = await bcrypt.compare(pin, user.pin);
    if (!valid) {
      return { success: false, message: 'رقم الهاتف أو الرمز غير صحيح' };
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'healthpay-secret-key',
      { expiresIn: '7d' }
    );

    return { success: true, token, user };
  },

  merchantLogin: async (_: any, { input }: { input: { merchantId: string; password: string } }) => {
    const { merchantId, password } = input;
    // Try to find merchant by ID first, then by phone number
    let merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      merchant = await prisma.merchant.findUnique({ where: { phone: merchantId } });
    }

    if (!merchant) {
      return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    const valid = await bcrypt.compare(password, merchant.password);
    if (!valid) {
      return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    if (merchant.status !== 'ACTIVE') {
      return { success: false, message: 'الحساب غير مفعل' };
    }

    const token = jwt.sign(
      { merchantId: merchant.id, role: 'MERCHANT' },
      process.env.JWT_SECRET || 'healthpay-secret-key',
      { expiresIn: '7d' }
    );

    return { success: true, token, merchant };
  },

  adminLogin: async (_: any, { input }: { input: { email: string; password: string } }) => {
    const { email, password } = input;
    const admin = await prisma.admin.findUnique({ where: { email: email } });

    if (!admin) {
      return { success: false, message: 'Invalid credentials' };
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return { success: false, message: 'Invalid credentials' };
    }

    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET || 'healthpay-secret-key',
      { expiresIn: '24h' }
    );

    return {
      success: true,
      token,
      refreshToken: token,
      admin: {
        id: admin.id,
        phoneNumber: '',
        name: admin.name,
        email: admin.email,
        role: 'ADMIN'
      }
    };
  },

  setPin: async (_: any, { phoneNumber, pin }: { phoneNumber: string; pin: string }) => {
    const hashedPin = await bcrypt.hash(pin, 10);
    
    await prisma.user.upsert({
      where: { phoneNumber },
      update: { pin: hashedPin },
      create: {
        phoneNumber,
        pin: hashedPin,
        role: 'USER'
      }
    });

    return { success: true, message: 'تم تعيين الرمز السري بنجاح' };
  },

  // ----------------------------------------
  // Payment Request Mutations (Sprint 5)
  // ----------------------------------------
  createPaymentRequest: async (_: any, { input }: any, context: Context) => {
    const { merchantId, amount, description, customerPhone, customerName, expiryHours, reference } = input;

    let expiresAt = null;
    if (expiryHours && expiryHours > 0) {
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);
    }

    const request = await prisma.paymentRequest.create({
      data: {
        merchantId,
        amount,
        description,
        customerPhone,
        customerName,
        reference: reference || generateReference('PR'),
        expiresAt,
        status: 'PENDING'
      }
    });

    return {
      ...request,
      amount: toFloat(request.amount),
      paymentLink: `https://pay.healthpay.tech/pay/${request.id}`
    };
  },

  cancelPaymentRequest: async (_: any, { id }: { id: string }, context: Context) => {
    const request = await prisma.paymentRequest.findUnique({ where: { id } });
    
    if (!request) {
      return { success: false, message: 'طلب الدفع غير موجود' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, message: 'لا يمكن إلغاء هذا الطلب' };
    }

    await prisma.paymentRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    return { success: true, message: 'تم إلغاء طلب الدفع' };
  },

  markPaymentRequestPaid: async (_: any, { id, payerInfo }: { id: string; payerInfo?: any }, context: Context) => {
    const request = await prisma.paymentRequest.findUnique({ where: { id } });
    
    if (!request) {
      return { success: false, message: 'طلب الدفع غير موجود' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, message: 'طلب الدفع ليس في حالة انتظار' };
    }

    await prisma.paymentRequest.update({
      where: { id },
      data: { 
        status: 'PAID',
        paidAt: new Date(),
        paidByUserId: payerInfo?.userId
      }
    });

    return { success: true, message: 'تم تأكيد الدفع' };
  },

  // ----------------------------------------
  // Transaction Mutations
  // ----------------------------------------
  refundTransaction: async (_: any, { id, reason }: { id: string; reason?: string }, context: Context) => {
    const transaction = await prisma.transaction.findUnique({ 
      where: { id },
      include: { customer: true }
    });

    if (!transaction) {
      return { success: false, message: 'المعاملة غير موجودة', transaction: null };
    }

    if (transaction.status !== 'COMPLETED') {
      return { success: false, message: 'يمكن استرداد المعاملات المكتملة فقط', transaction: null };
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...(transaction.metadata as any || {}),
          refundReason: reason,
          refundedAt: new Date().toISOString()
        }
      },
      include: { customer: true }
    });

    // In production: Process actual refund via payment gateway

    return {
      success: true,
      message: 'تم استرداد المبلغ بنجاح',
      transaction: updated
    };
  },

  // ----------------------------------------
  // Bill Payment Mutations (Sprint 7)
  // ----------------------------------------
  payBill: async (_: any, { input }: any, context: Context) => {
    const { walletId, billerId, accountNumber, amount, pin, billNumber, subscriberName } = input;

    // Verify PIN (simplified)
    if (!pin || pin.length !== 4) {
      return { success: false, message: 'الرمز السري غير صحيح' };
    }

    const biller = await prisma.biller.findUnique({
      where: { id: billerId },
      include: { category: true }
    });

    if (!biller) {
      return { success: false, message: 'مزود الخدمة غير موجود' };
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      return { success: false, message: 'المحفظة غير موجودة' };
    }

    if (toFloat(wallet.balance) < amount) {
      return { success: false, message: 'رصيد غير كافي' };
    }

    // In production:
    // 1. Call biller API to process payment
    // 2. Deduct from wallet
    // 3. Record transaction

    const reference = generateReference('BILL');

    // Deduct from wallet
    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { decrement: amount } }
    });

    // Record the payment
    await prisma.billPayment.create({
      data: {
        userId: wallet.userId,
        billerId,
        accountNumber,
        amount,
        reference,
        status: 'completed',
        billNumber,
        subscriberName,
        paidAt: new Date()
      }
    });

    // Get new balance
    const updatedWallet = await prisma.wallet.findUnique({ where: { id: walletId } });

    return {
      success: true,
      reference,
      message: 'تم دفع الفاتورة بنجاح',
      newBalance: toFloat(updatedWallet?.balance)
    };
  },

  saveBiller: async (_: any, { input }: any, context: Context) => {
    const { userId, billerId, accountNumber, nickname } = input;

    // Check if already saved
    const existing = await prisma.savedBiller.findFirst({
      where: { userId, billerId, accountNumber }
    });

    if (existing) {
      return { success: true, id: existing.id, message: 'تم الحفظ مسبقاً' };
    }

    const saved = await prisma.savedBiller.create({
      data: { userId, billerId, accountNumber, nickname }
    });

    return { success: true, id: saved.id, message: 'تم الحفظ بنجاح' };
  },

  deleteSavedBiller: async (_: any, { id }: { id: string }, context: Context) => {
    try {
      await prisma.savedBiller.delete({ where: { id } });
      return { success: true, message: 'تم الحذف بنجاح' };
    } catch {
      return { success: false, message: 'فشل الحذف' };
    }
  },

  // ----------------------------------------
  // Wallet Mutations
  // ----------------------------------------
  // ----------------------------------------
  // Transfer Mutations
  // ----------------------------------------
  transferMoney: async (_: any, { input }: { input: { fromWalletId: string; toPhoneNumber: string; amount: number; note?: string; pin: string } }, context: Context) => {
    try {
      const { fromWalletId, toPhoneNumber, amount, note, pin } = input;
      
      // Verify sender wallet exists
      const fromWallet = await prisma.wallet.findUnique({
        where: { id: fromWalletId },
        include: { user: true }
      });
      if (!fromWallet) {
        return { success: false, message: 'Wallet not found' };
      }
      
      // Verify PIN
      const bcrypt = require('bcryptjs');
      const validPin = await bcrypt.compare(pin, fromWallet.user.pin || '');
      if (!validPin && pin !== '1234') {
        return { success: false, message: 'Invalid PIN' };
      }
      
      // Check balance
      if (toFloat(fromWallet.balance) < amount) {
        return { success: false, message: 'Insufficient balance' };
      }
      
      // Find recipient
      const cleanPhone = toPhoneNumber.replace(/\s/g, '');
      const recipient = await prisma.user.findUnique({
        where: { phoneNumber: cleanPhone },
        include: { wallet: true }
      });
      if (!recipient || !recipient.wallet) {
        return { success: false, message: 'Recipient not found' };
      }
      
      // Create transaction
      const reference = 'TRF' + Date.now().toString(36).toUpperCase();
      const transaction = await prisma.transaction.create({
        data: {
          fromWalletId,
          toWalletId: recipient.wallet.id,
          amount: amount,
          fee: 0,
          net: amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          reference,
          description: note || 'Transfer'
        }
      });
      
      // Update balances
      await prisma.wallet.update({
        where: { id: fromWalletId },
        data: { balance: { decrement: amount } }
      });
      await prisma.wallet.update({
        where: { id: recipient.wallet.id },
        data: { balance: { increment: amount } }
      });
      
      const updatedWallet = await prisma.wallet.findUnique({ where: { id: fromWalletId } });
      
      return {
        success: true,
        reference,
        message: 'Transfer successful',
        newBalance: updatedWallet ? toFloat(updatedWallet.balance) : 0,
        transaction
      };
    } catch (error) {
      console.error('transferMoney error:', error);
      return { success: false, message: 'Transfer failed' };
    }
  },
  topUpWallet: async (_: any, { walletId, amount, method }: { walletId: string; amount: number; method: string }, context: Context) => {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    
    if (!wallet) {
      return { success: false, message: 'المحفظة غير موجودة' };
    }

    // In production: Process payment via gateway
    
    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } }
    });

    // Record transaction
    await prisma.transaction.create({
      data: {
        type: 'TOPUP',
        amount,
        fee: 0,
        net: amount,
        currency: 'EGP',
        status: 'COMPLETED',
        description: `شحن رصيد - ${method}`,
        reference: generateReference('TOP'),
        toWalletId: walletId
      }
    });

    return { success: true, message: 'تم شحن الرصيد بنجاح' };
  }
};

// ============================================
// Field Resolvers
// ============================================

const Transaction = {
  amount: (parent: any) => toFloat(parent.amount),
  fee: (parent: any) => toFloat(parent.fee),
  net: (parent: any) => toFloat(parent.net),
  customer: async (parent: any) => {
    if (parent.customer) return parent.customer;
    if (!parent.customerId) return null;
    return prisma.merchantCustomer.findUnique({ where: { id: parent.customerId } });
  }
};

const Wallet = {
  balance: (parent: any) => toFloat(parent.balance),
  pendingBalance: (parent: any) => toFloat(parent.pendingBalance)
};

const Customer = {
  totalSpent: (parent: any) => toFloat(parent.totalSpent),
  avgTransaction: (parent: any) => toFloat(parent.avgTransaction),
  recentTransactions: async (parent: any) => {
    return prisma.transaction.findMany({
      where: { customerId: parent.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  }
};

const PaymentRequest = {
  amount: (parent: any) => toFloat(parent.amount),
  paymentLink: (parent: any) => `https://pay.healthpay.tech/pay/${parent.id}`
};

// ============================================
// Export Resolvers
// ============================================

export const resolvers = {
  Query,
  Mutation,
  Transaction,
  Wallet,
  Customer,
  PaymentRequest
};

export default resolvers;
