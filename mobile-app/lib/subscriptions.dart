// lib/data/graphql/subscriptions/subscriptions.dart

/// Wallet Subscriptions
class WalletSubscriptions {
  static const String walletBalanceChanged = r'''
    subscription WalletBalanceChanged($walletId: ID!) {
      walletBalanceChanged(walletId: $walletId) {
        walletId
        balance
        availableBalance
        pendingBalance
        currency
        timestamp
      }
    }
  ''';
}

/// Transaction Subscriptions
class TransactionSubscriptions {
  static const String transactionCreated = r'''
    subscription TransactionCreated($walletId: ID!) {
      transactionCreated(walletId: $walletId) {
        id
        reference
        type
        status
        amount
        fee
        netAmount
        currency
        recipientPhone
        recipientName
        description
        createdAt
      }
    }
  ''';

  static const String transactionStatusChanged = r'''
    subscription TransactionStatusChanged($transactionId: ID!) {
      transactionStatusChanged(transactionId: $transactionId) {
        id
        reference
        status
        failureReason
        completedAt
      }
    }
  ''';
}

/// Payment Subscriptions (for merchants)
class PaymentSubscriptions {
  static const String paymentReceived = r'''
    subscription PaymentReceived($merchantId: ID!) {
      paymentReceived(merchantId: $merchantId) {
        paymentId
        amount
        customerPhone
        orderId
        status
        timestamp
      }
    }
  ''';
}

/// Admin Subscriptions
class AdminSubscriptions {
  static const String newUserRegistered = r'''
    subscription NewUserRegistered {
      newUserRegistered {
        id
        phoneNumber
        firstName
        lastName
        createdAt
      }
    }
  ''';

  static const String newKycSubmitted = r'''
    subscription NewKycSubmitted {
      newKycSubmitted {
        id
        userId
        documentType
        status
        createdAt
      }
    }
  ''';

  static const String newWithdrawalRequest = r'''
    subscription NewWithdrawalRequest {
      newWithdrawalRequest {
        id
        reference
        walletId
        amount
        status
        createdAt
      }
    }
  ''';
}
