/**
 * Wallet Domain Commands
 */

import { BaseCommand } from './base';

/**
 * Create Wallet Command
 */
export interface CreateWalletCommand extends BaseCommand {
  commandType: 'CreateWallet';
  walletId: string;
  userId: string;
  merchantId: string;
  currency?: string;
  userMobile?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Activate Wallet Command
 */
export interface ActivateWalletCommand extends BaseCommand {
  commandType: 'ActivateWallet';
  walletId: string;
  userId: string;
  reason?: string;
}

/**
 * Suspend Wallet Command
 */
export interface SuspendWalletCommand extends BaseCommand {
  commandType: 'SuspendWallet';
  walletId: string;
  userId: string;
  reason: string;
  suspendedBy?: string;
}

/**
 * Close Wallet Command
 */
export interface CloseWalletCommand extends BaseCommand {
  commandType: 'CloseWallet';
  walletId: string;
  userId: string;
  reason: string;
  closedBy?: string;
}

/**
 * Credit Wallet Command
 */
export interface CreditWalletCommand extends BaseCommand {
  commandType: 'CreditWallet';
  walletId: string;
  userId: string;
  amount: number; // in piasters
  currency?: string;
  source: 'card_topup' | 'wallet_transfer' | 'merchant_payment' | 'refund' | 'other';
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Debit Wallet Command
 */
export interface DebitWalletCommand extends BaseCommand {
  commandType: 'DebitWallet';
  walletId: string;
  userId: string;
  amount: number; // in piasters
  currency?: string;
  destination: 'merchant' | 'wallet_transfer' | 'withdrawal' | 'fee' | 'other';
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Transfer Funds Command (creates two events: debit + credit)
 */
export interface TransferFundsCommand extends BaseCommand {
  commandType: 'TransferFunds';
  fromWalletId: string;
  fromUserId: string;
  toWalletId: string;
  toUserId: string;
  amount: number; // in piasters
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Union type of all wallet commands
 */
export type WalletCommand =
  | CreateWalletCommand
  | ActivateWalletCommand
  | SuspendWalletCommand
  | CloseWalletCommand
  | CreditWalletCommand
  | DebitWalletCommand
  | TransferFundsCommand;

/**
 * Payment Request Commands
 */
export interface CreatePaymentRequestCommand extends BaseCommand {
  commandType: 'CreatePaymentRequest';
  requestId: string;
  fromWalletId: string;
  fromUserId: string;
  fromMerchantId: string;
  toWalletId?: string;
  toUserId?: string;
  amount: number; // in piasters
  currency?: string;
  description?: string;
  expiresInMinutes?: number; // default: 24 hours
}

export interface FulfillPaymentRequestCommand extends BaseCommand {
  commandType: 'FulfillPaymentRequest';
  requestId: string;
  walletId: string;
  userId: string;
}

export interface CancelPaymentRequestCommand extends BaseCommand {
  commandType: 'CancelPaymentRequest';
  requestId: string;
  walletId: string;
  userId: string;
  reason?: string;
  cancelledBy?: string;
}

export type PaymentRequestCommand =
  | CreatePaymentRequestCommand
  | FulfillPaymentRequestCommand
  | CancelPaymentRequestCommand;

/**
 * MedCard Commands
 */
export interface CreateMedCardCommand extends BaseCommand {
  commandType: 'CreateMedCard';
  cardId: string;
  walletId: string;
  userId: string;
  fullName: string;
  nationalId: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  relationId: number;
  relationName: string;
}

export interface ActivateMedCardCommand extends BaseCommand {
  commandType: 'ActivateMedCard';
  cardId: string;
  walletId: string;
  userId: string;
  activatedBy?: string;
}

export interface DeactivateMedCardCommand extends BaseCommand {
  commandType: 'DeactivateMedCard';
  cardId: string;
  walletId: string;
  userId: string;
  reason?: string;
  deactivatedBy?: string;
}

export interface LinkMedCardCommand extends BaseCommand {
  commandType: 'LinkMedCard';
  cardId: string;
  walletId: string;
  userId: string;
  linkedToWalletId: string;
  linkedToUserId: string;
}

export type MedCardCommand =
  | CreateMedCardCommand
  | ActivateMedCardCommand
  | DeactivateMedCardCommand
  | LinkMedCardCommand;

/**
 * All domain commands
 */
export type DomainCommand = WalletCommand | PaymentRequestCommand | MedCardCommand;

/**
 * Command validation helpers
 */
export function validateCreateWalletCommand(cmd: CreateWalletCommand): void {
  if (!cmd.walletId || !cmd.walletId.startsWith('wallet_')) {
    throw new Error('Invalid wallet ID');
  }
  if (!cmd.userId || !cmd.userId.startsWith('user_')) {
    throw new Error('Invalid user ID');
  }
  if (!cmd.merchantId || !cmd.merchantId.startsWith('merchant_')) {
    throw new Error('Invalid merchant ID');
  }
}

export function validateCreditWalletCommand(cmd: CreditWalletCommand): void {
  if (!cmd.walletId || !cmd.walletId.startsWith('wallet_')) {
    throw new Error('Invalid wallet ID');
  }
  if (!cmd.userId || !cmd.userId.startsWith('user_')) {
    throw new Error('Invalid user ID');
  }
  if (!Number.isInteger(cmd.amount) || cmd.amount <= 0) {
    throw new Error('Amount must be a positive integer (piasters)');
  }
}

export function validateDebitWalletCommand(cmd: DebitWalletCommand): void {
  if (!cmd.walletId || !cmd.walletId.startsWith('wallet_')) {
    throw new Error('Invalid wallet ID');
  }
  if (!cmd.userId || !cmd.userId.startsWith('user_')) {
    throw new Error('Invalid user ID');
  }
  if (!Number.isInteger(cmd.amount) || cmd.amount <= 0) {
    throw new Error('Amount must be a positive integer (piasters)');
  }
}

export function validateTransferFundsCommand(cmd: TransferFundsCommand): void {
  if (!cmd.fromWalletId || !cmd.fromWalletId.startsWith('wallet_')) {
    throw new Error('Invalid source wallet ID');
  }
  if (!cmd.toWalletId || !cmd.toWalletId.startsWith('wallet_')) {
    throw new Error('Invalid destination wallet ID');
  }
  if (cmd.fromWalletId === cmd.toWalletId) {
    throw new Error('Cannot transfer to the same wallet');
  }
  if (!Number.isInteger(cmd.amount) || cmd.amount <= 0) {
    throw new Error('Amount must be a positive integer (piasters)');
  }
}
