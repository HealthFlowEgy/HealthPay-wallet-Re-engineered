// lib/presentation/pages/auth/login_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/config/config.dart';
import '../../bloc/auth/auth_bloc.dart';
import '../../widgets/common/widgets.dart';

enum LoginType { customer, admin, merchant }

class LoginPage extends StatefulWidget {
  final LoginType loginType;

  const LoginPage({
    super.key,
    this.loginType = LoginType.customer,
  });

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _merchantCodeController = TextEditingController();

  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _merchantCodeController.dispose();
    super.dispose();
  }

  void _onLogin() {
    if (!_formKey.currentState!.validate()) return;

    final authBloc = context.read<AuthBloc>();

    switch (widget.loginType) {
      case LoginType.customer:
        authBloc.add(AuthSendOtpRequested(_phoneController.text));
        break;
      case LoginType.admin:
        authBloc.add(AuthAdminLoginRequested(
          _emailController.text,
          _passwordController.text,
        ));
        break;
      case LoginType.merchant:
        authBloc.add(AuthMerchantLoginRequested(
          _merchantCodeController.text,
          _passwordController.text,
        ));
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthOtpSent) {
            context.push('/otp', extra: {
              'phoneNumber': _phoneController.text,
              'expiresIn': state.expiresIn,
            });
          } else if (state is AuthAuthenticated) {
            _navigateToHome(state.userType);
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.errorColor,
              ),
            );
          }
        },
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 40),
                  
                  // Logo
                  Center(
                    child: Image.asset(
                      'assets/images/logo.png',
                      width: 120,
                      height: 120,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Title
                  Text(
                    _getTitle(),
                    style: context.textTheme.headlineMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getSubtitle(),
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),

                  // Login Type Selector (Customer only)
                  if (widget.loginType == LoginType.customer)
                    _buildLoginTypeSelector(),

                  const SizedBox(height: 24),

                  // Form Fields
                  _buildFormFields(),

                  const SizedBox(height: 32),

                  // Login Button
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      return AppButton(
                        text: widget.loginType == LoginType.customer
                            ? 'Send OTP'
                            : 'Login',
                        onPressed: _onLogin,
                        isLoading: state is AuthLoading,
                      );
                    },
                  ),

                  const SizedBox(height: 24),

                  // Switch Login Type
                  _buildSwitchLoginType(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginTypeSelector() {
    return Row(
      children: [
        Expanded(
          child: _LoginTypeButton(
            title: 'Customer',
            icon: Icons.person_outline,
            isSelected: true,
            onTap: () {},
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _LoginTypeButton(
            title: 'Merchant',
            icon: Icons.store_outlined,
            isSelected: false,
            onTap: () => context.go('/merchant-login'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _LoginTypeButton(
            title: 'Admin',
            icon: Icons.admin_panel_settings_outlined,
            isSelected: false,
            onTap: () => context.go('/admin-login'),
          ),
        ),
      ],
    );
  }

  Widget _buildFormFields() {
    switch (widget.loginType) {
      case LoginType.customer:
        return AppTextField(
          controller: _phoneController,
          label: 'Phone Number',
          hint: 'Enter your phone number',
          keyboardType: TextInputType.phone,
          prefixIcon: const Icon(Icons.phone_outlined),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'Please enter your phone number';
            }
            if (value.length < 10) {
              return 'Please enter a valid phone number';
            }
            return null;
          },
        );

      case LoginType.admin:
        return Column(
          children: [
            AppTextField(
              controller: _emailController,
              label: 'Email',
              hint: 'Enter your email',
              keyboardType: TextInputType.emailAddress,
              prefixIcon: const Icon(Icons.email_outlined),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your email';
                }
                if (!value.contains('@')) {
                  return 'Please enter a valid email';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            AppTextField(
              controller: _passwordController,
              label: 'Password',
              hint: 'Enter your password',
              obscureText: _obscurePassword,
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                ),
                onPressed: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your password';
                }
                return null;
              },
            ),
          ],
        );

      case LoginType.merchant:
        return Column(
          children: [
            AppTextField(
              controller: _merchantCodeController,
              label: 'Merchant ID',
              hint: 'Enter your merchant ID',
              prefixIcon: const Icon(Icons.store_outlined),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your merchant ID';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            AppTextField(
              controller: _passwordController,
              label: 'Password',
              hint: 'Enter your password',
              obscureText: _obscurePassword,
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off : Icons.visibility,
                ),
                onPressed: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter your password';
                }
                return null;
              },
            ),
          ],
        );
    }
  }

  Widget _buildSwitchLoginType() {
    if (widget.loginType == LoginType.customer) {
      return const SizedBox.shrink();
    }

    return TextButton(
      onPressed: () => context.go('/login'),
      child: const Text('Login as Customer'),
    );
  }

  String _getTitle() {
    switch (widget.loginType) {
      case LoginType.customer:
        return 'Welcome Back';
      case LoginType.admin:
        return 'Admin Login';
      case LoginType.merchant:
        return 'Merchant Login';
    }
  }

  String _getSubtitle() {
    switch (widget.loginType) {
      case LoginType.customer:
        return 'Enter your phone number to continue';
      case LoginType.admin:
        return 'Sign in to access admin dashboard';
      case LoginType.merchant:
        return 'Sign in to manage your business';
    }
  }

  void _navigateToHome(String userType) {
    switch (userType) {
      case 'admin':
        context.go('/admin');
        break;
      case 'merchant':
        context.go('/merchant');
        break;
      default:
        context.go('/customer');
    }
  }
}

