import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/widgets/custom_text_field.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';

class PinEntryScreen extends StatefulWidget {
  const PinEntryScreen({super.key});
  @override
  State<PinEntryScreen> createState() => _PinEntryScreenState();
}

class _PinEntryScreenState extends State<PinEntryScreen> {
  String? _errorText;
  int? _remainingAttempts;

  void _onPinEntered(String pin) {
    setState(() => _errorText = null);
    context.read<AuthBloc>().add(VerifyPinEvent(pin));
  }

  void _onLogout() {
    context.read<AuthBloc>().add(LogoutEvent());
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is PinVerified) { context.go(RouteConstants.dashboard); }
        else if (state is PinError) { setState(() { _errorText = state.message; _remainingAttempts = state.remainingAttempts; }); }
        else if (state is AuthUnauthenticated) { context.go(RouteConstants.login); }
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 48),
                // Logo
                Container(width: 80, height: 80, decoration: BoxDecoration(color: AppColors.primarySurface, shape: BoxShape.circle),
                  child: const Center(child: Text('HP', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.primary)))),
                const SizedBox(height: 32),
                Text('مرحباً بعودتك', style: AppTypography.headline2),
                const SizedBox(height: 8),
                Text('أدخل رمز PIN للمتابعة', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
                const SizedBox(height: 48),
                // PIN Input
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    return PINInputField(onCompleted: _onPinEntered, errorText: _errorText);
                  },
                ),
                if (_remainingAttempts != null) ...[
                  const SizedBox(height: 8),
                  Text('المحاولات المتبقية: $_remainingAttempts', style: AppTypography.caption.copyWith(color: AppColors.warning)),
                ],
                const SizedBox(height: 24),
                // Biometric button (optional)
                TextButton.icon(icon: const Icon(Icons.fingerprint), label: const Text('استخدام البصمة'), onPressed: () {}),
                const Spacer(),
                // Logout
                TextButton(onPressed: _onLogout, child: Text('تسجيل الخروج', style: TextStyle(color: AppColors.error))),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
