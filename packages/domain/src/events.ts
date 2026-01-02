/**
 * Wallet Domain Events
 */

import { BaseEvent } from './base';

/**
 * Wallet Event Types (enum for type safety)
 */
export enum WalletEventType {
  WALLET_CREATED = 'wallet.created.v1',
  WALLET_ACTIVATED = 'wallet.activated.v1',
  WALLET_SUSPENDED = 'wallet.suspended.v1',
  WALLET_CLOSED = 'wallet.closed.v1',
  WALLET_CREDITED = 'wallet.credited.v1',
  WALLET_DEBITED = 'wallet.debited.v1',
}

/**
 * Wallet Created Event
 */
export interface WalletCreatedEvent extends BaseEvent {
  type: WalletEventType.WALLET_CREATED;
  data: {
    walletId: string;
    userId: string;
    merchantId: string;
    currency: string;
    status: 'pending';
    userMobile?: string;
    userEmail?: string;
    userName?: string;
  };
}

/**
 * Wallet Activated Event
 */
export interface WalletActivatedEvent extends BaseEvent {
  type: WalletEventType.WALLET_ACTIVATED;
  data: {
    walletId: string;
    userId: string;
    reason?: string;
  };
}

/**
 * Wallet Suspended Event
 */
export interface WalletSuspendedEvent extends BaseEvent {
  type: WalletEventType.WALLET_SUSPENDED;
  data: {
    walletId: string;
    userId: string;
    reason: string;
    suspendedBy?: string;
  };
}

/**
 * Wallet Closed Event
 */
export interface WalletClosedEvent extends BaseEvent {
  type: WalletEventType.WALLET_CLOSED;
  data: {
    walletId: string;
    userId: string;
    reason: string;
    finalBalance: number;
    closedBy?: string;
  };
}

/**
 * Wallet Credited Event
 */
export interface WalletCreditedEvent extends BaseEvent {
  type: WalletEventType.WALLET_CREDITED;
  data: {
    walletId: string;
    userId: string;
    merchantId: string;
    amount: number;
    currency: string;
    balanceBefore: number;
    balanceAfter: number;
    source: 'card_topup' | 'wallet_transfer' | 'merchant_payment' | 'refund' | 'other';
    description?: string;
    metadata?: {
      transactionId?: string;
      gatewayRef?: string;
      fromWalletId?: string;
      [key: string]: any;
    };
  };
}

/**
 * Wallet Debited Event
 */
export interface WalletDebitedEvent extends BaseEvent {
  type: WalletEventType.WALLET_DEBITED;
  data: {
    walletId: string;
    userId: string;
    merchantId: string;
    amount: number;
    currency: string;
    balanceBefore: number;
    balanceAfter: number;
    destination: 'merchant' | 'wallet_transfer' | 'withdrawal' | 'fee' | 'other';
    description?: string;
    metadata?: {
      transactionId?: string;
      toWalletId?: string;
      toMerchantId?: string;
      [key: string]: any;
    };
  };
}

/**
 * Union type of all wallet events
 */
export type WalletEvent =
  | WalletCreatedEvent
  | WalletActivatedEvent
  | WalletSuspendedEvent
  | WalletClosedEvent
  | WalletCreditedEvent
  | WalletDebitedEvent;

/**
 * Payment Request Event Types
 */
export enum PaymentRequestEventType {
  PAYMENT_REQUEST_CREATED = 'payment_request.created.v1',
  PAYMENT_REQUEST_FULFILLED = 'payment_request.fulfilled.v1',
  PAYMENT_REQUEST_CANCELLED = 'payment_request.cancelled.v1',
  PAYMENT_REQUEST_EXPIRED = 'payment_request.expired.v1',
}

/**
 * Payment Request Created Event
 */
export interface PaymentRequestCreatedEvent extends BaseEvent {
  type: PaymentRequestEventType.PAYMENT_REQUEST_CREATED;
  data: {
    requestId: string;
    fromWalletId: string;
    fromUserId: string;
    fromMerchantId: string;
    toWalletId?: string;
    toUserId?: string;
    amount: number;
    currency: string;
    description?: string;
    expiresAt: string; // ISO 8601
  };
}

/**
 * Payment Request Fulfilled Event
 */
export interface PaymentRequestFulfilledEvent extends BaseEvent {
  type: PaymentRequestEventType.PAYMENT_REQUEST_FULFILLED;
  data: {
    requestId: string;
    walletId: string;
    userId: string;
    transactionId: string;
    fulfilledAt: string; // ISO 8601
  };
}

/**
 * Payment Request Cancelled Event
 */
export interface PaymentRequestCancelledEvent extends BaseEvent {
  type: PaymentRequestEventType.PAYMENT_REQUEST_CANCELLED;
  data: {
    requestId: string;
    walletId: string;
    userId: string;
    reason?: string;
    cancelledBy?: string;
    cancelledAt: string; // ISO 8601
  };
}

/**
 * Payment Request Expired Event
 */
export interface PaymentRequestExpiredEvent extends BaseEvent {
  type: PaymentRequestEventType.PAYMENT_REQUEST_EXPIRED;
  data: {
    requestId: string;
    walletId: string;
    userId: string;
    expiredAt: string; // ISO 8601
  };
}

/**
 * Union type of all payment request events
 */
export type PaymentRequestEvent =
  | PaymentRequestCreatedEvent
  | PaymentRequestFulfilledEvent
  | PaymentRequestCancelledEvent
  | PaymentRequestExpiredEvent;

/**
 * MedCard Event Types
 */
export enum MedCardEventType {
  MEDCARD_CREATED = 'medcard.created.v1',
  MEDCARD_ACTIVATED = 'medcard.activated.v1',
  MEDCARD_DEACTIVATED = 'medcard.deactivated.v1',
  MEDCARD_LINKED = 'medcard.linked.v1',
}

/**
 * MedCard Created Event
 */
export interface MedCardCreatedEvent extends BaseEvent {
  type: MedCardEventType.MEDCARD_CREATED;
  data: {
    cardId: string;
    walletId: string;
    userId: string;
    fullName: string;
    nationalId: string;
    birthDate: string; // ISO 8601 date
    gender: 'male' | 'female';
    relationId: number;
    relationName: string;
    status: 'pending';
  };
}

/**
 * MedCard Activated Event
 */
export interface MedCardActivatedEvent extends BaseEvent {
  type: MedCardEventType.MEDCARD_ACTIVATED;
  data: {
    cardId: string;
    walletId: string;
    userId: string;
    activatedBy?: string;
  };
}

/**
 * MedCard Deactivated Event
 */
export interface MedCardDeactivatedEvent extends BaseEvent {
  type: MedCardEventType.MEDCARD_DEACTIVATED;
  data: {
    cardId: string;
    walletId: string;
    userId: string;
    reason?: string;
    deactivatedBy?: string;
  };
}

/**
 * MedCard Linked Event
 */
export interface MedCardLinkedEvent extends BaseEvent {
  type: MedCardEventType.MEDCARD_LINKED;
  data: {
    cardId: string;
    walletId: string;
    userId: string;
    linkedToWalletId: string;
    linkedToUserId: string;
  };
}

/**
 * Union type of all medcard events
 */
export type MedCardEvent =
  | MedCardCreatedEvent
  | MedCardActivatedEvent
  | MedCardDeactivatedEvent
  | MedCardLinkedEvent;

/**
 * All domain events
 */
export type DomainEvent = WalletEvent | PaymentRequestEvent | MedCardEvent;
