// lib/core/errors/exceptions.dart

/// Base exception class for the application
abstract class AppException implements Exception {
  final String message;
  final dynamic originalError;

  AppException({required this.message, this.originalError});

  @override
  String toString() => message;
}

/// Network-related exceptions
class NetworkException extends AppException {
  NetworkException({required super.message, super.originalError});
}

/// Authentication exceptions
class AuthException extends AppException {
  AuthException({required super.message, super.originalError});
}

/// Server-side exceptions
class ServerException extends AppException {
  final int? statusCode;

  ServerException({
    required super.message,
    super.originalError,
    this.statusCode,
  });
}

/// Resource not found exceptions
class NotFoundException extends AppException {
  NotFoundException({required super.message, super.originalError});
}

/// Validation exceptions
class ValidationException extends AppException {
  final Map<String, List<String>>? errors;

  ValidationException({
    required super.message,
    super.originalError,
    this.errors,
  });
}

/// Cache exceptions
class CacheException extends AppException {
  CacheException({required super.message, super.originalError});
}

// lib/core/errors/failures.dart

import 'package:equatable/equatable.dart';

/// Base failure class for error handling in the domain layer
abstract class Failure extends Equatable {
  final String message;
  final dynamic error;

  const Failure({required this.message, this.error});

  @override
  List<Object?> get props => [message, error];
}

class NetworkFailure extends Failure {
  const NetworkFailure({required super.message, super.error});
}

class AuthFailure extends Failure {
  const AuthFailure({required super.message, super.error});
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.error});
}

class CacheFailure extends Failure {
  const CacheFailure({required super.message, super.error});
}

class ValidationFailure extends Failure {
  final Map<String, List<String>>? fieldErrors;

  const ValidationFailure({
    required super.message,
    super.error,
    this.fieldErrors,
  });

  @override
  List<Object?> get props => [message, error, fieldErrors];
}

// lib/core/utils/validators.dart

/// Input validation utilities
class Validators {
  Validators._();

  /// Validate Egyptian phone number
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }

    // Remove spaces and dashes
    final cleaned = value.replaceAll(RegExp(r'[\s\-]'), '');

    // Egyptian phone number patterns
    final patterns = [
      RegExp(r'^01[0125][0-9]{8}$'),      // Local format
      RegExp(r'^\+201[0125][0-9]{8}$'),   // International format
      RegExp(r'^201[0125][0-9]{8}$'),     // Without plus
    ];

    final isValid = patterns.any((pattern) => pattern.hasMatch(cleaned));
    if (!isValid) {
      return 'Please enter a valid Egyptian phone number';
    }

    return null;
  }

  /// Validate email
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }

    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  /// Validate password
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }

    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain at least one number';
    }

    return null;
  }

  /// Validate PIN
  static String? validatePin(String? value, {int length = 4}) {
    if (value == null || value.isEmpty) {
      return 'PIN is required';
    }

    if (value.length != length) {
      return 'PIN must be $length digits';
    }

    if (!RegExp(r'^[0-9]+$').hasMatch(value)) {
      return 'PIN must contain only numbers';
    }

    // Check for sequential numbers
    final sequential = ['1234', '2345', '3456', '4567', '5678', '6789', '0123'];
    if (sequential.contains(value)) {
      return 'PIN cannot be sequential numbers';
    }

    // Check for repeated numbers
    if (RegExp(r'^(\d)\1+$').hasMatch(value)) {
      return 'PIN cannot be repeated numbers';
    }

    return null;
  }

  /// Validate amount
  static String? validateAmount(
    String? value, {
    double min = 1,
    double max = 50000,
  }) {
    if (value == null || value.isEmpty) {
      return 'Amount is required';
    }

    final amount = double.tryParse(value);
    if (amount == null) {
      return 'Please enter a valid amount';
    }

    if (amount < min) {
      return 'Minimum amount is EGP ${min.toStringAsFixed(2)}';
    }

    if (amount > max) {
      return 'Maximum amount is EGP ${max.toStringAsFixed(2)}';
    }

    return null;
  }

  /// Validate Egyptian National ID
  static String? validateNationalId(String? value) {
    if (value == null || value.isEmpty) {
      return 'National ID is required';
    }

    if (value.length != 14) {
      return 'National ID must be 14 digits';
    }

    if (!RegExp(r'^[0-9]+$').hasMatch(value)) {
      return 'National ID must contain only numbers';
    }

    // Basic validation: first digit should be 2 or 3
    if (!['2', '3'].contains(value[0])) {
      return 'Please enter a valid National ID';
    }

    return null;
  }

  /// Validate required field
  static String? required(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    return null;
  }
}

