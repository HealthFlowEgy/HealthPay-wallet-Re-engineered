import 'package:intl/intl.dart';

/// Formatters for displaying data
class Formatters {
  Formatters._();

  /// Format currency amount
  static String currency(double amount, {String locale = 'ar'}) {
    final formatter = NumberFormat.currency(
      locale: locale == 'ar' ? 'ar_EG' : 'en_EG',
      symbol: locale == 'ar' ? 'ج.م ' : 'EGP ',
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }

  /// Format currency without symbol
  static String amount(double amount, {String locale = 'ar'}) {
    final formatter = NumberFormat.decimalPattern(
      locale == 'ar' ? 'ar_EG' : 'en_EG',
    );
    return formatter.format(amount);
  }

  /// Format number with grouping
  static String number(num value, {String locale = 'ar'}) {
    final formatter = NumberFormat.decimalPattern(
      locale == 'ar' ? 'ar_EG' : 'en_EG',
    );
    return formatter.format(value);
  }

  /// Format phone number for display
  static String phone(String phone) {
    if (phone.length == 11) {
      return '${phone.substring(0, 3)} ${phone.substring(3, 7)} ${phone.substring(7)}';
    }
    return phone;
  }

  /// Mask phone number (show last 4 digits)
  static String maskedPhone(String phone) {
    if (phone.length < 4) return phone;
    final visible = phone.substring(phone.length - 4);
    return '******$visible';
  }

  /// Format date
  static String date(DateTime date, {String locale = 'ar'}) {
    final formatter = DateFormat.yMMMd(locale == 'ar' ? 'ar' : 'en');
    return formatter.format(date);
  }

  /// Format time
  static String time(DateTime date, {String locale = 'ar'}) {
    final formatter = DateFormat.jm(locale == 'ar' ? 'ar' : 'en');
    return formatter.format(date);
  }

  /// Format date and time
  static String dateTime(DateTime date, {String locale = 'ar'}) {
    final formatter = DateFormat.yMMMd(locale == 'ar' ? 'ar' : 'en');
    final timeFormatter = DateFormat.jm(locale == 'ar' ? 'ar' : 'en');
    return '${formatter.format(date)} ${timeFormatter.format(date)}';
  }

  /// Format relative time (e.g., "2 minutes ago")
  static String relativeTime(DateTime date, {String locale = 'ar'}) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inSeconds < 60) {
      return locale == 'ar' ? 'الآن' : 'Just now';
    } else if (diff.inMinutes < 60) {
      final minutes = diff.inMinutes;
      return locale == 'ar'
          ? 'منذ $minutes ${minutes == 1 ? 'دقيقة' : 'دقائق'}'
          : '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (diff.inHours < 24) {
      final hours = diff.inHours;
      return locale == 'ar'
          ? 'منذ $hours ${hours == 1 ? 'ساعة' : 'ساعات'}'
          : '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (diff.inDays < 7) {
      final days = diff.inDays;
      return locale == 'ar'
          ? 'منذ $days ${days == 1 ? 'يوم' : 'أيام'}'
          : '$days ${days == 1 ? 'day' : 'days'} ago';
    } else {
      return Formatters.date(date, locale: locale);
    }
  }

  /// Format card number (XXXX XXXX XXXX XXXX)
  static String cardNumber(String number) {
    final clean = number.replaceAll(RegExp(r'\s'), '');
    final buffer = StringBuffer();
    for (var i = 0; i < clean.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(clean[i]);
    }
    return buffer.toString();
  }

  /// Mask card number (XXXX **** **** XXXX)
  static String maskedCardNumber(String number) {
    final clean = number.replaceAll(RegExp(r'\s'), '');
    if (clean.length < 8) return clean;
    final first = clean.substring(0, 4);
    final last = clean.substring(clean.length - 4);
    return '$first **** **** $last';
  }

  /// Format transaction reference
  static String reference(String ref) {
    return ref.toUpperCase();
  }

  /// Format file size
  static String fileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  /// Format percentage
  static String percentage(double value, {int decimals = 0}) {
    return '${value.toStringAsFixed(decimals)}%';
  }

  /// Alias for currency formatting (for backward compatibility)
  static String formatCurrency(double amount, {String locale = 'ar'}) {
    return currency(amount, locale: locale);
  }

  /// Alias for dateTime formatting (for backward compatibility)
  static String formatDateTime(DateTime date, {String locale = 'ar'}) {
    return dateTime(date, locale: locale);
  }

  /// Alias for relativeTime formatting (for backward compatibility)
  static String formatRelativeTime(DateTime date, {String locale = 'ar'}) {
    return relativeTime(date, locale: locale);
  }
}
