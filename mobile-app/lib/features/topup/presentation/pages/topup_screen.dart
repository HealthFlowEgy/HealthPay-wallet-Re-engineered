import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/widgets/custom_button.dart';
import 'package:healthpay/core/widgets/custom_card.dart';
import 'package:healthpay/core/widgets/pin_input_dialog.dart';
import 'package:healthpay/features/topup/presentation/bloc/topup_bloc.dart';
import 'package:healthpay/l10n/app_localizations.dart';

class TopUpScreen extends StatefulWidget {
  const TopUpScreen({super.key});
  @override
  State<TopUpScreen> createState() => _TopUpScreenState();
}

class _TopUpScreenState extends State<TopUpScreen> {
  final _amountController = TextEditingController();
  TopUpMethod? _selectedMethod;
  double? _selectedAmount;

  final List<double> _quickAmounts = [50, 100, 200, 500, 1000];

  // Default methods if API doesn't return any
  final List<TopUpMethod> _defaultMethods = const [
    TopUpMethod(
      id: 'bank_card',
      name: 'Bank Card',
      nameAr: 'بطاقة بنكية',
      type: 'card',
      minAmount: 10,
      maxAmount: 10000,
      fee: 0,
      feeType: 'fixed',
      enabled: true,
    ),
    TopUpMethod(
      id: 'fawry',
      name: 'Fawry',
      nameAr: 'فوري',
      type: 'fawry',
      minAmount: 10,
      maxAmount: 5000,
      fee: 5,
      feeType: 'fixed',
      enabled: true,
    ),
    TopUpMethod(
      id: 'vodafone_cash',
      name: 'Vodafone Cash',
      nameAr: 'فودافون كاش',
      type: 'mobile_wallet',
      minAmount: 10,
      maxAmount: 5000,
      fee: 0,
      feeType: 'fixed',
      enabled: true,
    ),
    TopUpMethod(
      id: 'instapay',
      name: 'InstaPay',
      nameAr: 'انستاباي',
      type: 'instapay',
      minAmount: 10,
      maxAmount: 10000,
      fee: 0,
      feeType: 'fixed',
      enabled: true,
    ),
  ];

  @override
  void initState() {
    super.initState();
    // Load methods from API or use defaults
    context.read<TopUpBloc>().add(LoadTopUpMethodsEvent());
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  IconData _getMethodIcon(String type) {
    switch (type) {
      case 'card':
        return Icons.credit_card;
      case 'fawry':
        return Icons.store;
      case 'mobile_wallet':
        return Icons.phone_android;
      case 'instapay':
        return Icons.account_balance;
      default:
        return Icons.payment;
    }
  }

  void _onTopUp() {
    if (_selectedMethod == null || _selectedAmount == null) return;

    showDialog(
      context: context,
      builder: (context) => PinInputDialog(
        title: 'أدخل رمز PIN',
        onComplete: (pin) {
          Navigator.pop(context);
          context.read<TopUpBloc>().add(ProcessTopUpEvent(
            walletId: 'wallet-id', // TODO: Get from user state
            amount: _selectedAmount!,
            methodId: _selectedMethod!.id,
            pin: pin,
          ));
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    
    return BlocConsumer<TopUpBloc, TopUpState>(
      listener: (context, state) {
        if (state is TopUpSuccess) {
          _showSuccessDialog(state);
        } else if (state is TopUpError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
          );
        }
      },
      builder: (context, state) {
        final methods = state is TopUpMethodsLoaded ? state.methods : _defaultMethods;
        
        return Scaffold(
          appBar: AppBar(
            title: Text(l10n.topUp),
            leading: IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => context.pop(),
            ),
          ),
          body: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.selectPaymentMethod, style: AppTypography.headline3),
                const SizedBox(height: 16),
                
                // Payment Methods
                ...methods.map((method) => _buildMethodCard(method)),
                
                const SizedBox(height: 24),
                Text(l10n.amount, style: AppTypography.labelLarge),
                const SizedBox(height: 8),
                
                // Quick Amounts
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _quickAmounts.map((amt) => ChoiceChip(
                    label: Text('$amt ${l10n.egp}'),
                    selected: _selectedAmount == amt,
                    selectedColor: AppColors.primaryLight,
                    onSelected: (selected) {
                      setState(() {
                        _selectedAmount = selected ? amt : null;
                        _amountController.text = selected ? amt.toString() : '';
                      });
                    },
                  )).toList(),
                ),
                
                const SizedBox(height: 16),
                
                // Custom Amount Input
                TextField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: l10n.customAmount,
                    suffixText: l10n.egp,
                    border: const OutlineInputBorder(),
                  ),
                  onChanged: (value) {
                    final amount = double.tryParse(value);
                    setState(() => _selectedAmount = amount);
                  },
                ),
                
                // Fee Info
                if (_selectedMethod != null && _selectedMethod!.fee > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '${l10n.fee}: ${_selectedMethod!.fee} ${_selectedMethod!.feeType == 'percentage' ? '%' : l10n.egp}',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                  ),
                
                const Spacer(),
                
                // Top Up Button
                CustomButton(
                  text: l10n.topUpNow,
                  onPressed: _selectedMethod != null && _selectedAmount != null && _selectedAmount! >= (_selectedMethod?.minAmount ?? 10)
                      ? _onTopUp
                      : null,
                  isLoading: state is TopUpProcessing,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMethodCard(TopUpMethod method) {
    final isSelected = _selectedMethod?.id == method.id;
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: CustomCard(
        onTap: () => setState(() => _selectedMethod = method),
        border: Border.all(
          color: isSelected ? AppColors.primary : AppColors.border,
          width: isSelected ? 2 : 1,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(_getMethodIcon(method.type), color: AppColors.primary, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isArabic ? method.nameAr : method.name,
                    style: AppTypography.labelMedium,
                  ),
                  if (method.fee > 0)
                    Text(
                      'رسوم: ${method.fee}${method.feeType == 'percentage' ? '%' : ' ج.م'}',
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textSecondary),
                    ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.primary),
          ],
        ),
      ),
    );
  }

  void _showSuccessDialog(TopUpSuccess state) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: AppColors.success, size: 64),
            const SizedBox(height: 16),
            Text('تم الشحن بنجاح', style: AppTypography.headline3),
            const SizedBox(height: 8),
            Text('رقم المرجع: ${state.reference}', style: AppTypography.bodyMedium),
            Text('الرصيد الجديد: ${state.newBalance.toStringAsFixed(2)} ج.م', style: AppTypography.labelLarge),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop();
            },
            child: const Text('حسناً'),
          ),
        ],
      ),
    );
  }
}
