// lib/router/app_router.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:injectable/injectable.dart';

import '../core/di/injection.dart';
import '../presentation/bloc/auth/auth_bloc.dart';
import '../presentation/bloc/wallet/wallet_bloc.dart';
import '../presentation/pages/auth/auth_pages.dart';
import '../presentation/pages/customer/customer_pages.dart';
import '../presentation/pages/merchant/merchant_pages.dart';

@singleton
class AppRouter {
  late final GoRouter _router;

  AppRouter() {
    _router = GoRouter(
      initialLocation: '/splash',
      debugLogDiagnostics: true,
      redirect: _guardRoute,
      routes: [
        // Splash Screen
        GoRoute(
          path: '/splash',
          name: 'splash',
          builder: (context, state) => const SplashPage(),
        ),

        // Onboarding
        GoRoute(
          path: '/onboarding',
          name: 'onboarding',
          builder: (context, state) => const OnboardingPage(),
        ),

        // ==================== AUTH ROUTES ====================
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (context, state) => const LoginPage(loginType: LoginType.customer),
        ),
        GoRoute(
          path: '/admin-login',
          name: 'admin-login',
          builder: (context, state) => const LoginPage(loginType: LoginType.admin),
        ),
        GoRoute(
          path: '/merchant-login',
          name: 'merchant-login',
          builder: (context, state) => const LoginPage(loginType: LoginType.merchant),
        ),
        GoRoute(
          path: '/otp',
          name: 'otp',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return OtpPage(
              phoneNumber: extra['phoneNumber'] as String,
              expiresIn: extra['expiresIn'] as int,
            );
          },
        ),
        GoRoute(
          path: '/pin-setup',
          name: 'pin-setup',
          builder: (context, state) => const PinSetupPage(),
        ),
        GoRoute(
          path: '/pin-verify',
          name: 'pin-verify',
          builder: (context, state) => const PinVerifyPage(),
        ),

        // ==================== CUSTOMER ROUTES ====================
        ShellRoute(
          builder: (context, state, child) {
            return BlocProvider(
              create: (_) => getIt<WalletBloc>(),
              child: CustomerShell(child: child),
            );
          },
          routes: [
            GoRoute(
              path: '/customer',
              name: 'customer-home',
              builder: (context, state) => const CustomerDashboardPage(),
              routes: [
                GoRoute(
                  path: 'send-money',
                  name: 'send-money',
                  builder: (context, state) => BlocProvider(
                    create: (_) => getIt<TransactionBloc>(),
                    child: const SendMoneyPage(),
                  ),
                ),
                GoRoute(
                  path: 'receive-money',
                  name: 'receive-money',
                  builder: (context, state) => const ReceiveMoneyPage(),
                ),
                GoRoute(
                  path: 'topup',
                  name: 'topup',
                  builder: (context, state) => const TopupPage(),
                ),
                GoRoute(
                  path: 'scan',
                  name: 'scan',
                  builder: (context, state) => const ScanPage(),
                ),
                GoRoute(
                  path: 'transactions',
                  name: 'customer-transactions',
                  builder: (context, state) => BlocProvider(
                    create: (_) => getIt<TransactionBloc>(),
                    child: const TransactionHistoryPage(),
                  ),
                  routes: [
                    GoRoute(
                      path: ':id',
                      name: 'transaction-detail',
                      builder: (context, state) => TransactionDetailPage(
                        id: state.pathParameters['id']!,
                      ),
                    ),
                    GoRoute(
                      path: ':id/success',
                      name: 'transaction-success',
                      builder: (context, state) => TransactionSuccessPage(
                        id: state.pathParameters['id']!,
                      ),
                    ),
                  ],
                ),
                GoRoute(
                  path: 'notifications',
                  name: 'customer-notifications',
                  builder: (context, state) => const NotificationsPage(),
                ),
                GoRoute(
                  path: 'settings',
                  name: 'customer-settings',
                  builder: (context, state) => const CustomerSettingsPage(),
                  routes: [
                    GoRoute(
                      path: 'profile',
                      name: 'profile',
                      builder: (context, state) => const ProfilePage(),
                    ),
                    GoRoute(
                      path: 'security',
                      name: 'security',
                      builder: (context, state) => const SecuritySettingsPage(),
                    ),
                    GoRoute(
                      path: 'kyc',
                      name: 'kyc',
                      builder: (context, state) => const KycUploadPage(),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),

        // ==================== ADMIN ROUTES ====================
        ShellRoute(
          builder: (context, state, child) {
            return AdminShell(child: child);
          },
          routes: [
            GoRoute(
              path: '/admin',
              name: 'admin-home',
              builder: (context, state) => const AdminDashboardPage(),
              routes: [
                GoRoute(
                  path: 'users',
                  name: 'user-management',
                  builder: (context, state) => const UserManagementPage(),
                  routes: [
                    GoRoute(
                      path: ':id',
                      name: 'user-detail',
                      builder: (context, state) => UserDetailPage(
                        id: state.pathParameters['id']!,
                      ),
                    ),
                  ],
                ),
                GoRoute(
                  path: 'merchants',
                  name: 'merchant-management',
                  builder: (context, state) => const MerchantManagementPage(),
                ),
                GoRoute(
                  path: 'transactions',
                  name: 'admin-transactions',
                  builder: (context, state) => const TransactionMonitoringPage(),
                ),
                GoRoute(
                  path: 'kyc',
                  name: 'kyc-management',
                  builder: (context, state) => const KycManagementPage(),
                ),
                GoRoute(
                  path: 'withdrawals',
                  name: 'withdrawal-management',
                  builder: (context, state) => const WithdrawalRequestsPage(),
                ),
                GoRoute(
                  path: 'settings',
                  name: 'admin-settings',
                  builder: (context, state) => const AdminSettingsPage(),
                ),
              ],
            ),
          ],
        ),

        // ==================== MERCHANT ROUTES ====================
        ShellRoute(
          builder: (context, state, child) {
            return BlocProvider(
              create: (_) => getIt<WalletBloc>(),
              child: MerchantShell(child: child),
            );
          },
          routes: [
            GoRoute(
              path: '/merchant',
              name: 'merchant-home',
              builder: (context, state) => const MerchantDashboardPage(),
              routes: [
                GoRoute(
                  path: 'accept-payment',
                  name: 'accept-payment',
                  builder: (context, state) => const AcceptPaymentPage(),
                ),
                GoRoute(
                  path: 'withdrawal',
                  name: 'merchant-withdrawal',
                  builder: (context, state) => const RequestWithdrawalPage(),
                ),
                GoRoute(
                  path: 'transactions',
                  name: 'merchant-transactions',
                  builder: (context, state) => const MerchantTransactionsPage(),
                ),
                GoRoute(
                  path: 'reports',
                  name: 'merchant-reports',
                  builder: (context, state) => const MerchantReportsPage(),
                ),
                GoRoute(
                  path: 'settings',
                  name: 'merchant-settings',
                  builder: (context, state) => const MerchantSettingsPage(),
                ),
              ],
            ),
          ],
        ),
      ],
      errorBuilder: (context, state) => ErrorPage(error: state.error),
    );
  }

  GoRouterConfig get config => _router;

  /// Route guard for authentication
  String? _guardRoute(BuildContext context, GoRouterState state) {
    final authBloc = context.read<AuthBloc>();
    final authState = authBloc.state;
    final location = state.matchedLocation;

    // Public routes that don't require authentication
    final publicRoutes = [
      '/splash',
      '/onboarding',
      '/login',
      '/admin-login',
      '/merchant-login',
      '/otp',
      '/pin-setup',
    ];

    final isPublicRoute = publicRoutes.any((route) => location.startsWith(route));

    // If checking auth, stay on current page
    if (authState is AuthLoading || authState is AuthInitial) {
      return null;
    }

    // If not authenticated and trying to access protected route
    if (authState is AuthUnauthenticated && !isPublicRoute) {
      return '/login';
    }

    // If authenticated and trying to access login pages
    if (authState is AuthAuthenticated && isPublicRoute) {
      switch (authState.userType) {
        case 'admin':
          return '/admin';
        case 'merchant':
          return '/merchant';
        default:
          return '/customer';
      }
    }

    // If PIN required
    if (authState is AuthPinRequired) {
      return '/pin-verify';
    }

    // If PIN setup required
    if (authState is AuthPinSetupRequired) {
      return '/pin-setup';
    }

    return null;
  }
}

// ==================== SHELL WIDGETS ====================

class CustomerShell extends StatelessWidget {
  final Widget child;

  const CustomerShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _calculateSelectedIndex(context),
        onTap: (index) => _onItemTapped(index, context),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Transactions',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code_scanner),
            label: 'Scan',
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

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/customer/transactions')) return 1;
    if (location.startsWith('/customer/scan')) return 2;
    if (location.startsWith('/customer/settings')) return 3;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/customer');
        break;
      case 1:
        context.go('/customer/transactions');
        break;
      case 2:
        context.go('/customer/scan');
        break;
      case 3:
        context.go('/customer/settings');
        break;
    }
  }
}

class AdminShell extends StatelessWidget {
  final Widget child;

  const AdminShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _calculateSelectedIndex(context),
        onTap: (index) => _onItemTapped(index, context),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'Users',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.store_outlined),
            activeIcon: Icon(Icons.store),
            label: 'Merchants',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Transactions',
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

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/admin/users')) return 1;
    if (location.startsWith('/admin/merchants')) return 2;
    if (location.startsWith('/admin/transactions')) return 3;
    if (location.startsWith('/admin/settings')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/admin');
        break;
      case 1:
        context.go('/admin/users');
        break;
      case 2:
        context.go('/admin/merchants');
        break;
      case 3:
        context.go('/admin/transactions');
        break;
      case 4:
        context.go('/admin/settings');
        break;
    }
  }
}

