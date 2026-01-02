import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/app_constants.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/utils/formatters.dart';
import 'package:healthpay/core/widgets/custom_button.dart';
import 'package:healthpay/core/widgets/custom_text_field.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:healthpay/l10n/app_localizations.dart';

class OTPScreen extends StatefulWidget {
  final String phoneNumber;
  
  const OTPScreen({super.key, required this.phoneNumber});
  
  @override
  State<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> {
  final _otpController = TextEditingController();
  Timer? _timer;
  int _countdown = AppConstants.otpResendCooldown;
  bool _canResend = false;
  String? _errorText;
  String? _devOTP;
  bool _isResending = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
    // Check for dev OTP (only in development)
    final state = context.read<AuthBloc>().state;
    if (state is OTPSent && state.devOTP != null) {
      _devOTP = state.devOTP;
    }
  }

  void _startTimer() {
    _countdown = AppConstants.otpResendCooldown;
    _canResend = false;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        setState(() => _countdown--);
      } else {
        setState(() => _canResend = true);
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  void _onVerify(String code) {
    if (code.length != AppConstants.otpLength) return;
    setState(() => _errorText = null);
    context.read<AuthBloc>().add(VerifyOTPEvent(
      phoneNumber: widget.phoneNumber,
      code: code,
    ));
  }

  void _onResend() {
    if (!_canResend || _isResending) return;
    
    setState(() {
      _isResending = true;
      _errorText = null;
    });
    
    // Clear OTP input
    _otpController.clear();
    
    // Resend OTP via Cequens SMS
    context.read<AuthBloc>().add(SendOTPEvent(widget.phoneNumber));
    _startTimer();
    
    // Reset resending state after a delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isResending = false);
      }
    });
  }

  void _showHelpDialog(BuildContext context, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.help_outline, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(l10n.didntReceiveOTP),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHelpItem(
              Icons.phone_android,
              l10n.checkPhoneNumber,
            ),
            const SizedBox(height: 12),
            _buildHelpItem(
              Icons.signal_cellular_alt,
              l10n.checkSignal,
            ),
            const SizedBox(height: 12),
            _buildHelpItem(
              Icons.timer,
              l10n.waitFewMinutes,
            ),
            const SizedBox(height: 12),
            _buildHelpItem(
              Icons.block,
              l10n.checkNotBlocked,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.ok),
          ),
        ],
      ),
    );
  }

  Widget _buildHelpItem(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppColors.textSecondary),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthRequiresPinSetup) {
          context.go(RouteConstants.pinSetup);
        } else if (state is AuthAuthenticated) {
          context.go(RouteConstants.dashboard);
        } else if (state is AuthError) {
          // Localize error messages
          String errorMessage = state.message;
          if (state.message.contains('OTP_EXPIRED')) {
            errorMessage = l10n.otpExpired;
          } else if (state.message.contains('OTP_INVALID') ||
              state.message.contains('Invalid')) {
            errorMessage = l10n.invalidOTP;
          } else if (state.message.contains('RATE_LIMITED')) {
            errorMessage = l10n.tooManyAttempts;
          }
          setState(() => _errorText = errorMessage);
          _otpController.clear();
        } else if (state is OTPSent) {
          // OTP resent successfully
          if (state.devOTP != null) {
            setState(() => _devOTP = state.devOTP);
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Text(l10n.otpResent),
                ],
              ),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go(RouteConstants.login),
          ),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(l10n.verifyPhone, style: AppTypography.headline1),
                const SizedBox(height: 8),
                
                // Subtitle
                Text(
                  l10n.enterOTP,
                  style: AppTypography.bodyLarge.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                
                // Phone number
                Row(
                  children: [
                    Text(
                      Formatters.phone(widget.phoneNumber),
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.primary,
                      ),
                      textDirection: TextDirection.ltr,
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () => context.go(RouteConstants.login),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        l10n.changeNumber,
                        style: AppTypography.bodySmall.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // SMS Info
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primarySurface,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.sms_outlined,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        l10n.viaSMS,
                        style: AppTypography.caption.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Dev OTP hint (only in development)
                if (_devOTP != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(
                      color: AppColors.infoLight,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.info.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.developer_mode, color: AppColors.info, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '${l10n.devOTPHint} $_devOTP',
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.info,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // OTP Input
                OTPInputField(
                  length: AppConstants.otpLength,
                  onCompleted: _onVerify,
                  controller: _otpController,
                  errorText: _errorText,
                ),
                const SizedBox(height: 24),

                // Resend OTP
                Center(
                  child: _canResend
                      ? TextButton.icon(
                          onPressed: _isResending ? null : _onResend,
                          icon: _isResending
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.primary,
                                  ),
                                )
                              : const Icon(Icons.refresh, size: 18),
                          label: Text(
                            _isResending ? l10n.sending : l10n.resendOTP,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.timer_outlined,
                              size: 16,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${l10n.resendIn} $_countdown ${l10n.seconds}',
                              style: AppTypography.bodyMedium.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                ),
                
                const Spacer(),

                // Verify Button
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    return CustomButton(
                      text: l10n.verify,
                      onPressed: () => _onVerify(_otpController.text),
                      isLoading: state is AuthLoading,
                    );
                  },
                ),
                const SizedBox(height: 16),

                // Help link
                Center(
                  child: TextButton(
                    onPressed: () => _showHelpDialog(context, l10n),
                    child: Text(
                      l10n.didntReceiveOTP,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
