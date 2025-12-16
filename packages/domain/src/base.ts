/**
 * Base types for Event Sourcing
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Base Event interface (CloudEvents specification)
 */
export interface BaseEvent {
  // CloudEvents standard fields
  specversion: string;
  id: string;
  source: string;
  type: string;
  datacontenttype: string;
  time: string;
  subject?: string;
  
  // Event data
  data: Record<string, any>;
  
  // HealthPay extensions
  healthpay?: {
    version: number;
    causationId?: string;
    correlationId?: string;
    aggregateVersion: number;
  };
}

/**
 * Base Command interface
 */
export interface BaseCommand {
  commandId: string;
  commandType: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Event metadata
 */
export interface EventMetadata {
  causationId?: string;
  correlationId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Create a CloudEvents-compliant event
 */
export function createEvent<T = any>(
  type: string,
  aggregateId: string,
  data: T,
  aggregateVersion: number,
  metadata?: EventMetadata
): BaseEvent {
  return {
    specversion: '1.0',
    id: `evt_${uuidv4()}`,
    source: 'healthpay/wallet-service',
    type,
    datacontenttype: 'application/json',
    time: new Date().toISOString(),
    subject: aggregateId,
    data: data as Record<string, any>,
    healthpay: {
      version: 1,
      causationId: metadata?.causationId,
      correlationId: metadata?.correlationId,
      aggregateVersion
    }
  };
}

/**
 * Base Aggregate class
 */
export abstract class Aggregate<TState = any, TEvent extends BaseEvent = BaseEvent> {
  protected state: TState;
  protected version: number = 0;
  protected uncommittedEvents: TEvent[] = [];

  constructor(state?: TState) {
    this.state = state || this.getInitialState();
  }

  /**
   * Get initial state for the aggregate
   */
  protected abstract getInitialState(): TState;

  /**
   * Apply an event to the aggregate state
   */
  protected abstract when(event: TEvent): void;

  /**
   * Get current state
   */
  public getState(): TState {
    return this.state;
  }

  /**
   * Get current version
   */
  public getVersion(): number {
    return this.version;
  }

  /**
   * Get uncommitted events
   */
  public getUncommittedEvents(): TEvent[] {
    return this.uncommittedEvents;
  }

  /**
   * Clear uncommitted events (after persistence)
   */
  public clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Load aggregate from history
   */
  public loadFromHistory(events: TEvent[]): void {
    events.forEach(event => {
      this.applyEvent(event, false);
    });
  }

  /**
   * Apply a new event
   */
  protected applyEvent(event: TEvent, isNew: boolean = true): void {
    this.when(event);
    this.version++;
    
    if (isNew) {
      this.uncommittedEvents.push(event);
    }
  }

  /**
   * Raise a new event
   */
  protected raiseEvent(event: TEvent): void {
    this.applyEvent(event, true);
  }
}

/**
 * Domain error base class
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'DomainError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common domain errors
 */
export class InsufficientBalanceError extends DomainError {
  constructor(walletId: string, required: number, available: number) {
    super(
      `Insufficient balance in wallet ${walletId}. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_BALANCE',
      400
    );
  }
}

export class WalletNotFoundError extends DomainError {
  constructor(walletId: string) {
    super(`Wallet ${walletId} not found`, 'WALLET_NOT_FOUND', 404);
  }
}

export class WalletSuspendedError extends DomainError {
  constructor(walletId: string) {
    super(`Wallet ${walletId} is suspended`, 'WALLET_SUSPENDED', 403);
  }
}

export class InvalidAmountError extends DomainError {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be positive`, 'INVALID_AMOUNT', 400);
  }
}

export class ConcurrencyError extends DomainError {
  constructor(aggregateId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for ${aggregateId}. Expected version: ${expectedVersion}, Actual: ${actualVersion}`,
      'CONCURRENCY_ERROR',
      409
    );
  }
}