class MerchantShell extends StatelessWidget {
  final Widget child;

  const MerchantShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _calculateSelectedIndex(context),
        onTap: (index) => _onItemTapped(index, context),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Transactions',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.qr_code),
            label: 'Accept',
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

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/merchant/transactions')) return 1;
    if (location.startsWith('/merchant/accept-payment')) return 2;
    if (location.startsWith('/merchant/settings')) return 3;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/merchant');
        break;
      case 1:
        context.go('/merchant/transactions');
        break;
      case 2:
        context.go('/merchant/accept-payment');
        break;
      case 3:
        context.go('/merchant/settings');
        break;
    }
  }
}

// ==================== PLACEHOLDER PAGES ====================

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) {
          context.go('/login');
        } else if (state is AuthAuthenticated) {
          switch (state.userType) {
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
      },
      child: const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.account_balance_wallet, size: 80, color: AppTheme.primaryColor),
              SizedBox(height: 24),
              Text(
                'HealthPay',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
              SizedBox(height: 48),
              CircularProgressIndicator(),
            ],
          ),
        ),
      ),
    );
  }
}

class OnboardingPage extends StatelessWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Onboarding')));
  }
}

class PinVerifyPage extends StatelessWidget {
  const PinVerifyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('PIN Verify')));
  }
}

