import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/utils/validators.dart';
import 'package:healthpay/core/widgets/custom_button.dart';
import 'package:healthpay/core/widgets/custom_text_field.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:healthpay/l10n/app_localizations.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _errorText;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  void _onSendOTP() {
    // Clear any previous errors
    setState(() => _errorText = null);

    final phone = Validators.normalizePhoneNumber(_phoneController.text);
    
    // Validate phone number
    if (!Validators.isValidPhoneNumber(phone)) {
      final l10n = AppLocalizations.of(context);
      setState(() => _errorText = l10n?.invalidPhoneNumber ?? 'رقم الهاتف غير صحيح');
      return;
    }

    // Send OTP via Cequens SMS
    context.read<AuthBloc>().add(SendOTPEvent(phone));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is OTPSent) {
          // Navigate to OTP screen with phone number
          context.go(RouteConstants.otp, extra: state.phoneNumber);
        } else if (state is AuthError) {
          // Show error message
          String errorMessage = state.message;
          
          // Localize common error messages
          if (state.message.contains('NETWORK_ERROR') || 
              state.message.contains('connection')) {
            errorMessage = l10n?.networkError ?? 'خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت';
          } else if (state.message.contains('SMS_SEND_FAILED')) {
            errorMessage = l10n?.smsSendFailed ?? 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى';
          } else if (state.message.contains('RATE_LIMITED')) {
            errorMessage = l10n?.tooManyAttempts ?? 'محاولات كثيرة. يرجى الانتظار قليلاً';
          }
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.all(16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          );
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 48),
                  
                  // Logo
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(
                      child: Text(
                        'HP',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Title
                  Text(
                    l10n?.login ?? 'تسجيل الدخول',
                    style: AppTypography.headline1,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n?.loginSubtitle ?? 'أدخل رقم هاتفك للمتابعة',
                    style: AppTypography.bodyLarge.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 40),
                  
                  // Phone Input with Egypt flag
                  PhoneInputField(
                    controller: _phoneController,
                    label: l10n?.phoneNumber ?? 'رقم الهاتف',
                    hint: '010 1234 5678',
                    errorText: _errorText,
                    autofocus: true,
                    onChanged: (value) {
                      // Clear error when user starts typing
                      if (_errorText != null) {
                        setState(() => _errorText = null);
                      }
                    },
                    onSubmitted: (_) => _onSendOTP(),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // SMS Info
                  Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        size: 16,
                        color: AppColors.textTertiary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          l10n?.smsWillBeSent ?? 'سيتم إرسال رمز التحقق عبر رسالة نصية',
                          style: AppTypography.caption.copyWith(
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  const Spacer(),
                  
                  // Submit Button
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      return CustomButton(
                        text: l10n?.sendOTP ?? 'إرسال رمز التحقق',
                        onPressed: _onSendOTP,
                        isLoading: state is AuthLoading,
                        icon: Icons.sms_outlined,
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  // Terms
                  Center(
                    child: Text.rich(
                      TextSpan(
                        text: l10n?.termsPrefix ?? 'بالمتابعة، أنت توافق على ',
                        style: AppTypography.caption,
                        children: [
                          TextSpan(
                            text: l10n?.termsOfService ?? 'شروط الخدمة',
                            style: AppTypography.caption.copyWith(
                              color: AppColors.primary,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                          TextSpan(text: l10n?.and ?? ' و '),
                          TextSpan(
                            text: l10n?.privacyPolicy ?? 'سياسة الخصوصية',
                            style: AppTypography.caption.copyWith(
                              color: AppColors.primary,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Version
                  Center(
                    child: Text(
                      'v2.0.0',
                      style: AppTypography.caption.copyWith(
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
