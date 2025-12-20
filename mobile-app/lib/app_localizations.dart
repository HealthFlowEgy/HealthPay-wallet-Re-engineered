// lib/l10n/app_localizations.dart

import 'package:flutter/material.dart';

/// Simple localization implementation
/// In production, use flutter_localizations with .arb files
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('en'));
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('ar'),
  ];

  static final Map<String, Map<String, String>> _localizedValues = {
    'en': _englishStrings,
    'ar': _arabicStrings,
  };

  String get(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }

  // ==================== COMMON ====================
  String get appName => get('app_name');
  String get ok => get('ok');
  String get cancel => get('cancel');
  String get save => get('save');
  String get delete => get('delete');
  String get edit => get('edit');
  String get close => get('close');
  String get confirm => get('confirm');
  String get loading => get('loading');
  String get error => get('error');
  String get success => get('success');
  String get retry => get('retry');
  String get next => get('next');
  String get back => get('back');
  String get done => get('done');
  String get search => get('search');
  String get filter => get('filter');
  String get noData => get('no_data');

  // ==================== AUTH ====================
  String get login => get('login');
  String get logout => get('logout');
  String get register => get('register');
  String get phoneNumber => get('phone_number');
  String get email => get('email');
  String get password => get('password');
  String get pin => get('pin');
  String get otp => get('otp');
  String get sendOtp => get('send_otp');
  String get verifyOtp => get('verify_otp');
  String get resendOtp => get('resend_otp');
  String get setPin => get('set_pin');
  String get confirmPin => get('confirm_pin');
  String get enterPin => get('enter_pin');
  String get forgotPin => get('forgot_pin');

  // ==================== WALLET ====================
  String get balance => get('balance');
  String get availableBalance => get('available_balance');
  String get pendingBalance => get('pending_balance');
  String get sendMoney => get('send_money');
  String get receiveMoney => get('receive_money');
  String get topUp => get('top_up');
  String get withdraw => get('withdraw');
  String get transactions => get('transactions');
  String get recentTransactions => get('recent_transactions');
  String get amount => get('amount');
  String get fee => get('fee');
  String get total => get('total');

  // ==================== MERCHANT ====================
  String get merchantId => get('merchant_id');
  String get businessName => get('business_name');
  String get acceptPayment => get('accept_payment');
  String get generateQr => get('generate_qr');
  String get scanToPay => get('scan_to_pay');
  String get requestWithdrawal => get('request_withdrawal');

  // ==================== SETTINGS ====================
  String get settings => get('settings');
  String get profile => get('profile');
  String get security => get('security');
  String get notifications => get('notifications');
  String get language => get('language');
  String get darkMode => get('dark_mode');
  String get biometric => get('biometric');
  String get changePin => get('change_pin');
  String get about => get('about');
  String get help => get('help');
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'ar'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

// ==================== ENGLISH STRINGS ====================
const Map<String, String> _englishStrings = {
  // Common
  'app_name': 'HealthPay',
  'ok': 'OK',
  'cancel': 'Cancel',
  'save': 'Save',
  'delete': 'Delete',
  'edit': 'Edit',
  'close': 'Close',
  'confirm': 'Confirm',
  'loading': 'Loading...',
  'error': 'Error',
  'success': 'Success',
  'retry': 'Retry',
  'next': 'Next',
  'back': 'Back',
  'done': 'Done',
  'search': 'Search',
  'filter': 'Filter',
  'no_data': 'No data available',

  // Auth
  'login': 'Login',
  'logout': 'Logout',
  'register': 'Register',
  'phone_number': 'Phone Number',
  'email': 'Email',
  'password': 'Password',
  'pin': 'PIN',
  'otp': 'OTP',
  'send_otp': 'Send OTP',
  'verify_otp': 'Verify OTP',
  'resend_otp': 'Resend Code',
  'set_pin': 'Set PIN',
  'confirm_pin': 'Confirm PIN',
  'enter_pin': 'Enter your PIN',
  'forgot_pin': 'Forgot PIN?',

  // Wallet
  'balance': 'Balance',
  'available_balance': 'Available Balance',
  'pending_balance': 'Pending Balance',
  'send_money': 'Send Money',
  'receive_money': 'Receive Money',
  'top_up': 'Top Up',
  'withdraw': 'Withdraw',
  'transactions': 'Transactions',
  'recent_transactions': 'Recent Transactions',
  'amount': 'Amount',
  'fee': 'Fee',
  'total': 'Total',

  // Merchant
  'merchant_id': 'Merchant ID',
  'business_name': 'Business Name',
  'accept_payment': 'Accept Payment',
  'generate_qr': 'Generate QR Code',
  'scan_to_pay': 'Scan to Pay',
  'request_withdrawal': 'Request Withdrawal',

  // Settings
  'settings': 'Settings',
  'profile': 'Profile',
  'security': 'Security',
  'notifications': 'Notifications',
  'language': 'Language',
  'dark_mode': 'Dark Mode',
  'biometric': 'Biometric Login',
  'change_pin': 'Change PIN',
  'about': 'About',
  'help': 'Help & Support',
};

