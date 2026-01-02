part of 'transfer_bloc.dart';

abstract class TransferState extends Equatable {
  const TransferState();
  @override
  List<Object?> get props => [];
}

class TransferInitial extends TransferState {}
class TransferLoading extends TransferState {}

class RecipientValidated extends TransferState {
  final String name;
  final String phoneNumber;
  const RecipientValidated({required this.name, required this.phoneNumber});
  @override
  List<Object?> get props => [name, phoneNumber];
}

class TransferSuccess extends TransferState {
  final String reference;
  final double newBalance;
  const TransferSuccess({required this.reference, required this.newBalance});
  @override
  List<Object?> get props => [reference, newBalance];
}

class TransferError extends TransferState {
  final String message;
  const TransferError(this.message);
  @override
  List<Object?> get props => [message];
}