// lib/core/utils/formatters.dart

import 'package:intl/intl.dart';

/// Formatting utilities
class Formatters {
  Formatters._();

  /// Format currency
  static String currency(
    dynamic amount, {
    String symbol = 'EGP',
    int decimalDigits = 2,
  }) {
    final formatter = NumberFormat.currency(
      symbol: '$symbol ',
      decimalDigits: decimalDigits,
    );

    if (amount is String) {
      final parsed = double.tryParse(amount);
      return formatter.format(parsed ?? 0);
    }

    return formatter.format(amount ?? 0);
  }

  /// Format number with commas
  static String number(dynamic value) {
    final formatter = NumberFormat('#,###');

    if (value is String) {
      final parsed = int.tryParse(value);
      return formatter.format(parsed ?? 0);
    }

    return formatter.format(value ?? 0);
  }

  /// Format phone number
  static String phone(String phone) {
    // Remove any existing formatting
    final cleaned = phone.replaceAll(RegExp(r'[^\d+]'), '');

    if (cleaned.startsWith('+20')) {
      return '+20 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 9)} ${cleaned.substring(9)}';
    } else if (cleaned.startsWith('20')) {
      return '+20 ${cleaned.substring(2, 4)} ${cleaned.substring(4, 8)} ${cleaned.substring(8)}';
    } else if (cleaned.startsWith('0')) {
      return '+20 ${cleaned.substring(1, 3)} ${cleaned.substring(3, 7)} ${cleaned.substring(7)}';
    }

    return phone;
  }

  /// Format date
  static String date(DateTime? date, {String pattern = 'dd MMM yyyy'}) {
    if (date == null) return '-';
    return DateFormat(pattern).format(date);
  }

  /// Format time
  static String time(DateTime? date, {String pattern = 'HH:mm'}) {
    if (date == null) return '-';
    return DateFormat(pattern).format(date);
  }

  /// Format date and time
  static String dateTime(DateTime? date, {String pattern = 'dd MMM yyyy, HH:mm'}) {
    if (date == null) return '-';
    return DateFormat(pattern).format(date);
  }

  /// Format relative time (e.g., "5 min ago")
  static String relativeTime(DateTime? date) {
    if (date == null) return '-';

    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hours ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return DateFormat('dd MMM').format(date);
    }
  }

  /// Mask sensitive data
  static String mask(String value, {int visibleChars = 4}) {
    if (value.length <= visibleChars) return value;
    return '${'*' * (value.length - visibleChars)}${value.substring(value.length - visibleChars)}';
  }

  /// Mask phone number
  static String maskPhone(String phone) {
    final cleaned = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (cleaned.length < 4) return phone;
    return '${cleaned.substring(0, 3)}****${cleaned.substring(cleaned.length - 4)}';
  }
}

// lib/core/utils/helpers.dart

import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:uuid/uuid.dart';

/// General helper utilities
class Helpers {
  Helpers._();

  static const _uuid = Uuid();

  /// Generate UUID
  static String generateUuid() => _uuid.v4();

  /// Generate transaction reference
  static String generateReference({String prefix = 'TXN'}) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = _uuid.v4().substring(0, 8).toUpperCase();
    return '$prefix-$timestamp-$random';
  }

  /// Hash PIN
  static String hashPin(String pin) {
    final bytes = utf8.encode(pin);
    final hash = sha256.convert(bytes);
    return hash.toString();
  }

  /// Verify PIN hash
  static bool verifyPinHash(String pin, String hash) {
    return hashPin(pin) == hash;
  }

  /// Delay execution
  static Future<void> delay([int milliseconds = 300]) async {
    await Future.delayed(Duration(milliseconds: milliseconds));
  }

  /// Check if string is numeric
  static bool isNumeric(String value) {
    return double.tryParse(value) != null;
  }

  /// Capitalize first letter
  static String capitalize(String value) {
    if (value.isEmpty) return value;
    return '${value[0].toUpperCase()}${value.substring(1).toLowerCase()}';
  }

  /// Capitalize each word
  static String capitalizeWords(String value) {
    return value.split(' ').map(capitalize).join(' ');
  }

  /// Parse amount string to double
  static double parseAmount(String value) {
    final cleaned = value.replaceAll(RegExp(r'[^\d.]'), '');
    return double.tryParse(cleaned) ?? 0;
  }

  /// Format amount for API
  static String formatAmountForApi(double amount) {
    return amount.toStringAsFixed(2);
  }
}
