import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:healthpay/features/bills/domain/repositories/bills_repository.dart';

// Events
abstract class BillsEvent extends Equatable {
  const BillsEvent();
  @override
  List<Object?> get props => [];
}

class LoadBillCategories extends BillsEvent {}

class SelectCategory extends BillsEvent {
  final String categoryId;
  const SelectCategory(this.categoryId);
  @override
  List<Object?> get props => [categoryId];
}

class SelectProvider extends BillsEvent {
  final String providerId;
  const SelectProvider(this.providerId);
  @override
  List<Object?> get props => [providerId];
}

class InquireBill extends BillsEvent {
  final String accountNumber;
  const InquireBill(this.accountNumber);
  @override
  List<Object?> get props => [accountNumber];
}

class PayBill extends BillsEvent {
  final String billId;
  final String pin;
  const PayBill({required this.billId, required this.pin});
  @override
  List<Object?> get props => [billId, pin];
}

class ResetBillFlow extends BillsEvent {}

// States
abstract class BillsState extends Equatable {
  const BillsState();
  @override
  List<Object?> get props => [];
}

class BillsInitial extends BillsState {}

class BillsLoading extends BillsState {}

class BillCategoriesLoaded extends BillsState {
  final List<BillCategory> categories;
  const BillCategoriesLoaded(this.categories);
  @override
  List<Object?> get props => [categories];
}

class BillProvidersLoaded extends BillsState {
  final BillCategory category;
  final List<BillProvider> providers;
  const BillProvidersLoaded({required this.category, required this.providers});
  @override
  List<Object?> get props => [category, providers];
}

class BillInquiryLoaded extends BillsState {
  final BillProvider provider;
  final BillInquiry inquiry;
  const BillInquiryLoaded({required this.provider, required this.inquiry});
  @override
  List<Object?> get props => [provider, inquiry];
}

class BillPaymentSuccess extends BillsState {
  final String referenceNumber;
  final double amount;
  final String providerName;
  const BillPaymentSuccess({
    required this.referenceNumber,
    required this.amount,
    required this.providerName,
  });
  @override
  List<Object?> get props => [referenceNumber, amount, providerName];
}

class BillsError extends BillsState {
  final String message;
  const BillsError(this.message);
  @override
  List<Object?> get props => [message];
}

// BLoC
class BillsBloc extends Bloc<BillsEvent, BillsState> {
  final BillsRepository repository;
  
  BillCategory? _selectedCategory;
  BillProvider? _selectedProvider;

  BillsBloc({required this.repository}) : super(BillsInitial()) {
    on<LoadBillCategories>(_onLoadCategories);
    on<SelectCategory>(_onSelectCategory);
    on<SelectProvider>(_onSelectProvider);
    on<InquireBill>(_onInquireBill);
    on<PayBill>(_onPayBill);
    on<ResetBillFlow>(_onResetFlow);
  }

  Future<void> _onLoadCategories(
    LoadBillCategories event,
    Emitter<BillsState> emit,
  ) async {
    emit(BillsLoading());
    try {
      final categories = await repository.getBillCategories();
      emit(BillCategoriesLoaded(categories));
    } catch (e) {
      emit(BillsError(e.toString()));
    }
  }

  Future<void> _onSelectCategory(
    SelectCategory event,
    Emitter<BillsState> emit,
  ) async {
    emit(BillsLoading());
    try {
      final categories = await repository.getBillCategories();
      _selectedCategory = categories.firstWhere((c) => c.id == event.categoryId);
      final providers = await repository.getProviders(event.categoryId);
      emit(BillProvidersLoaded(
        category: _selectedCategory!,
        providers: providers,
      ));
    } catch (e) {
      emit(BillsError(e.toString()));
    }
  }

  Future<void> _onSelectProvider(
    SelectProvider event,
    Emitter<BillsState> emit,
  ) async {
    if (state is BillProvidersLoaded) {
      final currentState = state as BillProvidersLoaded;
      _selectedProvider = currentState.providers.firstWhere(
        (p) => p.id == event.providerId,
      );
    }
  }

  Future<void> _onInquireBill(
    InquireBill event,
    Emitter<BillsState> emit,
  ) async {
    if (_selectedProvider == null) return;
    
    emit(BillsLoading());
    try {
      final inquiry = await repository.inquireBill(
        providerId: _selectedProvider!.id,
        accountNumber: event.accountNumber,
      );
      emit(BillInquiryLoaded(
        provider: _selectedProvider!,
        inquiry: inquiry,
      ));
    } catch (e) {
      emit(BillsError(e.toString()));
    }
  }

  Future<void> _onPayBill(
    PayBill event,
    Emitter<BillsState> emit,
  ) async {
    emit(BillsLoading());
    try {
      final result = await repository.payBill(
        billId: event.billId,
        pin: event.pin,
      );
      emit(BillPaymentSuccess(
        referenceNumber: result.referenceNumber,
        amount: result.amount,
        providerName: _selectedProvider?.name ?? '',
      ));
    } catch (e) {
      emit(BillsError(e.toString()));
    }
  }

  void _onResetFlow(ResetBillFlow event, Emitter<BillsState> emit) {
    _selectedCategory = null;
    _selectedProvider = null;
    emit(BillsInitial());
  }
}

// Models
class BillCategory {
  final String id;
  final String name;
  final String nameAr;
  final String icon;

  const BillCategory({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.icon,
  });
}

class BillProvider {
  final String id;
  final String name;
  final String nameAr;
  final String? logo;

  const BillProvider({
    required this.id,
    required this.name,
    required this.nameAr,
    this.logo,
  });
}

class BillInquiry {
  final String billId;
  final String subscriberName;
  final double amount;
  final String? dueDate;
  final String? period;

  const BillInquiry({
    required this.billId,
    required this.subscriberName,
    required this.amount,
    this.dueDate,
    this.period,
  });
}

class BillPaymentResult {
  final String referenceNumber;
  final double amount;
  final DateTime timestamp;

  const BillPaymentResult({
    required this.referenceNumber,
    required this.amount,
    required this.timestamp,
  });
}
