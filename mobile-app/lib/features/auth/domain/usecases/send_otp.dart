import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/auth/domain/repositories/auth_repository.dart';

class SendOTP {
  final AuthRepository repository;
  SendOTP(this.repository);
  Future<Either<Failure, OTPResponse>> call(String phoneNumber) {
    return repository.sendOTP(phoneNumber);
  }
}
