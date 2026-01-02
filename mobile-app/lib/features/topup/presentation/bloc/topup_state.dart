part of 'topup_bloc.dart';

abstract class TopUpState extends Equatable {
  const TopUpState();
  @override
  List<Object?> get props => [];
}

class TopUpInitial extends TopUpState {}

class TopUpLoading extends TopUpState {}

class TopUpProcessing extends TopUpState {}

class TopUpMethodsLoaded extends TopUpState {
  final List<TopUpMethod> methods;
  final TopUpMethod? selectedMethod;
  final double? selectedAmount;

  const TopUpMethodsLoaded({
    required this.methods,
    this.selectedMethod,
    this.selectedAmount,
  });

  TopUpMethodsLoaded copyWith({
    List<TopUpMethod>? methods,
    TopUpMethod? selectedMethod,
    double? selectedAmount,
  }) {
    return TopUpMethodsLoaded(
      methods: methods ?? this.methods,
      selectedMethod: selectedMethod ?? this.selectedMethod,
      selectedAmount: selectedAmount ?? this.selectedAmount,
    );
  }

  @override
  List<Object?> get props => [methods, selectedMethod, selectedAmount];
}

class TopUpSuccess extends TopUpState {
  final String reference;
  final double newBalance;
  final String? paymentUrl;

  const TopUpSuccess({
    required this.reference,
    required this.newBalance,
    this.paymentUrl,
  });

  @override
  List<Object?> get props => [reference, newBalance, paymentUrl];
}

class TopUpError extends TopUpState {
  final String message;
  const TopUpError(this.message);
  @override
  List<Object?> get props => [message];
}

/// TopUp Method Entity
class TopUpMethod extends Equatable {
  final String id;
  final String name;
  final String nameAr;
  final String type;
  final String? icon;
  final double minAmount;
  final double maxAmount;
  final double fee;
  final String feeType; // 'fixed' or 'percentage'
  final bool enabled;

  const TopUpMethod({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.type,
    this.icon,
    required this.minAmount,
    required this.maxAmount,
    required this.fee,
    required this.feeType,
    required this.enabled,
  });

  factory TopUpMethod.fromJson(Map<String, dynamic> json) {
    return TopUpMethod(
      id: json['id'] as String,
      name: json['name'] as String,
      nameAr: json['nameAr'] as String? ?? json['name'] as String,
      type: json['type'] as String,
      icon: json['icon'] as String?,
      minAmount: (json['minAmount'] as num?)?.toDouble() ?? 10,
      maxAmount: (json['maxAmount'] as num?)?.toDouble() ?? 10000,
      fee: (json['fee'] as num?)?.toDouble() ?? 0,
      feeType: json['feeType'] as String? ?? 'fixed',
      enabled: json['enabled'] as bool? ?? true,
    );
  }

  @override
  List<Object?> get props => [id, name, nameAr, type, icon, minAmount, maxAmount, fee, feeType, enabled];
}
