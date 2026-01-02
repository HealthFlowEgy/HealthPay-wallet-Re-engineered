/// API Constants for HealthPay
class ApiConstants {
  ApiConstants._();

  /// Environment - change this for different builds
  static const bool isProduction = false;
  
  /// Base GraphQL URL
  static String get baseUrl => isProduction 
      ? 'https://api.healthpay.tech/graphql'
      : 'http://104.248.245.150:4000/graphql';
  
  /// WebSocket URL for subscriptions
  static String get wsUrl => isProduction
      ? 'wss://api.healthpay.tech/graphql'
      : 'ws://104.248.245.150:4000/graphql';
  
  /// Request timeout duration
  static const Duration timeout = Duration(seconds: 30);
  
  /// Connection timeout duration
  static const Duration connectTimeout = Duration(seconds: 10);
  
  /// Retry count for failed requests
  static const int maxRetries = 3;
  
  /// Retry delay between attempts
  static const Duration retryDelay = Duration(seconds: 2);
}

/// GraphQL Query Names
class GqlQueries {
  GqlQueries._();
  
  static const String me = 'me';
  static const String wallet = 'wallet';
  static const String walletAnalytics = 'walletAnalytics';
  static const String transactionsByWallet = 'transactionsByWallet';
  static const String transaction = 'transaction';
  static const String validateRecipient = 'validateRecipient';
  static const String billCategories = 'billCategories';
  static const String billers = 'billers';
  static const String inquireBill = 'inquireBill';
  static const String savedBillers = 'savedBillers';
  static const String billPaymentHistory = 'billPaymentHistory';
  static const String notifications = 'notifications';
  static const String medicalCard = 'medicalCard';
  static const String topUpMethods = 'topUpMethods';
}

/// GraphQL Mutation Names
class GqlMutations {
  GqlMutations._();
  
  static const String sendOTP = 'sendOTP';
  static const String verifyOTP = 'verifyOTP';
  static const String setPin = 'setPin';
  static const String changePin = 'changePin';
  static const String verifyPin = 'verifyPin';
  static const String transferMoney = 'transferMoney';
  static const String topUpWallet = 'topUpWallet';
  static const String payBill = 'payBill';
  static const String saveBiller = 'saveBiller';
  static const String deleteSavedBiller = 'deleteSavedBiller';
  static const String updateProfile = 'updateProfile';
  static const String markNotificationRead = 'markNotificationRead';
}
