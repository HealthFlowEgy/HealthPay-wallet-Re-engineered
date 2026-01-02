part of 'dashboard_bloc.dart';

abstract class DashboardState extends Equatable {
  const DashboardState();
  @override
  List<Object?> get props => [];
}

class DashboardInitial extends DashboardState {}
class DashboardLoading extends DashboardState {}

class DashboardLoaded extends DashboardState {
  final User user;
  final List<Map<String, dynamic>> transactions;
  final String? error;

  const DashboardLoaded({required this.user, required this.transactions, this.error});

  DashboardLoaded copyWith({User? user, List<Map<String, dynamic>>? transactions, String? error}) {
    return DashboardLoaded(user: user ?? this.user, transactions: transactions ?? this.transactions, error: error);
  }

  @override
  List<Object?> get props => [user, transactions, error];
}

class DashboardError extends DashboardState {
  final String message;
  const DashboardError(this.message);
  @override
  List<Object?> get props => [message];
}
