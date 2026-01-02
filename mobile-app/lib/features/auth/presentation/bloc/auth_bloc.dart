import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:healthpay/core/network/secure_storage.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/auth/domain/usecases/send_otp.dart';
import 'package:healthpay/features/auth/domain/usecases/verify_otp.dart';
import 'package:healthpay/features/auth/domain/usecases/set_pin.dart';
import 'package:healthpay/features/auth/domain/usecases/verify_pin.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final SendOTP sendOTP;
  final VerifyOTP verifyOTP;
  final SetPin setPin;
  final VerifyPin verifyPin;
  final SecureStorageService secureStorage;

  AuthBloc({
    required this.sendOTP,
    required this.verifyOTP,
    required this.setPin,
    required this.verifyPin,
    required this.secureStorage,
  }) : super(AuthInitial()) {
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<SendOTPEvent>(_onSendOTP);
    on<VerifyOTPEvent>(_onVerifyOTP);
    on<SetPinEvent>(_onSetPin);
    on<VerifyPinEvent>(_onVerifyPin);
    on<LogoutEvent>(_onLogout);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    final isLoggedIn = await secureStorage.isLoggedIn();
    
    if (!isLoggedIn) {
      emit(AuthUnauthenticated());
      return;
    }

    final hasPin = await secureStorage.hasPin();
    if (hasPin) {
      emit(AuthRequiresPin());
    } else {
      emit(AuthRequiresPinSetup());
    }
  }

  Future<void> _onSendOTP(
    SendOTPEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    final result = await sendOTP(event.phoneNumber);
    
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (response) {
        if (response.success) {
          emit(OTPSent(
            phoneNumber: event.phoneNumber,
            expiresIn: response.expiresIn ?? 60,
            devOTP: response.devOTP,
          ));
        } else {
          emit(AuthError(response.message ?? 'Failed to send OTP'));
        }
      },
    );
  }

  Future<void> _onVerifyOTP(
    VerifyOTPEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    final result = await verifyOTP(
      phoneNumber: event.phoneNumber,
      code: event.code, // Changed from 'otp' to 'code' to match backend
    );
    
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (response) {
        if (response.success) {
          if (response.isNewUser) {
            emit(AuthRequiresPinSetup(user: response.user));
          } else {
            emit(AuthAuthenticated(user: response.user!));
          }
        } else {
          emit(AuthError(response.message ?? 'Invalid OTP'));
        }
      },
    );
  }

  Future<void> _onSetPin(
    SetPinEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    final result = await setPin(
      phoneNumber: event.phoneNumber,
      pin: event.pin,
    );
    
    result.fold(
      (failure) => emit(AuthError(failure.message)),
      (response) {
        if (response.success) {
          emit(PinSetSuccess());
        } else {
          emit(AuthError(response.message ?? 'Failed to set PIN'));
        }
      },
    );
  }

  Future<void> _onVerifyPin(
    VerifyPinEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    
    final result = await verifyPin(event.pin);
    
    result.fold(
      (failure) => emit(PinError(
        message: failure.message,
        remainingAttempts: failure is PinFailure ? failure.remainingAttempts : null,
      )),
      (isValid) {
        if (isValid) {
          emit(PinVerified());
        } else {
          emit(const PinError(message: 'Invalid PIN'));
        }
      },
    );
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<AuthState> emit,
  ) async {
    await secureStorage.clearAll();
    emit(AuthUnauthenticated());
  }
}
