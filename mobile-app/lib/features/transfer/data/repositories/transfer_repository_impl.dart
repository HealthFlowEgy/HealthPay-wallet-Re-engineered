import 'package:dartz/dartz.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/core/network/network_info.dart';
import 'package:healthpay/features/transfer/data/datasources/transfer_remote_datasource.dart';
import 'package:healthpay/features/transfer/domain/repositories/transfer_repository.dart';

class TransferRepositoryImpl implements TransferRepository {
  final TransferRemoteDataSource remoteDataSource;
  final NetworkInfo networkInfo;
  TransferRepositoryImpl({required this.remoteDataSource, required this.networkInfo});

  @override
  Future<Either<Failure, Map<String, dynamic>>> validateRecipient(String phoneNumber) async {
    if (!await networkInfo.isConnected) return const Left(NetworkFailure());
    try { return Right(await remoteDataSource.validateRecipient(phoneNumber)); }
    on ServerException catch (e) { return Left(ServerFailure(message: e.message)); }
    catch (e) { return Left(UnknownFailure(message: e.toString())); }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> transferMoney({required String fromWalletId, required String toPhoneNumber, required double amount, required String pin, String? description}) async {
    if (!await networkInfo.isConnected) return const Left(NetworkFailure());
    try { return Right(await remoteDataSource.transferMoney(fromWalletId: fromWalletId, toPhoneNumber: toPhoneNumber, amount: amount, pin: pin, description: description)); }
    on ServerException catch (e) { return Left(ServerFailure(message: e.message)); }
    catch (e) { return Left(UnknownFailure(message: e.toString())); }
  }
}
