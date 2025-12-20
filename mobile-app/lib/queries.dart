// lib/data/graphql/queries/queries.dart

/// User Queries
class UserQueries {
  static const String getUser = r'''
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        phoneNumber
        email
        firstName
        lastName
        nationalId
        dateOfBirth
        address
        city
        governorate
        status
        kycStatus
        kycLevel
        profileImage
        lastLoginAt
        createdAt
        updatedAt
      }
    }
  ''';

  static const String getUserByPhone = r'''
    query GetUserByPhone($phoneNumber: String!) {
      userByPhone(phoneNumber: $phoneNumber) {
        id
        phoneNumber
        firstName
        lastName
        status
        kycStatus
      }
    }
  ''';

  static const String hasPinSet = r'''
    query HasPinSet($userId: ID!) {
      hasPinSet(userId: $userId)
    }
  ''';

  static const String getUsers = r'''
    query GetUsers($limit: Int, $offset: Int, $status: String, $search: String) {
      users(limit: $limit, offset: $offset, status: $status, search: $search) {
        items {
          id
          phoneNumber
          email
          firstName
          lastName
          status
          kycStatus
          createdAt
        }
        totalCount
        hasMore
      }
    }
  ''';
}

/// Wallet Queries
class WalletQueries {
  static const String getWallet = r'''
    query GetWallet($id: ID!) {
      wallet(id: $id) {
        id
        userId
        merchantId
        walletNumber
        balance
        availableBalance
        pendingBalance
        currency
        dailyLimit
        monthlyLimit
        isActive
        lastTransactionAt
        createdAt
        updatedAt
      }
    }
  ''';

  static const String getWalletByUserId = r'''
    query GetWalletByUserId($userId: ID!) {
      walletByUserId(userId: $userId) {
        id
        userId
        walletNumber
        balance
        availableBalance
        pendingBalance
        currency
        dailyLimit
        monthlyLimit
        isActive
        lastTransactionAt
        createdAt
        updatedAt
      }
    }
  ''';

  static const String walletBalance = r'''
    query WalletBalance($walletId: ID!) {
      walletBalance(walletId: $walletId) {
        balance
        availableBalance
        pendingBalance
        currency
      }
    }
  ''';
}

/// Transaction Queries
class TransactionQueries {
  static const String getTransaction = r'''
    query GetTransaction($id: ID!) {
      transaction(id: $id) {
        id
        reference
        externalReference
        type
        status
        amount
        fee
        netAmount
        currency
        senderWalletId
        recipientWalletId
        recipientPhone
        recipientName
        senderBalanceBefore
        senderBalanceAfter
        description
        notes
        metadata
        failureReason
        createdAt
        completedAt
      }
    }
  ''';

  static const String transactionsByWallet = r'''
    query TransactionsByWallet(
      $walletId: ID!
      $limit: Int
      $offset: Int
      $type: String
      $status: String
      $startDate: DateTime
      $endDate: DateTime
    ) {
      transactionsByWallet(
        walletId: $walletId
        limit: $limit
        offset: $offset
        type: $type
        status: $status
        startDate: $startDate
        endDate: $endDate
      ) {
        items {
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
          completedAt
        }
        totalCount
        hasMore
      }
    }
  ''';

  static const String allTransactions = r'''
    query AllTransactions(
      $limit: Int
      $offset: Int
      $type: String
      $status: String
      $search: String
      $startDate: DateTime
      $endDate: DateTime
    ) {
      transactions(
        limit: $limit
        offset: $offset
        type: $type
        status: $status
        search: $search
        startDate: $startDate
        endDate: $endDate
      ) {
        items {
          id
          reference
          type
          status
          amount
          fee
          netAmount
          currency
          senderWalletId
          recipientWalletId
          recipientPhone
          recipientName
          description
          createdAt
          completedAt
        }
        totalCount
        hasMore
      }
    }
  ''';
}

/// Merchant Queries
class MerchantQueries {
  static const String getMerchant = r'''
    query GetMerchant($id: ID!) {
      merchant(id: $id) {
        id
        merchantCode
        businessName
        businessNameAr
        businessType
        email
        phone
        address
        city
        governorate
        website
        logo
        status
        commissionRate
        settlementPeriod
        settlementAccount
        settlementBank
        lastLoginAt
        createdAt
        updatedAt
      }
    }
  ''';

  static const String getMerchants = r'''
    query GetMerchants($limit: Int, $offset: Int, $status: String, $search: String) {
      merchants(limit: $limit, offset: $offset, status: $status, search: $search) {
        items {
          id
          merchantCode
          businessName
          email
          status
          createdAt
        }
        totalCount
        hasMore
      }
    }
  ''';

  static const String merchantAnalytics = r'''
    query MerchantAnalytics($merchantId: ID!) {
      merchantAnalytics(merchantId: $merchantId) {
        totalPayments
        totalVolume
        todayPayments
        todayVolume
        pendingWithdrawals
        totalWithdrawn
      }
    }
  ''';
}

/// Admin Queries
class AdminQueries {
  static const String getAdmin = r'''
    query GetAdmin($id: ID!) {
      admin(id: $id) {
        id
        email
        firstName
        lastName
        phone
        role
        permissions
        isActive
        lastLoginAt
        createdAt
        updatedAt
      }
    }
  ''';

  static const String systemAnalytics = r'''
    query SystemAnalytics {
      systemAnalytics {
        totalUsers
        activeUsers
        totalMerchants
        activeMerchants
        totalTransactions
        totalTransactionVolume
        pendingKyc
        pendingWithdrawals
        todayTransactions
        todayVolume
      }
    }
  ''';
}

/// KYC Queries
class KycQueries {
  static const String getKycDocuments = r'''
    query GetKycDocuments($userId: ID!) {
      kycDocuments(userId: $userId) {
        id
        userId
        documentType
        documentUrl
        documentNumber
        expiryDate
        status
        verifiedAt
        verifiedBy
        rejectionReason
        createdAt
        updatedAt
      }
    }
  ''';

  static const String pendingKycDocuments = r'''
    query PendingKycDocuments($limit: Int, $offset: Int) {
      pendingKycDocuments(limit: $limit, offset: $offset) {
        items {
          id
          userId
          documentType
          documentUrl
          status
          createdAt
          user {
            id
            phoneNumber
            firstName
            lastName
          }
        }
        totalCount
        hasMore
      }
    }
  ''';
}

/// Withdrawal Queries
class WithdrawalQueries {
  static const String getWithdrawalRequests = r'''
    query GetWithdrawalRequests($walletId: ID, $status: String, $limit: Int, $offset: Int) {
      withdrawalRequests(walletId: $walletId, status: $status, limit: $limit, offset: $offset) {
        items {
          id
          reference
          walletId
          amount
          fee
          netAmount
          currency
          status
          bankName
          accountNumber
          accountName
          iban
          notes
          rejectionReason
          processedAt
          createdAt
          updatedAt
        }
        totalCount
        hasMore
      }
    }
  ''';
}
