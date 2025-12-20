// lib/data/models/models_simple.dart
// 
// Simplified models without Freezed - use this for quick builds
// Replace models.dart with this file if you want to skip build_runner

import 'package:equatable/equatable.dart';

// ==================== USER MODEL ====================
class UserModel extends Equatable {
  final String id;
  final String phoneNumber;
  final String? email;
  final String? firstName;
  final String? lastName;
  final String? nationalId;
  final DateTime? dateOfBirth;
  final String? address;
  final String? city;
  final String? governorate;
  final String status;
  final String kycStatus;
  final int kycLevel;
  final String? profileImage;
  final DateTime? lastLoginAt;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const UserModel({
    required this.id,
    required this.phoneNumber,
    this.email,
    this.firstName,
    this.lastName,
    this.nationalId,
    this.dateOfBirth,
    this.address,
    this.city,
    this.governorate,
    this.status = 'active',
    this.kycStatus = 'pending',
    this.kycLevel = 0,
    this.profileImage,
    this.lastLoginAt,
    required this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      phoneNumber: json['phone_number'] as String,
      email: json['email'] as String?,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      nationalId: json['national_id'] as String?,
      dateOfBirth: json['date_of_birth'] != null 
          ? DateTime.parse(json['date_of_birth'] as String) 
          : null,
      address: json['address'] as String?,
      city: json['city'] as String?,
      governorate: json['governorate'] as String?,
      status: json['status'] as String? ?? 'active',
      kycStatus: json['kyc_status'] as String? ?? 'pending',
      kycLevel: json['kyc_level'] as int? ?? 0,
      profileImage: json['profile_image'] as String?,
      lastLoginAt: json['last_login_at'] != null 
          ? DateTime.parse(json['last_login_at'] as String) 
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone_number': phoneNumber,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'national_id': nationalId,
      'date_of_birth': dateOfBirth?.toIso8601String(),
      'address': address,
      'city': city,
      'governorate': governorate,
      'status': status,
      'kyc_status': kycStatus,
      'kyc_level': kycLevel,
      'profile_image': profileImage,
      'last_login_at': lastLoginAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();

  UserModel copyWith({
    String? id,
    String? phoneNumber,
    String? email,
    String? firstName,
    String? lastName,
    String? status,
    String? kycStatus,
    int? kycLevel,
  }) {
    return UserModel(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      status: status ?? this.status,
      kycStatus: kycStatus ?? this.kycStatus,
      kycLevel: kycLevel ?? this.kycLevel,
      createdAt: createdAt,
    );
  }

  @override
  List<Object?> get props => [id, phoneNumber, email, firstName, lastName];
}

// ==================== WALLET MODEL ====================
class WalletModel extends Equatable {
  final String id;
  final String? userId;
  final String? merchantId;
  final String? walletNumber;
  final double balance;
  final double availableBalance;
  final double pendingBalance;
  final String currency;
  final double dailyLimit;
  final double monthlyLimit;
  final bool isActive;
  final DateTime? lastTransactionAt;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const WalletModel({
    required this.id,
    this.userId,
    this.merchantId,
    this.walletNumber,
    this.balance = 0.0,
    this.availableBalance = 0.0,
    this.pendingBalance = 0.0,
    this.currency = 'EGP',
    this.dailyLimit = 100000.0,
    this.monthlyLimit = 500000.0,
    this.isActive = true,
    this.lastTransactionAt,
    required this.createdAt,
    this.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      id: json['id'] as String,
      userId: json['user_id'] as String?,
      merchantId: json['merchant_id'] as String?,
      walletNumber: json['wallet_number'] as String?,
      balance: (json['balance'] as num?)?.toDouble() ?? 0.0,
      availableBalance: (json['available_balance'] as num?)?.toDouble() ?? 0.0,
      pendingBalance: (json['pending_balance'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] as String? ?? 'EGP',
      dailyLimit: (json['daily_limit'] as num?)?.toDouble() ?? 100000.0,
      monthlyLimit: (json['monthly_limit'] as num?)?.toDouble() ?? 500000.0,
      isActive: json['is_active'] as bool? ?? true,
      lastTransactionAt: json['last_transaction_at'] != null 
          ? DateTime.parse(json['last_transaction_at'] as String) 
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'merchant_id': merchantId,
      'wallet_number': walletNumber,
      'balance': balance,
      'available_balance': availableBalance,
      'pending_balance': pendingBalance,
      'currency': currency,
      'daily_limit': dailyLimit,
      'monthly_limit': monthlyLimit,
      'is_active': isActive,
      'last_transaction_at': lastTransactionAt?.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  WalletModel copyWith({
    double? balance,
    double? availableBalance,
    double? pendingBalance,
    bool? isActive,
  }) {
    return WalletModel(
      id: id,
      userId: userId,
      merchantId: merchantId,
      walletNumber: walletNumber,
      balance: balance ?? this.balance,
      availableBalance: availableBalance ?? this.availableBalance,
      pendingBalance: pendingBalance ?? this.pendingBalance,
      currency: currency,
      dailyLimit: dailyLimit,
      monthlyLimit: monthlyLimit,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt,
    );
  }

  @override
  List<Object?> get props => [id, balance, availableBalance];
}

// ==================== TRANSACTION MODEL ====================
class TransactionModel extends Equatable {
  final String id;
  final String reference;
  final String? externalReference;
  final String type;
  final String status;
  final double amount;
  final double fee;
  final double netAmount;
  final String currency;
  final String? senderWalletId;
  final String? recipientWalletId;
  final String? recipientPhone;
  final String? recipientName;
  final double? balanceBefore;
  final double? balanceAfter;
  final String? description;
  final String? notes;
  final Map<String, dynamic>? metadata;
  final String? failureReason;
  final DateTime createdAt;
  final DateTime? completedAt;

  const TransactionModel({
    required this.id,
    required this.reference,
    this.externalReference,
    required this.type,
    required this.status,
    required this.amount,
    this.fee = 0.0,
    required this.netAmount,
    this.currency = 'EGP',
    this.senderWalletId,
    this.recipientWalletId,
    this.recipientPhone,
    this.recipientName,
    this.balanceBefore,
    this.balanceAfter,
    this.description,
    this.notes,
    this.metadata,
    this.failureReason,
    required this.createdAt,
    this.completedAt,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      externalReference: json['external_reference'] as String?,
      type: json['type'] as String,
      status: json['status'] as String,
      amount: (json['amount'] as num).toDouble(),
      fee: (json['fee'] as num?)?.toDouble() ?? 0.0,
      netAmount: (json['net_amount'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'EGP',
      senderWalletId: json['sender_wallet_id'] as String?,
      recipientWalletId: json['recipient_wallet_id'] as String?,
      recipientPhone: json['recipient_phone'] as String?,
      recipientName: json['recipient_name'] as String?,
      balanceBefore: (json['balance_before'] as num?)?.toDouble(),
      balanceAfter: (json['balance_after'] as num?)?.toDouble(),
      description: json['description'] as String?,
      notes: json['notes'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      failureReason: json['failure_reason'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      completedAt: json['completed_at'] != null 
          ? DateTime.parse(json['completed_at'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reference': reference,
      'external_reference': externalReference,
      'type': type,
      'status': status,
      'amount': amount,
      'fee': fee,
      'net_amount': netAmount,
      'currency': currency,
      'sender_wallet_id': senderWalletId,
      'recipient_wallet_id': recipientWalletId,
      'recipient_phone': recipientPhone,
      'recipient_name': recipientName,
      'balance_before': balanceBefore,
      'balance_after': balanceAfter,
      'description': description,
      'notes': notes,
      'metadata': metadata,
      'failure_reason': failureReason,
      'created_at': createdAt.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
    };
  }

  bool get isCredit => type.contains('received') || type == 'topup';
  bool get isDebit => type.contains('sent') || type == 'payment' || type == 'withdrawal';
  bool get isCompleted => status == 'completed';
  bool get isPending => status == 'pending';
  bool get isFailed => status == 'failed';

  @override
  List<Object?> get props => [id, reference, amount, status];
}

// ==================== AUTH RESPONSE MODEL ====================
class AuthResponseModel extends Equatable {
  final String accessToken;
  final String refreshToken;
  final String userId;
  final String userType;
  final int expiresIn;

  const AuthResponseModel({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.userType,
    required this.expiresIn,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      accessToken: json['access_token'] as String,
      refreshToken: json['refresh_token'] as String,
      userId: json['user_id'] as String,
      userType: json['user_type'] as String? ?? 'customer',
      expiresIn: json['expires_in'] as int? ?? 3600,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'access_token': accessToken,
      'refresh_token': refreshToken,
      'user_id': userId,
      'user_type': userType,
      'expires_in': expiresIn,
    };
  }

  @override
  List<Object?> get props => [accessToken, userId, userType];
}

// ==================== OTP RESPONSE MODEL ====================
class OtpResponseModel extends Equatable {
  final String requestId;
  final String phoneNumber;
  final int expiresIn;
  final int attemptsRemaining;

  const OtpResponseModel({
    required this.requestId,
    required this.phoneNumber,
    this.expiresIn = 120,
    this.attemptsRemaining = 3,
  });

  factory OtpResponseModel.fromJson(Map<String, dynamic> json) {
    return OtpResponseModel(
      requestId: json['request_id'] as String,
      phoneNumber: json['phone_number'] as String,
      expiresIn: json['expires_in'] as int? ?? 120,
      attemptsRemaining: json['attempts_remaining'] as int? ?? 3,
    );
  }

  @override
  List<Object?> get props => [requestId, phoneNumber];
}

// ==================== MERCHANT MODEL ====================
class MerchantModel extends Equatable {
  final String id;
  final String merchantCode;
  final String businessNameEn;
  final String? businessNameAr;
  final String businessType;
  final String email;
  final String phone;
  final String? address;
  final String? city;
  final String? logo;
  final String status;
  final double commissionRate;
  final int settlementPeriod;
  final String? settlementAccount;
  final String? settlementBank;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const MerchantModel({
    required this.id,
    required this.merchantCode,
    required this.businessNameEn,
    this.businessNameAr,
    required this.businessType,
    required this.email,
    required this.phone,
    this.address,
    this.city,
    this.logo,
    this.status = 'pending',
    this.commissionRate = 2.5,
    this.settlementPeriod = 7,
    this.settlementAccount,
    this.settlementBank,
    required this.createdAt,
    this.updatedAt,
  });

  factory MerchantModel.fromJson(Map<String, dynamic> json) {
    return MerchantModel(
      id: json['id'] as String,
      merchantCode: json['merchant_code'] as String,
      businessNameEn: json['business_name_en'] as String,
      businessNameAr: json['business_name_ar'] as String?,
      businessType: json['business_type'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String,
      address: json['address'] as String?,
      city: json['city'] as String?,
      logo: json['logo'] as String?,
      status: json['status'] as String? ?? 'pending',
      commissionRate: (json['commission_rate'] as num?)?.toDouble() ?? 2.5,
      settlementPeriod: json['settlement_period'] as int? ?? 7,
      settlementAccount: json['settlement_account'] as String?,
      settlementBank: json['settlement_bank'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'] as String) 
          : null,
    );
  }

  String get displayName => businessNameEn;

  @override
  List<Object?> get props => [id, merchantCode, businessNameEn];
}
