part of 'auth_bloc.dart';

abstract class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthUnauthenticated extends AuthState {}

class OTPSent extends AuthState {
  final String phoneNumber;
  final int expiresIn;
  final String? devOTP;
  const OTPSent({required this.phoneNumber, required this.expiresIn, this.devOTP});
  @override
  List<Object?> get props => [phoneNumber, expiresIn, devOTP];
}

class AuthRequiresPin extends AuthState {}

class AuthRequiresPinSetup extends AuthState {
  final User? user;
  const AuthRequiresPinSetup({this.user});
  @override
  List<Object?> get props => [user];
}

class AuthAuthenticated extends AuthState {
  final User user;
  const AuthAuthenticated({required this.user});
  @override
  List<Object?> get props => [user];
}

class PinSetSuccess extends AuthState {}
class PinVerified extends AuthState {}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
  @override
  List<Object?> get props => [message];
}

class PinError extends AuthState {
  final String message;
  final int? remainingAttempts;
  const PinError({required this.message, this.remainingAttempts});
  @override
  List<Object?> get props => [message, remainingAttempts];
}