// ==================== ARABIC STRINGS ====================
const Map<String, String> _arabicStrings = {
  // Common
  'app_name': 'هيلث باي',
  'ok': 'موافق',
  'cancel': 'إلغاء',
  'save': 'حفظ',
  'delete': 'حذف',
  'edit': 'تعديل',
  'close': 'إغلاق',
  'confirm': 'تأكيد',
  'loading': 'جاري التحميل...',
  'error': 'خطأ',
  'success': 'نجاح',
  'retry': 'إعادة المحاولة',
  'next': 'التالي',
  'back': 'رجوع',
  'done': 'تم',
  'search': 'بحث',
  'filter': 'تصفية',
  'no_data': 'لا توجد بيانات',

  // Auth
  'login': 'تسجيل الدخول',
  'logout': 'تسجيل الخروج',
  'register': 'تسجيل',
  'phone_number': 'رقم الهاتف',
  'email': 'البريد الإلكتروني',
  'password': 'كلمة المرور',
  'pin': 'الرقم السري',
  'otp': 'رمز التحقق',
  'send_otp': 'إرسال رمز التحقق',
  'verify_otp': 'تحقق من الرمز',
  'resend_otp': 'إعادة إرسال الرمز',
  'set_pin': 'تعيين الرقم السري',
  'confirm_pin': 'تأكيد الرقم السري',
  'enter_pin': 'أدخل الرقم السري',
  'forgot_pin': 'نسيت الرقم السري؟',

  // Wallet
  'balance': 'الرصيد',
  'available_balance': 'الرصيد المتاح',
  'pending_balance': 'الرصيد المعلق',
  'send_money': 'إرسال أموال',
  'receive_money': 'استلام أموال',
  'top_up': 'شحن الرصيد',
  'withdraw': 'سحب',
  'transactions': 'المعاملات',
  'recent_transactions': 'المعاملات الأخيرة',
  'amount': 'المبلغ',
  'fee': 'الرسوم',
  'total': 'الإجمالي',

  // Merchant
  'merchant_id': 'رقم التاجر',
  'business_name': 'اسم النشاط التجاري',
  'accept_payment': 'قبول الدفع',
  'generate_qr': 'إنشاء رمز QR',
  'scan_to_pay': 'امسح للدفع',
  'request_withdrawal': 'طلب سحب',

  // Settings
  'settings': 'الإعدادات',
  'profile': 'الملف الشخصي',
  'security': 'الأمان',
  'notifications': 'الإشعارات',
  'language': 'اللغة',
  'dark_mode': 'الوضع الداكن',
  'biometric': 'تسجيل الدخول بالبصمة',
  'change_pin': 'تغيير الرقم السري',
  'about': 'حول التطبيق',
  'help': 'المساعدة والدعم',
};

// Extension for easy access
extension LocalizationExtension on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
