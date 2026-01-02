part of 'auth_bloc.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

class CheckAuthStatus extends AuthEvent {}

class SendOTPEvent extends AuthEvent {
  final String phoneNumber;
  const SendOTPEvent(this.phoneNumber);
  @override
  List<Object?> get props => [phoneNumber];
}

class VerifyOTPEvent extends AuthEvent {
  final String phoneNumber;
  final String code; // Changed from 'otp' to 'code' to match backend
  const VerifyOTPEvent({required this.phoneNumber, required this.code});
  @override
  List<Object?> get props => [phoneNumber, code];
}

class SetPinEvent extends AuthEvent {
  final String phoneNumber;
  final String pin;
  const SetPinEvent({required this.phoneNumber, required this.pin});
  @override
  List<Object?> get props => [phoneNumber, pin];
}

class VerifyPinEvent extends AuthEvent {
  final String pin;
  const VerifyPinEvent(this.pin);
  @override
  List<Object?> get props => [pin];
}

class LogoutEvent extends AuthEvent {}

class AuthenticateWithBiometricEvent extends AuthEvent {}

class ResendOTPEvent extends AuthEvent {
  final String phoneNumber;
  const ResendOTPEvent(this.phoneNumber);
  @override
  List<Object?> get props => [phoneNumber];
}
