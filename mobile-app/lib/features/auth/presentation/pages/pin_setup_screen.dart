import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/widgets/custom_text_field.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';

class PinSetupScreen extends StatefulWidget {
  const PinSetupScreen({super.key});
  @override
  State<PinSetupScreen> createState() => _PinSetupScreenState();
}

class _PinSetupScreenState extends State<PinSetupScreen> {
  String _pin = '';
  String _confirmPin = '';
  bool _isConfirming = false;
  String? _errorText;

  void _onPinEntered(String pin) {
    if (!_isConfirming) {
      setState(() { _pin = pin; _isConfirming = true; _errorText = null; });
    } else {
      if (pin == _pin) {
        // PINs match - save it
        // Note: In real implementation, get phone from stored user data
        context.read<AuthBloc>().add(SetPinEvent(phoneNumber: '', pin: pin));
      } else {
        setState(() { _errorText = 'رمز PIN غير متطابق'; _confirmPin = ''; _isConfirming = false; _pin = ''; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is PinSetSuccess) { context.go(RouteConstants.dashboard); }
        else if (state is AuthError) { setState(() { _errorText = state.message; _isConfirming = false; _pin = ''; }); }
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 48),
                // Icon
                Container(width: 80, height: 80, decoration: BoxDecoration(color: AppColors.primarySurface, shape: BoxShape.circle),
                  child: const Icon(Icons.lock_outline, size: 40, color: AppColors.primary)),
                const SizedBox(height: 32),
                // Title
                Text(_isConfirming ? 'تأكيد رمز PIN' : 'إنشاء رمز PIN', style: AppTypography.headline2),
                const SizedBox(height: 8),
                Text(_isConfirming ? 'أعد إدخال رمز PIN للتأكيد' : 'أنشئ رمز PIN مكون من 4 أرقام لتأمين معاملاتك', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary), textAlign: TextAlign.center),
                const SizedBox(height: 48),
                // PIN Input
                PINInputField(onCompleted: _onPinEntered, errorText: _errorText),
                const Spacer(),
                // Progress dots
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildDot(true),
                    const SizedBox(width: 8),
                    _buildDot(_isConfirming),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDot(bool active) {
    return Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: active ? AppColors.primary : AppColors.border));
  }
}
