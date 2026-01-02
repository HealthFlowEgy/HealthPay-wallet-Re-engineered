/**
 * Wallet Aggregate
 * 
 * Contains all business logic for wallet operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DomainEvent,
  EventType,
  WalletCreatedEvent,
  WalletActivatedEvent,
  WalletSuspendedEvent,
  WalletClosedEvent,
  WalletCreditedEvent,
  WalletDebitedEvent
} from './events';
import {
  Result,
  Success,
  Failure,
  InsufficientFundsError,
  InvalidAmountError,
  WalletNotActiveError,
  InvalidStateTransitionError
} from './errors';

// =============================================================================
// Types
// =============================================================================

export enum WalletStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed'
}

export enum WalletType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  MERCHANT = 'merchant'
}

export enum KYCLevel {
  BASIC = 'basic',
  ENHANCED = 'enhanced',
  FULL = 'full'
}

export interface WalletState {
  id: string;
  userId: string;
  walletType: WalletType;
  status: WalletStatus;
  balance: number;
  currency: string;
  kycLevel: KYCLevel;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: Record<string, any>;
}

// =============================================================================
// Wallet Aggregate
// =============================================================================

export class WalletAggregate {
  private uncommittedEvents: DomainEvent[] = [];
  private state: WalletState | null = null;

  /**
   * Get aggregate ID
   */
  get id(): string {
    return this.state?.id || '';
  }

  /**
   * Get aggregate version
   */
  get version(): number {
    return this.state?.version || 0;
  }

  /**
   * Get current state (immutable)
   */
  getState(): Readonly<WalletState> | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Clear uncommitted events (after publishing)
   */
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  // ===========================================================================
  // Command: Create Wallet
  // ===========================================================================

  static create(
    userId: string,
    walletType: WalletType,
    currency: string,
    kycLevel: KYCLevel,
    initialBalance: number = 0,
    metadata?: Record<string, any>
  ): Result<WalletAggregate> {
    // Validation
    if (initialBalance < 0) {
      return Failure(new InvalidAmountError(initialBalance));
    }

    const aggregate = new WalletAggregate();
    const walletId = uuidv4();
    const now = new Date().toISOString();

    const event: WalletCreatedEvent = {
      eventId: uuidv4(),
      eventType: EventType.WALLET_CREATED,
      eventVersion: 1,
      aggregateId: walletId,
      aggregateType: 'wallet',
      timestamp: now,
      userId,
      data: {
        userId,
        walletType,
        currency,
        initialBalance,
        kycLevel,
        metadata
      }
    };

    aggregate.applyEvent(event);
    return Success(aggregate);
  }

  // ===========================================================================
  // Command: Activate Wallet
  // ===========================================================================

  activate(userId: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'activate'));
    }

    if (this.state.status !== WalletStatus.PENDING) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'activate')
      );
    }

    const event: WalletActivatedEvent = {
      eventId: uuidv4(),
      eventType: EventType.WALLET_ACTIVATED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'wallet',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        activatedAt: new Date().toISOString(),
        activatedBy: userId
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Suspend Wallet
  // ===========================================================================

  suspend(userId: string, reason: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'suspend'));
    }

    if (this.state.status !== WalletStatus.ACTIVE) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'suspend')
      );
    }

    const event: WalletSuspendedEvent = {
      eventId: uuidv4(),
      eventType: EventType.WALLET_SUSPENDED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'wallet',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        reason,
        suspendedAt: new Date().toISOString(),
        suspendedBy: userId
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Close Wallet
  // ===========================================================================

  close(userId: string, reason?: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'close'));
    }

    if (this.state.status === WalletStatus.CLOSED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'close')
      );
    }

    const event: WalletClosedEvent = {
      eventId: uuidv4(),
      eventType: EventType.WALLET_CLOSED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'wallet',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        finalBalance: this.state.balance,
        closedAt: new Date().toISOString(),
        closedBy: userId,
        reason
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Credit Wallet
  // ===========================================================================

  credit(
    amount: number,
    transactionType: 'deposit' | 'refund' | 'transfer_in' | 'cashback',
    reference: string,
    userId: string,
    sourceWalletId?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'credit'));
    }

    if (this.state.status !== WalletStatus.ACTIVE) {
      return Failure(new WalletNotActiveError(this.state.id, this.state.status));
    }

    if (amount <= 0) {
      return Failure(new InvalidAmountError(amount));
    }

    const balanceAfter = this.state.balance + amount;

    const event: WalletCreditedEvent = {
      eventId: uuidv4(),
      eventType: EventType.WALLET_CREDITED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'wallet',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        amount,
        currency: this.state.currency,
        balanceAfter,
        transactionType,
        reference,
        sourceWalletId,
        description,
        metadata
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Debit Wallet
  // ===========================================================================

  debit(
    amount: number,
    transactionType: 'payment' | 'withdrawal' | 'transfer_out' | 'fee',
    reference: string,
    userId: string,
    destinationWalletId?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'debit'));
    }

    if (this.state.status !== WalletStatus.ACTIVE) {
      return Failure(new WalletNotActiveError(this.state.id, this.state.status));
    }

    if (amount <= 0) {
      return Failure(new InvalidAmountError(amount));
    }

    if (this.state.balance < amount) {
      return Failure(
        new InsufficientFundsError(this.state.id, amount, this.state.balance)
      );
    }

    const balanceAfter = this.state.balance - amount;

    const event: WalletDebitedEvent = {
      eventId: uuidv4(),
      eventType: EventType.WALLET_DEBITED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'wallet',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        amount,
        currency: this.state.currency,
        balanceAfter,
        transactionType,
        reference,
        destinationWalletId,
        description,
        metadata
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Event Sourcing: Apply Events
  // ===========================================================================

  /**
   * Apply an event to update state
   */
  private applyEvent(event: DomainEvent): void {
    this.when(event);
    this.uncommittedEvents.push(event);
  }

  /**
   * Rehydrate aggregate from history
   */
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.when(event);
    }
  }

  /**
   * State transitions based on events
   */
  private when(event: DomainEvent): void {
    switch (event.eventType) {
      case EventType.WALLET_CREATED:
        this.whenWalletCreated(event as WalletCreatedEvent);
        break;
      case EventType.WALLET_ACTIVATED:
        this.whenWalletActivated(event as WalletActivatedEvent);
        break;
      case EventType.WALLET_SUSPENDED:
        this.whenWalletSuspended(event as WalletSuspendedEvent);
        break;
      case EventType.WALLET_CLOSED:
        this.whenWalletClosed(event as WalletClosedEvent);
        break;
      case EventType.WALLET_CREDITED:
        this.whenWalletCredited(event as WalletCreditedEvent);
        break;
      case EventType.WALLET_DEBITED:
        this.whenWalletDebited(event as WalletDebitedEvent);
        break;
    }
  }

  private whenWalletCreated(event: WalletCreatedEvent): void {
    this.state = {
      id: event.aggregateId,
      userId: event.data.userId,
      walletType: event.data.walletType as WalletType,
      status: WalletStatus.PENDING,
      balance: event.data.initialBalance,
      currency: event.data.currency,
      kycLevel: event.data.kycLevel as KYCLevel,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      version: 1,
      metadata: event.data.metadata
    };
  }

  private whenWalletActivated(event: WalletActivatedEvent): void {
    if (this.state) {
      this.state.status = WalletStatus.ACTIVE;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenWalletSuspended(event: WalletSuspendedEvent): void {
    if (this.state) {
      this.state.status = WalletStatus.SUSPENDED;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenWalletClosed(event: WalletClosedEvent): void {
    if (this.state) {
      this.state.status = WalletStatus.CLOSED;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenWalletCredited(event: WalletCreditedEvent): void {
    if (this.state) {
      this.state.balance = event.data.balanceAfter;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenWalletDebited(event: WalletDebitedEvent): void {
    if (this.state) {
      this.state.balance = event.data.balanceAfter;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }
}
