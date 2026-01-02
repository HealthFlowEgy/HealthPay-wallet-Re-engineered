import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/core/network/network_info.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/dashboard/data/datasources/dashboard_remote_datasource.dart';
import 'package:healthpay/features/dashboard/domain/repositories/dashboard_repository.dart';

class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;
  DashboardRepositoryImpl({required this.remoteDataSource, required this.networkInfo});

  @override
  Future<Either<Failure, User>> getUserWithWallet() async {
    if (!await networkInfo.isConnected) return const Left(NetworkFailure());
    try { return Right(await remoteDataSource.getUserWithWallet()); }
    on ServerException catch (e) { return Left(ServerFailure(message: e.message)); }
    catch (e) { return Left(UnknownFailure(message: e.toString())); }
  }

  @override
  Future<Either<Failure, List<Map<String, dynamic>>>> getRecentTransactions(String walletId, int limit) async {
    if (!await networkInfo.isConnected) return const Left(NetworkFailure());
    try { return Right(await remoteDataSource.getRecentTransactions(walletId, limit)); }
    on ServerException catch (e) { return Left(ServerFailure(message: e.message)); }
    catch (e) { return Left(UnknownFailure(message: e.toString())); }
  }
}
