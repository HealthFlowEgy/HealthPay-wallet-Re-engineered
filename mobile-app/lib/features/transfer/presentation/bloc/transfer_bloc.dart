import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:healthpay/features/transfer/domain/repositories/transfer_repository.dart';

part 'transfer_event.dart';
part 'transfer_state.dart';

class TransferBloc extends Bloc<TransferEvent, TransferState> {
  final TransferRepository repository;
  TransferBloc({required this.repository}) : super(TransferInitial()) {
    on<ValidateRecipientEvent>(_onValidateRecipient);
    on<TransferMoneyEvent>(_onTransferMoney);
    on<ResetTransferEvent>(_onReset);
  }

  Future<void> _onValidateRecipient(ValidateRecipientEvent event, Emitter<TransferState> emit) async {
    emit(TransferLoading());
    final result = await repository.validateRecipient(event.phoneNumber);
    result.fold(
      (failure) => emit(TransferError(failure.message)),
      (data) {
        if (data['valid'] == true) {
          emit(RecipientValidated(name: data['name'] ?? '', phoneNumber: event.phoneNumber));
        } else {
          emit(TransferError(data['message'] ?? 'رقم الهاتف غير مسجل'));
        }
      },
    );
  }

  Future<void> _onTransferMoney(TransferMoneyEvent event, Emitter<TransferState> emit) async {
    emit(TransferLoading());
    final result = await repository.transferMoney(
      fromWalletId: event.fromWalletId,
      toPhoneNumber: event.toPhoneNumber,
      amount: event.amount,
      pin: event.pin,
      description: event.description,
    );
    result.fold(
      (failure) => emit(TransferError(failure.message)),
      (data) {
        if (data['success'] == true) {
          emit(TransferSuccess(reference: data['reference'] ?? '', newBalance: (data['newBalance'] as num?)?.toDouble() ?? 0));
        } else {
          emit(TransferError(data['message'] ?? 'فشل التحويل'));
        }
      },
    );
  }

  void _onReset(ResetTransferEvent event, Emitter<TransferState> emit) {
    emit(TransferInitial());
  }
}
