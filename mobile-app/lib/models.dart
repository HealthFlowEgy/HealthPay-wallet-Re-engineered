// lib/data/models/user_model.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String phoneNumber,
    String? email,
    required String firstName,
    required String lastName,
    String? nationalId,
    String? dateOfBirth,
    String? address,
    String? city,
    String? governorate,
    @Default('pending') String status,
    @Default('not_started') String kycStatus,
    @Default(0) int kycLevel,
    String? profileImage,
    DateTime? lastLoginAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}

// lib/data/models/wallet_model.dart

@freezed
class WalletModel with _$WalletModel {
  const factory WalletModel({
    required String id,
    String? userId,
    String? merchantId,
    String? walletNumber,
    @Default('0.00') String balance,
    @Default('0.00') String availableBalance,
    @Default('0.00') String pendingBalance,
    @Default('EGP') String currency,
    @Default('10000.00') String dailyLimit,
    @Default('100000.00') String monthlyLimit,
    @Default(true) bool isActive,
    DateTime? lastTransactionAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _WalletModel;

  factory WalletModel.fromJson(Map<String, dynamic> json) =>
      _$WalletModelFromJson(json);
}

// lib/data/models/transaction_model.dart

@freezed
class TransactionModel with _$TransactionModel {
  const factory TransactionModel({
    required String id,
    required String reference,
    String? externalReference,
    required String type,
    @Default('pending') String status,
    required String amount,
    @Default('0.00') String fee,
    required String netAmount,
    @Default('EGP') String currency,
    String? senderWalletId,
    String? recipientWalletId,
    String? recipientPhone,
    String? recipientName,
    String? senderBalanceBefore,
    String? senderBalanceAfter,
    String? description,
    String? notes,
    Map<String, dynamic>? metadata,
    String? failureReason,
    required DateTime createdAt,
    DateTime? completedAt,
  }) = _TransactionModel;

  factory TransactionModel.fromJson(Map<String, dynamic> json) =>
      _$TransactionModelFromJson(json);
}

// lib/data/models/merchant_model.dart

@freezed
class MerchantModel with _$MerchantModel {
  const factory MerchantModel({
    required String id,
    required String merchantCode,
    required String businessName,
    String? businessNameAr,
    String? businessType,
    required String email,
    String? phone,
    String? address,
    String? city,
    String? governorate,
    String? website,
    String? logo,
    @Default('pending') String status,
    @Default('0.0250') String commissionRate,
    @Default(1) int settlementPeriod,
    String? settlementAccount,
    String? settlementBank,
    DateTime? lastLoginAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _MerchantModel;

  factory MerchantModel.fromJson(Map<String, dynamic> json) =>
      _$MerchantModelFromJson(json);
}

// lib/data/models/admin_model.dart

@freezed
class AdminModel with _$AdminModel {
  const factory AdminModel({
    required String id,
    required String email,
    required String firstName,
    required String lastName,
    String? phone,
    @Default('viewer') String role,
    Map<String, dynamic>? permissions,
    @Default(true) bool isActive,
    DateTime? lastLoginAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _AdminModel;

  factory AdminModel.fromJson(Map<String, dynamic> json) =>
      _$AdminModelFromJson(json);
}

// lib/data/models/otp_response_model.dart

@freezed
class OtpResponseModel with _$OtpResponseModel {
  const factory OtpResponseModel({
    required bool success,
    required String message,
    String? otpId,
    int? expiresIn,
  }) = _OtpResponseModel;

  factory OtpResponseModel.fromJson(Map<String, dynamic> json) =>
      _$OtpResponseModelFromJson(json);
}

// lib/data/models/auth_response_model.dart

@freezed
class AuthResponseModel with _$AuthResponseModel {
  const factory AuthResponseModel({
    required String token,
    required String userId,
    required String userType,
    UserModel? user,
    MerchantModel? merchant,
    AdminModel? admin,
  }) = _AuthResponseModel;

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseModelFromJson(json);
}

// lib/data/models/withdrawal_request_model.dart

@freezed
class WithdrawalRequestModel with _$WithdrawalRequestModel {
  const factory WithdrawalRequestModel({
    required String id,
    required String reference,
    required String walletId,
    required String amount,
    @Default('0.00') String fee,
    required String netAmount,
    @Default('EGP') String currency,
    @Default('pending') String status,
    String? bankName,
    String? accountNumber,
    String? accountName,
    String? iban,
    String? notes,
    String? rejectionReason,
    String? processedBy,
    DateTime? processedAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _WithdrawalRequestModel;

  factory WithdrawalRequestModel.fromJson(Map<String, dynamic> json) =>
      _$WithdrawalRequestModelFromJson(json);
}

// lib/data/models/kyc_document_model.dart

@freezed
class KycDocumentModel with _$KycDocumentModel {
  const factory KycDocumentModel({
    required String id,
    required String userId,
    required String documentType,
    required String documentUrl,
    String? documentNumber,
    String? expiryDate,
    @Default('pending') String status,
    DateTime? verifiedAt,
    String? verifiedBy,
    String? rejectionReason,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _KycDocumentModel;

  factory KycDocumentModel.fromJson(Map<String, dynamic> json) =>
      _$KycDocumentModelFromJson(json);
}

// lib/data/models/analytics_model.dart

@freezed
class SystemAnalyticsModel with _$SystemAnalyticsModel {
  const factory SystemAnalyticsModel({
    @Default(0) int totalUsers,
    @Default(0) int activeUsers,
    @Default(0) int totalMerchants,
    @Default(0) int activeMerchants,
    @Default(0) int totalTransactions,
    @Default('0.00') String totalTransactionVolume,
    @Default(0) int pendingKyc,
    @Default(0) int pendingWithdrawals,
    @Default(0) int todayTransactions,
    @Default('0.00') String todayVolume,
  }) = _SystemAnalyticsModel;

  factory SystemAnalyticsModel.fromJson(Map<String, dynamic> json) =>
      _$SystemAnalyticsModelFromJson(json);
}

@freezed
class MerchantAnalyticsModel with _$MerchantAnalyticsModel {
  const factory MerchantAnalyticsModel({
    @Default(0) int totalPayments,
    @Default('0.00') String totalVolume,
    @Default(0) int todayPayments,
    @Default('0.00') String todayVolume,
    @Default(0) int pendingWithdrawals,
    @Default('0.00') String totalWithdrawn,
  }) = _MerchantAnalyticsModel;

  factory MerchantAnalyticsModel.fromJson(Map<String, dynamic> json) =>
      _$MerchantAnalyticsModelFromJson(json);
}
