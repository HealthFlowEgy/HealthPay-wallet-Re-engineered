// lib/presentation/pages/merchant/dashboard/merchant_dashboard_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/config/config.dart';
import '../../../bloc/auth/auth_bloc.dart';
import '../../../widgets/common/widgets.dart';
import '../../../widgets/wallet/wallet_widgets.dart';

class MerchantDashboardPage extends StatefulWidget {
  const MerchantDashboardPage({super.key});

  @override
  State<MerchantDashboardPage> createState() => _MerchantDashboardPageState();
}

class _MerchantDashboardPageState extends State<MerchantDashboardPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            // Refresh data
          },
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                floating: true,
                title: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.store, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 12),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'My Business',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'MCH-12345',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(Icons.settings_outlined),
                    onPressed: () => context.push('/merchant/settings'),
                  ),
                ],
              ),

              // Content
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Balance Card
                    _MerchantBalanceCard(
                      balance: '125,450.00',
                      availableBalance: '120,000.00',
                      pendingBalance: '5,450.00',
                      onWithdraw: () => context.push('/merchant/withdrawal'),
                    ),
                    const SizedBox(height: 24),

                    // Today's Stats
                    _buildTodayStats(),
                    const SizedBox(height: 24),

                    // Quick Actions
                    _buildQuickActions(),
                    const SizedBox(height: 24),

                    // Recent Payments
                    _buildRecentPayments(),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/merchant/accept-payment'),
        icon: const Icon(Icons.qr_code),
        label: const Text('Accept Payment'),
      ),
    );
  }

  Widget _buildTodayStats() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Today\'s Overview',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _StatCard(
                title: 'Payments',
                value: '45',
                icon: Icons.payments_outlined,
                color: AppTheme.primaryColor,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _StatCard(
                title: 'Revenue',
                value: 'EGP 12,500',
                icon: Icons.trending_up,
                color: AppTheme.successColor,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _QuickAction(
              icon: Icons.qr_code,
              label: 'Accept Payment',
              onTap: () => context.push('/merchant/accept-payment'),
            ),
            _QuickAction(
              icon: Icons.account_balance_wallet_outlined,
              label: 'Withdraw',
              onTap: () => context.push('/merchant/withdrawal'),
            ),
            _QuickAction(
              icon: Icons.receipt_long_outlined,
              label: 'Transactions',
              onTap: () => context.push('/merchant/transactions'),
            ),
            _QuickAction(
              icon: Icons.analytics_outlined,
              label: 'Reports',
              onTap: () => context.push('/merchant/reports'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentPayments() {
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);
    final timeFormat = DateFormat('HH:mm');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Payments',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/merchant/transactions'),
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        AppCard(
          padding: EdgeInsets.zero,
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 5,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.successColor.withOpacity(0.1),
                  child: const Icon(
                    Icons.arrow_downward,
                    color: AppTheme.successColor,
                  ),
                ),
                title: Text(
                  '+20 10 ${1234 + index} ${5678 + index}',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                subtitle: Text(
                  'Payment • ${timeFormat.format(DateTime.now().subtract(Duration(hours: index)))}',
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: Text(
                  formatter.format(150 + (index * 50)),
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.successColor,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _MerchantBalanceCard extends StatelessWidget {
  final String balance;
  final String availableBalance;
  final String pendingBalance;
  final VoidCallback onWithdraw;

  const _MerchantBalanceCard({
    required this.balance,
    required this.availableBalance,
    required this.pendingBalance,
    required this.onWithdraw,
  });

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1A237E),
            Color(0xFF3949AB),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A237E).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Business Balance',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                ),
              ),
              ElevatedButton.icon(
                onPressed: onWithdraw,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF1A237E),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                icon: const Icon(Icons.arrow_upward, size: 18),
                label: const Text('Withdraw'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            formatter.format(double.tryParse(balance) ?? 0),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Available',
                      style: TextStyle(color: Colors.white60, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formatter.format(double.tryParse(availableBalance) ?? 0),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(width: 1, height: 40, color: Colors.white24),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Pending',
                        style: TextStyle(color: Colors.white60, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatter.format(double.tryParse(pendingBalance) ?? 0),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
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

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.primaryColor),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// lib/presentation/pages/merchant/accept_payment/accept_payment_page.dart

class AcceptPaymentPage extends StatefulWidget {
  const AcceptPaymentPage({super.key});

  @override
  State<AcceptPaymentPage> createState() => _AcceptPaymentPageState();
}

class _AcceptPaymentPageState extends State<AcceptPaymentPage> {
  final _amountController = TextEditingController();
  final _orderIdController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  bool _qrGenerated = false;
  String? _paymentId;

  @override
  void dispose() {
    _amountController.dispose();
    _orderIdController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _generateQr() {
    if (_amountController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an amount')),
      );
      return;
    }

    setState(() {
      _qrGenerated = true;
      _paymentId = 'PAY-${DateTime.now().millisecondsSinceEpoch}';
    });
  }

  String _generateQrData() {
    return 'healthpay://pay?'
        'merchant_id=MCH-12345'
        '&amount=${_amountController.text}'
        '&order_id=${_orderIdController.text}'
        '&payment_id=$_paymentId';
  }

  void _resetQr() {
    setState(() {
      _qrGenerated = false;
      _paymentId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Accept Payment'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _qrGenerated ? _buildQrView() : _buildAmountForm(),
        ),
      ),
    );
  }

  Widget _buildAmountForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Enter Payment Details',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Generate a QR code for customers to pay',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        const SizedBox(height: 32),

        // Amount
        AppTextField(
          controller: _amountController,
          label: 'Amount *',
          hint: '0.00',
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          prefixIcon: const Icon(Icons.attach_money),
          suffixIcon: const Padding(
            padding: EdgeInsets.all(16),
            child: Text('EGP', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 16),

        // Order ID
        AppTextField(
          controller: _orderIdController,
          label: 'Order ID (Optional)',
          hint: 'e.g., ORD-12345',
          prefixIcon: const Icon(Icons.tag),
        ),
        const SizedBox(height: 16),

        // Description
        AppTextField(
          controller: _descriptionController,
          label: 'Description (Optional)',
          hint: 'Payment for...',
          prefixIcon: const Icon(Icons.note_outlined),
          maxLines: 2,
        ),
        const SizedBox(height: 32),

        AppButton(
          text: 'Generate QR Code',
          icon: const Icon(Icons.qr_code, color: Colors.white),
          onPressed: _generateQr,
        ),
      ],
    );
  }

  Widget _buildQrView() {
    final amount = double.tryParse(_amountController.text) ?? 0;
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);

    return Column(
      children: [
        const SizedBox(height: 24),

        // Amount Display
        Text(
          formatter.format(amount),
          style: const TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.bold,
            color: AppTheme.primaryColor,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Payment ID: $_paymentId',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        const SizedBox(height: 32),

        // QR Code
        QrGenerator(
          data: _generateQrData(),
          size: 280,
        ),
        const SizedBox(height: 24),

        const Text(
          'Ask customer to scan this QR code',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Waiting for payment...',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        const SizedBox(height: 32),

        // Timer/Status
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppTheme.warningColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.timer, color: AppTheme.warningColor),
              const SizedBox(width: 8),
              const Text(
                'Expires in 5:00',
                style: TextStyle(
                  color: AppTheme.warningColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),

        // Actions
        Row(
          children: [
            Expanded(
              child: AppButton(
                text: 'Cancel',
                isOutlined: true,
                onPressed: _resetQr,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: AppButton(
                text: 'Share',
                icon: const Icon(Icons.share, color: Colors.white),
                onPressed: () {
                  // Share QR code
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// lib/presentation/pages/merchant/withdrawal/request_withdrawal_page.dart

class RequestWithdrawalPage extends StatefulWidget {
  const RequestWithdrawalPage({super.key});

  @override
  State<RequestWithdrawalPage> createState() => _RequestWithdrawalPageState();
}

class _RequestWithdrawalPageState extends State<RequestWithdrawalPage> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _accountNameController = TextEditingController();
  final _ibanController = TextEditingController();
  
  String _selectedBank = 'National Bank of Egypt';
  
  final _banks = [
    'National Bank of Egypt',
    'Commercial International Bank (CIB)',
    'Banque Misr',
    'Bank of Alexandria',
    'HSBC Egypt',
    'QNB Alahli',
  ];

  @override
  void dispose() {
    _amountController.dispose();
    _accountNumberController.dispose();
    _accountNameController.dispose();
    _ibanController.dispose();
    super.dispose();
  }

  void _submitRequest() {
    if (!_formKey.currentState!.validate()) return;

    // TODO: Submit withdrawal request
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Withdrawal Request Submitted'),
        content: const Text(
          'Your withdrawal request has been submitted successfully. '
          'It will be processed within 1-2 business days.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop();
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Withdrawal'),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Available Balance
                AppCard(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Available Balance',
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                      Text(
                        formatter.format(120000),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Amount
                const Text(
                  'Withdrawal Amount',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                AppTextField(
                  controller: _amountController,
                  hint: '0.00',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  prefixIcon: const Icon(Icons.attach_money),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter an amount';
                    }
                    final amount = double.tryParse(value);
                    if (amount == null || amount <= 0) {
                      return 'Please enter a valid amount';
                    }
                    if (amount > 120000) {
                      return 'Amount exceeds available balance';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // Bank Selection
                const Text(
                  'Bank',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedBank,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: _banks
                      .map((bank) => DropdownMenuItem(
                            value: bank,
                            child: Text(bank),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setState(() => _selectedBank = value!);
                  },
                ),
                const SizedBox(height: 16),

                // Account Number
                const Text(
                  'Account Number',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                AppTextField(
                  controller: _accountNumberController,
                  hint: 'Enter account number',
                  keyboardType: TextInputType.number,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter account number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Account Name
                const Text(
                  'Account Holder Name',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                AppTextField(
                  controller: _accountNameController,
                  hint: 'Enter account holder name',
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter account holder name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // IBAN (Optional)
                const Text(
                  'IBAN (Optional)',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                AppTextField(
                  controller: _ibanController,
                  hint: 'Enter IBAN',
                ),
                const SizedBox(height: 24),

                // Fee Notice
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.infoColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: AppTheme.infoColor),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Withdrawal fee: EGP 5.00. Processing time: 1-2 business days.',
                          style: TextStyle(
                            color: AppTheme.infoColor,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Submit Button
                AppButton(
                  text: 'Submit Request',
                  onPressed: _submitRequest,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
