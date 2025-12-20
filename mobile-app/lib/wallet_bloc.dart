// lib/presentation/bloc/wallet/wallet_bloc.dart

import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../data/models/models.dart';
import '../../../data/repositories/repositories.dart';

// Events
abstract class WalletEvent extends Equatable {
  const WalletEvent();

  @override
  List<Object?> get props => [];
}

class WalletLoadRequested extends WalletEvent {
  final String userId;
  const WalletLoadRequested(this.userId);

  @override
  List<Object?> get props => [userId];
}

class WalletRefreshRequested extends WalletEvent {}

class WalletBalanceUpdated extends WalletEvent {
  final String balance;
  final String availableBalance;
  final String pendingBalance;

  const WalletBalanceUpdated({
    required this.balance,
    required this.availableBalance,
    required this.pendingBalance,
  });

  @override
  List<Object?> get props => [balance, availableBalance, pendingBalance];
}

// States
abstract class WalletState extends Equatable {
  const WalletState();

  @override
  List<Object?> get props => [];
}

class WalletInitial extends WalletState {}

class WalletLoading extends WalletState {}

class WalletLoaded extends WalletState {
  final WalletModel wallet;
  final List<TransactionModel> recentTransactions;

  const WalletLoaded({
    required this.wallet,
    this.recentTransactions = const [],
  });

  @override
  List<Object?> get props => [wallet, recentTransactions];

  WalletLoaded copyWith({
    WalletModel? wallet,
    List<TransactionModel>? recentTransactions,
  }) {
    return WalletLoaded(
      wallet: wallet ?? this.wallet,
      recentTransactions: recentTransactions ?? this.recentTransactions,
    );
  }
}

class WalletError extends WalletState {
  final String message;
  const WalletError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
@injectable
class WalletBloc extends Bloc<WalletEvent, WalletState> {
  final WalletRepository _walletRepository;
  final TransactionRepository _transactionRepository;

  StreamSubscription? _balanceSubscription;
  StreamSubscription? _transactionSubscription;
  String? _currentWalletId;

  WalletBloc(
    this._walletRepository,
    this._transactionRepository,
  ) : super(WalletInitial()) {
    on<WalletLoadRequested>(_onLoadRequested);
    on<WalletRefreshRequested>(_onRefreshRequested);
    on<WalletBalanceUpdated>(_onBalanceUpdated);
  }

  Future<void> _onLoadRequested(
    WalletLoadRequested event,
    Emitter<WalletState> emit,
  ) async {
    emit(WalletLoading());

    try {
      final wallet = await _walletRepository.getWalletByUserId(event.userId);
      _currentWalletId = wallet.id;

      final transactions = await _transactionRepository.getTransactionsByWallet(
        wallet.id,
        limit: 10,
      );

      emit(WalletLoaded(
        wallet: wallet,
        recentTransactions: transactions,
      ));

      // Subscribe to real-time updates
      _subscribeToUpdates(wallet.id);
    } catch (e) {
      emit(WalletError(e.toString()));
    }
  }

  Future<void> _onRefreshRequested(
    WalletRefreshRequested event,
    Emitter<WalletState> emit,
  ) async {
    if (_currentWalletId == null) return;

    try {
      final wallet = await _walletRepository.getWallet(_currentWalletId!);
      final transactions = await _transactionRepository.getTransactionsByWallet(
        wallet.id,
        limit: 10,
      );

      emit(WalletLoaded(
        wallet: wallet,
        recentTransactions: transactions,
      ));
    } catch (e) {
      emit(WalletError(e.toString()));
    }
  }

  void _onBalanceUpdated(
    WalletBalanceUpdated event,
    Emitter<WalletState> emit,
  ) {
    if (state is WalletLoaded) {
      final currentState = state as WalletLoaded;
      final updatedWallet = WalletModel(
        id: currentState.wallet.id,
        userId: currentState.wallet.userId,
        walletNumber: currentState.wallet.walletNumber,
        balance: event.balance,
        availableBalance: event.availableBalance,
        pendingBalance: event.pendingBalance,
        currency: currentState.wallet.currency,
        dailyLimit: currentState.wallet.dailyLimit,
        monthlyLimit: currentState.wallet.monthlyLimit,
        isActive: currentState.wallet.isActive,
        createdAt: currentState.wallet.createdAt,
        updatedAt: DateTime.now(),
      );

      emit(currentState.copyWith(wallet: updatedWallet));
    }
  }

  void _subscribeToUpdates(String walletId) {
    _balanceSubscription?.cancel();
    _transactionSubscription?.cancel();

    _balanceSubscription = _walletRepository.watchBalance(walletId).listen(
      (data) {
        add(WalletBalanceUpdated(
          balance: data['balance'] as String,
          availableBalance: data['availableBalance'] as String,
          pendingBalance: data['pendingBalance'] as String,
        ));
      },
    );

    _transactionSubscription = _transactionRepository.watchTransactions(walletId).listen(
      (transaction) {
        add(WalletRefreshRequested());
      },
    );
  }

  @override
  Future<void> close() {
    _balanceSubscription?.cancel();
    _transactionSubscription?.cancel();
    return super.close();
  }
}

// lib/presentation/bloc/transaction/transaction_bloc.dart

// Events
abstract class TransactionEvent extends Equatable {
  const TransactionEvent();

  @override
  List<Object?> get props => [];
}

class TransactionLoadRequested extends TransactionEvent {
  final String walletId;
  final String? type;
  final String? status;
  final DateTime? startDate;
  final DateTime? endDate;

  const TransactionLoadRequested({
    required this.walletId,
    this.type,
    this.status,
    this.startDate,
    this.endDate,
  });

