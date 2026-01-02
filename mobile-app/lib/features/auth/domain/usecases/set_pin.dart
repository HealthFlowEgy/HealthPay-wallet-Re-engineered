import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/auth/domain/repositories/auth_repository.dart';

class SetPin {
  final AuthRepository repository;
  SetPin(this.repository);
  Future<Either<Failure, PinResponse>> call({required String phoneNumber, required String pin}) {
    return repository.setPin(phoneNumber: phoneNumber, pin: pin);
  }
}
