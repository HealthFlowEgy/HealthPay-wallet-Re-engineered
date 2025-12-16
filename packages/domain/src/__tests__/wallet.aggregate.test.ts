/**
 * Wallet Aggregate Tests
 */

import { WalletAggregate } from '../src/wallet.aggregate';
import { Money, WalletId, UserId, MerchantId } from '../src/value-objects';
import { WalletEventType } from '../src/events';
import {
  InsufficientBalanceError,
  WalletSuspendedError,
  InvalidAmountError,
  DomainError
} from '../src/base';

describe('WalletAggregate', () => {
  let wallet: WalletAggregate;
  let walletId: WalletId;
  let userId: UserId;
  let merchantId: MerchantId;

  beforeEach(() => {
    wallet = new WalletAggregate();
    walletId = WalletId.from('wallet_test123');
    userId = UserId.from('user_test456');
    merchantId = MerchantId.from('merchant_test789');
  });

  describe('createWallet', () => {
    it('should create a new wallet', () => {
      wallet.createWallet(walletId, userId, merchantId);

      const events = wallet.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(WalletEventType.WALLET_CREATED);
      expect(events[0].data.walletId).toBe(walletId.toString());
      expect(events[0].data.userId).toBe(userId.toString());
      expect(events[0].data.merchantId).toBe(merchantId.toString());
      expect(events[0].data.status).toBe('pending');
    });

    it('should create wallet with user details', () => {
      wallet.createWallet(walletId, userId, merchantId, {
        userMobile: '+201234567890',
        userEmail: 'test@example.com',
        userName: 'Test User'
      });

      const events = wallet.getUncommittedEvents();
      expect(events[0].data.userMobile).toBe('+201234567890');
      expect(events[0].data.userEmail).toBe('test@example.com');
      expect(events[0].data.userName).toBe('Test User');
    });

    it('should not allow creating wallet twice', () => {
      wallet.createWallet(walletId, userId, merchantId);

      expect(() => {
        wallet.createWallet(walletId, userId, merchantId);
      }).toThrow(DomainError);
    });

    it('should initialize wallet state correctly', () => {
      wallet.createWallet(walletId, userId, merchantId);

      const state = wallet.getState();
      expect(state.walletId?.toString()).toBe(walletId.toString());
      expect(state.userId?.toString()).toBe(userId.toString());
      expect(state.merchantId?.toString()).toBe(merchantId.toString());
      expect(state.balance.isZero()).toBe(true);
      expect(state.status).toBe('pending');
    });
  });

  describe('activateWallet', () => {
    beforeEach(() => {
      wallet.createWallet(walletId, userId, merchantId);
    });

    it('should activate pending wallet', () => {
      wallet.activateWallet('KYC verified');

      const events = wallet.getUncommittedEvents();
      expect(events).toHaveLength(2); // Created + Activated
      expect(events[1].type).toBe(WalletEventType.WALLET_ACTIVATED);
      expect(events[1].data.reason).toBe('KYC verified');
    });

    it('should update wallet status to active', () => {
      wallet.activateWallet();

      const state = wallet.getState();
      expect(state.status).toBe('active');
    });

    it('should not allow activating non-pending wallet', () => {
      wallet.activateWallet();
      
      expect(() => {
        wallet.activateWallet();
      }).toThrow(DomainError);
    });
  });

  describe('suspendWallet', () => {
    beforeEach(() => {
      wallet.createWallet(walletId, userId, merchantId);
      wallet.activateWallet();
    });

    it('should suspend active wallet', () => {
      wallet.suspendWallet('Fraud detected', 'admin_user');

      const events = wallet.getUncommittedEvents();
      expect(events).toHaveLength(3); // Created + Activated + Suspended
      expect(events[2].type).toBe(WalletEventType.WALLET_SUSPENDED);
      expect(events[2].data.reason).toBe('Fraud detected');
      expect(events[2].data.suspendedBy).toBe('admin_user');
    });

    it('should update wallet status to suspended', () => {
      wallet.suspendWallet('Compliance issue');

      const state = wallet.getState();
      expect(state.status).toBe('suspended');
    });
  });

  describe('closeWallet', () => {
    beforeEach(() => {
      wallet.createWallet(walletId, userId, merchantId);
      wallet.activateWallet();
    });

    it('should close wallet with zero balance', () => {
      wallet.closeWallet('User request', 'user_test456');

      const events = wallet.getUncommittedEvents();
      expect(events).toHaveLength(3); // Created + Activated + Closed
      expect(events[2].type).toBe(WalletEventType.WALLET_CLOSED);
      expect(events[2].data.finalBalance).toBe(0);
    });

    it('should not allow closing wallet with non-zero balance', () => {
      wallet.creditWallet(Money.fromEGP(100), 'card_topup');

      expect(() => {
        wallet.closeWallet('User request');
      }).toThrow(DomainError);
    });

    it('should update wallet status to closed', () => {
      wallet.closeWallet('Inactive account');

      const state = wallet.getState();
      expect(state.status).toBe('closed');
    });
  });

  describe('creditWallet', () => {
    beforeEach(() => {
      wallet.createWallet(walletId, userId, merchantId);
      wallet.activateWallet();
    });

    it('should credit wallet with valid amount', () => {
      const amount = Money.fromEGP(100);
      wallet.creditWallet(amount, 'card_topup', {
        description: 'Top up via credit card'
      });

      const events = wallet.getUncommittedEvents();
      expect(events).toHaveLength(3); // Created + Activated + Credited
      expect(events[2].type).toBe(WalletEventType.WALLET_CREDITED);
      expect(events[2].data.amount).toBe(10000); // 100 EGP = 10000 piasters
      expect(events[2].data.balanceBefore).toBe(0);
      expect(events[2].data.balanceAfter).toBe(10000);
      expect(events[2].data.source).toBe('card_topup');
    });

    it('should update wallet balance after credit', () => {
      wallet.creditWallet(Money.fromEGP(100), 'card_topup');

      const state = wallet.getState();
      expect(state.balance.toEGP()).toBe(100);
    });

    it('should allow multiple credits', () => {
      wallet.creditWallet(Money.fromEGP(100), 'card_topup');
      wallet.creditWallet(Money.fromEGP(50), 'refund');

      const state = wallet.getState();
      expect(state.balance.toEGP()).toBe(150);
    });

    it('should not allow crediting with zero or negative amount', () => {
      expect(() => {
        wallet.creditWallet(Money.zero(), 'card_topup');
      }).toThrow(InvalidAmountError);
    });

    it('should not allow crediting suspended wallet', () => {
      wallet.suspendWallet('Test suspension');

      expect(() => {
        wallet.creditWallet(Money.fromEGP(100), 'card_topup');
      }).toThrow(WalletSuspendedError);
    });

    it('should not allow crediting pending wallet', () => {
      const pendingWallet = new WalletAggregate();
      pendingWallet.createWallet(
        WalletId.from('wallet_pending'),
        UserId.from('user_pending'),
        MerchantId.from('merchant_pending')
      );

      expect(() => {
        pendingWallet.creditWallet(Money.fromEGP(100), 'card_topup');
      }).toThrow(DomainError);
    });
  });

  describe('debitWallet', () => {
    beforeEach(() => {
      wallet.createWallet(walletId, userId, merchantId);
      wallet.activateWallet();
      wallet.creditWallet(Money.fromEGP(100), 'card_topup');
    });

    it('should debit wallet with valid amount', () => {
      const amount = Money.fromEGP(30);
      wallet.debitWallet(amount, 'merchant', {
        description: 'Payment for service'
      });

      const events = wallet.getUncommittedEvents();
      expect(events).toHaveLength(4); // Created + Activated + Credited + Debited
      expect(events[3].type).toBe(WalletEventType.WALLET_DEBITED);
      expect(events[3].data.amount).toBe(3000); // 30 EGP = 3000 piasters
      expect(events[3].data.balanceBefore).toBe(10000);
      expect(events[3].data.balanceAfter).toBe(7000);
      expect(events[3].data.destination).toBe('merchant');
    });

    it('should update wallet balance after debit', () => {
      wallet.debitWallet(Money.fromEGP(30), 'merchant');

      const state = wallet.getState();
      expect(state.balance.toEGP()).toBe(70);
    });

    it('should allow multiple debits', () => {
      wallet.debitWallet(Money.fromEGP(30), 'merchant');
      wallet.debitWallet(Money.fromEGP(20), 'merchant');

      const state = wallet.getState();
      expect(state.balance.toEGP()).toBe(50);
    });

    it('should not allow debit with insufficient balance', () => {
      expect(() => {
        wallet.debitWallet(Money.fromEGP(150), 'merchant');
      }).toThrow(InsufficientBalanceError);
    });

    it('should not allow debiting with zero or negative amount', () => {
      expect(() => {
        wallet.debitWallet(Money.zero(), 'merchant');
      }).toThrow(InvalidAmountError);
    });

    it('should not allow debiting suspended wallet', () => {
      wallet.suspendWallet('Test suspension');

      expect(() => {
        wallet.debitWallet(Money.fromEGP(10), 'merchant');
      }).toThrow(WalletSuspendedError);
    });
  });

  describe('canDebit', () => {
    beforeEach(() => {
      wallet.createWallet(walletId, userId, merchantId);
      wallet.activateWallet();
      wallet.creditWallet(Money.fromEGP(100), 'card_topup');
    });

    it('should return true for sufficient balance', () => {
      expect(wallet.canDebit(Money.fromEGP(50))).toBe(true);
      expect(wallet.canDebit(Money.fromEGP(100))).toBe(true);
    });

    it('should return false for insufficient balance', () => {
      expect(wallet.canDebit(Money.fromEGP(150))).toBe(false);
    });

    it('should return false for suspended wallet', () => {
      wallet.suspendWallet('Test');
      expect(wallet.canDebit(Money.fromEGP(50))).toBe(false);
    });
  });

  describe('event replay (loadFromHistory)', () => {
    it('should rebuild state from event history', () => {
      // Create events
      wallet.createWallet(walletId, userId, merchantId);
      wallet.activateWallet();
      wallet.creditWallet(Money.fromEGP(100), 'card_topup');
      wallet.debitWallet(Money.fromEGP(30), 'merchant');

      const events = wallet.getUncommittedEvents();

      // Create new aggregate and load from history
      const replayedWallet = new WalletAggregate();
      replayedWallet.loadFromHistory(events);

      // Should have same state
      const originalState = wallet.getState();
      const replayedState = replayedWallet.getState();

      expect(replayedState.walletId?.toString()).toBe(originalState.walletId?.toString());
      expect(replayedState.balance.toEGP()).toBe(70);
      expect(replayedState.status).toBe('active');
      expect(replayedWallet.getVersion()).toBe(4);
    });

    it('should not have uncommitted events after replay', () => {
      wallet.createWallet(walletId, userId, merchantId);
      wallet.activateWallet();

      const events = wallet.getUncommittedEvents();

      const replayedWallet = new WalletAggregate();
      replayedWallet.loadFromHistory(events);

      expect(replayedWallet.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('version management', () => {
    it('should increment version for each event', () => {
      expect(wallet.getVersion()).toBe(0);

      wallet.createWallet(walletId, userId, merchantId);
      expect(wallet.getVersion()).toBe(1);

      wallet.activateWallet();
      expect(wallet.getVersion()).toBe(2);

      wallet.creditWallet(Money.fromEGP(100), 'card_topup');
      expect(wallet.getVersion()).toBe(3);
    });

    it('should clear uncommitted events', () => {
      wallet.createWallet(walletId, userId, merchantId);
      expect(wallet.getUncommittedEvents()).toHaveLength(1);

      wallet.clearUncommittedEvents();
      expect(wallet.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
