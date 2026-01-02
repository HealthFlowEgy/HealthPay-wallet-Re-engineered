import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:healthpay/features/topup/domain/repositories/topup_repository.dart';

part 'topup_event.dart';
part 'topup_state.dart';

class TopUpBloc extends Bloc<TopUpEvent, TopUpState> {
  final TopUpRepository repository;

  TopUpBloc({required this.repository}) : super(TopUpInitial()) {
    on<LoadTopUpMethodsEvent>(_onLoadMethods);
    on<SelectTopUpMethodEvent>(_onSelectMethod);
    on<SelectTopUpAmountEvent>(_onSelectAmount);
    on<ProcessTopUpEvent>(_onProcessTopUp);
    on<ResetTopUpEvent>(_onReset);
  }

  Future<void> _onLoadMethods(
    LoadTopUpMethodsEvent event,
    Emitter<TopUpState> emit,
  ) async {
    emit(TopUpLoading());
    
    final result = await repository.getTopUpMethods();
    
    result.fold(
      (failure) => emit(TopUpError(failure.message)),
      (methods) => emit(TopUpMethodsLoaded(methods: methods)),
    );
  }

  void _onSelectMethod(
    SelectTopUpMethodEvent event,
    Emitter<TopUpState> emit,
  ) {
    if (state is TopUpMethodsLoaded) {
      final currentState = state as TopUpMethodsLoaded;
      emit(currentState.copyWith(selectedMethod: event.method));
    }
  }

  void _onSelectAmount(
    SelectTopUpAmountEvent event,
    Emitter<TopUpState> emit,
  ) {
    if (state is TopUpMethodsLoaded) {
      final currentState = state as TopUpMethodsLoaded;
      emit(currentState.copyWith(selectedAmount: event.amount));
    }
  }

  Future<void> _onProcessTopUp(
    ProcessTopUpEvent event,
    Emitter<TopUpState> emit,
  ) async {
    emit(TopUpProcessing());
    
    final result = await repository.topUpWallet(
      walletId: event.walletId,
      amount: event.amount,
      methodId: event.methodId,
      pin: event.pin,
    );
    
    result.fold(
      (failure) => emit(TopUpError(failure.message)),
      (response) {
        if (response['success'] == true) {
          emit(TopUpSuccess(
            reference: response['reference'] ?? '',
            newBalance: (response['newBalance'] as num?)?.toDouble() ?? 0,
            paymentUrl: response['paymentUrl'],
          ));
        } else {
          emit(TopUpError(response['message'] ?? 'فشل الشحن'));
        }
      },
    );
  }

  void _onReset(ResetTopUpEvent event, Emitter<TopUpState> emit) {
    emit(TopUpInitial());
  }
}
