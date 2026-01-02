import 'package:healthpay/core/constants/app_constants.dart';

/// Input Validators
class Validators {
  Validators._();

  /// Validate Egyptian phone number
  /// Formats: 01XXXXXXXXX (11 digits) or 1XXXXXXXXX (10 digits)
  static bool isValidPhoneNumber(String phone) {
    final cleanPhone = phone.replaceAll(RegExp(r'\s'), '');
    // Remove country code if present
    String number = cleanPhone;
    if (number.startsWith('+20')) {
      number = number.substring(3);
    } else if (number.startsWith('20')) {
      number = number.substring(2);
    }
    // Add leading 0 if not present
    if (number.startsWith('1') && number.length == 10) {
      number = '0$number';
    }
    // Validate Egyptian mobile format: 01[0125]XXXXXXXX
    return RegExp(r'^01[0125]\d{8}$').hasMatch(number);
  }

  /// Normalize phone number to standard format
  static String normalizePhoneNumber(String phone) {
    String number = phone.replaceAll(RegExp(r'\s'), '');
    if (number.startsWith('+20')) {
      number = number.substring(3);
    } else if (number.startsWith('20')) {
      number = number.substring(2);
    }
    if (number.startsWith('1') && number.length == 10) {
      number = '0$number';
    }
    return number;
  }

  /// Validate OTP
  static bool isValidOTP(String otp) {
    return otp.length == AppConstants.otpLength &&
        RegExp(r'^\d+$').hasMatch(otp);
  }

  /// Validate PIN
  static bool isValidPIN(String pin) {
    return pin.length == AppConstants.pinLength &&
        RegExp(r'^\d+$').hasMatch(pin);
  }

  /// Validate email
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  /// Validate amount
  static bool isValidAmount(double amount, {double? min, double? max}) {
    if (amount <= 0) return false;
    if (min != null && amount < min) return false;
    if (max != null && amount > max) return false;
    return true;
  }

  /// Validate transfer amount
  static bool isValidTransferAmount(double amount) {
    return isValidAmount(
      amount,
      min: AppConstants.minTransferAmount,
      max: AppConstants.maxTransferAmount,
    );
  }

  /// Validate top-up amount
  static bool isValidTopupAmount(double amount) {
    return isValidAmount(
      amount,
      min: AppConstants.minTopupAmount,
      max: AppConstants.maxTopupAmount,
    );
  }

  /// Validate name
  static bool isValidName(String name) {
    return name.trim().length >= 2;
  }

  /// Validate national ID (Egyptian format: 14 digits)
  static bool isValidNationalId(String id) {
    return id.length == 14 && RegExp(r'^\d{14}$').hasMatch(id);
  }

  /// Get phone validation error message
  static String? phoneValidationError(String phone, String locale) {
    if (phone.isEmpty) {
      return locale == 'ar'
          ? 'الرجاء إدخال رقم الهاتف'
          : 'Please enter phone number';
    }
    if (!isValidPhoneNumber(phone)) {
      return locale == 'ar'
          ? 'رقم الهاتف غير صحيح'
          : 'Invalid phone number';
    }
    return null;
  }

  /// Get OTP validation error message
  static String? otpValidationError(String otp, String locale) {
    if (otp.isEmpty) {
      return locale == 'ar'
          ? 'الرجاء إدخال رمز التحقق'
          : 'Please enter verification code';
    }
    if (!isValidOTP(otp)) {
      return locale == 'ar'
          ? 'رمز التحقق غير صحيح'
          : 'Invalid verification code';
    }
    return null;
  }

  /// Get PIN validation error message
  static String? pinValidationError(String pin, String locale) {
    if (pin.isEmpty) {
      return locale == 'ar' ? 'الرجاء إدخال رمز PIN' : 'Please enter PIN';
    }
    if (!isValidPIN(pin)) {
      return locale == 'ar'
          ? 'رمز PIN يجب أن يكون 4 أرقام'
          : 'PIN must be 4 digits';
    }
    return null;
  }
}
