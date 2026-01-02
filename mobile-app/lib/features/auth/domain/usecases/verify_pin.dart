import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/auth/domain/repositories/auth_repository.dart';

class VerifyPin {
  final AuthRepository repository;
  VerifyPin(this.repository);
  Future<Either<Failure, bool>> call(String pin) {
    return repository.verifyPin(pin);
  }
}
