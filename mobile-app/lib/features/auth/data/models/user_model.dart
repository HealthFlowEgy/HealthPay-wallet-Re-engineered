import 'package:healthpay/features/auth/domain/entities/user.dart';

/// User Model
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.phoneNumber,
    super.name,
    super.email,
    super.role,
    super.kycLevel,
    super.wallet,
    super.createdAt,
    super.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      phoneNumber: json['phoneNumber'] as String,
      name: json['name'] as String?,
      email: json['email'] as String?,
      role: _parseRole(json['role'] as String?),
      kycLevel: json['kycLevel'] as String?,
      wallet: json['wallet'] != null
          ? WalletModel.fromJson(json['wallet'] as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phoneNumber': phoneNumber,
      'name': name,
      'email': email,
      'role': role.name.toUpperCase(),
      'kycLevel': kycLevel,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  static UserRole _parseRole(String? role) {
    switch (role?.toUpperCase()) {
      case 'MERCHANT':
        return UserRole.merchant;
      case 'ADMIN':
        return UserRole.admin;
      default:
        return UserRole.user;
    }
  }
}

/// Wallet Model
class WalletModel extends Wallet {
  const WalletModel({
    required super.id,
    required super.balance,
    super.pendingBalance,
    super.currency,
    required super.userId,
    super.createdAt,
    super.updatedAt,
  });

  factory WalletModel.fromJson(Map<String, dynamic> json) {
    return WalletModel(
      id: json['id'] as String,
      balance: (json['balance'] as num?)?.toDouble() ?? 0.0,
      pendingBalance: (json['pendingBalance'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] as String? ?? 'EGP',
      userId: json['userId'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'balance': balance,
      'pendingBalance': pendingBalance,
      'currency': currency,
      'userId': userId,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}

/// OTP Response Model
class OTPResponseModel extends OTPResponse {
  const OTPResponseModel({
    required super.success,
    super.message,
    super.expiresIn,
    super.messageId,
    super.devOTP,
  });

  factory OTPResponseModel.fromJson(Map<String, dynamic> json) {
    return OTPResponseModel(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String?,
      expiresIn: json['expiresIn'] as int?,
      messageId: json['messageId'] as String?,
      devOTP: json['devOTP'] as String?,
    );
  }
}

/// Auth Response Model
class AuthResponseModel extends AuthResponse {
  const AuthResponseModel({
    required super.success,
    super.message,
    super.token,
    super.user,
    super.isNewUser,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String?,
      token: json['token'] as String?,
      user: json['user'] != null
          ? UserModel.fromJson(json['user'] as Map<String, dynamic>)
          : null,
      isNewUser: json['isNewUser'] as bool? ?? false,
    );
  }
}

/// Pin Response Model
class PinResponseModel extends PinResponse {
  const PinResponseModel({
    required super.success,
    super.message,
  });

  factory PinResponseModel.fromJson(Map<String, dynamic> json) {
    return PinResponseModel(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String?,
    );
  }
}
