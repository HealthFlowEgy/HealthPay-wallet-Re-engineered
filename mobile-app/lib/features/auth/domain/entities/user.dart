import 'package:equatable/equatable.dart';

/// User Entity
class User extends Equatable {
  final String id;
  final String phoneNumber;
  final String? name;
  final String? email;
  final UserRole role;
  final String? kycLevel;
  final Wallet? wallet;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.phoneNumber,
    this.name,
    this.email,
    this.role = UserRole.user,
    this.kycLevel,
    this.wallet,
    this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        phoneNumber,
        name,
        email,
        role,
        kycLevel,
        wallet,
        createdAt,
        updatedAt,
      ];

  User copyWith({
    String? id,
    String? phoneNumber,
    String? name,
    String? email,
    UserRole? role,
    String? kycLevel,
    Wallet? wallet,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      kycLevel: kycLevel ?? this.kycLevel,
      wallet: wallet ?? this.wallet,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// User Role Enum
enum UserRole { user, merchant, admin }

/// Wallet Entity
class Wallet extends Equatable {
  final String id;
  final double balance;
  final double pendingBalance;
  final String currency;
  final String userId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Wallet({
    required this.id,
    required this.balance,
    this.pendingBalance = 0,
    this.currency = 'EGP',
    required this.userId,
    this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
        id,
        balance,
        pendingBalance,
        currency,
        userId,
        createdAt,
        updatedAt,
      ];
}

/// OTP Response Entity
class OTPResponse extends Equatable {
  final bool success;
  final String? message;
  final int? expiresIn;
  final String? messageId;
  final String? devOTP; // For development testing

  const OTPResponse({
    required this.success,
    this.message,
    this.expiresIn,
    this.messageId,
    this.devOTP,
  });

  @override
  List<Object?> get props => [success, message, expiresIn, messageId, devOTP];
}

/// Auth Response Entity
class AuthResponse extends Equatable {
  final bool success;
  final String? message;
  final String? token;
  final User? user;
  final bool isNewUser;

  const AuthResponse({
    required this.success,
    this.message,
    this.token,
    this.user,
    this.isNewUser = false,
  });

  @override
  List<Object?> get props => [success, message, token, user, isNewUser];
}

/// Pin Response Entity
class PinResponse extends Equatable {
  final bool success;
  final String? message;

  const PinResponse({
    required this.success,
    this.message,
  });

  @override
  List<Object?> get props => [success, message];
}
