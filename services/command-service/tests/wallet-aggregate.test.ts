/**
 * Unit Tests for Wallet Aggregate
 */

import { WalletAggregate, WalletType, KYCLevel, WalletStatus } from '../src/domain/wallet-aggregate';
import { EventType } from '../src/domain/events';
import { isFailure } from '../src/domain/errors';

describe('WalletAggregate', () => {
  
  describe('create', () => {
    it('should create a new wallet with valid parameters', () => {
      const result = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC,
        100
      );

      expect(result.success).toBe(true);
      
      if (result.success) {
        const wallet = result.value;
        const state = wallet.getState();
        
        expect(state).toBeDefined();
        expect(state?.userId).toBe('user123');
        expect(state?.walletType).toBe(WalletType.PERSONAL);
        expect(state?.currency).toBe('EGP');
        expect(state?.balance).toBe(100);
        expect(state?.status).toBe(WalletStatus.PENDING);
        expect(state?.version).toBe(1);

        const events = wallet.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0].eventType).toBe(EventType.WALLET_CREATED);
      }
    });

    it('should fail with negative initial balance', () => {
      const result = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC,
        -100
      );

      expect(isFailure(result)).toBe(true);
      
      if (isFailure(result)) {
        expect(result.error.code).toBe('INVALID_AMOUNT');
      }
    });
  });

  describe('activate', () => {
    it('should activate a pending wallet', () => {
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC
      );

      expect(createResult.success).toBe(true);

      if (createResult.success) {
        const wallet = createResult.value;
        const activateResult = wallet.activate('user123');

        expect(activateResult.success).toBe(true);

        const state = wallet.getState();
        expect(state?.status).toBe(WalletStatus.ACTIVE);
        expect(state?.version).toBe(2);

        const events = wallet.getUncommittedEvents();
        expect(events).toHaveLength(2);
        expect(events[1].eventType).toBe(EventType.WALLET_ACTIVATED);
      }
    });

    it('should fail to activate an already active wallet', () => {
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC
      );

      if (createResult.success) {
        const wallet = createResult.value;
        wallet.activate('user123');
        
        const secondActivate = wallet.activate('user123');
        
        expect(isFailure(secondActivate)).toBe(true);
        
        if (isFailure(secondActivate)) {
          expect(secondActivate.error.code).toBe('INVALID_STATE_TRANSITION');
        }
      }
    });
  });

  describe('credit', () => {
    it('should credit an active wallet', () => {
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC,
        100
      );

      if (createResult.success) {
        const wallet = createResult.value;
        wallet.activate('user123');
        
        const creditResult = wallet.credit(
          50,
          'deposit',
          'REF123',
          'user123',
          undefined,
          'Test deposit'
        );

        expect(creditResult.success).toBe(true);

        const state = wallet.getState();
        expect(state?.balance).toBe(150);
        expect(state?.version).toBe(3);

        const events = wallet.getUncommittedEvents();
        expect(events[2].eventType).toBe(EventType.WALLET_CREDITED);
        
        if (events[2].eventType === EventType.WALLET_CREDITED) {
          expect(events[2].data.amount).toBe(50);
          expect(events[2].data.balanceAfter).toBe(150);
        }
      }
    });

    it('should fail to credit a non-active wallet', () => {
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC
      );

      if (createResult.success) {
        const wallet = createResult.value;
        
        const creditResult = wallet.credit(
          50,
          'deposit',
          'REF123',
          'user123'
        );

        expect(isFailure(creditResult)).toBe(true);
        
        if (isFailure(creditResult)) {
          expect(creditResult.error.code).toBe('WALLET_NOT_ACTIVE');
        }
      }
    });

    it('should fail with invalid amount', () => {
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC
      );

      if (createResult.success) {
        const wallet = createResult.value;
        wallet.activate('user123');
        
        const creditResult = wallet.credit(
          -50,
          'deposit',
          'REF123',
          'user123'
        );

        expect(isFailure(creditResult)).toBe(true);
        
        if (isFailure(creditResult)) {
          expect(creditResult.error.code).toBe('INVALID_AMOUNT');
        }
      }
    });
  });

  describe('debit', () => {
    it('should debit an active wallet with sufficient funds', () => {
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC,
        100
      );

      if (createResult.success) {
        const wallet = createResult.value;
        wallet.activate('user123');
        
        const debitResult = wallet.debit(
          30,
          'payment',
          'REF456',
          'user123',
          undefined,
          'Test payment'
        );

        expect(debitResult.success).toBe(true);

        const state = wallet.getState();
        expect(state?.balance).toBe(70);
        expect(state?.version).toBe(3);

        const events = wallet.getUncommittedEvents();
        expect(events[2].eventType).toBe(EventType.WALLET_DEBITED);
        
        if (events[2].eventType === EventType.WALLET_DEBITED) {
          expect(events[2].data.amount).toBe(30);
          expect(events[2].data.balanceAfter).toBe(70);
        }
      }
    });

    it('should fail with insufficient funds', () => {
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC,
        50
      );

      if (createResult.success) {
        const wallet = createResult.value;
        wallet.activate('user123');
        
        const debitResult = wallet.debit(
          100,
          'payment',
          'REF456',
          'user123'
        );

        expect(isFailure(debitResult)).toBe(true);
        
        if (isFailure(debitResult)) {
          expect(debitResult.error.code).toBe('INSUFFICIENT_FUNDS');
        }
      }
    });
  });

  describe('event sourcing', () => {
    it('should rehydrate from event history', () => {
      // Create wallet
      const createResult = WalletAggregate.create(
        'user123',
        WalletType.PERSONAL,
        'EGP',
        KYCLevel.BASIC,
        100
      );

      expect(createResult.success).toBe(true);

      if (createResult.success) {
        const wallet1 = createResult.value;
        wallet1.activate('user123');
        wallet1.credit(50, 'deposit', 'REF1', 'user123');
        wallet1.debit(30, 'payment', 'REF2', 'user123');

        // Get all events
        const events = wallet1.getUncommittedEvents();
        const finalState = wallet1.getState();

        // Create new aggregate and replay events
        const wallet2 = new WalletAggregate();
        wallet2.loadFromHistory(events);

        const rehydratedState = wallet2.getState();

        // States should match
        expect(rehydratedState).toEqual(finalState);
        expect(rehydratedState?.balance).toBe(120);
        expect(rehydratedState?.status).toBe(WalletStatus.ACTIVE);
        expect(rehydratedState?.version).toBe(4);
      }
    });
  });
});
