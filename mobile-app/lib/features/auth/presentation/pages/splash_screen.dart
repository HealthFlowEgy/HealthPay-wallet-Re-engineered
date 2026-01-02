import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: const Duration(milliseconds: 1500), vsync: this);
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
    _controller.forward();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthUnauthenticated) { context.go(RouteConstants.login); }
    else if (authState is AuthRequiresPin) { context.go(RouteConstants.pinEntry); }
    else if (authState is AuthRequiresPinSetup) { context.go(RouteConstants.pinSetup); }
    else if (authState is AuthAuthenticated) { context.go(RouteConstants.dashboard); }
    else { context.go(RouteConstants.login); }
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) context.go(RouteConstants.login);
        else if (state is AuthRequiresPin) context.go(RouteConstants.pinEntry);
        else if (state is AuthRequiresPinSetup) context.go(RouteConstants.pinSetup);
        else if (state is AuthAuthenticated || state is PinVerified) context.go(RouteConstants.dashboard);
      },
      child: Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [AppColors.primary, AppColors.primaryDark])),
          child: SafeArea(
            child: Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(width: 120, height: 120, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10))]),
                      child: const Center(child: Text('HP', style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.primary)))),
                    const SizedBox(height: 24),
                    Text('HealthPay', style: AppTypography.headline1.copyWith(color: Colors.white, fontSize: 36)),
                    const SizedBox(height: 8),
                    Text('محفظتك الصحية الرقمية', style: AppTypography.bodyLarge.copyWith(color: Colors.white.withOpacity(0.8))),
                    const SizedBox(height: 48),
                    const SizedBox(width: 32, height: 32, child: CircularProgressIndicator(strokeWidth: 3, valueColor: AlwaysStoppedAnimation<Color>(Colors.white))),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
