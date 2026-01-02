import 'package:healthpay/features/transactions/presentation/bloc/transactions_bloc.dart';

abstract class TransactionsRepository {
  Future<TransactionsResult> getTransactions({
    required int page,
    String? filter,
    DateTime? startDate,
    DateTime? endDate,
  });
  
  Future<Transaction> getTransactionDetails(String transactionId);
}
