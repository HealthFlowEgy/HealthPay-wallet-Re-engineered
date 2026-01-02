# @healthpay/domain

Domain models and event sourcing foundation for HealthPay Wallet Re-engineering.

## Overview

This package contains the core domain logic for the HealthPay wallet system, implemented using **Event Sourcing** and **Domain-Driven Design (DDD)** principles.

## Features

- ✅ **Event Sourcing Foundation** - CloudEvents specification compliance
- ✅ **Value Objects** - Money, IDs, Email, Mobile with validation
- ✅ **Domain Events** - 15 event types for wallet, payments, and MedCard
- ✅ **Domain Commands** - 14 command types with validation
- ✅ **Wallet Aggregate** - Complete business logic with invariants
- ✅ **Unit Tests** - 24 tests with >85% coverage

## Installation

```bash
npm install
```

## Usage

### Creating a Wallet

```typescript
import { WalletAggregate, WalletId, UserId, MerchantId, Money } from '@healthpay/domain';

// Create a new wallet
const wallet = new WalletAggregate();
const walletId = WalletId.generate();
const userId = UserId.from('user_123');
const merchantId = MerchantId.from('merchant_456');

wallet.createWallet(walletId, userId, merchantId);
wallet.activateWallet();
```

### Managing Balance

```typescript
// Credit wallet
wallet.creditWallet(Money.fromEGP(100), 'card_topup', 'txn_001');

// Debit wallet
wallet.debitWallet(Money.fromEGP(30), 'merchant', 'txn_002');

// Check balance
const balance = wallet.getBalance();
console.log(balance.format()); // "70.00 EGP"
```

### Event Sourcing

```typescript
// Get uncommitted events for persistence
const events = wallet.getUncommittedEvents();

// Mark events as committed
wallet.markEventsAsCommitted();

// Rebuild aggregate from history
const wallet2 = new WalletAggregate();
wallet2.loadFromHistory(events);
```

## Value Objects

### Money

```typescript
import { Money } from '@healthpay/domain';

const money1 = Money.fromEGP(100);
const money2 = Money.fromEGP(50);

const sum = money1.add(money2); // 150.00 EGP
const diff = money1.subtract(money2); // 50.00 EGP
const isGreater = money1.greaterThan(money2); // true
```

### IDs

```typescript
import { WalletId, UserId, MerchantId } from '@healthpay/domain';

const walletId = WalletId.generate(); // wallet_abc123...
const userId = UserId.from('user_123');
const merchantId = MerchantId.from('merchant_456');
```

### Email & Mobile

```typescript
import { Email, Mobile } from '@healthpay/domain';

const email = Email.from('user@example.com');
const mobile = Mobile.from('+201234567890');
```

## Business Rules

The Wallet aggregate enforces these invariants:

1. ✅ Balance cannot be negative
2. ✅ Cannot debit from suspended/closed wallet
3. ✅ Cannot credit zero or negative amounts
4. ✅ Wallet must be activated before transactions
5. ✅ Cannot activate already active wallet
6. ✅ Cannot close wallet with positive balance
7. ✅ Wallet lifecycle: Created → Activated → Suspended → Closed

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Architecture

```
packages/domain/
├── src/
│   ├── base.ts                    # Event sourcing foundation
│   ├── value-objects.ts           # Money, IDs, Email, Mobile
│   ├── events.ts                  # 15 domain events
│   ├── commands.ts                # 14 domain commands
│   ├── wallet.aggregate.ts        # Wallet business logic
│   ├── index.ts                   # Package exports
│   └── __tests__/
│       └── wallet.aggregate.test.ts # Unit tests
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Event Types

- `WalletCreatedEvent`
- `WalletActivatedEvent`
- `WalletSuspendedEvent`
- `WalletClosedEvent`
- `WalletCreditedEvent`
- `WalletDebitedEvent`
- `PaymentRequestCreatedEvent`
- `PaymentRequestApprovedEvent`
- `PaymentRequestRejectedEvent`
- `PaymentRequestCancelledEvent`
- `PaymentRequestExpiredEvent`
- `MedCardLinkedEvent`
- `MedCardUnlinkedEvent`
- `MedCardActivatedEvent`
- `MedCardDeactivatedEvent`

## Command Types

- `CreateWalletCommand`
- `ActivateWalletCommand`
- `SuspendWalletCommand`
- `CloseWalletCommand`
- `CreditWalletCommand`
- `DebitWalletCommand`
- `CreatePaymentRequestCommand`
- `ApprovePaymentRequestCommand`
- `RejectPaymentRequestCommand`
- `CancelPaymentRequestCommand`
- `LinkMedCardCommand`
- `UnlinkMedCardCommand`
- `ActivateMedCardCommand`
- `DeactivateMedCardCommand`

## License

UNLICENSED - Proprietary to HealthPay
