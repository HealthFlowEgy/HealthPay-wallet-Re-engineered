/**
 * Wallet Aggregate
 * Core business logic for wallet operations
 */

import { Aggregate, createEvent, EventMetadata } from './base';
import {
  InsufficientBalanceError,
  WalletSuspendedError,
  InvalidAmountError,
  DomainError
} from './base';
import { Money, WalletId, UserId, MerchantId } from './value-objects';
import {
  WalletEvent,
  WalletEventType,
  WalletCreatedEvent,
  WalletActivatedEvent,
  WalletSuspendedEvent,
  WalletClosedEvent,
  WalletCreditedEvent,
  WalletDebitedEvent
} from './events';

/**
 * Wallet Status
 */
export type WalletStatus = 'pending' | 'active' | 'suspended' | 'closed';

/**
 * Wallet State
 */
export interface WalletState {
  walletId: WalletId | null;
  userId: UserId | null;
  merchantId: MerchantId | null;
  balance: Money;
  status: WalletStatus;
  currency: string;
  
  // Metadata
  userMobile?: string;
  userEmail?: string;
  userName?: string;
  
  // Audit
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Wallet Aggregate
 */
export class WalletAggregate extends Aggregate<WalletState, WalletEvent> {
  protected getInitialState(): WalletState {
    return {
      walletId: null,
      userId: null,
      merchantId: null,
      balance: Money.zero('EGP'),
      status: 'pending',
      currency: 'EGP'
    };
  }

  /**
   * Command: Create Wallet
   */
  public createWallet(
    walletId: WalletId,
    userId: UserId,
    merchantId: MerchantId,
    options?: {
      currency?: string;
      userMobile?: string;
      userEmail?: string;
      userName?: string;
    },
    metadata?: EventMetadata
  ): void {
    // Invariant: Wallet can only be created once
    if (this.state.walletId !== null) {
      throw new DomainError('Wallet already exists', 'WALLET_ALREADY_EXISTS', 409);
    }

    // Create event
    const event = createEvent<WalletCreatedEvent['data']>(
      WalletEventType.WALLET_CREATED,
      walletId.toString(),
      {
        walletId: walletId.toString(),
        userId: userId.toString(),
        merchantId: merchantId.toString(),
        currency: options?.currency || 'EGP',
        status: 'pending',
        userMobile: options?.userMobile,
        userEmail: options?.userEmail,
        userName: options?.userName
      },
      this.version + 1,
      metadata
    ) as WalletCreatedEvent;

    this.raiseEvent(event);
  }

