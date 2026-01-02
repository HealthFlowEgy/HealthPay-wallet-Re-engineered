import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/app_constants.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/utils/helpers.dart';
import 'package:healthpay/core/widgets/custom_card.dart';
import 'package:healthpay/core/widgets/loading_widget.dart';
import 'package:healthpay/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:healthpay/l10n/app_localizations.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return Scaffold(
      body: SafeArea(
        child: BlocBuilder<DashboardBloc, DashboardState>(
          builder: (context, state) {
            if (state is DashboardLoading) {
              return const Center(child: LoadingSpinner());
            }
            if (state is DashboardError) {
              return ErrorDisplay(
                message: state.message,
                onRetry: () => context.read<DashboardBloc>().add(LoadDashboard()),
              );
            }
            if (state is DashboardLoaded) {
              return RefreshIndicator(
                onRefresh: () async => context.read<DashboardBloc>().add(RefreshDashboard()),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                Helpers.getGreeting(context),
                                style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                state.user.name ?? l10n.user,
                                style: AppTypography.headline3,
                              ),
                            ],
                          ),
                          IconButton(
                            onPressed: () => context.push(RouteConstants.notifications),
                            icon: const Icon(Icons.notifications_outlined, size: 28),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      
                      // Balance Card
                      WalletBalanceCard(
                        balance: state.user.wallet?.balance ?? 0,
                        pendingBalance: state.user.wallet?.pendingBalance,
                        dailyLimit: AppConstants.dailyLimit,
                        dailySpent: 0,
                      ),
                      const SizedBox(height: 24),
                      
                      // Quick Actions
                      Text(l10n.quickActions, style: AppTypography.labelLarge),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          QuickActionButton(
                            label: l10n.transfer,
                            icon: Icons.send,
                            onTap: () => context.push(RouteConstants.transfer),
                          ),
                          QuickActionButton(
                            label: l10n.topUp,
                            icon: Icons.add_card,
                            onTap: () => context.push(RouteConstants.topup),
                          ),
                          QuickActionButton(
                            label: l10n.bills,
                            icon: Icons.receipt_long,
                            onTap: () => context.go(RouteConstants.bills),
                          ),
                          QuickActionButton(
                            label: l10n.qrScan,
                            icon: Icons.qr_code_scanner,
                            onTap: () {
                              // TODO: Implement QR scanner
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(l10n.comingSoon)),
                              );
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      
                      // Recent Transactions
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(l10n.recentTransactions, style: AppTypography.labelLarge),
                          TextButton(
                            onPressed: () => context.go(RouteConstants.transactions),
                            child: Text(l10n.viewAll),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      
                      if (state.transactions.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(32),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(
                                  Icons.receipt_long_outlined,
                                  size: 48,
                                  color: AppColors.textTertiary,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  l10n.noTransactions,
                                  style: AppTypography.bodyMedium.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        CustomCard(
                          padding: EdgeInsets.zero,
                          child: Column(
                            children: state.transactions.take(5).map((tx) {
                              final type = tx['type'] as String? ?? 'TRANSFER';
                              final amount = (tx['amount'] as num?)?.toDouble() ?? 0;
                              final isDebit = type.contains('PAYMENT') ||
                                  type == 'TRANSFER' ||
                                  type == 'WITHDRAWAL';
                              return TransactionItem(
                                title: tx['description'] ?? _getTypeLabel(type, l10n),
                                subtitle: '',
                                amount: amount,
                                isDebit: isDebit,
                                status: tx['status'] ?? 'COMPLETED',
                                date: DateTime.tryParse(tx['createdAt'] ?? '') ?? DateTime.now(),
                                icon: _getTypeIcon(type),
                                onTap: () => context.push('/transactions/${tx['id']}'),
                              );
                            }).toList(),
                          ),
                        ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              );
            }
            return const SizedBox();
          },
        ),
      ),
    );
  }

  String _getTypeLabel(String type, AppLocalizations l10n) {
    switch (type) {
      case 'TRANSFER':
        return l10n.transfer;
      case 'TOPUP':
        return l10n.topUp;
      case 'BILL_PAYMENT':
        return l10n.billPayment;
      case 'PAYMENT_REQUEST':
        return l10n.paymentRequest;
      default:
        return type;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'TRANSFER':
        return Icons.swap_horiz;
      case 'TOPUP':
        return Icons.add_card;
      case 'BILL_PAYMENT':
        return Icons.receipt_long;
      case 'PAYMENT_REQUEST':
        return Icons.shopping_cart;
      default:
        return Icons.paid;
    }
  }
}
