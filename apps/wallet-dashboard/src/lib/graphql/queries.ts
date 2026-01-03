import { gql } from '@apollo/client';

// ============================================
// Authentication Queries & Mutations
// ============================================

export const SEND_OTP = gql`
  mutation SendOTP($input: SendOTPInput!) {
    sendOTP(input: $input) {
      success
      message
      expiresIn
      devOTP
    }
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOTP($input: VerifyOTPInput!) {
    verifyOTP(input: $input) {
      success
      token
      user {
        id
        phoneNumber
        name
        email
        role
      }
      message
      isNewUser
    }
  }
`;

export const SET_PIN = gql`
  mutation SetPin($phoneNumber: String!, $pin: String!) {
    setPin(phoneNumber: $phoneNumber, pin: $pin) {
      success
      message
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      phoneNumber
      name
      email
      role
      wallet {
        id
        balance
        pendingBalance
        currency
      }
    }
  }
`;

export const HAS_PIN_SET = gql`
  query HasPinSet($phoneNumber: String!) {
    hasPinSet(phoneNumber: $phoneNumber)
  }
`;

// ============================================
// Wallet Queries
// ============================================

export const GET_WALLET = gql`
  query Wallet($id: ID!) {
    wallet(id: $id) {
      id
      balance
      pendingBalance
      currency
      userId
    }
  }
`;

export const GET_WALLET_ANALYTICS = gql`
  query WalletAnalytics($walletId: ID!, $days: Int) {
    walletAnalytics(walletId: $walletId, days: $days) {
      totalIn
      totalOut
      transactionCount
      avgTransaction
    }
  }
`;

// ============================================
// Transaction Queries & Mutations
// ============================================

export const GET_TRANSACTIONS = gql`
  query TransactionsByWallet($walletId: ID!, $limit: Int, $offset: Int) {
    transactionsByWallet(walletId: $walletId, limit: $limit, offset: $offset) {
      id
      type
      amount
      fee
      net
      status
      reference
      description
      createdAt
      merchant {
        id
        businessName
      }
    }
  }
`;

export const GET_TRANSACTION = gql`
  query Transaction($id: ID!) {
    transaction(id: $id) {
      id
      type
      amount
      fee
      net
      status
      reference
      description
      metadata
      createdAt
      merchant {
        id
        businessName
        phone
      }
    }
  }
`;

export const TOP_UP_WALLET = gql`
  mutation TopUpWallet($walletId: ID!, $amount: Float!, $method: String!) {
    topUpWallet(walletId: $walletId, amount: $amount, method: $method) {
      success
      message
      transaction {
        id
        amount
        status
        reference
      }
      newBalance
    }
  }
`;

// ============================================
// Transfer Mutations
// ============================================

export const TRANSFER_MONEY = gql`
  mutation TransferMoney($input: TransferInput!) {
    transferMoney(input: $input) {
      success
      message
      transaction {
        id
        amount
        status
        reference
        createdAt
      }
    }
  }
`;

export const VALIDATE_RECIPIENT = gql`
  query ValidateRecipient($phoneNumber: String!) {
    validateRecipient(phoneNumber: $phoneNumber) {
      valid
      name
      message
    }
  }
`;

// ============================================
// Bill Payment Queries & Mutations
// ============================================

export const GET_BILL_CATEGORIES = gql`
  query BillCategories {
    billCategories {
      id
      name
      nameAr
      icon
      order
      billers {
        id
        name
        nameAr
        code
        accountFormat
        accountHint
      }
    }
  }
`;

export const GET_BILLERS = gql`
  query Billers($categoryId: ID!) {
    billers(categoryId: $categoryId) {
      id
      name
      nameAr
      code
      accountFormat
      accountHint
    }
  }
`;

export const INQUIRE_BILL = gql`
  query InquireBill($billerId: ID!, $accountNumber: String!) {
    inquireBill(billerId: $billerId, accountNumber: $accountNumber) {
      success
      subscriberName
      amount
      dueDate
      period
      billNumber
      message
    }
  }
`;

export const PAY_BILL = gql`
  mutation PayBill($input: PayBillInput!) {
    payBill(input: $input) {
      success
      reference
      message
      newBalance
    }
  }
`;

export const GET_SAVED_BILLERS = gql`
  query SavedBillers($userId: ID!) {
    savedBillers(userId: $userId) {
      id
      billerId
      accountNumber
      nickname
      biller {
        id
        name
        nameAr
        code
      }
      category {
        id
        name
        nameAr
        icon
      }
    }
  }
`;

export const SAVE_BILLER = gql`
  mutation SaveBiller($input: SaveBillerInput!) {
    saveBiller(input: $input) {
      success
      id
    }
  }
`;

export const DELETE_SAVED_BILLER = gql`
  mutation DeleteSavedBiller($id: ID!) {
    deleteSavedBiller(id: $id) {
      success
    }
  }
`;

export const GET_BILL_HISTORY = gql`
  query BillPaymentHistory($userId: ID!, $category: String, $limit: Int) {
    billPaymentHistory(userId: $userId, category: $category, limit: $limit) {
      id
      accountNumber
      amount
      reference
      status
      paidAt
      biller {
        name
        nameAr
      }
      category {
        name
        nameAr
        icon
      }
    }
  }
`;

// ============================================
// Notification Queries
// ============================================

export const GET_NOTIFICATIONS = gql`
  query Notifications($userId: ID!, $limit: Int, $offset: Int) {
    notifications(userId: $userId, limit: $limit, offset: $offset) {
      id
      type
      title
      titleAr
      body
      bodyAr
      read
      createdAt
      data
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      success
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($userId: ID!) {
    markAllNotificationsRead(userId: $userId) {
      success
      count
    }
  }
`;

// ============================================
// Medical Card Queries
// ============================================

export const GET_MEDICAL_CARD = gql`
  query MedicalCard($userId: ID!) {
    medicalCard(userId: $userId) {
      id
      cardNumber
      status
      balance
      dailyLimit
      expiryDate
      beneficiaries {
        id
        name
        relation
        nationalId
        isActive
      }
    }
  }
`;

// ============================================
// User Profile Queries & Mutations
// ============================================

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      success
      user {
        id
        name
        email
        phoneNumber
      }
    }
  }
`;

export const CHANGE_PIN = gql`
  mutation ChangePin($currentPin: String!, $newPin: String!) {
    changePin(currentPin: $currentPin, newPin: $newPin) {
      success
      message
    }
  }
`;
