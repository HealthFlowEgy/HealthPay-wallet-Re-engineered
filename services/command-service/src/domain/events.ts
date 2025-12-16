/**
 * Event Schema Definitions
 * 
 * All domain events with versioning support
 */

export enum EventType {
  // Wallet Events
  WALLET_CREATED = 'wallet.created',
  WALLET_ACTIVATED = 'wallet.activated',
  WALLET_SUSPENDED = 'wallet.suspended',
  WALLET_CLOSED = 'wallet.closed',
  
  // Transaction Events
  WALLET_CREDITED = 'wallet.credited',
  WALLET_DEBITED = 'wallet.debited',
  TRANSFER_INITIATED = 'transfer.initiated',
  TRANSFER_COMPLETED = 'transfer.completed',
  TRANSFER_FAILED = 'transfer.failed',
  
  // Payment Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_CAPTURED = 'payment.captured',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  
  // Med Card Events
  MEDCARD_ISSUED = 'medcard.issued',
  MEDCARD_ACTIVATED = 'medcard.activated',
  MEDCARD_SUSPENDED = 'medcard.suspended',
  MEDCARD_EXPIRED = 'medcard.expired'
}

/**
 * Base event interface - all events must extend this
 */
export interface BaseEvent {
  eventId: string;           // Unique event ID
  eventType: EventType;      // Type of event
  eventVersion: number;      // Schema version (for evolution)
  aggregateId: string;       // ID of the aggregate (wallet, payment, etc.)
  aggregateType: string;     // Type of aggregate
  timestamp: string;         // ISO 8601 timestamp
  causationId?: string;      // ID of the command that caused this event
  correlationId?: string;    // ID for tracking related events
  userId?: string;           // User who triggered the event
  metadata?: Record<string, any>;
}

// =============================================================================
// Wallet Events
// =============================================================================

export interface WalletCreatedEvent extends BaseEvent {
  eventType: EventType.WALLET_CREATED;
  aggregateType: 'wallet';
  data: {
    userId: string;
    walletType: 'personal' | 'business' | 'merchant';
    currency: string;
    initialBalance: number;
    kycLevel: 'basic' | 'enhanced' | 'full';
    metadata?: Record<string, any>;
  };
}

export interface WalletActivatedEvent extends BaseEvent {
  eventType: EventType.WALLET_ACTIVATED;
  aggregateType: 'wallet';
  data: {
    activatedAt: string;
    activatedBy: string;
  };
}

export interface WalletSuspendedEvent extends BaseEvent {
  eventType: EventType.WALLET_SUSPENDED;
  aggregateType: 'wallet';
  data: {
    reason: string;
    suspendedAt: string;
    suspendedBy: string;
  };
}

export interface WalletClosedEvent extends BaseEvent {
  eventType: EventType.WALLET_CLOSED;
  aggregateType: 'wallet';
  data: {
    finalBalance: number;
    closedAt: string;
    closedBy: string;
    reason?: string;
  };
}

// =============================================================================
// Transaction Events
// =============================================================================

export interface WalletCreditedEvent extends BaseEvent {
  eventType: EventType.WALLET_CREDITED;
  aggregateType: 'wallet';
  data: {
    amount: number;
    currency: string;
    balanceAfter: number;
    transactionType: 'deposit' | 'refund' | 'transfer_in' | 'cashback';
    reference: string;
    sourceWalletId?: string;
    description?: string;
    metadata?: Record<string, any>;
  };
}

export interface WalletDebitedEvent extends BaseEvent {
  eventType: EventType.WALLET_DEBITED;
  aggregateType: 'wallet';
  data: {
    amount: number;
    currency: string;
    balanceAfter: number;
    transactionType: 'payment' | 'withdrawal' | 'transfer_out' | 'fee';
    reference: string;
    destinationWalletId?: string;
    description?: string;
    metadata?: Record<string, any>;
  };
}

export interface TransferInitiatedEvent extends BaseEvent {
  eventType: EventType.TRANSFER_INITIATED;
  aggregateType: 'transfer';
  data: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    currency: string;
    reference: string;
    description?: string;
  };
}

export interface TransferCompletedEvent extends BaseEvent {
  eventType: EventType.TRANSFER_COMPLETED;
  aggregateType: 'transfer';
  data: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    currency: string;
    reference: string;
    completedAt: string;
  };
}

