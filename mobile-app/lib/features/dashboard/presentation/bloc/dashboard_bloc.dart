import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:healthpay/core/constants/app_constants.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/dashboard/domain/repositories/dashboard_repository.dart';

part 'dashboard_event.dart';
part 'dashboard_state.dart';

class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  final DashboardRepository repository;

  DashboardBloc({required this.repository}) : super(DashboardInitial()) {
    on<LoadDashboard>(_onLoadDashboard);
    on<RefreshDashboard>(_onRefreshDashboard);
  }

  Future<void> _onLoadDashboard(LoadDashboard event, Emitter<DashboardState> emit) async {
    emit(DashboardLoading());
    final userResult = await repository.getUserWithWallet();
    await userResult.fold(
      (failure) async => emit(DashboardError(failure.message)),
      (user) async {
        if (user.wallet != null) {
          final txResult = await repository.getRecentTransactions(user.wallet!.id, AppConstants.recentTransactionsLimit);
          txResult.fold(
            (failure) => emit(DashboardLoaded(user: user, transactions: const [])),
            (transactions) => emit(DashboardLoaded(user: user, transactions: transactions)),
          );
        } else {
          emit(DashboardLoaded(user: user, transactions: const []));
        }
      },
    );
  }

  Future<void> _onRefreshDashboard(RefreshDashboard event, Emitter<DashboardState> emit) async {
    final currentState = state;
    if (currentState is DashboardLoaded) {
      final userResult = await repository.getUserWithWallet();
      await userResult.fold(
        (failure) async => emit(currentState.copyWith(error: failure.message)),
        (user) async {
          if (user.wallet != null) {
            final txResult = await repository.getRecentTransactions(user.wallet!.id, AppConstants.recentTransactionsLimit);
            txResult.fold(
              (failure) => emit(DashboardLoaded(user: user, transactions: currentState.transactions)),
              (transactions) => emit(DashboardLoaded(user: user, transactions: transactions)),
            );
          }
        },
      );
    } else {
      add(LoadDashboard());
    }
  }
}
