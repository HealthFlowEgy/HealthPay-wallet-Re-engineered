import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';

abstract class TransferRepository {
  Future<Either<Failure, Map<String, dynamic>>> validateRecipient(String phoneNumber);
  Future<Either<Failure, Map<String, dynamic>>> transferMoney({required String fromWalletId, required String toPhoneNumber, required double amount, required String pin, String? description});
}
