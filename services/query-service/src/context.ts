import { Pool } from 'pg';

// Mock implementation for command handlers
const mockCommandHandler = {
  handle: async (command: any) => {
    console.log(`Mock Command Handler: ${JSON.stringify(command)}`);
    return { success: true, error: undefined, walletId: 'mock-wallet-id', transactionId: 'mock-tx-id', paymentId: 'mock-payment-id', refundId: 'mock-refund-id' };
  },
  handleAdminLogin: async (command: any) => {
    console.log(`Mock Admin Login: ${JSON.stringify(command)}`);
    return { success: true, error: undefined, token: 'mock-admin-token' };
  },
  handleMerchantLogin: async (command: any) => {
    console.log(`Mock Merchant Login: ${JSON.stringify(command)}`);
    return { success: true, error: undefined, token: 'mock-merchant-token' };
  },
  handleCreateWallet: async (command: any) => mockCommandHandler.handle(command),
  handleCreditWallet: async (command: any) => mockCommandHandler.handle(command),
  handleDebitWallet: async (command: any) => mockCommandHandler.handle(command),
  handleTransfer: async (command: any) => mockCommandHandler.handle(command),
  handleIssuePayment: async (command: any) => mockCommandHandler.handle(command),
  handleCompletePayment: async (command: any) => mockCommandHandler.handle(command),
  handleCancelPayment: async (command: any) => mockCommandHandler.handle(command),
  handleRefundPayment: async (command: any) => mockCommandHandler.handle(command),
  handleActivateWallet: async (command: any) => mockCommandHandler.handle(command),
  handleSuspendWallet: async (command: any) => mockCommandHandler.handle(command),
  handleCloseWallet: async (command: any) => mockCommandHandler.handle(command),
  handleUpdateWalletLimit: async (command: any) => mockCommandHandler.handle(command),
  handleUpdateWalletOwner: async (command: any) => mockCommandHandler.handle(command),
  handleUpdateWalletName: async (command: any) => mockCommandHandler.handle(command),
  handleUpdateWalletMetadata: async (command: any) => mockCommandHandler.handle(command),
};

export interface ResolverContext {
  userId: string;
  readDb: Pool;
  commandHandler: typeof mockCommandHandler;
  pubsub: any;
}

export const context: ResolverContext = {
  userId: 'mock-user-id',
  readDb: {
    query: async (text: string, params: any[]) => {
      console.log(`Mock DB Query: ${text} with params ${params}`);
      return { rows: [] };
    },
  } as unknown as Pool,
  commandHandler: mockCommandHandler,
  pubsub: {
    asyncIterator: (triggers: string[]) => {
      console.log(`Mock PubSub asyncIterator: ${triggers}`);
      return {};
    },
    publish: (trigger: string, payload: any) => {
      console.log(`Mock PubSub publish: ${trigger} with payload ${JSON.stringify(payload)}`);
    },
  },
};

export const contextFactory = (userId: string) => ({
  ...context,
  userId,
});
