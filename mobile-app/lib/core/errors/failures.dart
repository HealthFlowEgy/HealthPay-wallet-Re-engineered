import 'package:equatable/equatable.dart';

/// Base Failure class
abstract class Failure extends Equatable {
  final String message;
  final String? code;

  const Failure({required this.message, this.code});

  @override
  List<Object?> get props => [message, code];
}

/// Server-side failures
class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.code});
}

/// Network failures
class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection. Please check your network.',
    super.code = 'NETWORK_ERROR',
  });
}

/// Cache failures
class CacheFailure extends Failure {
  const CacheFailure({
    super.message = 'Unable to load cached data.',
    super.code = 'CACHE_ERROR',
  });
}

/// Authentication failures
class AuthFailure extends Failure {
  const AuthFailure({required super.message, super.code});
}

/// Validation failures
class ValidationFailure extends Failure {
  const ValidationFailure({required super.message, super.code});
}

/// PIN failures
class PinFailure extends Failure {
  final int? remainingAttempts;
  final DateTime? lockoutUntil;

  const PinFailure({
    required super.message,
    super.code,
    this.remainingAttempts,
    this.lockoutUntil,
  });

  @override
  List<Object?> get props => [message, code, remainingAttempts, lockoutUntil];
}

/// Insufficient balance failure
class InsufficientBalanceFailure extends Failure {
  final double requiredAmount;
  final double currentBalance;

  const InsufficientBalanceFailure({
    required super.message,
    required this.requiredAmount,
    required this.currentBalance,
    super.code = 'INSUFFICIENT_BALANCE',
  });

  @override
  List<Object?> get props => [message, code, requiredAmount, currentBalance];
}

/// Rate limit failure
class RateLimitFailure extends Failure {
  final Duration retryAfter;

  const RateLimitFailure({
    super.message = 'Too many requests. Please try again later.',
    super.code = 'RATE_LIMITED',
    this.retryAfter = const Duration(minutes: 1),
  });

  @override
  List<Object?> get props => [message, code, retryAfter];
}

/// Unknown failure
class UnknownFailure extends Failure {
  const UnknownFailure({
    super.message = 'An unexpected error occurred. Please try again.',
    super.code = 'UNKNOWN_ERROR',
  });
}
