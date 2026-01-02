import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;
  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  bool get isArabic => locale.languageCode == 'ar';

  String _get(String key) => _localizedValues[locale.languageCode]?[key] ?? _localizedValues['en']![key] ?? key;

  static final Map<String, Map<String, String>> _localizedValues = {
    'ar': {
      // Auth
      'login': 'تسجيل الدخول',
      'loginSubtitle': 'أدخل رقم هاتفك للمتابعة',
      'phoneNumber': 'رقم الهاتف',
      'sendOTP': 'إرسال رمز التحقق',
      'termsAgreement': 'بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية',
      'verifyPhone': 'التحقق من الرقم',
      'enterOTP': 'أدخل رمز التحقق المرسل إلى',
      'resendOTP': 'إعادة إرسال الرمز',
      'resendIn': 'إعادة الإرسال خلال',
      'seconds': 'ثانية',
      'verify': 'تحقق',
      'invalidPhone': 'رقم الهاتف غير صحيح',
      'invalidOTP': 'رمز التحقق غير صحيح',
      'otpExpired': 'انتهت صلاحية الرمز. يرجى طلب رمز جديد',
      'otpResent': 'تم إرسال رمز جديد',
      'tooManyAttempts': 'محاولات كثيرة. يرجى الانتظار قليلاً',
      'didntReceiveOTP': 'لم تستلم الرمز؟',
      'viaSMS': 'عبر رسالة نصية SMS',
      'changeNumber': 'تغيير الرقم',
      'sending': 'جاري الإرسال...',
      'checkPhoneNumber': 'تأكد من صحة رقم الهاتف',
      'checkSignal': 'تأكد من وجود إشارة شبكة جيدة',
      'waitFewMinutes': 'انتظر بضع دقائق، قد تتأخر الرسالة',
      'checkNotBlocked': 'تأكد من عدم حظر الرسائل من HealthPay',
      'devOTPHint': 'رمز التحقق للتجربة:',
      
      // PIN
      'setupPin': 'إنشاء رمز PIN',
      'setupPinSubtitle': 'أنشئ رمز PIN مكون من 4 أرقام لتأمين حسابك',
      'enterPin': 'أدخل رمز PIN',
      'confirmPin': 'تأكيد رمز PIN',
      'pinMismatch': 'رمز PIN غير متطابق',
      'invalidPin': 'رمز PIN غير صحيح',
      'pinSetSuccess': 'تم إنشاء رمز PIN بنجاح',
      'attemptsRemaining': 'محاولات متبقية',
      
      // Dashboard
      'home': 'الرئيسية',
      'goodMorning': 'صباح الخير',
      'goodAfternoon': 'مساء الخير',
      'goodEvening': 'مساء الخير',
      'availableBalance': 'الرصيد المتاح',
      'pendingBalance': 'رصيد معلق',
      'dailyLimit': 'الحد اليومي',
      'quickActions': 'الإجراءات السريعة',
      'transfer': 'تحويل',
      'topUp': 'شحن',
      'bills': 'فواتير',
      'qrScan': 'مسح QR',
      'recentTransactions': 'آخر المعاملات',
      'viewAll': 'عرض الكل',
      'noTransactions': 'لا توجد معاملات بعد',
      
      // Transfer
      'transferMoney': 'تحويل أموال',
      'recipient': 'المستلم',
      'enterRecipientPhone': 'أدخل رقم هاتف المستلم',
      'recipientFound': 'تم العثور على المستلم',
      'recipientNotFound': 'لم يتم العثور على المستلم',
      'amount': 'المبلغ',
      'enterAmount': 'أدخل المبلغ',
      'minAmount': 'الحد الأدنى',
      'maxAmount': 'الحد الأقصى',
      'note': 'ملاحظة',
      'addNote': 'أضف ملاحظة للمستلم',
      'optional': 'اختياري',
      'continue_': 'متابعة',
      'reviewTransfer': 'مراجعة التحويل',
      'transferFee': 'رسوم التحويل',
      'free': 'مجاني',
      'total': 'الإجمالي',
      'confirmTransfer': 'تأكيد التحويل',
      'transferSuccess': 'تم التحويل بنجاح!',
      'referenceNumber': 'رقم المرجع',
      'done': 'تم',
      'insufficientBalance': 'رصيد غير كافٍ',
      
      // Top Up
      'topUpWallet': 'شحن المحفظة',
      'selectAmount': 'اختر المبلغ',
      'customAmount': 'مبلغ مخصص',
      'selectMethod': 'اختر طريقة الدفع',
      'bankCard': 'بطاقة بنكية',
      'fawry': 'فوري',
      'vodafoneCash': 'فودافون كاش',
      'instaPay': 'إنستاباي',
      'topUpSuccess': 'تم الشحن بنجاح!',
      'newBalance': 'الرصيد الجديد',
      
      // Bills
      'billPayments': 'دفع الفواتير',
      'selectCategory': 'اختر الفئة',
      'electricity': 'كهرباء',
      'water': 'مياه',
      'gas': 'غاز',
      'internet': 'إنترنت',
      'mobile': 'موبايل',
      'landline': 'هاتف أرضي',
      'subscriptions': 'اشتراكات',
      'government': 'خدمات حكومية',
      'donations': 'تبرعات',
      'selectProvider': 'اختر مقدم الخدمة',
      'accountNumber': 'رقم الحساب',
      'enterAccountNumber': 'أدخل رقم الحساب',
      'inquire': 'استعلام',
      'billDetails': 'تفاصيل الفاتورة',
      'subscriberName': 'اسم المشترك',
      'billAmount': 'قيمة الفاتورة',
      'dueDate': 'تاريخ الاستحقاق',
      'period': 'الفترة',
      'payBill': 'دفع الفاتورة',
      'billPaid': 'تم دفع الفاتورة بنجاح!',
      
      // Transactions
      'transactions': 'المعاملات',
      'history': 'السجل',
      'all': 'الكل',
      'incoming': 'وارد',
      'outgoing': 'صادر',
      'filterByDate': 'تصفية حسب التاريخ',
      'filterByType': 'تصفية حسب النوع',
      'transactionDetails': 'تفاصيل المعاملة',
      'type': 'النوع',
      'status': 'الحالة',
      'date': 'التاريخ',
      'completed': 'مكتمل',
      'pending': 'قيد الانتظار',
      'failed': 'فشل',
      'cancelled': 'ملغي',
      
      // Medical Card
      'medicalCard': 'البطاقة الطبية',
      'card': 'البطاقة',
      'cardNumber': 'رقم البطاقة',
      'cardBalance': 'رصيد البطاقة',
      'cardLimit': 'الحد اليومي',
      'cardStatus': 'حالة البطاقة',
      'active': 'نشط',
      'inactive': 'غير نشط',
      'suspended': 'معلق',
      'expired': 'منتهي',
      'expiryDate': 'تاريخ الانتهاء',
      'beneficiaries': 'المستفيدون',
      'addBeneficiary': 'إضافة مستفيد',
      
      // Profile
      'profile': 'الملف الشخصي',
      'personalInfo': 'المعلومات الشخصية',
      'fullName': 'الاسم الكامل',
      'email': 'البريد الإلكتروني',
      'editProfile': 'تعديل الملف الشخصي',
      'saveChanges': 'حفظ التغييرات',
      'profileUpdated': 'تم تحديث الملف الشخصي',
      
      // Settings
      'settings': 'الإعدادات',
      'changePin': 'تغيير رمز PIN',
      'biometricLogin': 'الدخول بالبصمة',
      'language': 'اللغة',
      'arabic': 'العربية',
      'english': 'English',
      'notifications': 'الإشعارات',
      'help': 'المساعدة',
      'privacyPolicy': 'سياسة الخصوصية',
      'termsOfService': 'شروط الخدمة',
      'logout': 'تسجيل الخروج',
      'deleteAccount': 'حذف الحساب',
      'logoutConfirm': 'هل أنت متأكد من تسجيل الخروج؟',
      'deleteConfirm': 'هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه.',
      'yes': 'نعم',
      'no': 'لا',
      'cancel': 'إلغاء',
      
      // Notifications
      'noNotifications': 'لا توجد إشعارات',
      'markAllRead': 'تحديد الكل كمقروء',
      
      // Errors
      'error': 'خطأ',
      'networkError': 'خطأ في الاتصال',
      'serverError': 'خطأ في الخادم',
      'tryAgain': 'حاول مرة أخرى',
      'somethingWrong': 'حدث خطأ ما',
      
      // General
      'egp': 'ج.م',
      'version': 'الإصدار',
      'loading': 'جاري التحميل...',
      'noData': 'لا توجد بيانات',
      'search': 'بحث',
      'close': 'إغلاق',
      'back': 'رجوع',
      'next': 'التالي',
      'confirm': 'تأكيد',
      'save': 'حفظ',
      'edit': 'تعديل',
      'delete': 'حذف',
      'share': 'مشاركة',
      'copy': 'نسخ',
      'copied': 'تم النسخ',
    },
    'en': {
      // Auth
      'login': 'Login',
      'loginSubtitle': 'Enter your phone number to continue',
      'phoneNumber': 'Phone Number',
      'sendOTP': 'Send Verification Code',
      'termsAgreement': 'By continuing, you agree to the Terms of Service and Privacy Policy',
      'verifyPhone': 'Verify Phone',
      'enterOTP': 'Enter the verification code sent to',
      'resendOTP': 'Resend Code',
      'resendIn': 'Resend in',
      'seconds': 'seconds',
      'verify': 'Verify',
      'invalidPhone': 'Invalid phone number',
      'invalidOTP': 'Invalid verification code',
      'otpExpired': 'Code expired. Please request a new one',
      'otpResent': 'New code sent',
      'tooManyAttempts': 'Too many attempts. Please wait a moment',
      'didntReceiveOTP': "Didn't receive the code?",
      'viaSMS': 'via SMS',
      'changeNumber': 'Change',
      'sending': 'Sending...',
      'checkPhoneNumber': 'Make sure your phone number is correct',
      'checkSignal': 'Make sure you have good network signal',
      'waitFewMinutes': 'Wait a few minutes, the message may be delayed',
      'checkNotBlocked': 'Make sure HealthPay messages are not blocked',
      'devOTPHint': 'Test verification code:',
      
      // PIN
      'setupPin': 'Set Up PIN',
      'setupPinSubtitle': 'Create a 4-digit PIN to secure your account',
      'enterPin': 'Enter PIN',
      'confirmPin': 'Confirm PIN',
      'pinMismatch': 'PIN does not match',
      'invalidPin': 'Invalid PIN',
      'pinSetSuccess': 'PIN set successfully',
      'attemptsRemaining': 'attempts remaining',
      
      // Dashboard
      'home': 'Home',
      'goodMorning': 'Good Morning',
      'goodAfternoon': 'Good Afternoon',
      'goodEvening': 'Good Evening',
      'availableBalance': 'Available Balance',
      'pendingBalance': 'Pending Balance',
      'dailyLimit': 'Daily Limit',
      'quickActions': 'Quick Actions',
      'transfer': 'Transfer',
      'topUp': 'Top Up',
      'bills': 'Bills',
      'qrScan': 'QR Scan',
      'recentTransactions': 'Recent Transactions',
      'viewAll': 'View All',
      'noTransactions': 'No transactions yet',
      
      // Transfer
      'transferMoney': 'Transfer Money',
      'recipient': 'Recipient',
      'enterRecipientPhone': 'Enter recipient phone number',
      'recipientFound': 'Recipient found',
      'recipientNotFound': 'Recipient not found',
      'amount': 'Amount',
      'enterAmount': 'Enter amount',
      'minAmount': 'Minimum',
      'maxAmount': 'Maximum',
      'note': 'Note',
      'addNote': 'Add a note for the recipient',
      'optional': 'Optional',
      'continue_': 'Continue',
      'reviewTransfer': 'Review Transfer',
      'transferFee': 'Transfer Fee',
      'free': 'Free',
      'total': 'Total',
      'confirmTransfer': 'Confirm Transfer',
      'transferSuccess': 'Transfer Successful!',
      'referenceNumber': 'Reference Number',
      'done': 'Done',
      'insufficientBalance': 'Insufficient balance',
      
      // Top Up
      'topUpWallet': 'Top Up Wallet',
      'selectAmount': 'Select Amount',
      'customAmount': 'Custom Amount',
      'selectMethod': 'Select Payment Method',
      'bankCard': 'Bank Card',
      'fawry': 'Fawry',
      'vodafoneCash': 'Vodafone Cash',
      'instaPay': 'InstaPay',
      'topUpSuccess': 'Top Up Successful!',
      'newBalance': 'New Balance',
      
      // Bills
      'billPayments': 'Bill Payments',
      'selectCategory': 'Select Category',
      'electricity': 'Electricity',
      'water': 'Water',
      'gas': 'Gas',
      'internet': 'Internet',
      'mobile': 'Mobile',
      'landline': 'Landline',
      'subscriptions': 'Subscriptions',
      'government': 'Government Services',
      'donations': 'Donations',
      'selectProvider': 'Select Provider',
      'accountNumber': 'Account Number',
      'enterAccountNumber': 'Enter account number',
      'inquire': 'Inquire',
      'billDetails': 'Bill Details',
      'subscriberName': 'Subscriber Name',
      'billAmount': 'Bill Amount',
      'dueDate': 'Due Date',
      'period': 'Period',
      'payBill': 'Pay Bill',
      'billPaid': 'Bill paid successfully!',
      
      // Transactions
      'transactions': 'Transactions',
      'history': 'History',
      'all': 'All',
      'incoming': 'Incoming',
      'outgoing': 'Outgoing',
      'filterByDate': 'Filter by date',
      'filterByType': 'Filter by type',
      'transactionDetails': 'Transaction Details',
      'type': 'Type',
      'status': 'Status',
      'date': 'Date',
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed',
      'cancelled': 'Cancelled',
      
      // Medical Card
      'medicalCard': 'Medical Card',
      'card': 'Card',
      'cardNumber': 'Card Number',
      'cardBalance': 'Card Balance',
      'cardLimit': 'Daily Limit',
      'cardStatus': 'Card Status',
      'active': 'Active',
      'inactive': 'Inactive',
      'suspended': 'Suspended',
      'expired': 'Expired',
      'expiryDate': 'Expiry Date',
      'beneficiaries': 'Beneficiaries',
      'addBeneficiary': 'Add Beneficiary',
      
      // Profile
      'profile': 'Profile',
      'personalInfo': 'Personal Information',
      'fullName': 'Full Name',
      'email': 'Email',
      'editProfile': 'Edit Profile',
      'saveChanges': 'Save Changes',
      'profileUpdated': 'Profile updated',
      
      // Settings
      'settings': 'Settings',
      'changePin': 'Change PIN',
      'biometricLogin': 'Biometric Login',
      'language': 'Language',
      'arabic': 'العربية',
      'english': 'English',
      'notifications': 'Notifications',
      'help': 'Help',
      'privacyPolicy': 'Privacy Policy',
      'termsOfService': 'Terms of Service',
      'logout': 'Logout',
      'deleteAccount': 'Delete Account',
      'logoutConfirm': 'Are you sure you want to logout?',
      'deleteConfirm': 'Are you sure you want to delete your account? This action cannot be undone.',
      'yes': 'Yes',
      'no': 'No',
      'cancel': 'Cancel',
      
      // Notifications
      'noNotifications': 'No notifications',
      'markAllRead': 'Mark all as read',
      
      // Errors
      'error': 'Error',
      'networkError': 'Network error',
      'serverError': 'Server error',
      'tryAgain': 'Try again',
      'somethingWrong': 'Something went wrong',
      
      // General
      'egp': 'EGP',
      'version': 'Version',
      'loading': 'Loading...',
      'noData': 'No data',
      'search': 'Search',
      'close': 'Close',
      'back': 'Back',
      'next': 'Next',
      'confirm': 'Confirm',
      'save': 'Save',
      'edit': 'Edit',
      'delete': 'Delete',
      'share': 'Share',
      'copy': 'Copy',
      'copied': 'Copied',
    },
  };

  // Auth
  String get login => _get('login');
  String get loginSubtitle => _get('loginSubtitle');
  String get phoneNumber => _get('phoneNumber');
  String get sendOTP => _get('sendOTP');
  String get termsAgreement => _get('termsAgreement');
  String get verifyPhone => _get('verifyPhone');
  String get enterOTP => _get('enterOTP');
  String get resendOTP => _get('resendOTP');
  String get resendIn => _get('resendIn');
  String get seconds => _get('seconds');
  String get verify => _get('verify');
  String get invalidPhone => _get('invalidPhone');
  String get invalidOTP => _get('invalidOTP');
  String get otpExpired => _get('otpExpired');
  String get otpResent => _get('otpResent');
  String get tooManyAttempts => _get('tooManyAttempts');
  String get didntReceiveOTP => _get('didntReceiveOTP');
  String get viaSMS => _get('viaSMS');
  String get changeNumber => _get('changeNumber');
  String get sending => _get('sending');
  String get checkPhoneNumber => _get('checkPhoneNumber');
  String get checkSignal => _get('checkSignal');
  String get waitFewMinutes => _get('waitFewMinutes');
  String get checkNotBlocked => _get('checkNotBlocked');
  String get devOTPHint => _get('devOTPHint');
  
  // PIN
  String get setupPin => _get('setupPin');
  String get setupPinSubtitle => _get('setupPinSubtitle');
  String get enterPin => _get('enterPin');
  String get confirmPin => _get('confirmPin');
  String get pinMismatch => _get('pinMismatch');
  String get invalidPin => _get('invalidPin');
  String get pinSetSuccess => _get('pinSetSuccess');
  String get attemptsRemaining => _get('attemptsRemaining');
  
  // Dashboard
  String get home => _get('home');
  String get goodMorning => _get('goodMorning');
  String get goodAfternoon => _get('goodAfternoon');
  String get goodEvening => _get('goodEvening');
  String get availableBalance => _get('availableBalance');
  String get pendingBalance => _get('pendingBalance');
  String get dailyLimit => _get('dailyLimit');
  String get quickActions => _get('quickActions');
  String get transfer => _get('transfer');
  String get topUp => _get('topUp');
  String get bills => _get('bills');
  String get qrScan => _get('qrScan');
  String get recentTransactions => _get('recentTransactions');
  String get viewAll => _get('viewAll');
  String get noTransactions => _get('noTransactions');
  
  // Transfer
  String get transferMoney => _get('transferMoney');
  String get recipient => _get('recipient');
  String get enterRecipientPhone => _get('enterRecipientPhone');
  String get recipientFound => _get('recipientFound');
  String get recipientNotFound => _get('recipientNotFound');
  String get amount => _get('amount');
  String get enterAmount => _get('enterAmount');
  String get minAmount => _get('minAmount');
  String get maxAmount => _get('maxAmount');
  String get note => _get('note');
  String get addNote => _get('addNote');
  String get optional => _get('optional');
  String get continueText => _get('continue_');
  String get reviewTransfer => _get('reviewTransfer');
  String get transferFee => _get('transferFee');
  String get free => _get('free');
  String get total => _get('total');
  String get confirmTransfer => _get('confirmTransfer');
  String get transferSuccess => _get('transferSuccess');
  String get referenceNumber => _get('referenceNumber');
  String get done => _get('done');
  String get insufficientBalance => _get('insufficientBalance');
  
  // Top Up
  String get topUpWallet => _get('topUpWallet');
  String get selectAmount => _get('selectAmount');
  String get customAmount => _get('customAmount');
  String get selectMethod => _get('selectMethod');
  String get bankCard => _get('bankCard');
  String get fawry => _get('fawry');
  String get vodafoneCash => _get('vodafoneCash');
  String get instaPay => _get('instaPay');
  String get topUpSuccess => _get('topUpSuccess');
  String get newBalance => _get('newBalance');
  
  // Bills
  String get billPayments => _get('billPayments');
  String get selectCategory => _get('selectCategory');
  String get electricity => _get('electricity');
  String get water => _get('water');
  String get gas => _get('gas');
  String get internet => _get('internet');
  String get mobile => _get('mobile');
  String get landline => _get('landline');
  String get subscriptions => _get('subscriptions');
  String get government => _get('government');
  String get donations => _get('donations');
  String get selectProvider => _get('selectProvider');
  String get accountNumber => _get('accountNumber');
  String get enterAccountNumber => _get('enterAccountNumber');
  String get inquire => _get('inquire');
  String get billDetails => _get('billDetails');
  String get subscriberName => _get('subscriberName');
  String get billAmount => _get('billAmount');
  String get dueDate => _get('dueDate');
  String get period => _get('period');
  String get payBill => _get('payBill');
  String get billPaid => _get('billPaid');
  
  // Transactions
  String get transactions => _get('transactions');
  String get history => _get('history');
  String get all => _get('all');
  String get incoming => _get('incoming');
  String get outgoing => _get('outgoing');
  String get filterByDate => _get('filterByDate');
  String get filterByType => _get('filterByType');
  String get transactionDetails => _get('transactionDetails');
  String get type => _get('type');
  String get status => _get('status');
  String get date => _get('date');
  String get completed => _get('completed');
  String get pending => _get('pending');
  String get failed => _get('failed');
  String get cancelled => _get('cancelled');
  
  // Medical Card
  String get medicalCard => _get('medicalCard');
  String get card => _get('card');
  String get cardNumber => _get('cardNumber');
  String get cardBalance => _get('cardBalance');
  String get cardLimit => _get('cardLimit');
  String get cardStatus => _get('cardStatus');
  String get active => _get('active');
  String get inactive => _get('inactive');
  String get suspended => _get('suspended');
  String get expired => _get('expired');
  String get expiryDate => _get('expiryDate');
  String get beneficiaries => _get('beneficiaries');
  String get addBeneficiary => _get('addBeneficiary');
  
  // Profile
  String get profile => _get('profile');
  String get personalInfo => _get('personalInfo');
  String get fullName => _get('fullName');
  String get email => _get('email');
  String get editProfile => _get('editProfile');
  String get saveChanges => _get('saveChanges');
  String get profileUpdated => _get('profileUpdated');
  
  // Settings
  String get settings => _get('settings');
  String get changePin => _get('changePin');
  String get biometricLogin => _get('biometricLogin');
  String get language => _get('language');
  String get arabic => _get('arabic');
  String get english => _get('english');
  String get notifications => _get('notifications');
  String get help => _get('help');
  String get privacyPolicy => _get('privacyPolicy');
  String get termsOfService => _get('termsOfService');
  String get logout => _get('logout');
  String get deleteAccount => _get('deleteAccount');
  String get logoutConfirm => _get('logoutConfirm');
  String get deleteConfirm => _get('deleteConfirm');
  String get yes => _get('yes');
  String get no => _get('no');
  String get cancel => _get('cancel');
  
  // Notifications
  String get noNotifications => _get('noNotifications');
  String get markAllRead => _get('markAllRead');
  
  // Errors
  String get error => _get('error');
  String get networkError => _get('networkError');
  String get serverError => _get('serverError');
  String get tryAgain => _get('tryAgain');
  String get somethingWrong => _get('somethingWrong');
  
  // General
  String get egp => _get('egp');
  String get version => _get('version');
  String get loading => _get('loading');
  String get noData => _get('noData');
  String get search => _get('search');
  String get close => _get('close');
  String get back => _get('back');
  String get next => _get('next');
  String get confirm => _get('confirm');
  String get save => _get('save');
  String get edit => _get('edit');
  String get delete => _get('delete');
  String get share => _get('share');
  String get copy => _get('copy');
  String get copied => _get('copied');
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['ar', 'en'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
