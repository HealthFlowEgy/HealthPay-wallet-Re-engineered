import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/injection_container.dart';

// Feature Screens
import 'package:healthpay/features/auth/presentation/pages/splash_screen.dart';
import 'package:healthpay/features/auth/presentation/pages/login_screen.dart';
import 'package:healthpay/features/auth/presentation/pages/otp_screen.dart';
import 'package:healthpay/features/auth/presentation/pages/pin_setup_screen.dart';
import 'package:healthpay/features/auth/presentation/pages/pin_entry_screen.dart';
import 'package:healthpay/features/dashboard/presentation/pages/dashboard_screen.dart';
import 'package:healthpay/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:healthpay/features/transactions/presentation/pages/transactions_screen.dart';
import 'package:healthpay/features/transfer/presentation/pages/transfer_screen.dart';
import 'package:healthpay/features/transfer/presentation/bloc/transfer_bloc.dart';
import 'package:healthpay/features/topup/presentation/pages/topup_screen.dart';
import 'package:healthpay/features/bills/presentation/pages/bills_screen.dart';
import 'package:healthpay/features/medical_card/presentation/pages/medical_card_screen.dart';
import 'package:healthpay/features/settings/presentation/pages/settings_screen.dart';
import 'package:healthpay/features/profile/presentation/pages/profile_screen.dart';

/// Main Navigation Shell
class MainNavigationShell extends StatefulWidget {
  final Widget child;

  const MainNavigationShell({super.key, required this.child});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  void _onItemTapped(int index, BuildContext context) {
    setState(() => _currentIndex = index);
    switch (index) {
      case 0:
        context.go(RouteConstants.dashboard);
        break;
      case 1:
        context.go(RouteConstants.transactions);
        break;
      case 2:
        context.go(RouteConstants.bills);
        break;
      case 3:
        context.go(RouteConstants.medicalCard);
        break;
      case 4:
        context.go(RouteConstants.settings);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => _onItemTapped(index, context),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'History',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_outlined),
            activeIcon: Icon(Icons.receipt),
            label: 'Bills',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.credit_card_outlined),
            activeIcon: Icon(Icons.credit_card),
            label: 'Card',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

/// App Router Configuration
class AppRouter {
  static final _rootNavigatorKey = GlobalKey<NavigatorState>();
  static final _shellNavigatorKey = GlobalKey<NavigatorState>();

  static final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: RouteConstants.splash,
    debugLogDiagnostics: true,
    routes: [
      // Auth Routes (no bottom nav)
      GoRoute(
        path: RouteConstants.splash,
        name: RouteNames.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: RouteConstants.login,
        name: RouteNames.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: RouteConstants.otp,
        name: RouteNames.otp,
        builder: (context, state) {
          final phoneNumber = state.extra as String? ?? '';
          return OTPScreen(phoneNumber: phoneNumber);
        },
      ),
      GoRoute(
        path: RouteConstants.pinSetup,
        name: RouteNames.pinSetup,
        builder: (context, state) => const PinSetupScreen(),
      ),
      GoRoute(
        path: RouteConstants.pinEntry,
        name: RouteNames.pinEntry,
        builder: (context, state) => const PinEntryScreen(),
      ),

      // Main App Routes (with bottom nav)
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainNavigationShell(child: child),
        routes: [
          GoRoute(
            path: RouteConstants.dashboard,
            name: RouteNames.dashboard,
            builder: (context, state) => BlocProvider(
              create: (_) => sl<DashboardBloc>()..add(LoadDashboard()),
              child: const DashboardScreen(),
            ),
          ),
          GoRoute(
            path: RouteConstants.transactions,
            name: RouteNames.transactions,
            builder: (context, state) => const TransactionsScreen(),
          ),
          GoRoute(
            path: RouteConstants.bills,
            name: RouteNames.bills,
            builder: (context, state) => const BillsScreen(),
          ),
          GoRoute(
            path: RouteConstants.medicalCard,
            name: RouteNames.medicalCard,
            builder: (context, state) => const MedicalCardScreen(),
          ),
          GoRoute(
            path: RouteConstants.settings,
            name: RouteNames.settings,
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),

      // Transfer Routes (full screen)
      GoRoute(
        path: RouteConstants.transfer,
        name: RouteNames.transfer,
        builder: (context, state) => BlocProvider(
          create: (_) => sl<TransferBloc>(),
          child: const TransferScreen(),
        ),
      ),

      // Top-up Routes
      GoRoute(
        path: RouteConstants.topup,
        name: RouteNames.topup,
        builder: (context, state) => const TopUpScreen(),
      ),

      // Profile Routes
      GoRoute(
        path: RouteConstants.profile,
        name: RouteNames.profile,
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.uri}'),
      ),
    ),
  );
}
