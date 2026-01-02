import 'dart:math';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:healthpay/l10n/app_localizations.dart';

/// Helper Utilities
class Helpers {
  Helpers._();

  /// Generate random reference number
  static String generateReference({int length = 12}) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random.secure();
    return List.generate(length, (_) => chars[random.nextInt(chars.length)])
        .join();
  }

  /// Hash PIN using SHA256
  static String hashPin(String pin) {
    final bytes = utf8.encode(pin);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Verify PIN against hash
  static bool verifyPin(String pin, String hash) {
    return hashPin(pin) == hash;
  }

  /// Copy text to clipboard
  static Future<void> copyToClipboard(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
  }

  /// Launch URL
  static Future<bool> launchURL(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return false;
  }

  /// Launch phone dialer
  static Future<bool> launchPhone(String phone) async {
    final uri = Uri.parse('tel:$phone');
    return await launchUrl(uri);
  }

  /// Launch email
  static Future<bool> launchEmail(String email, {String? subject}) async {
    final uri = Uri(
      scheme: 'mailto',
      path: email,
      query: subject != null ? 'subject=$subject' : null,
    );
    return await launchUrl(uri);
  }

  /// Launch WhatsApp
  static Future<bool> launchWhatsApp(String phone, {String? message}) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse(
      'https://wa.me/$cleanPhone${message != null ? '?text=${Uri.encodeComponent(message)}' : ''}',
    );
    return await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  /// Share text
  static Future<void> shareText(String text, {String? subject}) async {
    await Share.share(text, subject: subject);
  }

  /// Share receipt
  static Future<void> shareReceipt({
    required String amount,
    required String recipient,
    required String reference,
    required String date,
    String locale = 'ar',
  }) async {
    final text = locale == 'ar'
        ? '''
إيصال تحويل - HealthPay
──────────────────
المبلغ: $amount
المستلم: $recipient
رقم المرجع: $reference
التاريخ: $date
──────────────────
'''
        : '''
Transfer Receipt - HealthPay
──────────────────
Amount: $amount
Recipient: $recipient
Reference: $reference
Date: $date
──────────────────
''';
    await shareText(text, subject: 'HealthPay Receipt');
  }

  /// Get greeting based on time of day with context for localization
  static String getGreeting(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final hour = DateTime.now().hour;
    
    if (l10n != null) {
      if (hour < 12) return l10n.goodMorning;
      if (hour < 17) return l10n.goodAfternoon;
      return l10n.goodEvening;
    }
    
    // Fallback
    final locale = Localizations.localeOf(context).languageCode;
    if (locale == 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 17) return 'مساء الخير';
      return 'مساء الخير';
    } else {
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    }
  }

  /// Get initials from name
  static String getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.isEmpty) return '';
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  /// Calculate age from date
  static int calculateAge(DateTime birthDate) {
    final today = DateTime.now();
    int age = today.year - birthDate.year;
    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }
    return age;
  }

  /// Debounce function
  static Function(T) debounce<T>(
    void Function(T) callback, {
    Duration duration = const Duration(milliseconds: 300),
  }) {
    Timer? timer;
    return (T value) {
      timer?.cancel();
      timer = Timer(duration, () => callback(value));
    };
  }

  /// Check if running on tablet
  static bool isTablet(BuildContext context) {
    final shortestSide = MediaQuery.of(context).size.shortestSide;
    return shortestSide >= 600;
  }

  /// Get screen size category
  static String getScreenCategory(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width < 360) return 'small';
    if (width < 600) return 'medium';
    if (width < 900) return 'large';
    return 'xlarge';
  }
}

/// Timer helper
class Timer {
  final Duration duration;
  final VoidCallback callback;
  bool _cancelled = false;

  Timer(this.duration, this.callback) {
    Future.delayed(duration, () {
      if (!_cancelled) callback();
    });
  }

  void cancel() {
    _cancelled = true;
  }
}

/// Extension on String for convenience
extension StringExtension on String {
  String get capitalize {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }

  String get capitalizeWords {
    return split(' ').map((word) => word.capitalize).join(' ');
  }

  bool get isNumeric => double.tryParse(this) != null;

  String truncate(int maxLength, {String suffix = '...'}) {
    if (length <= maxLength) return this;
    return '${substring(0, maxLength - suffix.length)}$suffix';
  }
}

/// Extension on DateTime for convenience
extension DateTimeExtension on DateTime {
  bool get isToday {
    final now = DateTime.now();
    return year == now.year && month == now.month && day == now.day;
  }

  bool get isYesterday {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return year == yesterday.year &&
        month == yesterday.month &&
        day == yesterday.day;
  }

  bool get isThisWeek {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekEnd = weekStart.add(const Duration(days: 7));
    return isAfter(weekStart) && isBefore(weekEnd);
  }

  DateTime get startOfDay => DateTime(year, month, day);

  DateTime get endOfDay => DateTime(year, month, day, 23, 59, 59);
}
