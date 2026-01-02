import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/auth/domain/repositories/auth_repository.dart';

/// Send OTP Use Case
class SendOTP {
  final AuthRepository repository;

  SendOTP(this.repository);

  Future<Either<Failure, OTPResponse>> call(String phoneNumber) {
    return repository.sendOTP(phoneNumber);
  }
}

/// Verify OTP Use Case
class VerifyOTP {
  final AuthRepository repository;

  VerifyOTP(this.repository);

  Future<Either<Failure, AuthResponse>> call({
    required String phoneNumber,
    required String otp,
  }) {
    return repository.verifyOTP(phoneNumber: phoneNumber, otp: otp);
  }
}

/// Set PIN Use Case
class SetPin {
  final AuthRepository repository;

  SetPin(this.repository);

  Future<Either<Failure, PinResponse>> call({
    required String phoneNumber,
    required String pin,
  }) {
    return repository.setPin(phoneNumber: phoneNumber, pin: pin);
  }
}

/// Verify PIN Use Case
class VerifyPin {
  final AuthRepository repository;

  VerifyPin(this.repository);

  Future<Either<Failure, bool>> call(String pin) {
    return repository.verifyPin(pin);
  }
}

/// Get Current User Use Case
class GetCurrentUser {
  final AuthRepository repository;

  GetCurrentUser(this.repository);

  Future<Either<Failure, User>> call() {
    return repository.getCurrentUser();
  }
}

/// Logout Use Case
class Logout {
  final AuthRepository repository;

  Logout(this.repository);

  Future<Either<Failure, void>> call() {
    return repository.logout();
  }
}

/// Authenticate with Biometric Use Case
class AuthenticateWithBiometric {
  final AuthRepository repository;

  AuthenticateWithBiometric(this.repository);

  Future<Either<Failure, bool>> call() {
    return repository.authenticateWithBiometric();
  }
}