  @override
  List<Object?> get props => [walletId, type, status, startDate, endDate];
}

class TransactionLoadMoreRequested extends TransactionEvent {}

class TransactionRefreshRequested extends TransactionEvent {}

class SendMoneyRequested extends TransactionEvent {
  final String senderWalletId;
  final String recipientPhone;
  final double amount;
  final String pin;
  final String? description;

  const SendMoneyRequested({
    required this.senderWalletId,
    required this.recipientPhone,
    required this.amount,
    required this.pin,
    this.description,
  });

  @override
  List<Object?> get props => [
        senderWalletId,
        recipientPhone,
        amount,
        pin,
        description,
      ];
}

// States
abstract class TransactionState extends Equatable {
  const TransactionState();

  @override
  List<Object?> get props => [];
}

class TransactionInitial extends TransactionState {}

class TransactionLoading extends TransactionState {}

class TransactionLoaded extends TransactionState {
  final List<TransactionModel> transactions;
  final bool hasMore;
  final int offset;
  final String? typeFilter;
  final String? statusFilter;

  const TransactionLoaded({
    required this.transactions,
    this.hasMore = true,
    this.offset = 0,
    this.typeFilter,
    this.statusFilter,
  });

  @override
  List<Object?> get props => [
        transactions,
        hasMore,
        offset,
        typeFilter,
        statusFilter,
      ];

  TransactionLoaded copyWith({
    List<TransactionModel>? transactions,
    bool? hasMore,
    int? offset,
    String? typeFilter,
    String? statusFilter,
  }) {
    return TransactionLoaded(
      transactions: transactions ?? this.transactions,
      hasMore: hasMore ?? this.hasMore,
      offset: offset ?? this.offset,
      typeFilter: typeFilter ?? this.typeFilter,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }
}

class TransactionLoadingMore extends TransactionLoaded {
  const TransactionLoadingMore({
    required super.transactions,
    super.hasMore,
    super.offset,
    super.typeFilter,
    super.statusFilter,
  });
}

class SendMoneyLoading extends TransactionState {}

class SendMoneySuccess extends TransactionState {
  final TransactionModel transaction;
  const SendMoneySuccess(this.transaction);

  @override
  List<Object?> get props => [transaction];
}

class TransactionError extends TransactionState {
  final String message;
  const TransactionError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
@injectable
class TransactionBloc extends Bloc<TransactionEvent, TransactionState> {
  final TransactionRepository _transactionRepository;

  String? _currentWalletId;
  static const int _pageSize = 20;

  TransactionBloc(this._transactionRepository) : super(TransactionInitial()) {
    on<TransactionLoadRequested>(_onLoadRequested);
    on<TransactionLoadMoreRequested>(_onLoadMoreRequested);
    on<TransactionRefreshRequested>(_onRefreshRequested);
    on<SendMoneyRequested>(_onSendMoneyRequested);
  }

  Future<void> _onLoadRequested(
    TransactionLoadRequested event,
    Emitter<TransactionState> emit,
  ) async {
    emit(TransactionLoading());
    _currentWalletId = event.walletId;

    try {
      final transactions = await _transactionRepository.getTransactionsByWallet(
        event.walletId,
        limit: _pageSize,
        offset: 0,
        type: event.type,
        status: event.status,
        startDate: event.startDate,
        endDate: event.endDate,
      );

      emit(TransactionLoaded(
        transactions: transactions,
        hasMore: transactions.length >= _pageSize,
        offset: 0,
        typeFilter: event.type,
        statusFilter: event.status,
      ));
    } catch (e) {
      emit(TransactionError(e.toString()));
    }
  }

  Future<void> _onLoadMoreRequested(
    TransactionLoadMoreRequested event,
    Emitter<TransactionState> emit,
  ) async {
    if (state is! TransactionLoaded) return;

    final currentState = state as TransactionLoaded;
    if (!currentState.hasMore) return;

    emit(TransactionLoadingMore(
      transactions: currentState.transactions,
      hasMore: currentState.hasMore,
      offset: currentState.offset,
      typeFilter: currentState.typeFilter,
      statusFilter: currentState.statusFilter,
    ));

    try {
      final newOffset = currentState.offset + _pageSize;
      final transactions = await _transactionRepository.getTransactionsByWallet(
        _currentWalletId!,
        limit: _pageSize,
        offset: newOffset,
        type: currentState.typeFilter,
        status: currentState.statusFilter,
      );

      emit(TransactionLoaded(
        transactions: [...currentState.transactions, ...transactions],
        hasMore: transactions.length >= _pageSize,
        offset: newOffset,
        typeFilter: currentState.typeFilter,
        statusFilter: currentState.statusFilter,
      ));
    } catch (e) {
      emit(currentState);
    }
  }

  Future<void> _onRefreshRequested(
    TransactionRefreshRequested event,
    Emitter<TransactionState> emit,
  ) async {
    if (_currentWalletId == null) return;

    final currentState = state;
    String? typeFilter;
    String? statusFilter;

    if (currentState is TransactionLoaded) {
      typeFilter = currentState.typeFilter;
      statusFilter = currentState.statusFilter;
    }

    add(TransactionLoadRequested(
      walletId: _currentWalletId!,
      type: typeFilter,
      status: statusFilter,
    ));
  }

  Future<void> _onSendMoneyRequested(
    SendMoneyRequested event,
    Emitter<TransactionState> emit,
  ) async {
    emit(SendMoneyLoading());

    try {
      final transaction = await _transactionRepository.sendMoney(
        senderWalletId: event.senderWalletId,
        recipientPhone: event.recipientPhone,
        amount: event.amount,
        pin: event.pin,
        description: event.description,
      );

      emit(SendMoneySuccess(transaction));
    } catch (e) {
      emit(TransactionError(e.toString()));
    }
  }
}
