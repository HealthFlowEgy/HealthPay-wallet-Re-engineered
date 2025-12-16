/**
 * Domain Errors and Result Types
 */

// =============================================================================
// Domain Errors
// =============================================================================

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(walletId: string, required: number, available: number) {
    super(
      `Insufficient funds in wallet ${walletId}`,
      'INSUFFICIENT_FUNDS',
      { walletId, required, available }
    );
    this.name = 'InsufficientFundsError';
  }
}

export class WalletNotFoundError extends DomainError {
  constructor(walletId: string) {
    super(`Wallet not found: ${walletId}`, 'WALLET_NOT_FOUND', { walletId });
    this.name = 'WalletNotFoundError';
  }
}

export class WalletNotActiveError extends DomainError {
  constructor(walletId: string, status: string) {
    super(
      `Wallet ${walletId} is not active (status: ${status})`,
      'WALLET_NOT_ACTIVE',
      { walletId, status }
    );
    this.name = 'WalletNotActiveError';
  }
}

export class InvalidAmountError extends DomainError {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}`, 'INVALID_AMOUNT', { amount });
    this.name = 'InvalidAmountError';
  }
}

export class ConcurrencyError extends DomainError {
  constructor(aggregateId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for ${aggregateId}`,
      'CONCURRENCY_CONFLICT',
      { aggregateId, expectedVersion, actualVersion }
    );
    this.name = 'ConcurrencyError';
  }
}

export class DuplicateEventError extends DomainError {
  constructor(eventId: string) {
    super(`Duplicate event: ${eventId}`, 'DUPLICATE_EVENT', { eventId });
    this.name = 'DuplicateEventError';
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(currentState: string, attemptedTransition: string) {
    super(
      `Invalid state transition from ${currentState} via ${attemptedTransition}`,
      'INVALID_STATE_TRANSITION',
      { currentState, attemptedTransition }
    );
    this.name = 'InvalidStateTransitionError';
  }
}

// =============================================================================
// Result Types (Railway-Oriented Programming)
// =============================================================================

export type Result<T, E = DomainError> =
  | { success: true; value: T }
  | { success: false; error: E };

export const Success = <T>(value: T): Result<T, never> => ({
  success: true,
  value
});

export const Failure = <E>(error: E): Result<never, E> => ({
  success: false,
  error
});

/**
 * Helper to check if result is success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success === true;
}

/**
 * Helper to check if result is failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Map a success value to a new value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isSuccess(result)) {
    return Success(fn(result.value));
  }
  return result;
}

/**
 * Chain (flatMap) operations
 */
export function chain<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return fn(result.value);
  }
  return result;
}
