part of 'topup_bloc.dart';

abstract class TopUpEvent extends Equatable {
  const TopUpEvent();
  @override
  List<Object?> get props => [];
}

class LoadTopUpMethodsEvent extends TopUpEvent {}

class SelectTopUpMethodEvent extends TopUpEvent {
  final TopUpMethod method;
  const SelectTopUpMethodEvent(this.method);
  @override
  List<Object?> get props => [method];
}

class SelectTopUpAmountEvent extends TopUpEvent {
  final double amount;
  const SelectTopUpAmountEvent(this.amount);
  @override
  List<Object?> get props => [amount];
}

class ProcessTopUpEvent extends TopUpEvent {
  final String walletId;
  final double amount;
  final String methodId;
  final String pin;
  
  const ProcessTopUpEvent({
    required this.walletId,
    required this.amount,
    required this.methodId,
    required this.pin,
  });
  
  @override
  List<Object?> get props => [walletId, amount, methodId, pin];
}

class ResetTopUpEvent extends TopUpEvent {}
