import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/auth/domain/repositories/auth_repository.dart';

class VerifyOTP {
  final AuthRepository repository;
  VerifyOTP(this.repository);
  
  Future<Either<Failure, AuthResponse>> call({
    required String phoneNumber, 
    required String code,
  }) {
    return repository.verifyOTP(phoneNumber: phoneNumber, code: code);
  }
}
