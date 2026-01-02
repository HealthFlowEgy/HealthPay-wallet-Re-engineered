/// Application Constants for HealthPay
class AppConstants {
  AppConstants._();

  /// App Name
  static const String appName = 'HealthPay';
  
  /// App Version
  static const String appVersion = '1.0.0';
  
  /// Default Currency
  static const String defaultCurrency = 'EGP';
  
  /// Country Code
  static const String countryCode = '+20';
  
  /// OTP Length
  static const int otpLength = 6;
  
  /// PIN Length
  static const int pinLength = 4;
  
  /// Max PIN Attempts
  static const int maxPinAttempts = 5;
  
  /// PIN Lockout Duration (minutes)
  static const int pinLockoutMinutes = 30;
  
  /// Session Timeout (minutes)
  static const int sessionTimeoutMinutes = 30;
  
  /// OTP Resend Cooldown (seconds)
  static const int otpResendCooldown = 60;
  
  /// Daily Transaction Limit
  static const double dailyLimit = 10000.0;
  
  /// Minimum Top-up Amount
  static const double minTopupAmount = 10.0;
  
  /// Maximum Top-up Amount
  static const double maxTopupAmount = 10000.0;
  
  /// Minimum Transfer Amount
  static const double minTransferAmount = 1.0;
  
  /// Maximum Transfer Amount
  static const double maxTransferAmount = 10000.0;
  
  /// Recent Transactions Limit (Dashboard)
  static const int recentTransactionsLimit = 5;
  
  /// Transactions Page Size
  static const int transactionsPageSize = 20;
}

/// Storage Keys
class StorageKeys {
  StorageKeys._();
  
  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';
  static const String userId = 'user_id';
  static const String userPin = 'user_pin';
  static const String pinAttempts = 'pin_attempts';
  static const String pinLockoutTime = 'pin_lockout_time';
  static const String biometricEnabled = 'biometric_enabled';
  static const String locale = 'locale';
  static const String onboardingComplete = 'onboarding_complete';
  static const String fcmToken = 'fcm_token';
}

/// Asset Paths
class AssetPaths {
  AssetPaths._();
  
  static const String images = 'assets/images';
  static const String icons = 'assets/icons';
  static const String animations = 'assets/animations';
  
  // Images
  static const String logo = '$images/logo.png';
  static const String logoWhite = '$images/logo_white.png';
  static const String emptyState = '$images/empty_state.png';
  static const String successCheck = '$animations/success.json';
  static const String loadingSpinner = '$animations/loading.json';
}
