/// Route Constants for Navigation
class RouteConstants {
  RouteConstants._();

  // Auth Routes
  static const String splash = '/';
  static const String login = '/login';
  static const String otp = '/otp';
  static const String pinSetup = '/pin-setup';
  static const String pinEntry = '/pin-entry';
  
  // Main Routes
  static const String dashboard = '/dashboard';
  static const String transactions = '/transactions';
  static const String transactionDetail = '/transactions/:id';
  static const String bills = '/bills';
  static const String medicalCard = '/medical-card';
  static const String settings = '/settings';
  
  // Transfer Routes
  static const String transfer = '/transfer';
  static const String transferRecipient = '/transfer/recipient';
  static const String transferAmount = '/transfer/amount';
  static const String transferReview = '/transfer/review';
  static const String transferSuccess = '/transfer/success';
  
  // Top-up Routes
  static const String topup = '/topup';
  static const String topupMethod = '/topup/method';
  static const String topupSuccess = '/topup/success';
  
  // Bills Routes
  static const String billCategories = '/bills/categories';
  static const String billProviders = '/bills/providers/:categoryId';
  static const String billPayment = '/bills/payment';
  static const String savedBillers = '/bills/saved';
  
  // Profile Routes
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  
  // Settings Routes
  static const String changePin = '/settings/change-pin';
  static const String notifications = '/notifications';
  static const String help = '/help';
  static const String privacy = '/privacy';
  static const String terms = '/terms';
}

/// Route Names for GoRouter
class RouteNames {
  RouteNames._();
  
  static const String splash = 'splash';
  static const String login = 'login';
  static const String otp = 'otp';
  static const String pinSetup = 'pin-setup';
  static const String pinEntry = 'pin-entry';
  static const String dashboard = 'dashboard';
  static const String transactions = 'transactions';
  static const String transactionDetail = 'transaction-detail';
  static const String transfer = 'transfer';
  static const String topup = 'topup';
  static const String bills = 'bills';
  static const String medicalCard = 'medical-card';
  static const String settings = 'settings';
  static const String profile = 'profile';
  static const String notifications = 'notifications';
}
