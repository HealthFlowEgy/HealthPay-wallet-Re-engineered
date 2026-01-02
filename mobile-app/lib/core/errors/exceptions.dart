/// Base Exception
class AppException implements Exception {
  final String message;
  final String? code;

  const AppException({required this.message, this.code});

  @override
  String toString() => 'AppException: $message (code: $code)';
}

/// Server Exception
class ServerException extends AppException {
  final int? statusCode;

  const ServerException({
    required super.message,
    super.code,
    this.statusCode,
  });
}

/// Network Exception
class NetworkException extends AppException {
  const NetworkException({
    super.message = 'No internet connection',
    super.code = 'NETWORK_ERROR',
  });
}

/// Cache Exception
class CacheException extends AppException {
  const CacheException({
    super.message = 'Cache error',
    super.code = 'CACHE_ERROR',
  });
}

/// Authentication Exception
class AuthException extends AppException {
  const AuthException({
    required super.message,
    super.code,
  });
}

/// Unauthorized Exception
class UnauthorizedException extends AuthException {
  const UnauthorizedException({
    super.message = 'Session expired. Please login again.',
    super.code = 'UNAUTHORIZED',
  });
}

/// Validation Exception
class ValidationException extends AppException {
  final Map<String, String>? fieldErrors;

  const ValidationException({
    required super.message,
    super.code,
    this.fieldErrors,
  });
}

/// PIN Exception
class PinException extends AppException {
  final int? remainingAttempts;
  final DateTime? lockoutUntil;

  const PinException({
    required super.message,
    super.code,
    this.remainingAttempts,
    this.lockoutUntil,
  });
}

/// Rate Limit Exception
class RateLimitException extends AppException {
  final Duration retryAfter;

  const RateLimitException({
    super.message = 'Too many requests',
    super.code = 'RATE_LIMITED',
    this.retryAfter = const Duration(minutes: 1),
  });
}

/// GraphQL Exception
class GraphQLException extends AppException {
  final List<String>? errors;

  const GraphQLException({
    required super.message,
    super.code,
    this.errors,
  });
}
