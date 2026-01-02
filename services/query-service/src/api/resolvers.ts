import { ResolverContext } from '../context';
// -----------------------------------------------------------------------------
// Query Resolvers
// -----------------------------------------------------------------------------
export const queryResolvers = {
  // User Queries
  user: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM users WHERE id = ',
      [id]
    );
    return result.rows[0] || null;
  },
  // Wallet Queries
  wallet: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM wallets WHERE id = ',
      [id]
    );
    return result.rows[0] || null;
  },
  walletsByUser: async (_: any, { userId }: { userId: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM wallets WHERE user_id = ',
      [userId]
    );
    return result.rows;
  },
  // Transaction Queries
  transaction: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM transactions WHERE id = ',
      [id]
    );
    return result.rows[0] || null;
  },
  transactionsByWallet: async (
    _: any,
    { walletId, limit = 50, offset = 0 }: { walletId: string; limit?: number; offset?: number },
    context: ResolverContext
  ) => {
    const result = await context.readDb.query(
      `SELECT * FROM transactions 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );
    return result.rows;
  },
  // Payment Queries
  payment: async (_: any, { id }: { id: string }, context: ResolverContext) => {
    const result = await context.readDb.query(
      'SELECT * FROM payments WHERE id = ',
      [id]
    );
    return result.rows[0] || null;
  },
  paymentsByWallet: async (
    _: any,
    { walletId, limit = 50, offset = 0 }: { walletId: string; limit?: number; offset?: number },
    context: ResolverContext
  ) => {
    const result = await context.readDb.query(
      `SELECT * FROM payments 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );
    return result.rows;
  },
  walletAnalytics: async (
    _: any,
    { walletId, startDate, endDate }: { walletId: string; startDate?: string; endDate?: string },
    context: ResolverContext
  ) => {
    const dateFilter = startDate && endDate
      ? 'AND created_at BETWEEN $2 AND $3'
      : '';
    const params = startDate && endDate
      ? [walletId, startDate, endDate]
      : [walletId];
    const result = await context.readDb.query(
      `SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits,
        COUNT(*) as transaction_count,
        AVG(ABS(amount)) as average_transaction,
        MAX(ABS(amount)) as largest_transaction
       FROM transactions 
       WHERE wallet_id = $1 ${dateFilter}`,
      params
    );
    const row = result.rows[0] || {};
    return {
      totalCredits: parseFloat(row.total_credits) || 0,
      totalDebits: parseFloat(row.total_debits) || 0,
      transactionCount: parseInt(row.transaction_count) || 0,
      averageTransaction: parseFloat(row.average_transaction) || 0,
      largestTransaction: parseFloat(row.largest_transaction) || 0,
    };
  },
  // SPRINT 5-7 QUERIES (MOCK IMPLEMENTATION)
  paymentRequest: () => ({ id: 'mock-pr-1', merchantId: 'mock-m-1', amount: 100.0, status: 'PENDING', expiryDate: '2026-01-01T00:00:00Z', qrCodeUrl: 'mock-url', paymentLink: 'mock-link', createdAt: '2026-01-01T00:00:00Z' }),
  paymentRequests: () => ([{ id: 'mock-pr-1', merchantId: 'mock-m-1', amount: 100.0, status: 'PENDING', expiryDate: '2026-01-01T00:00:00Z', qrCodeUrl: 'mock-url', paymentLink: 'mock-link', createdAt: '2026-01-01T00:00:00Z' }]),
  customer: () => ({ id: 'mock-c-1', merchantId: 'mock-m-1', name: 'Mock Customer', tags: ['VIP'], totalSpent: 500.0, transactionCount: 5, createdAt: '2026-01-01T00:00:00Z' }),
  customers: () => ([{ id: 'mock-c-1', merchantId: 'mock-m-1', name: 'Mock Customer', tags: ['VIP'], totalSpent: 500.0, transactionCount: 5, createdAt: '2026-01-01T00:00:00Z' }]),
  merchantDashboardAnalytics: () => ({ totalRevenue: 10000.0, todayRevenue: 500.0, totalTransactions: 100, todayTransactions: 5, newCustomersToday: 2, pendingRequests: 3, revenueByTransactionType: [{ type: 'CARD', revenue: 5000.0 }] }),
  billCategories: () => ([{ id: 'mock-bc-1', name: 'Electricity', icon: '⚡', color: 'bg-yellow-500' }]),
  billers: () => ([{ id: 'mock-b-1', name: 'Mock Biller', category: { id: 'mock-bc-1', name: 'Electricity', icon: '⚡', color: 'bg-yellow-500' }, fields: [{ name: 'accountNumber', label: 'Account Number', type: 'text', required: true }] }]),
  billPaymentHistory: () => ([{ id: 'mock-bph-1', billerName: 'Mock Biller', amount: 50.0, paidAt: '2026-01-01T00:00:00Z', reference: 'REF123' }]),
  savedBillers: () => ([{ id: 'mock-sb-1', nickname: 'Home Bill', billerName: 'Mock Biller', accountNumber: '12345', category: { id: 'mock-bc-1', name: 'Electricity', icon: '⚡', color: 'bg-yellow-500' } }]),
  hasPinSet: () => true,
};
// -----------------------------------------------------------------------------
// Mutation Resolvers
// -----------------------------------------------------------------------------
export const mutationResolvers = {
  // Authentication
  adminLogin: () => ({ token: 'mock-admin-jwt', refreshToken: 'mock-admin-refresh' }),
  merchantLogin: () => ({ token: 'mock-merchant-jwt', refreshToken: 'mock-merchant-refresh' }),
  // Wallet mutations
  createWallet: async (_: any, { input }: any, context: ResolverContext) => {
    const command = {
      userId: input.userId,
      walletType: input.walletType,
      initialBalance: input.initialBalance,
      currency: input.currency,
      name: input.name,
      metadata: input.metadata,
    };
    const result = await context.commandHandler.handleCreateWallet(command);
    return {
      success: result.success,
      walletId: result.walletId,
      message: result.error || 'Wallet created successfully',
    };
  },
  creditWallet: async (_: any, { walletId, amount, metadata }: any, context: ResolverContext) => {
    const command = {
      walletId,
      amount,
      metadata,
      userId: context.userId,
    };
    const result = await context.commandHandler.handleCreditWallet(command);
    return {
      success: result.success,
      transactionId: result.transactionId,
      message: result.error || 'Credit successful',
    };
  },
  debitWallet: async (_: any, { walletId, amount, metadata }: any, context: ResolverContext) => {
    const command = {
      walletId,
      amount,
      metadata,
      userId: context.userId,
    };
    const result = await context.commandHandler.handleDebitWallet(command);
    return {
      success: result.success,
      transactionId: result.transactionId,
      message: result.error || 'Debit successful',
    };
  },
  activateWallet: async (_: any, { walletId }: any, context: ResolverContext) => {
    const command = {
      walletId,
      activatedBy: context.userId,
      userId: context.userId,
    };
    const result = await context.commandHandler.handleActivateWallet(command);
    return {
      success: result.success,
      walletId: result.walletId,
      message: result.error || 'Wallet activated successfully',
    };
  },
  suspendWallet: async (_: any, { walletId, reason, notes }: any, context: ResolverContext) => {
    const command = {
      walletId,
      suspendedBy: context.userId,
      reason,
      notes,
      userId: context.userId,
    };
    const result = await context.commandHandler.handleSuspendWallet(command);
    return {
      success: result.success,
      walletId: result.walletId,
      message: result.error || 'Wallet suspended successfully',
    };
  },
  closeWallet: async (_: any, { walletId, reason, notes, refundAmount }: any, context: ResolverContext) => {
    const command = {
      walletId,
      closedBy: context.userId,
      reason,
      notes,
      refundAmount,
      userId: context.userId,
    };
    const result = await context.commandHandler.handleCloseWallet(command);
    return {
      success: result.success,
      walletId: result.walletId,
      message: result.error || 'Wallet closed successfully',
    };
  },
  // SPRINT 5-7 MUTATIONS (MOCK IMPLEMENTATION)
  createPaymentRequest: () => ({ success: true, paymentRequestId: 'mock-pr-1', message: 'Mock Payment Request created' }),
  cancelPaymentRequest: () => ({ success: true, message: 'Mock Payment Request cancelled' }),
  updateCustomerTags: () => ({ success: true, customerId: 'mock-c-1', message: 'Mock Customer tags updated' }),
  inquireBill: () => ({ success: true, billId: 'mock-bill-1', amountDue: 150.0, dueDate: '2026-01-01T00:00:00Z', customerName: 'Mock User', message: 'Mock Bill Inquiry success' }),
  payBill: () => ({ success: true, transactionId: 'mock-tx-1', message: 'Mock Bill Payment success' }),
  saveBiller: () => ({ id: 'mock-sb-1', nickname: 'Home Bill', billerName: 'Mock Biller', accountNumber: '12345', category: { id: 'mock-bc-1', name: 'Electricity', icon: '⚡', color: 'bg-yellow-500' } }),
  deleteSavedBiller: () => true,
  sendMoney: () => ({ success: true, transactionId: 'mock-tx-2', message: 'Mock Send Money success', newBalance: 999.0 }),
  setPin: () => ({ success: true, message: 'Mock PIN set success' }),
  verifyPin: () => ({ success: true, message: 'Mock PIN verified', hasPinSet: true }),
};
// -----------------------------------------------------------------------------
// Field Resolvers
// -----------------------------------------------------------------------------
export const fieldResolvers = {
  User: {
    wallets: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM wallets WHERE user_id = ',
        [parent.id]
      );
      return result.rows;
    },
  },
  Wallet: {
    user: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM users WHERE id = ',
        [parent.user_id]
      );
      return result.rows[0];
    },
    transactions: async (parent: any, _: any, context: ResolverContext) => {
      const result = await context.readDb.query(
        'SELECT * FROM transactions WHERE wallet_id =  ORDER BY created_at DESC LIMIT 50',
        [parent.id]
      );
      return result.rows;
    },
  },
};
// -----------------------------------------------------------------------------
// Subscription Resolvers
// -----------------------------------------------------------------------------
export const subscriptionResolvers = {
  walletBalanceChanged: {
    subscribe: (_: any, { walletId }: { walletId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator(['WALLET_BALANCE_' + walletId]);
    },
  },
  transactionCreated: {
    subscribe: (_: any, { walletId }: { walletId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator(['TRANSACTION_CREATED_' + walletId]);
    },
  },
  paymentStatusChanged: {
    subscribe: (_: any, { paymentId }: { paymentId: string }, context: ResolverContext) => {
      return context.pubsub.asyncIterator(['PAYMENT_STATUS_' + paymentId]);
    },
  },
};
// -----------------------------------------------------------------------------
// Combined Resolvers
// -----------------------------------------------------------------------------
export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers,
  Subscription: subscriptionResolvers,
  ...fieldResolvers,
};
