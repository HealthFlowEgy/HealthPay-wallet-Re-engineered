// lib/presentation/bloc/auth/auth_bloc.dart

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../data/models/models.dart';
import '../../../data/repositories/repositories.dart';
import '../../../core/services/services.dart';

// Events
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {}

class AuthSendOtpRequested extends AuthEvent {
  final String phoneNumber;
  const AuthSendOtpRequested(this.phoneNumber);

  @override
  List<Object?> get props => [phoneNumber];
}

class AuthVerifyOtpRequested extends AuthEvent {
  final String phoneNumber;
  final String code;
  const AuthVerifyOtpRequested(this.phoneNumber, this.code);

  @override
  List<Object?> get props => [phoneNumber, code];
}

class AuthAdminLoginRequested extends AuthEvent {
  final String email;
  final String password;
  const AuthAdminLoginRequested(this.email, this.password);

  @override
  List<Object?> get props => [email, password];
}

class AuthMerchantLoginRequested extends AuthEvent {
  final String merchantCode;
  final String password;
  const AuthMerchantLoginRequested(this.merchantCode, this.password);

  @override
  List<Object?> get props => [merchantCode, password];
}

class AuthBiometricRequested extends AuthEvent {}

class AuthLogoutRequested extends AuthEvent {}

class AuthSetPinRequested extends AuthEvent {
  final String pin;
  const AuthSetPinRequested(this.pin);

  @override
  List<Object?> get props => [pin];
}

class AuthVerifyPinRequested extends AuthEvent {
  final String pin;
  const AuthVerifyPinRequested(this.pin);

  @override
  List<Object?> get props => [pin];
}

// States
abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthUnauthenticated extends AuthState {}

class AuthOtpSent extends AuthState {
  final String phoneNumber;
  final int expiresIn;
  const AuthOtpSent(this.phoneNumber, this.expiresIn);

  @override
  List<Object?> get props => [phoneNumber, expiresIn];
}

class AuthOtpVerified extends AuthState {
  final String userId;
  final bool hasPinSet;
  const AuthOtpVerified(this.userId, this.hasPinSet);

  @override
  List<Object?> get props => [userId, hasPinSet];
}

class AuthPinRequired extends AuthState {
  final String userId;
  const AuthPinRequired(this.userId);

  @override
  List<Object?> get props => [userId];
}

class AuthPinSetupRequired extends AuthState {
  final String userId;
  const AuthPinSetupRequired(this.userId);

  @override
  List<Object?> get props => [userId];
}

class AuthAuthenticated extends AuthState {
  final String userId;
  final String userType;
  final UserModel? user;
  final MerchantModel? merchant;
  final AdminModel? admin;

  const AuthAuthenticated({
    required this.userId,
    required this.userType,
    this.user,
    this.merchant,
    this.admin,
  });

  @override
  List<Object?> get props => [userId, userType, user, merchant, admin];
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);

  @override
  List<Object?> get props => [message];
}

// BLoC
@injectable
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;
  final BiometricService _biometricService;
  final SecureStorageService _storageService;

  String? _currentUserId;

  AuthBloc(
    this._authRepository,
    this._biometricService,
    this._storageService,
  ) : super(AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthSendOtpRequested>(_onSendOtpRequested);
    on<AuthVerifyOtpRequested>(_onVerifyOtpRequested);
    on<AuthAdminLoginRequested>(_onAdminLoginRequested);
    on<AuthMerchantLoginRequested>(_onMerchantLoginRequested);
    on<AuthBiometricRequested>(_onBiometricRequested);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthSetPinRequested>(_onSetPinRequested);
    on<AuthVerifyPinRequested>(_onVerifyPinRequested);
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final isLoggedIn = await _authRepository.isLoggedIn();
      if (!isLoggedIn) {
        emit(AuthUnauthenticated());
        return;
      }

      final userType = await _authRepository.getUserType();
      final userId = await _storageService.getUserId();

      if (userId == null || userType == null) {
        emit(AuthUnauthenticated());
        return;
      }

      _currentUserId = userId;

      // Check if biometric is enabled
      final biometricEnabled = await _storageService.isBiometricEnabled();
      if (biometricEnabled) {
        emit(AuthPinRequired(userId));
      } else {
        emit(AuthAuthenticated(userId: userId, userType: userType));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onSendOtpRequested(
    AuthSendOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final response = await _authRepository.sendOtp(event.phoneNumber);
      emit(AuthOtpSent(event.phoneNumber, response.expiresIn ?? 120));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onVerifyOtpRequested(
    AuthVerifyOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final response = await _authRepository.verifyOtp(
        event.phoneNumber,
        event.code,
      );

      _currentUserId = response.userId;

      // Check if PIN is set
      final hasPinSet = await _authRepository.hasPinSet(response.userId);

      if (!hasPinSet) {
        emit(AuthPinSetupRequired(response.userId));
      } else {
        emit(AuthAuthenticated(
          userId: response.userId,
          userType: response.userType,
          user: response.user,
        ));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onAdminLoginRequested(
    AuthAdminLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final response = await _authRepository.adminLogin(
        event.email,
        event.password,
      );

      _currentUserId = response.userId;

      emit(AuthAuthenticated(
        userId: response.userId,
        userType: 'admin',
        admin: response.admin,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onMerchantLoginRequested(
    AuthMerchantLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final response = await _authRepository.merchantLogin(
        event.merchantCode,
        event.password,
      );

      _currentUserId = response.userId;

      emit(AuthAuthenticated(
        userId: response.userId,
        userType: 'merchant',
        merchant: response.merchant,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onBiometricRequested(
    AuthBiometricRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final authenticated = await _biometricService.authenticate(
        reason: 'Authenticate to access HealthPay',
      );

      if (authenticated) {
        final userType = await _authRepository.getUserType();
        final userId = await _storageService.getUserId();

        emit(AuthAuthenticated(
          userId: userId!,
          userType: userType!,
        ));
      } else {
        emit(AuthPinRequired(_currentUserId!));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      await _authRepository.logout();
      _currentUserId = null;
      emit(AuthUnauthenticated());
    } catch (e) {
      // Even if logout fails, clear local data
      await _storageService.clearAll();
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onSetPinRequested(
    AuthSetPinRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      await _authRepository.setPin(_currentUserId!, event.pin);
      
      final userType = await _authRepository.getUserType();
      
      emit(AuthAuthenticated(
        userId: _currentUserId!,
        userType: userType!,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onVerifyPinRequested(
    AuthVerifyPinRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());

    try {
      final verified = await _authRepository.verifyPin(
        _currentUserId!,
        event.pin,
      );

      if (verified) {
        final userType = await _authRepository.getUserType();
        
        emit(AuthAuthenticated(
          userId: _currentUserId!,
          userType: userType!,
        ));
      } else {
        emit(const AuthError('Invalid PIN'));
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }
}
