/**
 * Command Definitions
 * 
 * All commands that can be issued to the system
 */

import { WalletType, KYCLevel } from '../domain/wallet-aggregate';

// =============================================================================
// Base Command
// =============================================================================

export interface BaseCommand {
  commandId: string;
  userId: string;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// Wallet Commands
// =============================================================================

export interface CreateWalletCommand extends BaseCommand {
  type: 'CreateWallet';
  data: {
    walletType: WalletType;
    currency: string;
    kycLevel: KYCLevel;
    initialBalance?: number;
  };
}

export interface ActivateWalletCommand extends BaseCommand {
  type: 'ActivateWallet';
  data: {
    walletId: string;
  };
}

export interface SuspendWalletCommand extends BaseCommand {
  type: 'SuspendWallet';
  data: {
    walletId: string;
    reason: string;
  };
}

export interface CloseWalletCommand extends BaseCommand {
  type: 'CloseWallet';
  data: {
    walletId: string;
    reason?: string;
  };
}

export interface CreditWalletCommand extends BaseCommand {
  type: 'CreditWallet';
  data: {
    walletId: string;
    amount: number;
    transactionType: 'deposit' | 'refund' | 'transfer_in' | 'cashback';
    reference: string;
    sourceWalletId?: string;
    description?: string;
  };
}

export interface DebitWalletCommand extends BaseCommand {
  type: 'DebitWallet';
  data: {
    walletId: string;
    amount: number;
    transactionType: 'payment' | 'withdrawal' | 'transfer_out' | 'fee';
    reference: string;
    destinationWalletId?: string;
    description?: string;
  };
}

export interface TransferCommand extends BaseCommand {
  type: 'Transfer';
  data: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    reference: string;
    description?: string;
  };
}

// =============================================================================
// Command Union Type
// =============================================================================

export type Command =
  | CreateWalletCommand
  | ActivateWalletCommand
  | SuspendWalletCommand
  | CloseWalletCommand
  | CreditWalletCommand
  | DebitWalletCommand
  | TransferCommand;

// =============================================================================
// Command Result
// =============================================================================

export interface CommandResult {
  success: boolean;
  commandId: string;
  aggregateId?: string;
  events?: string[];  // Event IDs
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
