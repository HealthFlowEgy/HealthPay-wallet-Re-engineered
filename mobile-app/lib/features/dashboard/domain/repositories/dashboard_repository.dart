import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';

abstract class DashboardRepository {
  Future<Either<Failure, User>> getUserWithWallet();
  Future<Either<Failure, List<Map<String, dynamic>>>> getRecentTransactions(String walletId, int limit);
}
