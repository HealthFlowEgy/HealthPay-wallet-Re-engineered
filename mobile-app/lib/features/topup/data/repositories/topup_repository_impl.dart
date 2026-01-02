import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/core/network/network_info.dart';
import 'package:healthpay/features/topup/data/datasources/topup_remote_datasource.dart';
import 'package:healthpay/features/topup/domain/repositories/topup_repository.dart';
import 'package:healthpay/features/topup/presentation/bloc/topup_bloc.dart';

class TopUpRepositoryImpl implements TopUpRepository {
  final TopUpRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;

  TopUpRepositoryImpl({
    required this.remoteDataSource,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, List<TopUpMethod>>> getTopUpMethods() async {
    if (!await networkInfo.isConnected) {
      return const Left(NetworkFailure());
    }

    try {
      final methods = await remoteDataSource.getTopUpMethods();
      return Right(methods);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> topUpWallet({
    required String walletId,
    required double amount,
    required String methodId,
    required String pin,
  }) async {
    if (!await networkInfo.isConnected) {
      return const Left(NetworkFailure());
    }

    try {
      final result = await remoteDataSource.topUpWallet(
        walletId: walletId,
        amount: amount,
        methodId: methodId,
        pin: pin,
      );
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }
}
