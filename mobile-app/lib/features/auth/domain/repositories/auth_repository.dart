import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';

/// Auth Repository Interface
abstract class AuthRepository {
  /// Send OTP to phone number
  Future<Either<Failure, OTPResponse>> sendOTP(String phoneNumber);
  
  /// Verify OTP and authenticate
  Future<Either<Failure, AuthResponse>> verifyOTP({
    required String phoneNumber,
    required String code,
  });
  
  /// Set user PIN
  Future<Either<Failure, PinResponse>> setPin({
    required String phoneNumber,
    required String pin,
  });
  
  /// Verify user PIN locally
  Future<Either<Failure, bool>> verifyPin(String pin);
  
  /// Check if user has PIN set
  Future<Either<Failure, bool>> hasPin();
  
  /// Get current user
  Future<Either<Failure, User>> getCurrentUser();
  
  /// Check if user is authenticated
  Future<bool> isAuthenticated();
  
  /// Logout user
  Future<Either<Failure, void>> logout();
  
  /// Check biometric availability
  Future<bool> isBiometricAvailable();
  
  /// Authenticate with biometric
  Future<Either<Failure, bool>> authenticateWithBiometric();
  
  /// Enable/disable biometric
  Future<Either<Failure, void>> setBiometricEnabled(bool enabled);
  
  /// Check if biometric is enabled
  Future<bool> isBiometricEnabled();
}
