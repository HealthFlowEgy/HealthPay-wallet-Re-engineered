/// Environment configuration for the HealthPay app
/// 
/// This file manages different environment configurations for development,
/// staging, and production builds.
class Environment {
  static const String development = 'development';
  static const String staging = 'staging';
  static const String production = 'production';

  /// Current environment - change this for different builds
  static const String current = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: development,
  );

  static bool get isDevelopment => current == development;
  static bool get isStaging => current == staging;
  static bool get isProduction => current == production;

  /// API Configuration
  static String get apiBaseUrl {
    switch (current) {
      case production:
        return 'https://api.healthpay.tech/graphql';
      case staging:
        return 'https://staging-api.healthpay.tech/graphql';
      case development:
      default:
        return 'http://104.248.245.150:4000/graphql';
    }
  }

  /// WebSocket Configuration (for real-time updates)
  static String get wsBaseUrl {
    switch (current) {
      case production:
        return 'wss://api.healthpay.tech/graphql';
      case staging:
        return 'wss://staging-api.healthpay.tech/graphql';
      case development:
      default:
        return 'ws://104.248.245.150:4000/graphql';
    }
  }

  /// App Configuration
  static String get appName {
    switch (current) {
      case production:
        return 'HealthPay';
      case staging:
        return 'HealthPay (Staging)';
      case development:
      default:
        return 'HealthPay (Dev)';
    }
  }

  /// Feature Flags
  static bool get enableBiometricAuth => true;
  static bool get enablePushNotifications => current != development;
  static bool get enableAnalytics => current == production;
  static bool get enableCrashlytics => current == production;
  static bool get showDebugBanner => current == development;
  static bool get enableDevOTPHint => current == development;

  /// Timeouts (in seconds)
  static int get connectionTimeout => 30;
  static int get receiveTimeout => 30;

  /// OTP Configuration
  static int get otpLength => 6;
  static int get otpResendCooldown => 60; // seconds
  static int get otpExpiryTime => 300; // 5 minutes

  /// PIN Configuration
  static int get pinLength => 4;
  static int get maxPinAttempts => 3;
  static int get pinLockoutDuration => 300; // 5 minutes

  /// Transaction Limits (EGP)
  static double get minTransferAmount => 1.0;
  static double get maxTransferAmount => 50000.0;
  static double get dailyTransferLimit => 100000.0;
  static double get minTopUpAmount => 10.0;
  static double get maxTopUpAmount => 50000.0;

  /// Logging
  static bool get enableNetworkLogging => current != production;
  static bool get enableBlocLogging => current != production;
}

/// Build configuration
class BuildConfig {
  /// Version information
  static const String versionName = '1.0.0';
  static const int versionCode = 1;

  /// Package identifiers
  static String get androidPackageName {
    switch (Environment.current) {
      case Environment.production:
        return 'tech.healthpay.wallet';
      case Environment.staging:
        return 'tech.healthpay.wallet.staging';
      case Environment.development:
      default:
        return 'tech.healthpay.wallet.dev';
    }
  }

  static String get iosBundleId {
    switch (Environment.current) {
      case Environment.production:
        return 'tech.healthpay.wallet';
      case Environment.staging:
        return 'tech.healthpay.wallet.staging';
      case Environment.development:
      default:
        return 'tech.healthpay.wallet.dev';
    }
  }

  /// App Store IDs (for deep linking and reviews)
  static const String appStoreId = ''; // Add when available
  static const String playStoreId = 'tech.healthpay.wallet';

  /// Support
  static const String supportEmail = 'support@healthpay.tech';
  static const String supportPhone = '+20 100 000 0000';
  static const String websiteUrl = 'https://healthpay.tech';
  static const String privacyPolicyUrl = 'https://healthpay.tech/privacy';
  static const String termsOfServiceUrl = 'https://healthpay.tech/terms';
}
