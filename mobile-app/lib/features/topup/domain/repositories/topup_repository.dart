import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/topup/presentation/bloc/topup_bloc.dart';

abstract class TopUpRepository {
  Future<Either<Failure, List<TopUpMethod>>> getTopUpMethods();
  
  Future<Either<Failure, Map<String, dynamic>>> topUpWallet({
    required String walletId,
    required double amount,
    required String methodId,
    required String pin,
  });
}
