/**
 * MedCard Aggregate
 * 
 * Handles medical card lifecycle
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Result,
  Success,
  Failure,
  DomainError,
  InvalidStateTransitionError
} from './errors';

// =============================================================================
// MedCard Events
// =============================================================================

export enum MedCardEventType {
  MEDCARD_ISSUED = 'medcard.issued',
  MEDCARD_ACTIVATED = 'medcard.activated',
  MEDCARD_SUSPENDED = 'medcard.suspended',
  MEDCARD_REACTIVATED = 'medcard.reactivated',
  MEDCARD_BLOCKED = 'medcard.blocked',
  MEDCARD_EXPIRED = 'medcard.expired',
  MEDCARD_REPLACED = 'medcard.replaced'
}

export interface BaseMedCardEvent {
  eventId: string;
  eventType: MedCardEventType;
  eventVersion: number;
  aggregateId: string;
  aggregateType: 'medcard';
  timestamp: string;
  causationId?: string;
  correlationId?: string;
  userId?: string;
}

export interface MedCardIssuedEvent extends BaseMedCardEvent {
  eventType: MedCardEventType.MEDCARD_ISSUED;
  data: {
    walletId: string;
    cardNumber: string;
    cardType: 'virtual' | 'physical';
    holderName: string;
    expiryDate: string;
    issuer: string;
    cvv?: string;
  };
}

export interface MedCardActivatedEvent extends BaseMedCardEvent {
  eventType: MedCardEventType.MEDCARD_ACTIVATED;
  data: {
    activatedAt: string;
    activationMethod: 'app' | 'pin' | 'biometric';
  };
}

export interface MedCardSuspendedEvent extends BaseMedCardEvent {
  eventType: MedCardEventType.MEDCARD_SUSPENDED;
  data: {
    reason: 'lost' | 'stolen' | 'fraud_suspected' | 'user_request' | 'admin_action';
    suspendedAt: string;
    suspendedBy: string;
  };
}

export interface MedCardReactivatedEvent extends BaseMedCardEvent {
  eventType: MedCardEventType.MEDCARD_REACTIVATED;
  data: {
    reactivatedAt: string;
    reactivatedBy: string;
  };
}

export interface MedCardBlockedEvent extends BaseMedCardEvent {
  eventType: MedCardEventType.MEDCARD_BLOCKED;
  data: {
    reason: string;
    blockedAt: string;
    blockedBy: string;
  };
}

export interface MedCardExpiredEvent extends BaseMedCardEvent {
  eventType: MedCardEventType.MEDCARD_EXPIRED;
  data: {
    expiredAt: string;
    expiryDate: string;
  };
}

export interface MedCardReplacedEvent extends BaseMedCardEvent {
  eventType: MedCardEventType.MEDCARD_REPLACED;
  data: {
    newCardId: string;
    newCardNumber: string;
    reason: string;
    replacedAt: string;
  };
}

export type MedCardEvent =
  | MedCardIssuedEvent
  | MedCardActivatedEvent
  | MedCardSuspendedEvent
  | MedCardReactivatedEvent
  | MedCardBlockedEvent
  | MedCardExpiredEvent
  | MedCardReplacedEvent;

// =============================================================================
// MedCard Aggregate
// =============================================================================

export enum MedCardStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
  REPLACED = 'replaced'
}

export enum MedCardType {
  VIRTUAL = 'virtual',
  PHYSICAL = 'physical'
}

export interface MedCardState {
  id: string;
  walletId: string;
  cardNumber: string;
  cardType: MedCardType;
  holderName: string;
  status: MedCardStatus;
  expiryDate: string;
  issuer: string;
  cvv?: string;
  replacedByCardId?: string;
  issuedAt: string;
  activatedAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export class MedCardAggregate {
  private uncommittedEvents: MedCardEvent[] = [];
  private state: MedCardState | null = null;

  get id(): string {
    return this.state?.id || '';
  }

  get version(): number {
    return this.state?.version || 0;
  }

  getState(): Readonly<MedCardState> | null {
    return this.state ? { ...this.state } : null;
  }

  getUncommittedEvents(): MedCardEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  // ===========================================================================
  // Command: Issue MedCard
  // ===========================================================================

  static issue(
    walletId: string,
    cardType: MedCardType,
    holderName: string,
    issuer: string,
    userId: string,
    expiryYears: number = 3
  ): Result<MedCardAggregate> {
    const aggregate = new MedCardAggregate();
    const cardId = uuidv4();
    const now = new Date();

    // Generate card number (placeholder - in production use proper algorithm)
    const cardNumber = this.generateCardNumber();

    // Generate CVV for virtual cards
    const cvv = cardType === MedCardType.VIRTUAL ? this.generateCVV() : undefined;

    // Calculate expiry date
    const expiryDate = new Date(now);
    expiryDate.setFullYear(expiryDate.getFullYear() + expiryYears);

    const event: MedCardIssuedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_ISSUED,
      eventVersion: 1,
      aggregateId: cardId,
      aggregateType: 'medcard',
      timestamp: now.toISOString(),
      userId,
      data: {
        walletId,
        cardNumber,
        cardType,
        holderName,
        expiryDate: expiryDate.toISOString().split('T')[0],
        issuer,
        cvv
      }
    };

    aggregate.applyEvent(event);
    return Success(aggregate);
  }

  // ===========================================================================
  // Command: Activate MedCard
  // ===========================================================================

  activate(
    activationMethod: 'app' | 'pin' | 'biometric',
    userId: string
  ): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'activate'));
    }

    if (this.state.status !== MedCardStatus.PENDING) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'activate')
      );
    }

    const event: MedCardActivatedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_ACTIVATED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        activatedAt: new Date().toISOString(),
        activationMethod
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Suspend MedCard
  // ===========================================================================

  suspend(
    reason: 'lost' | 'stolen' | 'fraud_suspected' | 'user_request' | 'admin_action',
    userId: string
  ): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'suspend'));
    }

    if (this.state.status !== MedCardStatus.ACTIVE) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'suspend')
      );
    }

    const event: MedCardSuspendedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_SUSPENDED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
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
  // Command: Reactivate MedCard
  // ===========================================================================

  reactivate(userId: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'reactivate'));
    }

    if (this.state.status !== MedCardStatus.SUSPENDED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'reactivate')
      );
    }

    // Check if card is expired
    if (new Date(this.state.expiryDate) < new Date()) {
      return Failure(
        new DomainError(
          'Cannot reactivate expired card',
          'CARD_EXPIRED',
          { expiryDate: this.state.expiryDate }
        )
      );
    }

    const event: MedCardReactivatedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_REACTIVATED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        reactivatedAt: new Date().toISOString(),
        reactivatedBy: userId
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Block MedCard (permanent)
  // ===========================================================================

  block(reason: string, userId: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'block'));
    }

    if (this.state.status === MedCardStatus.BLOCKED || 
        this.state.status === MedCardStatus.REPLACED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'block')
      );
    }

    const event: MedCardBlockedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_BLOCKED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        reason,
        blockedAt: new Date().toISOString(),
        blockedBy: userId
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Mark as Expired
  // ===========================================================================

  markExpired(userId: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'expire'));
    }

    const now = new Date();
    const expiryDate = new Date(this.state.expiryDate);

    if (expiryDate > now) {
      return Failure(
        new DomainError(
          'Card has not reached expiry date',
          'NOT_EXPIRED',
          { expiryDate: this.state.expiryDate }
        )
      );
    }

    const event: MedCardExpiredEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_EXPIRED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: now.toISOString(),
      userId,
      data: {
        expiredAt: now.toISOString(),
        expiryDate: this.state.expiryDate
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Command: Replace MedCard
  // ===========================================================================

  replace(newCardId: string, newCardNumber: string, reason: string, userId: string): Result<void> {
    if (!this.state) {
      return Failure(new InvalidStateTransitionError('null', 'replace'));
    }

    if (this.state.status === MedCardStatus.REPLACED) {
      return Failure(
        new InvalidStateTransitionError(this.state.status, 'replace')
      );
    }

    const event: MedCardReplacedEvent = {
      eventId: uuidv4(),
      eventType: MedCardEventType.MEDCARD_REPLACED,
      eventVersion: 1,
      aggregateId: this.state.id,
      aggregateType: 'medcard',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        newCardId,
        newCardNumber,
        reason,
        replacedAt: new Date().toISOString()
      }
    };

    this.applyEvent(event);
    return Success(undefined);
  }

  // ===========================================================================
  // Event Sourcing
  // ===========================================================================

  private applyEvent(event: MedCardEvent): void {
    this.when(event);
    this.uncommittedEvents.push(event);
  }

  loadFromHistory(events: MedCardEvent[]): void {
    for (const event of events) {
      this.when(event);
    }
  }

  private when(event: MedCardEvent): void {
    switch (event.eventType) {
      case MedCardEventType.MEDCARD_ISSUED:
        this.whenMedCardIssued(event as MedCardIssuedEvent);
        break;
      case MedCardEventType.MEDCARD_ACTIVATED:
        this.whenMedCardActivated(event as MedCardActivatedEvent);
        break;
      case MedCardEventType.MEDCARD_SUSPENDED:
        this.whenMedCardSuspended(event as MedCardSuspendedEvent);
        break;
      case MedCardEventType.MEDCARD_REACTIVATED:
        this.whenMedCardReactivated(event as MedCardReactivatedEvent);
        break;
      case MedCardEventType.MEDCARD_BLOCKED:
        this.whenMedCardBlocked(event as MedCardBlockedEvent);
        break;
      case MedCardEventType.MEDCARD_EXPIRED:
        this.whenMedCardExpired(event as MedCardExpiredEvent);
        break;
      case MedCardEventType.MEDCARD_REPLACED:
        this.whenMedCardReplaced(event as MedCardReplacedEvent);
        break;
    }
  }

  private whenMedCardIssued(event: MedCardIssuedEvent): void {
    this.state = {
      id: event.aggregateId,
      walletId: event.data.walletId,
      cardNumber: event.data.cardNumber,
      cardType: event.data.cardType as MedCardType,
      holderName: event.data.holderName,
      status: MedCardStatus.PENDING,
      expiryDate: event.data.expiryDate,
      issuer: event.data.issuer,
      cvv: event.data.cvv,
      issuedAt: event.timestamp,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      version: 1
    };
  }

  private whenMedCardActivated(event: MedCardActivatedEvent): void {
    if (this.state) {
      this.state.status = MedCardStatus.ACTIVE;
      this.state.activatedAt = event.data.activatedAt;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenMedCardSuspended(event: MedCardSuspendedEvent): void {
    if (this.state) {
      this.state.status = MedCardStatus.SUSPENDED;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenMedCardReactivated(event: MedCardReactivatedEvent): void {
    if (this.state) {
      this.state.status = MedCardStatus.ACTIVE;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenMedCardBlocked(event: MedCardBlockedEvent): void {
    if (this.state) {
      this.state.status = MedCardStatus.BLOCKED;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenMedCardExpired(event: MedCardExpiredEvent): void {
    if (this.state) {
      this.state.status = MedCardStatus.EXPIRED;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  private whenMedCardReplaced(event: MedCardReplacedEvent): void {
    if (this.state) {
      this.state.status = MedCardStatus.REPLACED;
      this.state.replacedByCardId = event.data.newCardId;
      this.state.updatedAt = event.timestamp;
      this.state.version++;
    }
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private static generateCardNumber(): string {
    // Placeholder - in production use proper Luhn algorithm
    const bin = '521234'; // Bank Identification Number
    const accountNumber = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${bin}${accountNumber}`;
  }

  private static generateCVV(): string {
    return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
}