export interface TransferFailedEvent extends BaseEvent {
  eventType: EventType.TRANSFER_FAILED;
  aggregateType: 'transfer';
  data: {
    sourceWalletId: string;
    destinationWalletId: string;
    amount: number;
    currency: string;
    reference: string;
    reason: string;
    failedAt: string;
  };
}

// =============================================================================
// Payment Events
// =============================================================================

export interface PaymentInitiatedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_INITIATED;
  aggregateType: 'payment';
  data: {
    walletId: string;
    amount: number;
    currency: string;
    merchantId: string;
    merchantName: string;
    paymentMethod: 'wallet' | 'card' | 'bank_transfer';
    reference: string;
    description?: string;
    metadata?: Record<string, any>;
  };
}

export interface PaymentAuthorizedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_AUTHORIZED;
  aggregateType: 'payment';
  data: {
    walletId: string;
    amount: number;
    currency: string;
    merchantId: string;
    reference: string;
    authorizationCode: string;
    authorizedAt: string;
  };
}

export interface PaymentCapturedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_CAPTURED;
  aggregateType: 'payment';
  data: {
    walletId: string;
    amount: number;
    currency: string;
    merchantId: string;
    reference: string;
    capturedAt: string;
    settlementDate: string;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_FAILED;
  aggregateType: 'payment';
  data: {
    walletId: string;
    amount: number;
    currency: string;
    merchantId: string;
    reference: string;
    reason: string;
    errorCode: string;
    failedAt: string;
  };
}

export interface PaymentRefundedEvent extends BaseEvent {
  eventType: EventType.PAYMENT_REFUNDED;
  aggregateType: 'payment';
  data: {
    walletId: string;
    originalPaymentId: string;
    amount: number;
    currency: string;
    reference: string;
    reason?: string;
    refundedAt: string;
  };
}

// =============================================================================
// Med Card Events
// =============================================================================

export interface MedCardIssuedEvent extends BaseEvent {
  eventType: EventType.MEDCARD_ISSUED;
  aggregateType: 'medcard';
  data: {
    walletId: string;
    cardNumber: string;
    cardType: 'virtual' | 'physical';
    expiryDate: string;
    issuer: string;
    issuedAt: string;
  };
}

export interface MedCardActivatedEvent extends BaseEvent {
  eventType: EventType.MEDCARD_ACTIVATED;
  aggregateType: 'medcard';
  data: {
    cardNumber: string;
    activatedAt: string;
    activationMethod: 'app' | 'pin' | 'biometric';
  };
}

export interface MedCardSuspendedEvent extends BaseEvent {
  eventType: EventType.MEDCARD_SUSPENDED;
  aggregateType: 'medcard';
  data: {
    cardNumber: string;
    reason: 'lost' | 'stolen' | 'fraud_suspected' | 'user_request';
    suspendedAt: string;
  };
}

export interface MedCardExpiredEvent extends BaseEvent {
  eventType: EventType.MEDCARD_EXPIRED;
  aggregateType: 'medcard';
  data: {
    cardNumber: string;
    expiryDate: string;
    expiredAt: string;
  };
}

// =============================================================================
// Event Type Union
// =============================================================================

export type DomainEvent =
  | WalletCreatedEvent
  | WalletActivatedEvent
  | WalletSuspendedEvent
  | WalletClosedEvent
  | WalletCreditedEvent
  | WalletDebitedEvent
  | TransferInitiatedEvent
  | TransferCompletedEvent
  | TransferFailedEvent
  | PaymentInitiatedEvent
  | PaymentAuthorizedEvent
  | PaymentCapturedEvent
  | PaymentFailedEvent
  | PaymentRefundedEvent
  | MedCardIssuedEvent
  | MedCardActivatedEvent
  | MedCardSuspendedEvent
  | MedCardExpiredEvent;

// =============================================================================
// Event Envelope (for Kafka)
// =============================================================================

export interface EventEnvelope {
  eventId: string;
  eventType: string;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  aggregateVersion: number;  // Version of the aggregate after this event
  timestamp: string;
  causationId?: string;
  correlationId?: string;
  userId?: string;
  payload: any;  // The actual event data
  metadata?: Record<string, any>;
}