  /**
   * Command: Activate Wallet
   */
  public activateWallet(reason?: string, metadata?: EventMetadata): void {
    this.ensureWalletExists();

    // Invariant: Only pending wallets can be activated
    if (this.state.status !== 'pending') {
      throw new DomainError(
        `Wallet cannot be activated from ${this.state.status} status`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }

    const event = createEvent<WalletActivatedEvent['data']>(
      WalletEventType.WALLET_ACTIVATED,
      this.state.walletId!.toString(),
      {
        walletId: this.state.walletId!.toString(),
        userId: this.state.userId!.toString(),
        reason
      },
      this.version + 1,
      metadata
    ) as WalletActivatedEvent;

    this.raiseEvent(event);
  }

  /**
   * Command: Suspend Wallet
   */
  public suspendWallet(reason: string, suspendedBy?: string, metadata?: EventMetadata): void {
    this.ensureWalletExists();
    this.ensureNotClosed();

    const event = createEvent<WalletSuspendedEvent['data']>(
      WalletEventType.WALLET_SUSPENDED,
      this.state.walletId!.toString(),
      {
        walletId: this.state.walletId!.toString(),
        userId: this.state.userId!.toString(),
        reason,
        suspendedBy
      },
      this.version + 1,
      metadata
    ) as WalletSuspendedEvent;

    this.raiseEvent(event);
  }

  /**
   * Command: Close Wallet
   */
  public closeWallet(reason: string, closedBy?: string, metadata?: EventMetadata): void {
    this.ensureWalletExists();
    this.ensureNotClosed();

    // Invariant: Balance must be zero to close
    if (!this.state.balance.isZero()) {
      throw new DomainError(
        'Cannot close wallet with non-zero balance',
        'NON_ZERO_BALANCE',
        400
      );
    }

    const event = createEvent<WalletClosedEvent['data']>(
      WalletEventType.WALLET_CLOSED,
      this.state.walletId!.toString(),
      {
        walletId: this.state.walletId!.toString(),
        userId: this.state.userId!.toString(),
        reason,
        finalBalance: this.state.balance.amount,
        closedBy
      },
      this.version + 1,
      metadata
    ) as WalletClosedEvent;

    this.raiseEvent(event);
  }

  /**
   * Command: Credit Wallet
   */
  public creditWallet(
    amount: Money,
    source: 'card_topup' | 'wallet_transfer' | 'merchant_payment' | 'refund' | 'other',
    options?: {
      description?: string;
      metadata?: Record<string, any>;
    },
    eventMetadata?: EventMetadata
  ): void {
    this.ensureWalletExists();
    this.ensureActive();

    // Invariant: Amount must be positive
    if (amount.isNegativeOrZero()) {
      throw new InvalidAmountError(amount.amount);
    }

    // Invariant: Currency must match
    if (amount.currency !== this.state.currency) {
      throw new DomainError(
        `Currency mismatch: wallet is ${this.state.currency}, credit is ${amount.currency}`,
        'CURRENCY_MISMATCH',
        400
      );
    }

    const balanceBefore = this.state.balance;
    const balanceAfter = balanceBefore.add(amount);

    const event = createEvent<WalletCreditedEvent['data']>(
      WalletEventType.WALLET_CREDITED,
      this.state.walletId!.toString(),
      {
        walletId: this.state.walletId!.toString(),
        userId: this.state.userId!.toString(),
        merchantId: this.state.merchantId!.toString(),
        amount: amount.amount,
        currency: amount.currency,
        balanceBefore: balanceBefore.amount,
        balanceAfter: balanceAfter.amount,
        source,
        description: options?.description,
        metadata: options?.metadata
      },
      this.version + 1,
      eventMetadata
    ) as WalletCreditedEvent;

    this.raiseEvent(event);
  }

  /**
   * Command: Debit Wallet
   */
  public debitWallet(
    amount: Money,
    destination: 'merchant' | 'wallet_transfer' | 'withdrawal' | 'fee' | 'other',
    options?: {
      description?: string;
      metadata?: Record<string, any>;
    },
    eventMetadata?: EventMetadata
  ): void {
    this.ensureWalletExists();
    this.ensureActive();

    // Invariant: Amount must be positive
    if (amount.isNegativeOrZero()) {
      throw new InvalidAmountError(amount.amount);
    }

    // Invariant: Currency must match
    if (amount.currency !== this.state.currency) {
      throw new DomainError(
        `Currency mismatch: wallet is ${this.state.currency}, debit is ${amount.currency}`,
        'CURRENCY_MISMATCH',
        400
      );
    }

    // Invariant: Sufficient balance
    if (this.state.balance.isLessThan(amount)) {
      throw new InsufficientBalanceError(
        this.state.walletId!.toString(),
        amount.amount,
        this.state.balance.amount
      );
    }

    const balanceBefore = this.state.balance;
    const balanceAfter = balanceBefore.subtract(amount);

    const event = createEvent<WalletDebitedEvent['data']>(
      WalletEventType.WALLET_DEBITED,
      this.state.walletId!.toString(),
      {
        walletId: this.state.walletId!.toString(),
        userId: this.state.userId!.toString(),
        merchantId: this.state.merchantId!.toString(),
        amount: amount.amount,
        currency: amount.currency,
        balanceBefore: balanceBefore.amount,
        balanceAfter: balanceAfter.amount,
        destination,
        description: options?.description,
        metadata: options?.metadata
      },
      this.version + 1,
      eventMetadata
    ) as WalletDebitedEvent;

    this.raiseEvent(event);
  }

  /**
   * Query: Can debit amount?
   */
  public canDebit(amount: Money): boolean {
    return this.state.status === 'active' && !this.state.balance.isLessThan(amount);
  }

  /**
   * Query: Get current balance
   */
  public getBalance(): Money {
    return this.state.balance;
  }

  /**
   * Query: Get wallet ID
   */
  public getWalletId(): WalletId | null {
    return this.state.walletId;
  }

  /**
   * Query: Is active?
   */
  public isActive(): boolean {
    return this.state.status === 'active';
  }

  /**
   * Event handlers (state mutations)
   */
  protected when(event: WalletEvent): void {
    switch (event.type) {
      case WalletEventType.WALLET_CREATED:
        this.onWalletCreated(event);
        break;
      case WalletEventType.WALLET_ACTIVATED:
        this.onWalletActivated(event);
        break;
      case WalletEventType.WALLET_SUSPENDED:
        this.onWalletSuspended(event);
        break;
      case WalletEventType.WALLET_CLOSED:
        this.onWalletClosed(event);
        break;
      case WalletEventType.WALLET_CREDITED:
        this.onWalletCredited(event);
        break;
      case WalletEventType.WALLET_DEBITED:
        this.onWalletDebited(event);
        break;
      default:
        throw new DomainError(`Unknown event type: ${(event as any).type}`, 'UNKNOWN_EVENT', 500);
    }

    this.state.updatedAt = new Date(event.time);
  }

  private onWalletCreated(event: WalletCreatedEvent): void {
    this.state.walletId = WalletId.from(event.data.walletId);
    this.state.userId = UserId.from(event.data.userId);
    this.state.merchantId = MerchantId.from(event.data.merchantId);
    this.state.currency = event.data.currency;
    this.state.status = 'pending';
    this.state.balance = Money.zero(event.data.currency);
    this.state.userMobile = event.data.userMobile;
    this.state.userEmail = event.data.userEmail;
    this.state.userName = event.data.userName;
    this.state.createdAt = new Date(event.time);
  }

  private onWalletActivated(event: WalletActivatedEvent): void {
    this.state.status = 'active';
  }

  private onWalletSuspended(event: WalletSuspendedEvent): void {
    this.state.status = 'suspended';
  }

  private onWalletClosed(event: WalletClosedEvent): void {
    this.state.status = 'closed';
  }

  private onWalletCredited(event: WalletCreditedEvent): void {
    this.state.balance = Money.fromPiasters(event.data.balanceAfter, event.data.currency);
  }

  private onWalletDebited(event: WalletDebitedEvent): void {
    this.state.balance = Money.fromPiasters(event.data.balanceAfter, event.data.currency);
  }

  /**
   * Invariant helpers
   */
  private ensureWalletExists(): void {
    if (this.state.walletId === null) {
      throw new DomainError('Wallet does not exist', 'WALLET_NOT_FOUND', 404);
    }
  }

  private ensureActive(): void {
    if (this.state.status === 'suspended') {
      throw new WalletSuspendedError(this.state.walletId!.toString());
    }
    if (this.state.status === 'closed') {
      throw new DomainError('Wallet is closed', 'WALLET_CLOSED', 403);
    }
    if (this.state.status === 'pending') {
      throw new DomainError('Wallet is not yet activated', 'WALLET_PENDING', 403);
    }
  }

  private ensureNotClosed(): void {
    if (this.state.status === 'closed') {
      throw new DomainError('Wallet is already closed', 'WALLET_CLOSED', 409);
    }
  }
}
