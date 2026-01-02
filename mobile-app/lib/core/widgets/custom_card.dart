import 'package:flutter/material.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/utils/formatters.dart';

/// Custom Card Widget
class CustomCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final Border? border;
  final List<BoxShadow>? boxShadow;

  const CustomCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.backgroundColor,
    this.borderRadius,
    this.border,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.surface,
        borderRadius: borderRadius ?? BorderRadius.circular(AppRadius.lg),
        border: border,
        boxShadow: boxShadow ??
            [
              BoxShadow(
                color: AppColors.shadow,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
      ),
      child: child,
    );

    if (onTap != null) {
      return Padding(
        padding: margin ?? EdgeInsets.zero,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? BorderRadius.circular(AppRadius.lg),
          child: content,
        ),
      );
    }

    return Padding(
      padding: margin ?? EdgeInsets.zero,
      child: content,
    );
  }
}

/// Wallet Balance Card
class WalletBalanceCard extends StatelessWidget {
  final double balance;
  final double? pendingBalance;
  final double dailyLimit;
  final double dailySpent;
  final VoidCallback? onTap;
  final String locale;

  const WalletBalanceCard({
    super.key,
    required this.balance,
    this.pendingBalance,
    required this.dailyLimit,
    required this.dailySpent,
    this.onTap,
    this.locale = 'ar',
  });

  @override
  Widget build(BuildContext context) {
    final remaining = dailyLimit - dailySpent;
    final progress = dailySpent / dailyLimit;

    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background Pattern
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.1),
              ),
            ),
          ),
          Positioned(
            bottom: -40,
            left: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  locale == 'ar' ? 'الرصيد المتاح' : 'Available Balance',
                  style: AppTypography.bodyMedium.copyWith(
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  Formatters.currency(balance, locale: locale),
                  style: AppTypography.amountLarge.copyWith(
                    color: Colors.white,
                  ),
                ),
                if (pendingBalance != null && pendingBalance! > 0) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${locale == 'ar' ? 'رصيد معلق:' : 'Pending:'} ${Formatters.currency(pendingBalance!, locale: locale)}',
                    style: AppTypography.caption.copyWith(
                      color: Colors.white.withOpacity(0.7),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                // Daily Limit Progress
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      locale == 'ar' ? 'الحد اليومي' : 'Daily Limit',
                      style: AppTypography.caption.copyWith(
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                    Text(
                      Formatters.currency(remaining, locale: locale),
                      style: AppTypography.labelSmall.copyWith(
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress.clamp(0.0, 1.0),
                    backgroundColor: Colors.white.withOpacity(0.3),
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Transaction Item Card
class TransactionItem extends StatelessWidget {
  final String title;
  final String subtitle;
  final double amount;
  final bool isDebit;
  final String status;
  final DateTime date;
  final IconData icon;
  final VoidCallback? onTap;
  final String locale;

  const TransactionItem({
    super.key,
    required this.title,
    required this.subtitle,
    required this.amount,
    required this.isDebit,
    required this.status,
    required this.date,
    required this.icon,
    this.onTap,
    this.locale = 'ar',
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: [
            // Icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isDebit
                    ? AppColors.errorLight
                    : AppColors.successLight,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: isDebit ? AppColors.error : AppColors.success,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.labelMedium,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    Formatters.relativeTime(date, locale: locale),
                    style: AppTypography.caption,
                  ),
                ],
              ),
            ),
            // Amount & Status
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${isDebit ? '-' : '+'}${Formatters.currency(amount, locale: locale)}',
                  style: AppTypography.labelMedium.copyWith(
                    color: isDebit ? AppColors.error : AppColors.success,
                  ),
                ),
                const SizedBox(height: 2),
                _StatusBadge(status: status, locale: locale),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Status Badge
class _StatusBadge extends StatelessWidget {
  final String status;
  final String locale;

  const _StatusBadge({required this.status, required this.locale});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status.toUpperCase()) {
      case 'COMPLETED':
        bgColor = AppColors.successLight;
        textColor = AppColors.success;
        label = locale == 'ar' ? 'مكتمل' : 'Completed';
        break;
      case 'PENDING':
        bgColor = AppColors.warningLight;
        textColor = AppColors.warning;
        label = locale == 'ar' ? 'معلق' : 'Pending';
        break;
      case 'FAILED':
        bgColor = AppColors.errorLight;
        textColor = AppColors.error;
        label = locale == 'ar' ? 'فشل' : 'Failed';
        break;
      default:
        bgColor = AppColors.surfaceVariant;
        textColor = AppColors.textSecondary;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Text(
        label,
        style: AppTypography.caption.copyWith(
          color: textColor,
          fontSize: 10,
        ),
      ),
    );
  }
}

/// Status Badge (Public)
class StatusBadge extends StatelessWidget {
  final String status;
  final String locale;

  const StatusBadge({
    super.key,
    required this.status,
    this.locale = 'ar',
  });

  @override
  Widget build(BuildContext context) {
    return _StatusBadge(status: status, locale: locale);
  }
}

/// Info Row (for details screens)
class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Widget? trailing;
  final bool showDivider;

  const InfoRow({
    super.key,
    required this.label,
    required this.value,
    this.trailing,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: AppTypography.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              )),
              Row(
                children: [
                  Text(value, style: AppTypography.labelMedium),
                  if (trailing != null) ...[
                    const SizedBox(width: 8),
                    trailing!,
                  ],
                ],
              ),
            ],
          ),
        ),
        if (showDivider) const Divider(height: 1),
      ],
    );
  }
}