class TopupPage extends StatelessWidget {
  const TopupPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Top Up')));
  }
}

class ScanPage extends StatelessWidget {
  const ScanPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Scan QR')));
  }
}

class TransactionDetailPage extends StatelessWidget {
  final String id;
  const TransactionDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Transaction: $id')));
  }
}

class TransactionSuccessPage extends StatelessWidget {
  final String id;
  const TransactionSuccessPage({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('Success: $id')));
  }
}

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Notifications')));
  }
}

class CustomerSettingsPage extends StatelessWidget {
  const CustomerSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Settings')));
  }
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Profile')));
  }
}

class SecuritySettingsPage extends StatelessWidget {
  const SecuritySettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Security')));
  }
}

class KycUploadPage extends StatelessWidget {
  const KycUploadPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('KYC Upload')));
  }
}

class UserDetailPage extends StatelessWidget {
  final String id;
  const UserDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text('User: $id')));
  }
}

class MerchantManagementPage extends StatelessWidget {
  const MerchantManagementPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Merchant Management')));
  }
}

class TransactionMonitoringPage extends StatelessWidget {
  const TransactionMonitoringPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Transaction Monitoring')));
  }
}

class KycManagementPage extends StatelessWidget {
  const KycManagementPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('KYC Management')));
  }
}

class WithdrawalRequestsPage extends StatelessWidget {
  const WithdrawalRequestsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Withdrawal Requests')));
  }
}

class AdminSettingsPage extends StatelessWidget {
  const AdminSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Admin Settings')));
  }
}

class MerchantTransactionsPage extends StatelessWidget {
  const MerchantTransactionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Merchant Transactions')));
  }
}

class MerchantReportsPage extends StatelessWidget {
  const MerchantReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Merchant Reports')));
  }
}

class MerchantSettingsPage extends StatelessWidget {
  const MerchantSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Merchant Settings')));
  }
}

class ErrorPage extends StatelessWidget {
  final Exception? error;
  const ErrorPage({super.key, this.error});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text('Page not found'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}
