// lib/data/graphql/mutations/mutations.dart

/// Authentication Mutations
class AuthMutations {
  static const String sendOtp = r'''
    mutation SendOtp($phoneNumber: String!) {
      sendOtp(phoneNumber: $phoneNumber) {
        success
        message
        otpId
        expiresIn
      }
    }
  ''';

  static const String verifyOtp = r'''
    mutation VerifyOtp($phoneNumber: String!, $code: String!) {
      verifyOtp(phoneNumber: $phoneNumber, code: $code) {
        token
        userId
        userType
        user {
          id
          phoneNumber
          firstName
          lastName
          status
          kycStatus
        }
      }
    }
  ''';

  static const String adminLogin = r'''
    mutation AdminLogin($email: String!, $password: String!) {
      adminLogin(email: $email, password: $password) {
        token
        userId
        userType
        admin {
          id
          email
          firstName
          lastName
          role
          isActive
        }
      }
    }
  ''';

  static const String merchantLogin = r'''
    mutation MerchantLogin($merchantCode: String!, $password: String!) {
      merchantLogin(merchantCode: $merchantCode, password: $password) {
        token
        userId
        userType
        merchant {
          id
          merchantCode
          businessName
          email
          status
        }
      }
    }
  ''';

  static const String refreshToken = r'''
    mutation RefreshToken($refreshToken: String!) {
      refreshToken(refreshToken: $refreshToken) {
        token
        refreshToken
      }
    }
  ''';

  static const String logout = r'''
    mutation Logout {
      logout {
        success
        message
      }
    }
  ''';
}

/// PIN Mutations
class PinMutations {
  static const String setPin = r'''
    mutation SetPin($userId: ID!, $pin: String!) {
      setPin(userId: $userId, pin: $pin) {
        success
        message
      }
    }
  ''';

  static const String verifyPin = r'''
    mutation VerifyPin($userId: ID!, $pin: String!) {
      verifyPin(userId: $userId, pin: $pin) {
        success
        message
        remainingAttempts
      }
    }
  ''';

  static const String changePin = r'''
    mutation ChangePin($userId: ID!, $currentPin: String!, $newPin: String!) {
      changePin(userId: $userId, currentPin: $currentPin, newPin: $newPin) {
        success
        message
      }
    }
  ''';

  static const String resetPin = r'''
    mutation ResetPin($userId: ID!, $otp: String!, $newPin: String!) {
      resetPin(userId: $userId, otp: $otp, newPin: $newPin) {
        success
        message
      }
    }
  ''';
}

/// Wallet Mutations
class WalletMutations {
  static const String createWallet = r'''
    mutation CreateWallet($userId: ID!) {
      createWallet(userId: $userId) {
        id
        userId
        walletNumber
        balance
        currency
        isActive
        createdAt
      }
    }
  ''';

  static const String creditWallet = r'''
    mutation CreditWallet($walletId: ID!, $amount: Float!, $description: String) {
      creditWallet(walletId: $walletId, amount: $amount, description: $description) {
        success
        message
        transaction {
          id
          reference
          amount
          status
        }
      }
    }
  ''';
}

/// Transaction Mutations
class TransactionMutations {
  static const String sendMoney = r'''
    mutation SendMoney(
      $senderWalletId: ID!
      $recipientPhone: String!
      $amount: Float!
      $pin: String!
      $description: String
    ) {
      sendMoney(
        senderWalletId: $senderWalletId
        recipientPhone: $recipientPhone
        amount: $amount
        pin: $pin
        description: $description
      ) {
        success
        message
        transaction {
          id
          reference
          type
          status
          amount
          fee
          netAmount
          recipientPhone
          recipientName
          senderBalanceBefore
          senderBalanceAfter
          createdAt
          completedAt
        }
      }
    }
  ''';

  static const String initiatePayment = r'''
    mutation InitiatePayment($walletId: ID!, $amount: Float!, $paymentMethod: String!) {
      initiatePayment(walletId: $walletId, amount: $amount, paymentMethod: $paymentMethod) {
        success
        message
        paymentId
        paymentUrl
        expiresAt
      }
    }
  ''';

  static const String completePayment = r'''
    mutation CompletePayment($paymentId: ID!, $transactionReference: String!) {
      completePayment(paymentId: $paymentId, transactionReference: $transactionReference) {
        success
        message
        transaction {
          id
          reference
          amount
          status
        }
      }
    }
  ''';

