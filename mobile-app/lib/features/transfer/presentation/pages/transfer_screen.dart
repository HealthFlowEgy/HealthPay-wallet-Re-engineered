import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/core/utils/formatters.dart';
import 'package:healthpay/core/utils/validators.dart';
import 'package:healthpay/core/widgets/custom_button.dart';
import 'package:healthpay/core/widgets/custom_text_field.dart';
import 'package:healthpay/core/widgets/custom_card.dart';
import 'package:healthpay/features/transfer/presentation/bloc/transfer_bloc.dart';

class TransferScreen extends StatefulWidget {
  const TransferScreen({super.key});
  @override
  State<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends State<TransferScreen> {
  int _step = 0; // 0: recipient, 1: amount, 2: review, 3: success
  final _phoneController = TextEditingController();
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  String? _recipientName;
  String? _recipientPhone;
  String? _errorText;

  @override
  void dispose() { _phoneController.dispose(); _amountController.dispose(); _noteController.dispose(); super.dispose(); }

  void _onValidateRecipient() {
    final phone = Validators.normalizePhoneNumber(_phoneController.text);
    if (!Validators.isValidPhoneNumber(phone)) { setState(() => _errorText = 'رقم الهاتف غير صحيح'); return; }
    context.read<TransferBloc>().add(ValidateRecipientEvent(phone));
  }

  void _onContinueToReview() {
    final amount = double.tryParse(_amountController.text) ?? 0;
    if (amount < 1) { setState(() => _errorText = 'الحد الأدنى 1 جنيه'); return; }
    if (amount > 10000) { setState(() => _errorText = 'الحد الأقصى 10,000 جنيه'); return; }
    setState(() { _step = 2; _errorText = null; });
  }

  void _showPinDialog() {
    showModalBottomSheet(context: context, builder: (ctx) => _PinSheet(onConfirm: (pin) {
      Navigator.pop(ctx);
      context.read<TransferBloc>().add(TransferMoneyEvent(
        fromWalletId: 'wallet-id', // TODO: Get from user state
        toPhoneNumber: _recipientPhone!,
        amount: double.parse(_amountController.text),
        pin: pin,
        description: _noteController.text.isNotEmpty ? _noteController.text : null,
      ));
    }));
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<TransferBloc, TransferState>(
      listener: (context, state) {
        if (state is RecipientValidated) { setState(() { _recipientName = state.name; _recipientPhone = state.phoneNumber; _step = 1; _errorText = null; }); }
        else if (state is TransferSuccess) { setState(() => _step = 3); }
        else if (state is TransferError) { setState(() => _errorText = state.message); }
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('تحويل أموال'), leading: IconButton(icon: const Icon(Icons.close), onPressed: () => context.pop())),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: _buildStep(),
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0: return _buildRecipientStep();
      case 1: return _buildAmountStep();
      case 2: return _buildReviewStep();
      case 3: return _buildSuccessStep();
      default: return const SizedBox();
    }
  }

  Widget _buildRecipientStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('المستلم', style: AppTypography.headline3),
        const SizedBox(height: 8),
        Text('أدخل رقم هاتف المستلم', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 24),
        PhoneInputField(controller: _phoneController, errorText: _errorText, autofocus: true),
        const Spacer(),
        BlocBuilder<TransferBloc, TransferState>(
          builder: (context, state) => CustomButton(text: 'متابعة', onPressed: _onValidateRecipient, isLoading: state is TransferLoading),
        ),
      ],
    );
  }

  Widget _buildAmountStep() {
    return Column(
      children: [
        // Recipient Card
        CustomCard(
          child: Row(children: [
            CircleAvatar(backgroundColor: AppColors.primarySurface, child: Text(_recipientName?.substring(0, 1) ?? 'U', style: const TextStyle(color: AppColors.primary))),
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_recipientName ?? '', style: AppTypography.labelMedium),
              Text(Formatters.phone(_recipientPhone ?? ''), style: AppTypography.caption, textDirection: TextDirection.ltr),
            ]),
          ]),
        ),
        const SizedBox(height: 32),
        AmountInputField(controller: _amountController, errorText: _errorText),
        const SizedBox(height: 24),
        // Quick amounts
        Wrap(spacing: 8, children: [50, 100, 200, 500].map((amt) => ActionChip(label: Text('$amt'), onPressed: () => _amountController.text = amt.toString())).toList()),
        const SizedBox(height: 24),
        CustomTextField(controller: _noteController, label: 'ملاحظة (اختياري)', hint: 'أضف ملاحظة للمستلم', maxLines: 2),
        const Spacer(),
        CustomButton(text: 'متابعة', onPressed: _onContinueToReview),
      ],
    );
  }

  Widget _buildReviewStep() {
    final amount = double.tryParse(_amountController.text) ?? 0;
    return Column(
      children: [
        Text('مراجعة التحويل', style: AppTypography.headline3),
        const SizedBox(height: 24),
        CustomCard(
          child: Column(children: [
            InfoRow(label: 'المستلم', value: _recipientName ?? ''),
            InfoRow(label: 'الهاتف', value: Formatters.phone(_recipientPhone ?? '')),
            InfoRow(label: 'المبلغ', value: Formatters.currency(amount)),
            InfoRow(label: 'الرسوم', value: 'مجاني', showDivider: false),
          ]),
        ),
        const SizedBox(height: 16),
        CustomCard(
          backgroundColor: AppColors.primarySurface,
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('الإجمالي', style: AppTypography.labelLarge),
            Text(Formatters.currency(amount), style: AppTypography.headline3.copyWith(color: AppColors.primary)),
          ]),
        ),
        if (_errorText != null) Padding(padding: const EdgeInsets.only(top: 16), child: Text(_errorText!, style: TextStyle(color: AppColors.error))),
        const Spacer(),
        BlocBuilder<TransferBloc, TransferState>(
          builder: (context, state) => CustomButton(text: 'تأكيد التحويل', onPressed: _showPinDialog, isLoading: state is TransferLoading),
        ),
      ],
    );
  }

  Widget _buildSuccessStep() {
    final state = context.read<TransferBloc>().state;
    final reference = state is TransferSuccess ? state.reference : '';
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 100, height: 100, decoration: const BoxDecoration(color: AppColors.successLight, shape: BoxShape.circle),
          child: const Icon(Icons.check, size: 60, color: AppColors.success)),
        const SizedBox(height: 24),
        Text('تم التحويل بنجاح!', style: AppTypography.headline2),
        const SizedBox(height: 8),
        Text(Formatters.currency(double.tryParse(_amountController.text) ?? 0), style: AppTypography.amountLarge),
        const SizedBox(height: 8),
        Text('إلى $_recipientName', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 24),
        CustomCard(child: InfoRow(label: 'رقم المرجع', value: reference, showDivider: false)),
        const Spacer(),
        CustomButton(text: 'تم', onPressed: () => context.pop()),
      ],
    );
  }
}

class _PinSheet extends StatefulWidget {
  final Function(String) onConfirm;
  const _PinSheet({required this.onConfirm});
  @override
  State<_PinSheet> createState() => _PinSheetState();
}

class _PinSheetState extends State<_PinSheet> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('أدخل رمز PIN', style: AppTypography.headline3),
          const SizedBox(height: 24),
          PINInputField(onCompleted: widget.onConfirm),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
