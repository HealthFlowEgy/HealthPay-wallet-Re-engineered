/**
 * Value Objects for HealthPay Domain
 */

import { v4 as uuidv4 } from 'uuid';
import { DomainError } from './base';

/**
 * Money Value Object
 * Represents monetary amounts in piasters (1 EGP = 100 piasters)
 */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (!Number.isInteger(amount)) {
      throw new DomainError('Amount must be an integer (piasters)', 'INVALID_AMOUNT', 400);
    }
    if (amount < 0) {
      throw new DomainError('Amount cannot be negative', 'INVALID_AMOUNT', 400);
    }
    if (currency !== 'EGP') {
      throw new DomainError(`Unsupported currency: ${currency}`, 'INVALID_CURRENCY', 400);
    }
  }

  /**
   * Create Money from piasters
   */
  static fromPiasters(piasters: number, currency: string = 'EGP'): Money {
    return new Money(piasters, currency);
  }

  /**
   * Create Money from EGP (converts to piasters)
   */
  static fromEGP(egp: number, currency: string = 'EGP'): Money {
    const piasters = Math.round(egp * 100);
    return new Money(piasters, currency);
  }

  /**
   * Create zero money
   */
  static zero(currency: string = 'EGP'): Money {
    return new Money(0, currency);
  }

  /**
   * Check if amount is zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Check if amount is positive
   */
  isPositive(): boolean {
    return this.amount > 0;
  }

  /**
   * Check if amount is negative or zero
   */
  isNegativeOrZero(): boolean {
    return this.amount <= 0;
  }

  /**
   * Add money
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract money
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new DomainError('Subtraction would result in negative amount', 'INVALID_OPERATION', 400);
    }
    return new Money(result, this.currency);
  }

  /**
   * Multiply money
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new DomainError('Factor cannot be negative', 'INVALID_OPERATION', 400);
    }
    return new Money(Math.round(this.amount * factor), this.currency);
  }

  /**
   * Check if this amount is less than another
   */
  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Check if this amount is greater than another
   */
  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Check if this amount equals another
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Convert to EGP
   */
  toEGP(): number {
    return this.amount / 100;
  }

  /**
   * Format as currency string
   */
  format(): string {
    return `${this.toEGP().toFixed(2)} ${this.currency}`;
  }

  /**
   * Assert same currency
   */
  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
        'CURRENCY_MISMATCH',
        400
      );
    }
  }

  /**
   * Serialize for storage/transmission
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency
    };
  }
}

/**
 * WalletId Value Object
 */
export class WalletId {
  private constructor(public readonly value: string) {
    if (!value || !value.startsWith('wallet_')) {
      throw new DomainError('Invalid wallet ID format', 'INVALID_WALLET_ID', 400);
    }
  }

  static create(): WalletId {
    return new WalletId(`wallet_${uuidv4().replace(/-/g, '').substring(0, 12)}`);
  }

  static from(value: string): WalletId {
    return new WalletId(value);
  }

  equals(other: WalletId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * UserId Value Object
 */
export class UserId {
  private constructor(public readonly value: string) {
    if (!value || !value.startsWith('user_')) {
      throw new DomainError('Invalid user ID format', 'INVALID_USER_ID', 400);
    }
  }

  static create(): UserId {
    return new UserId(`user_${uuidv4().replace(/-/g, '').substring(0, 12)}`);
  }

  static from(value: string): UserId {
    return new UserId(value);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * MerchantId Value Object
 */
export class MerchantId {
  private constructor(public readonly value: string) {
    if (!value || !value.startsWith('merchant_')) {
      throw new DomainError('Invalid merchant ID format', 'INVALID_MERCHANT_ID', 400);
    }
  }

  static create(): MerchantId {
    return new MerchantId(`merchant_${uuidv4().replace(/-/g, '').substring(0, 12)}`);
  }

  static from(value: string): MerchantId {
    return new MerchantId(value);
  }

  equals(other: MerchantId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * MobileNumber Value Object
 */
export class MobileNumber {
  private constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new DomainError('Invalid mobile number format', 'INVALID_MOBILE', 400);
    }
  }

  static from(value: string): MobileNumber {
    // Normalize: remove spaces, dashes
    const normalized = value.replace(/[\s-]/g, '');
    return new MobileNumber(normalized);
  }

  private isValid(value: string): boolean {
    // Egyptian mobile number: +201xxxxxxxxx (11 digits after country code)
    const egyptianPattern = /^\+201[0-2,5]\d{8}$/;
    return egyptianPattern.test(value);
  }

  equals(other: MobileNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  /**
   * Format for display
   */
  format(): string {
    // +201234567890 -> +20 123 456 7890
    return this.value.replace(/(\+\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
}

/**
 * Email Value Object
 */
export class Email {
  private constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new DomainError('Invalid email format', 'INVALID_EMAIL', 400);
    }
  }

  static from(value: string): Email {
    return new Email(value.toLowerCase().trim());
  }

  private isValid(value: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
