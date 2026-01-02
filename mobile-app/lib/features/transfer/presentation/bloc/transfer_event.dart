part of 'transfer_bloc.dart';

abstract class TransferEvent extends Equatable {
  const TransferEvent();
  @override
  List<Object?> get props => [];
}

class ValidateRecipientEvent extends TransferEvent {
  final String phoneNumber;
  const ValidateRecipientEvent(this.phoneNumber);
  @override
  List<Object?> get props => [phoneNumber];
}

class TransferMoneyEvent extends TransferEvent {
  final String fromWalletId;
  final String toPhoneNumber;
  final double amount;
  final String pin;
  final String? description;
  const TransferMoneyEvent({required this.fromWalletId, required this.toPhoneNumber, required this.amount, required this.pin, this.description});
  @override
  List<Object?> get props => [fromWalletId, toPhoneNumber, amount, pin, description];
}

class ResetTransferEvent extends TransferEvent {}