class _LoginTypeButton extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _LoginTypeButton({
    required this.title,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : AppTheme.dividerColor,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : AppTheme.textSecondary,
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? Colors.white : AppTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// lib/presentation/pages/auth/otp_page.dart

class OtpPage extends StatefulWidget {
  final String phoneNumber;
  final int expiresIn;

  const OtpPage({
    super.key,
    required this.phoneNumber,
    required this.expiresIn,
  });

  @override
  State<OtpPage> createState() => _OtpPageState();
}

class _OtpPageState extends State<OtpPage> {
  late int _remainingSeconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.expiresIn;
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  void _onOtpCompleted(String otp) {
    context.read<AuthBloc>().add(
          AuthVerifyOtpRequested(widget.phoneNumber, otp),
        );
  }

  void _resendOtp() {
    context.read<AuthBloc>().add(AuthSendOtpRequested(widget.phoneNumber));
    setState(() => _remainingSeconds = widget.expiresIn);
    _startTimer();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthPinSetupRequired) {
            context.go('/pin-setup');
          } else if (state is AuthAuthenticated) {
            context.go('/customer');
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.errorColor,
              ),
            );
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),

                // Icon
                const Icon(
                  Icons.message_outlined,
                  size: 64,
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  'Verify Phone Number',
                  style: context.textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Enter the 6-digit code sent to\n${widget.phoneNumber}',
                  style: context.textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),

                // OTP Input
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    return PinInput(
                      length: 6,
                      obscure: false,
                      onCompleted: _onOtpCompleted,
                    );
                  },
                ),
                const SizedBox(height: 32),

                // Timer and Resend
                if (_remainingSeconds > 0)
                  Text(
                    'Resend code in ${_remainingSeconds}s',
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  )
                else
                  TextButton(
                    onPressed: _resendOtp,
                    child: const Text('Resend Code'),
                  ),

                const Spacer(),

                // Loading indicator
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    if (state is AuthLoading) {
                      return const LoadingIndicator(message: 'Verifying...');
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// lib/presentation/pages/auth/pin_setup_page.dart

class PinSetupPage extends StatefulWidget {
  const PinSetupPage({super.key});

  @override
  State<PinSetupPage> createState() => _PinSetupPageState();
}

class _PinSetupPageState extends State<PinSetupPage> {
  String? _firstPin;
  bool _isConfirming = false;

  void _onPinCompleted(String pin) {
    if (_firstPin == null) {
      setState(() {
        _firstPin = pin;
        _isConfirming = true;
      });
    } else {
      if (pin == _firstPin) {
        context.read<AuthBloc>().add(AuthSetPinRequested(pin));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PINs do not match. Please try again.'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        setState(() {
          _firstPin = null;
          _isConfirming = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Set PIN'),
      ),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            context.go('/customer');
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.errorColor,
              ),
            );
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),

                // Icon
                const Icon(
                  Icons.lock_outline,
                  size: 64,
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  _isConfirming ? 'Confirm Your PIN' : 'Create a PIN',
                  style: context.textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  _isConfirming
                      ? 'Enter your PIN again to confirm'
                      : 'This PIN will be used to authorize transactions',
                  style: context.textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),

                // PIN Input
                PinInput(
                  key: ValueKey(_isConfirming),
                  length: 4,
                  onCompleted: _onPinCompleted,
                ),

                const Spacer(),

                // Loading indicator
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, state) {
                    if (state is AuthLoading) {
                      return const LoadingIndicator(message: 'Setting PIN...');
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