  static const String reverseTransaction = r'''
    mutation ReverseTransaction($transactionId: ID!, $reason: String!) {
      reverseTransaction(transactionId: $transactionId, reason: $reason) {
        success
        message
        reversalTransaction {
          id
          reference
          status
        }
      }
    }
  ''';
}

/// Merchant Mutations
class MerchantMutations {
  static const String acceptPayment = r'''
    mutation AcceptPayment($merchantId: ID!, $amount: Float!, $orderId: String, $description: String) {
      acceptPayment(merchantId: $merchantId, amount: $amount, orderId: $orderId, description: $description) {
        success
        message
        paymentId
        qrCode
        expiresAt
      }
    }
  ''';

  static const String requestWithdrawal = r'''
    mutation RequestWithdrawal(
      $walletId: ID!
      $amount: Float!
      $bankName: String!
      $accountNumber: String!
      $accountName: String!
      $iban: String
      $notes: String
    ) {
      requestWithdrawal(
        walletId: $walletId
        amount: $amount
        bankName: $bankName
        accountNumber: $accountNumber
        accountName: $accountName
        iban: $iban
        notes: $notes
      ) {
        success
        message
        withdrawalRequest {
          id
          reference
          amount
          fee
          netAmount
          status
          createdAt
        }
      }
    }
  ''';

  static const String updateMerchant = r'''
    mutation UpdateMerchant($id: ID!, $input: UpdateMerchantInput!) {
      updateMerchant(id: $id, input: $input) {
        id
        businessName
        businessNameAr
        email
        phone
        address
        city
        website
      }
    }
  ''';

  static const String approveMerchant = r'''
    mutation ApproveMerchant($id: ID!) {
      approveMerchant(id: $id) {
        success
        message
        merchant {
          id
          merchantCode
          status
        }
      }
    }
  ''';

  static const String rejectMerchant = r'''
    mutation RejectMerchant($id: ID!, $reason: String!) {
      rejectMerchant(id: $id, reason: $reason) {
        success
        message
      }
    }
  ''';
}

/// User Management Mutations
class UserMutations {
  static const String updateUser = r'''
    mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
      updateUser(id: $id, input: $input) {
        id
        firstName
        lastName
        email
        address
        city
        governorate
      }
    }
  ''';

  static const String suspendUser = r'''
    mutation SuspendUser($id: ID!, $reason: String!) {
      suspendUser(id: $id, reason: $reason) {
        success
        message
        user {
          id
          status
        }
      }
    }
  ''';

  static const String blockUser = r'''
    mutation BlockUser($id: ID!, $reason: String!) {
      blockUser(id: $id, reason: $reason) {
        success
        message
      }
    }
  ''';

  static const String activateUser = r'''
    mutation ActivateUser($id: ID!) {
      activateUser(id: $id) {
        success
        message
        user {
          id
          status
        }
      }
    }
  ''';
}

/// KYC Mutations
class KycMutations {
  static const String uploadKycDocument = r'''
    mutation UploadKycDocument(
      $userId: ID!
      $documentType: String!
      $documentUrl: String!
      $documentNumber: String
      $expiryDate: String
    ) {
      uploadKycDocument(
        userId: $userId
        documentType: $documentType
        documentUrl: $documentUrl
        documentNumber: $documentNumber
        expiryDate: $expiryDate
      ) {
        success
        message
        document {
          id
          documentType
          status
        }
      }
    }
  ''';

  static const String approveKyc = r'''
    mutation ApproveKyc($documentId: ID!) {
      approveKyc(documentId: $documentId) {
        success
        message
        document {
          id
          status
          verifiedAt
        }
      }
    }
  ''';

  static const String rejectKyc = r'''
    mutation RejectKyc($documentId: ID!, $reason: String!) {
      rejectKyc(documentId: $documentId, reason: $reason) {
        success
        message
      }
    }
  ''';
}

/// Withdrawal Mutations
class WithdrawalMutations {
  static const String approveWithdrawal = r'''
    mutation ApproveWithdrawal($id: ID!) {
      approveWithdrawal(id: $id) {
        success
        message
        withdrawalRequest {
          id
          status
          processedAt
        }
      }
    }
  ''';

  static const String rejectWithdrawal = r'''
    mutation RejectWithdrawal($id: ID!, $reason: String!) {
      rejectWithdrawal(id: $id, reason: $reason) {
        success
        message
      }
    }
  ''';
}
