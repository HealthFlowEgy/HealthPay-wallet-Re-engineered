import 'package:healthpay/features/transactions/data/datasources/transactions_remote_datasource.dart';
import 'package:healthpay/features/transactions/domain/repositories/transactions_repository.dart';
import 'package:healthpay/features/transactions/presentation/bloc/transactions_bloc.dart';

class TransactionsRepositoryImpl implements TransactionsRepository {
  final TransactionsRemoteDataSource remoteDataSource;

  TransactionsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<TransactionsResult> getTransactions({
    required int page,
    String? filter,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    return remoteDataSource.getTransactions(
      page: page,
      filter: filter,
      startDate: startDate,
      endDate: endDate,
    );
  }

  @override
  Future<Transaction> getTransactionDetails(String transactionId) async {
    return remoteDataSource.getTransactionDetails(transactionId);
  }
}
