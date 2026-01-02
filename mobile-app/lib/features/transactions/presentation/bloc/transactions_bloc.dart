import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:healthpay/features/transactions/domain/repositories/transactions_repository.dart';

// Events
abstract class TransactionsEvent extends Equatable {
  const TransactionsEvent();
  @override
  List<Object?> get props => [];
}

class LoadTransactions extends TransactionsEvent {
  final String? filter; // 'all', 'incoming', 'outgoing'
  final DateTime? startDate;
  final DateTime? endDate;
  
  const LoadTransactions({this.filter, this.startDate, this.endDate});
  
  @override
  List<Object?> get props => [filter, startDate, endDate];
}

class LoadMoreTransactions extends TransactionsEvent {}

class LoadTransactionDetails extends TransactionsEvent {
  final String transactionId;
  const LoadTransactionDetails(this.transactionId);
  @override
  List<Object?> get props => [transactionId];
}

class RefreshTransactions extends TransactionsEvent {}

// States
abstract class TransactionsState extends Equatable {
  const TransactionsState();
  @override
  List<Object?> get props => [];
}

class TransactionsInitial extends TransactionsState {}

class TransactionsLoading extends TransactionsState {}

class TransactionsLoaded extends TransactionsState {
  final List<Transaction> transactions;
  final bool hasMore;
  final String? currentFilter;
  
  const TransactionsLoaded({
    required this.transactions,
    this.hasMore = false,
    this.currentFilter,
  });
  
  @override
  List<Object?> get props => [transactions, hasMore, currentFilter];
}

class TransactionDetailsLoaded extends TransactionsState {
  final Transaction transaction;
  const TransactionDetailsLoaded(this.transaction);
  @override
  List<Object?> get props => [transaction];
}

class TransactionsError extends TransactionsState {
  final String message;
  const TransactionsError(this.message);
  @override
  List<Object?> get props => [message];
}

// BLoC
class TransactionsBloc extends Bloc<TransactionsEvent, TransactionsState> {
  final TransactionsRepository repository;
  
  List<Transaction> _transactions = [];
  int _page = 1;
  bool _hasMore = true;
  String? _currentFilter;

  TransactionsBloc({required this.repository}) : super(TransactionsInitial()) {
    on<LoadTransactions>(_onLoadTransactions);
    on<LoadMoreTransactions>(_onLoadMore);
    on<LoadTransactionDetails>(_onLoadDetails);
    on<RefreshTransactions>(_onRefresh);
  }

  Future<void> _onLoadTransactions(
    LoadTransactions event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(TransactionsLoading());
    try {
      _page = 1;
      _currentFilter = event.filter;
      final result = await repository.getTransactions(
        page: _page,
        filter: event.filter,
        startDate: event.startDate,
        endDate: event.endDate,
      );
      _transactions = result.transactions;
      _hasMore = result.hasMore;
      emit(TransactionsLoaded(
        transactions: _transactions,
        hasMore: _hasMore,
        currentFilter: _currentFilter,
      ));
    } catch (e) {
      emit(TransactionsError(e.toString()));
    }
  }

  Future<void> _onLoadMore(
    LoadMoreTransactions event,
    Emitter<TransactionsState> emit,
  ) async {
    if (!_hasMore) return;
    
    try {
      _page++;
      final result = await repository.getTransactions(
        page: _page,
        filter: _currentFilter,
      );
      _transactions.addAll(result.transactions);
      _hasMore = result.hasMore;
      emit(TransactionsLoaded(
        transactions: _transactions,
        hasMore: _hasMore,
        currentFilter: _currentFilter,
      ));
    } catch (e) {
      emit(TransactionsError(e.toString()));
    }
  }

  Future<void> _onLoadDetails(
    LoadTransactionDetails event,
    Emitter<TransactionsState> emit,
  ) async {
    emit(TransactionsLoading());
    try {
      final transaction = await repository.getTransactionDetails(event.transactionId);
      emit(TransactionDetailsLoaded(transaction));
    } catch (e) {
      emit(TransactionsError(e.toString()));
    }
  }

  Future<void> _onRefresh(
    RefreshTransactions event,
    Emitter<TransactionsState> emit,
  ) async {
    add(LoadTransactions(filter: _currentFilter));
  }
}

// Models
class Transaction {
  final String id;
  final String type; // 'transfer_in', 'transfer_out', 'topup', 'bill_payment', 'merchant_payment'
  final double amount;
  final String status; // 'completed', 'pending', 'failed', 'cancelled'
  final DateTime timestamp;
  final String? recipientName;
  final String? recipientPhone;
  final String? senderName;
  final String? senderPhone;
  final String? note;
  final String? referenceNumber;
  final String? merchantName;
  final String? billProvider;

  const Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.status,
    required this.timestamp,
    this.recipientName,
    this.recipientPhone,
    this.senderName,
    this.senderPhone,
    this.note,
    this.referenceNumber,
    this.merchantName,
    this.billProvider,
  });

  bool get isIncoming => type == 'transfer_in' || type == 'topup';
  bool get isOutgoing => type == 'transfer_out' || type == 'bill_payment' || type == 'merchant_payment';

  String get displayName {
    switch (type) {
      case 'transfer_in':
        return senderName ?? 'Unknown';
      case 'transfer_out':
        return recipientName ?? 'Unknown';
      case 'topup':
        return 'Wallet Top Up';
      case 'bill_payment':
        return billProvider ?? 'Bill Payment';
      case 'merchant_payment':
        return merchantName ?? 'Merchant Payment';
      default:
        return 'Transaction';
    }
  }

  String get typeLabel {
    switch (type) {
      case 'transfer_in':
        return 'Received';
      case 'transfer_out':
        return 'Sent';
      case 'topup':
        return 'Top Up';
      case 'bill_payment':
        return 'Bill Payment';
      case 'merchant_payment':
        return 'Payment';
      default:
        return type;
    }
  }

  String get typeLabelAr {
    switch (type) {
      case 'transfer_in':
        return 'استلام';
      case 'transfer_out':
        return 'إرسال';
      case 'topup':
        return 'شحن';
      case 'bill_payment':
        return 'دفع فاتورة';
      case 'merchant_payment':
        return 'دفع';
      default:
        return type;
    }
  }
}

class TransactionsResult {
  final List<Transaction> transactions;
  final bool hasMore;
  final int totalCount;

  const TransactionsResult({
    required this.transactions,
    required this.hasMore,
    required this.totalCount,
  });
}
