/**
 * Payment Aggregate
 * 
 * Handles healthcare payment processing
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Result,
  Success,
  Failure,
  DomainError,
  InvalidAmountError,
  InvalidStateTransitionError
} from './errors';

// =============================================================================
// Payment Events
// =============================================================================

export enum PaymentEventType {
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_CAPTURED = 'payment.captured',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  PAYMENT_CANCELLED = 'payment.cancelled'
}

export interface BasePaymentEvent {
  eventId: string;
  eventType: PaymentEventType;
  eventVersion: number;
  aggregateId: string;
  aggregateType: 'payment';
  timestamp: string;
  causationId?: string;
  correlationId?: string;
  userId?: string;
}

export interface PaymentInitiatedEvent extends BasePaymentEvent {
  eventType: PaymentEventType.PAYMENT_INITIATED;
  data: {
    walletId: string;
    amount: number;
    currency: string;
    merchantId: string;
    merchantName: string;
    paymentMethod: 'wallet' | 'card' | 'bank_transfer';
    description?: string;
    metadata?: Record<string, any>;
  };
}

export interface PaymentAuthorizedEvent extends BasePaymentEvent {
  eventType: PaymentEventType.PAYMENT_AUTHORIZED;
  data: {
    authorizationCode: string;
    authorizedAt: string;
    expiresAt: string;
  };
}

export interface PaymentCapturedEvent extends BasePaymentEvent {
  eventType: PaymentEventType.PAYMENT_CAPTURED;
  data: {
    capturedAmount: number;
    capturedAt: string;
    settlementDate: string;
    transactionId: string;
  };
}

export interface PaymentFailedEvent extends BasePaymentEvent {
  eventType: PaymentEventType.PAYMENT_FAILED;
  data: {
    reason: string;
    errorCode: string;
    failedAt: string;
  };
}

export interface PaymentRefundedEvent extends BasePaymentEvent {
  eventType: PaymentEventType.PAYMENT_REFUNDED;
  data: {
    refundAmount: number;
    refundReason: string;
    refundedAt: string;
    refundReference: string;
  };
}

export interface PaymentCancelledEvent extends BasePaymentEvent {
  eventType: PaymentEventType.PAYMENT_CANCELLED;
  data: {
    cancelReason: string;
    cancelledAt: string;
  };
}

export type PaymentEvent =
  | PaymentInitiatedEvent
  | PaymentAuthorizedEvent
  | PaymentCapturedEvent
  | PaymentFailedEvent
  | PaymentRefundedEvent
  | PaymentCancelledEvent;

// =============================================================================
// Payment Aggregate
// =============================================================================

export enum PaymentStatus {
  INITIATED = 'initiated',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  WALLET = 'wallet',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer'
}

export interface PaymentState {
  id: string;
  walletId: string;
  amount: number;
  currency: string;
  merchantId: string;
  merchantName: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  authorizationCode?: string;
  transactionId?: string;
  capturedAmount?: number;
  refundedAmount?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: Record<string, any>;
}

export class PaymentAggregate {
  private uncommittedEvents: PaymentEvent[] = [];
  private state: PaymentState | null = null;

  get id(): string {
    return this.state?.id || '';
  }

  get version(): number {
    return this.state?.version || 0;
  }

  getState(): Readonly<PaymentState> | null {
    return this.state ? { ...this.state } : null;
  }

  getUncommittedEvents(): PaymentEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  // ===========================================================================
  // Command: Initiate Payment
  // ===========================================================================

  static initiate(
    walletId: string,
    amount: number,
    currency: string,
    merchantId: string,
    merchantName: string,
    paymentMethod: PaymentMethod,
    userId: string,
    description?: string,
    metadata?: Record<string, any>
  ): Result<PaymentAggregate> {
    if (amount <= 0) {
      return Failure(new InvalidAmountError(amount));
    }

    const aggregate = new PaymentAggregate();
    const paymentId = uuidv4();
    const now = new Date().toISOString();

    const event: PaymentInitiatedEvent = {
      eventId: uuidv4(),
      eventType: PaymentEventType.PAYMENT_INITIATED,
      eventVersion: 1,
      aggregateId: paymentId,
      aggregateType: 'payment',
      timestamp: now,
      userId,
      data: {
        walletId,
        amount,
        currency,
        merchantId,
        merchantName,
        paymentMethod,
        description,
        metadata
      }
    };

    aggregate.applyEvent(event);
    return Success(aggregate);
  }

  // ===========================================================================
  // Command: Authorize Payment
  // ===========================================================================

  authorize(authorizationCode: string, userId: string, expiresIn: number = 3600): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'authorize'));
    }

    if (this.state.status !== PaymentStatus.INITIATED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'authorize')
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1000).toISOString();

    const event: PaymentAuthorizedEvent = {
      eventId: uuidv4(),
      eventType: PaymentEventType.PAYMENT_AUTHORIZED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'payment',
      timestamp: now.toISOString(),
      userId,
      data: {
        authorizationCode,
        authorizedAt: now.toISOString(),
        expiresAt
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Capture Payment
  // ===========================================================================

  capture(
    capturedAmount: number,
    transactionId: string,
    userId: string,
    settlementDays: number = 2
  ): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'capture'));
    }

    if (this.state.status !== PaymentStatus.AUTHORIZED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'capture')
      );
    }

    if (capturedAmount <= 0 || capturedAmount > this.state.amount) {
      return Failure(new InvalidAmountError(capturedAmount));
    }

    const now = new Date();
    const settlementDate = new Date(now.getTime() + settlementDays * 86400000);

    const event: PaymentCapturedEvent = {
      eventId: uuidv4(),
      eventType: PaymentEventType.PAYMENT_CAPTURED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'payment',
      timestamp: now.toISOString(),
      userId,
      data: {
        capturedAmount,
        capturedAt: now.toISOString(),
        settlementDate: settlementDate.toISOString(),
        transactionId
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Fail Payment
  // ===========================================================================

  fail(reason: string, errorCode: string, userId: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'fail'));
    }

    if (this.state.status === PaymentStatus.CAPTURED || 
        this.state.status === PaymentStatus.REFUNDED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'fail')
      );
    }

    const event: PaymentFailedEvent = {
      eventId: uuidv4(),
      eventType: PaymentEventType.PAYMENT_FAILED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'payment',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        reason,
        errorCode,
        failedAt: new Date().toISOString()
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Refund Payment
  // ===========================================================================

  refund(
    refundAmount: number,
    refundReason: string,
    userId: string
  ): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'refund'));
    }

    if (this.state.status !== PaymentStatus.CAPTURED && 
        this.state.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'refund')
      );
    }

    const refundedSoFar = this.state.refundedAmount || 0;
    const capturedAmount = this.state.capturedAmount || this.state.amount;

    if (refundAmount <= 0 || refundAmount > (capturedAmount - refundedSoFar)) {
      return Failure(
        new DomainError(
          'Invalid refund amount',
          'INVALID_REFUND_AMOUNT',
          { refundAmount, available: capturedAmount - refundedSoFar }
        )
      );
    }

    const event: PaymentRefundedEvent = {
      eventId: uuidv4(),
      eventType: PaymentEventType.PAYMENT_REFUNDED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'payment',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        refundAmount,
        refundReason,
        refundedAt: new Date().toISOString(),
        refundReference: `REFUND-${this.state.id}-${Date.now()}`
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Cancel Payment
  // ===========================================================================

  cancel(cancelReason: string, userId: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'cancel'));
    }

    if (this.state.status !== PaymentStatus.INITIATED && 
        this.state.status !== PaymentStatus.AUTHORIZED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'cancel')
      );
    }

    const event: PaymentCancelledEvent = {
      eventId: uuidv4(),
      eventType: PaymentEventType.PAYMENT_CANCELLED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'payment',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        cancelReason,
        cancelledAt: new Date().toISOString()
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Event Sourcing
  // ===========================================================================

  private applyEvent(event: PaymentEvent): void {
    this.when(event);
    this.uncommittedEvents.push(event);
  }

  loadFromHistory(events: PaymentEvent[]): void {
    for (const event of events) {
      this.when(event);
    }
  }

  private when(event: PaymentEvent): void {
    switch (event.eventType) {
      case PaymentEventType.PAYMENT_INITIATED:
        this.whenPaymentInitiated(event as PaymentInitiatedEvent);
        break;
      case PaymentEventType.PAYMENT_AUTHORIZED:
        this.whenPaymentAuthorized(event as PaymentAuthorizedEvent);
        break;
      case PaymentEventType.PAYMENT_CAPTURED:
        this.whenPaymentCaptured(event as PaymentCapturedEvent);
        break;
      case PaymentEventType.PAYMENT_FAILED:
        this.whenPaymentFailed(event as PaymentFailedEvent);
        break;
      case PaymentEventType.PAYMENT_REFUNDED:
        this.whenPaymentRefunded(event as PaymentRefundedEvent);
        break;
      case PaymentEventType.PAYMENT_CANCELLED:
        this.whenPaymentCancelled(event as PaymentCancelledEvent);
        break;
    }
  }

  private whenPaymentInitiated(event: PaymentInitiatedEvent): void {
    this.state = {
      id: event.aggregateId,
      walletId: event.data.walletId,
      amount: event.data.amount,
      currency: event.data.currency,
      merchantId: event.data.merchantId,
      merchantName: event.data.merchantName,
      paymentMethod: event.data.paymentMethod as PaymentMethod,
      status: PaymentStatus.INITIATED,
      description: event.data.description,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      version: 1,
      metadata: event.data.metadata
    };
  }

  private whenPaymentAuthorized(event: PaymentAuthorizedEvent): void {
    if (this.state) {
      this.state.status = PaymentStatus.AUTHORIZED;
      this.state.authorizationCode = event.data.authorizationCode;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenPaymentCaptured(event: PaymentCapturedEvent): void {
    if (this.state) {
      this.state.status = PaymentStatus.CAPTURED;
      this.state.capturedAmount = event.data.capturedAmount;
      this.state.transactionId = event.data.transactionId;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenPaymentFailed(event: PaymentFailedEvent): void {
    if (this.state) {
      this.state.status = PaymentStatus.FAILED;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenPaymentRefunded(event: PaymentRefundedEvent): void {
    if (this.state) {
      const refundedSoFar = this.state.refundedAmount || 0;
      const newTotal = refundedSoFar + event.data.refundAmount;
      const capturedAmount = this.state.capturedAmount || this.state.amount;

      this.state.refundedAmount = newTotal;
      
      if (newTotal >= capturedAmount) {
        this.state.status = PaymentStatus.REFUNDED;
      } else {
        this.state.status = PaymentStatus.PARTIALLY_REFUNDED;
      }

      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenPaymentCancelled(event: PaymentCancelledEvent): void {
    if (this.state) {
      this.state.status = PaymentStatus.CANCELLED;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }
}
