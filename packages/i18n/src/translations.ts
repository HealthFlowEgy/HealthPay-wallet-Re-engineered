export const locales = ['ar', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ar'

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English'
}

export const translations = {
  ar: {
    // Common
    common: {
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      success: 'تم بنجاح',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'عرض',
      search: 'بحث',
      filter: 'تصفية',
      export: 'تصدير',
      import: 'استيراد',
      download: 'تحميل',
      upload: 'رفع',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      submit: 'إرسال',
      refresh: 'تحديث',
      close: 'إغلاق',
      yes: 'نعم',
      no: 'لا',
      optional: 'اختياري',
      required: 'مطلوب',
      all: 'الكل',
      none: 'لا شيء',
      other: 'أخرى'
    },

    // Navigation
    nav: {
      dashboard: 'لوحة التحكم',
      wallet: 'المحفظة',
      transactions: 'المعاملات',
      payments: 'المدفوعات',
      medcard: 'البطاقة الطبية',
      settings: 'الإعدادات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      admin: 'الإدارة',
      merchants: 'التجار',
      users: 'المستخدمين',
      reports: 'التقارير',
      analytics: 'التحليلات'
    },

    // Authentication
    auth: {
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      resetPassword: 'إعادة تعيين كلمة المرور',
      phone: 'رقم الهاتف',
      otp: 'رمز التحقق',
      sendOTP: 'إرسال رمز التحقق',
      verifyOTP: 'تأكيد الرمز',
      resendOTP: 'إعادة إرسال الرمز',
      fullName: 'الاسم الكامل',
      nationalId: 'الرقم القومي',
      termsAccept: 'أوافق على الشروط والأحكام',
      privacyAccept: 'أوافق على سياسة الخصوصية'
    },

    // Wallet
    wallet: {
      balance: 'الرصيد',
      availableBalance: 'الرصيد المتاح',
      totalBalance: 'إجمالي الرصيد',
      currency: 'العملة',
      topUp: 'شحن المحفظة',
      withdraw: 'سحب',
      send: 'إرسال',
      request: 'طلب',
      recent: 'المعاملات الأخيرة',
      history: 'السجل',
      details: 'التفاصيل',
      walletId: 'رقم المحفظة',
      created: 'تاريخ الإنشاء',
      status: 'الحالة',
      active: 'نشط',
      suspended: 'معلق',
      closed: 'مغلق'
    },

    // Transactions
    transactions: {
      transaction: 'معاملة',
      transactions: 'المعاملات',
      txnId: 'رقم المعاملة',
      type: 'النوع',
      amount: 'المبلغ',
      fee: 'الرسوم',
      total: 'الإجمالي',
      status: 'الحالة',
      date: 'التاريخ',
      time: 'الوقت',
      from: 'من',
      to: 'إلى',
      description: 'الوصف',
      reference: 'المرجع',
      receipt: 'الإيصال',
      pending: 'قيد المعالجة',
      completed: 'مكتمل',
      failed: 'فشل',
      cancelled: 'ملغي',
      refunded: 'مسترجع',
      credit: 'إيداع',
      debit: 'سحب',
      transfer: 'تحويل',
      payment: 'دفع',
      refund: 'استرجاع',
      topup: 'شحن',
      withdrawal: 'سحب'
    },

    // Payments
    payments: {
      payment: 'دفعة',
      payments: 'المدفوعات',
      paymentId: 'رقم الدفعة',
      merchant: 'التاجر',
      gateway: 'بوابة الدفع',
      method: 'طريقة الدفع',
      card: 'بطاقة',
      wallet: 'محفظة',
      cash: 'نقدي',
      bankTransfer: 'تحويل بنكي',
      fawry: 'فوري',
      paymob: 'بايموب',
      vodafoneCash: 'فودافون كاش',
      success: 'ناجح',
      failed: 'فشل',
      pending: 'قيد الانتظار'
    },

    // MedCard
    medcard: {
      medcard: 'البطاقة الطبية',
      cardNumber: 'رقم البطاقة',
      holder: 'حامل البطاقة',
      validUntil: 'صالحة حتى',
      coverage: 'التغطية',
      limit: 'الحد الأقصى',
      used: 'المستخدم',
      remaining: 'المتبقي',
      activate: 'تفعيل',
      deactivate: 'إيقاف',
      renew: 'تجديد'
    },

    // Dashboard
    dashboard: {
      welcome: 'مرحباً',
      overview: 'نظرة عامة',
      quickActions: 'إجراءات سريعة',
      recentActivity: 'النشاط الأخير',
      statistics: 'الإحصائيات',
      today: 'اليوم',
      thisWeek: 'هذا الأسبوع',
      thisMonth: 'هذا الشهر',
      thisYear: 'هذا العام',
      totalTransactions: 'إجمالي المعاملات',
      totalAmount: 'إجمالي المبلغ',
      successRate: 'معدل النجاح',
      avgAmount: 'متوسط المبلغ'
    },

    // Errors
    errors: {
      generic: 'حدث خطأ غير متوقع',
      network: 'خطأ في الاتصال بالشبكة',
      timeout: 'انتهت مهلة الطلب',
      unauthorized: 'غير مصرح',
      forbidden: 'محظور',
      notFound: 'غير موجود',
      validation: 'خطأ في التحقق من البيانات',
      insufficientBalance: 'الرصيد غير كافٍ',
      invalidOTP: 'رمز التحقق غير صحيح',
      expiredOTP: 'انتهت صلاحية رمز التحقق',
      invalidPhone: 'رقم الهاتف غير صحيح',
      invalidNationalId: 'الرقم القومي غير صحيح',
      duplicateAccount: 'الحساب موجود مسبقاً',
      accountSuspended: 'الحساب معلق',
      accountClosed: 'الحساب مغلق',
      transactionFailed: 'فشلت المعاملة',
      paymentFailed: 'فشلت عملية الدفع',
      cardExpired: 'انتهت صلاحية البطاقة',
      cardInactive: 'البطاقة غير نشطة',
      limitExceeded: 'تم تجاوز الحد المسموح'
    },

    // Success messages
    success: {
      transactionComplete: 'تمت المعاملة بنجاح',
      paymentComplete: 'تمت عملية الدفع بنجاح',
      walletTopUp: 'تم شحن المحفظة بنجاح',
      profileUpdated: 'تم تحديث الملف الشخصي',
      settingsSaved: 'تم حفظ الإعدادات',
      otpSent: 'تم إرسال رمز التحقق',
      passwordReset: 'تم إعادة تعيين كلمة المرور',
      cardActivated: 'تم تفعيل البطاقة',
      cardDeactivated: 'تم إيقاف البطاقة'
    }
  },

  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      refresh: 'Refresh',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      optional: 'Optional',
      required: 'Required',
      all: 'All',
      none: 'None',
      other: 'Other'
    },

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      wallet: 'Wallet',
      transactions: 'Transactions',
      payments: 'Payments',
      medcard: 'MedCard',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      admin: 'Admin',
      merchants: 'Merchants',
      users: 'Users',
      reports: 'Reports',
      analytics: 'Analytics'
    },

    // Authentication
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      phone: 'Phone Number',
      otp: 'Verification Code',
      sendOTP: 'Send OTP',
      verifyOTP: 'Verify OTP',
      resendOTP: 'Resend OTP',
      fullName: 'Full Name',
      nationalId: 'National ID',
      termsAccept: 'I agree to the Terms & Conditions',
      privacyAccept: 'I agree to the Privacy Policy'
    },

    // Wallet
    wallet: {
      balance: 'Balance',
      availableBalance: 'Available Balance',
      totalBalance: 'Total Balance',
      currency: 'Currency',
      topUp: 'Top Up',
      withdraw: 'Withdraw',
      send: 'Send',
      request: 'Request',
      recent: 'Recent Transactions',
      history: 'History',
      details: 'Details',
      walletId: 'Wallet ID',
      created: 'Created',
      status: 'Status',
      active: 'Active',
      suspended: 'Suspended',
      closed: 'Closed'
    },

    // Transactions
    transactions: {
      transaction: 'Transaction',
      transactions: 'Transactions',
      txnId: 'Transaction ID',
      type: 'Type',
      amount: 'Amount',
      fee: 'Fee',
      total: 'Total',
      status: 'Status',
      date: 'Date',
      time: 'Time',
      from: 'From',
      to: 'To',
      description: 'Description',
      reference: 'Reference',
      receipt: 'Receipt',
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      credit: 'Credit',
      debit: 'Debit',
      transfer: 'Transfer',
      payment: 'Payment',
      refund: 'Refund',
      topup: 'Top-up',
      withdrawal: 'Withdrawal'
    },

    // Payments
    payments: {
      payment: 'Payment',
      payments: 'Payments',
      paymentId: 'Payment ID',
      merchant: 'Merchant',
      gateway: 'Gateway',
      method: 'Method',
      card: 'Card',
      wallet: 'Wallet',
      cash: 'Cash',
      bankTransfer: 'Bank Transfer',
      fawry: 'Fawry',
      paymob: 'Paymob',
      vodafoneCash: 'Vodafone Cash',
      success: 'Success',
      failed: 'Failed',
      pending: 'Pending'
    },

    // MedCard
    medcard: {
      medcard: 'MedCard',
      cardNumber: 'Card Number',
      holder: 'Card Holder',
      validUntil: 'Valid Until',
      coverage: 'Coverage',
      limit: 'Limit',
      used: 'Used',
      remaining: 'Remaining',
      activate: 'Activate',
      deactivate: 'Deactivate',
      renew: 'Renew'
    },

    // Dashboard
    dashboard: {
      welcome: 'Welcome',
      overview: 'Overview',
      quickActions: 'Quick Actions',
      recentActivity: 'Recent Activity',
      statistics: 'Statistics',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
      totalTransactions: 'Total Transactions',
      totalAmount: 'Total Amount',
      successRate: 'Success Rate',
      avgAmount: 'Average Amount'
    },

    // Errors
    errors: {
      generic: 'An unexpected error occurred',
      network: 'Network connection error',
      timeout: 'Request timeout',
      unauthorized: 'Unauthorized',
      forbidden: 'Forbidden',
      notFound: 'Not Found',
      validation: 'Validation error',
      insufficientBalance: 'Insufficient balance',
      invalidOTP: 'Invalid OTP',
      expiredOTP: 'OTP expired',
      invalidPhone: 'Invalid phone number',
      invalidNationalId: 'Invalid national ID',
      duplicateAccount: 'Account already exists',
      accountSuspended: 'Account suspended',
      accountClosed: 'Account closed',
      transactionFailed: 'Transaction failed',
      paymentFailed: 'Payment failed',
      cardExpired: 'Card expired',
      cardInactive: 'Card inactive',
      limitExceeded: 'Limit exceeded'
    },

    // Success messages
    success: {
      transactionComplete: 'Transaction completed successfully',
      paymentComplete: 'Payment completed successfully',
      walletTopUp: 'Wallet topped up successfully',
      profileUpdated: 'Profile updated',
      settingsSaved: 'Settings saved',
      otpSent: 'OTP sent',
      passwordReset: 'Password reset successful',
      cardActivated: 'Card activated',
      cardDeactivated: 'Card deactivated'
    }
  }
}

export type TranslationKey = keyof typeof translations.ar
export type Translation = typeof translations.ar

export function getTranslation(locale: Locale): Translation {
  return translations[locale]
}
