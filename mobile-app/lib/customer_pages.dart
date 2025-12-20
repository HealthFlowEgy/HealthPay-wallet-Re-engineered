// lib/presentation/pages/customer/dashboard/customer_dashboard_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/config.dart';
import '../../../bloc/auth/auth_bloc.dart';
import '../../../bloc/wallet/wallet_bloc.dart';
import '../../../widgets/common/widgets.dart';
import '../../../widgets/wallet/wallet_widgets.dart';

class CustomerDashboardPage extends StatefulWidget {
  const CustomerDashboardPage({super.key});

  @override
  State<CustomerDashboardPage> createState() => _CustomerDashboardPageState();
}

class _CustomerDashboardPageState extends State<CustomerDashboardPage> {
  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  void _loadWallet() {
    final authState = context.read<AuthBloc>().state;
    if (authState is AuthAuthenticated) {
      context.read<WalletBloc>().add(WalletLoadRequested(authState.userId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            context.read<WalletBloc>().add(WalletRefreshRequested());
          },
          child: BlocBuilder<WalletBloc, WalletState>(
            builder: (context, state) {
              if (state is WalletLoading) {
                return const LoadingIndicator(message: 'Loading wallet...');
              }

              if (state is WalletError) {
                return AppErrorWidget(
                  message: state.message,
                  onRetry: _loadWallet,
                );
              }

              if (state is WalletLoaded) {
                return _buildDashboard(state);
              }

              return const SizedBox.shrink();
            },
          ),
        ),
      ),
    );
  }

  Widget _buildDashboard(WalletLoaded state) {
    return CustomScrollView(
      slivers: [
        // App Bar
        SliverAppBar(
          floating: true,
          title: Row(
            children: [
              CircleAvatar(
                backgroundColor: AppTheme.primaryLight,
                child: const Icon(Icons.person, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const Text(
                    'User',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () => context.push('/customer/notifications'),
            ),
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () => context.push('/customer/settings'),
            ),
          ],
        ),

        // Content
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Balance Card
              BalanceCard(
                balance: state.wallet.balance,
                availableBalance: state.wallet.availableBalance,
                pendingBalance: state.wallet.pendingBalance,
                currency: state.wallet.currency,
              ),
              const SizedBox(height: 24),

              // Quick Actions
              _buildQuickActions(),
              const SizedBox(height: 24),

              // Recent Transactions
              _buildRecentTransactions(state),
            ]),
          ),
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
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _QuickActionButton(
              icon: Icons.arrow_upward,
              label: 'Send',
              color: AppTheme.primaryColor,
              onTap: () => context.push('/customer/send-money'),
            ),
            _QuickActionButton(
              icon: Icons.arrow_downward,
              label: 'Receive',
              color: AppTheme.successColor,
              onTap: () => context.push('/customer/receive-money'),
            ),
            _QuickActionButton(
              icon: Icons.add,
              label: 'Top Up',
              color: AppTheme.secondaryColor,
              onTap: () => context.push('/customer/topup'),
            ),
            _QuickActionButton(
              icon: Icons.qr_code_scanner,
              label: 'Scan',
              color: AppTheme.accentColor,
              onTap: () => context.push('/customer/scan'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentTransactions(WalletLoaded state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Transactions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/customer/transactions'),
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (state.recentTransactions.isEmpty)
          const EmptyState(
            title: 'No transactions yet',
            description: 'Your transactions will appear here',
            icon: Icons.receipt_long_outlined,
          )
        else
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: state.recentTransactions.map((transaction) {
                return TransactionItem(
                  reference: transaction.reference,
                  type: transaction.type,
                  status: transaction.status,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  recipientName: transaction.recipientName,
                  description: transaction.description,
                  createdAt: transaction.createdAt,
                  onTap: () => context.push(
                    '/customer/transactions/${transaction.id}',
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// lib/presentation/pages/customer/send_money/send_money_page.dart

class SendMoneyPage extends StatefulWidget {
  const SendMoneyPage({super.key});

  @override
  State<SendMoneyPage> createState() => _SendMoneyPageState();
}

class _SendMoneyPageState extends State<SendMoneyPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();

  int _currentStep = 0;
  String? _recipientName;

  @override
  void dispose() {
    _phoneController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _onContinue() {
    if (_currentStep == 0) {
      if (_formKey.currentState!.validate()) {
        // TODO: Lookup recipient name
        setState(() {
          _recipientName = 'John Doe'; // Mock
          _currentStep = 1;
        });
      }
    } else if (_currentStep == 1) {
      if (_formKey.currentState!.validate()) {
        setState(() => _currentStep = 2);
      }
    }
  }

  void _onConfirm(String pin) {
    final walletState = context.read<WalletBloc>().state;
    if (walletState is WalletLoaded) {
      context.read<TransactionBloc>().add(SendMoneyRequested(
            senderWalletId: walletState.wallet.id,
            recipientPhone: _phoneController.text,
            amount: double.parse(_amountController.text),
            pin: pin,
            description: _descriptionController.text.isNotEmpty
                ? _descriptionController.text
                : null,
          ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Money'),
      ),
      body: BlocListener<TransactionBloc, TransactionState>(
        listener: (context, state) {
          if (state is SendMoneySuccess) {
            context.pushReplacement(
              '/customer/transactions/${state.transaction.id}/success',
            );
          } else if (state is TransactionError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppTheme.errorColor,
              ),
            );
          }
        },
        child: SafeArea(
          child: Form(
            key: _formKey,
            child: _buildCurrentStep(),
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildRecipientStep();
      case 1:
        return _buildAmountStep();
      case 2:
        return _buildConfirmStep();
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildRecipientStep() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Who are you sending to?',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Enter the recipient\'s phone number',
            style: TextStyle(color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 32),
          AppTextField(
            controller: _phoneController,
            label: 'Phone Number',
            hint: 'e.g., 01012345678',
            keyboardType: TextInputType.phone,
            prefixIcon: const Icon(Icons.phone_outlined),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter a phone number';
              }
              if (value.length < 10) {
                return 'Please enter a valid phone number';
              }
              return null;
            },
          ),
          const Spacer(),
          AppButton(
            text: 'Continue',
            onPressed: _onContinue,
          ),
        ],
      ),
    );
  }

  Widget _buildAmountStep() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Recipient info
          AppCard(
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.primaryLight,
                  child: Text(
                    _recipientName?.substring(0, 1) ?? 'U',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _recipientName ?? 'Unknown',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      _phoneController.text,
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => setState(() => _currentStep = 0),
                  child: const Text('Change'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'How much?',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          AppTextField(
            controller: _amountController,
            label: 'Amount',
            hint: '0.00',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            prefixIcon: const Icon(Icons.attach_money),
            suffixIcon: const Padding(
              padding: EdgeInsets.all(16),
              child: Text('EGP', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter an amount';
              }
              final amount = double.tryParse(value);
              if (amount == null || amount <= 0) {
                return 'Please enter a valid amount';
              }
              if (amount < 1) {
                return 'Minimum amount is 1 EGP';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          AppTextField(
            controller: _descriptionController,
            label: 'Description (Optional)',
            hint: 'What is this for?',
            prefixIcon: const Icon(Icons.note_outlined),
            maxLines: 2,
          ),
          const Spacer(),
          AppButton(
            text: 'Continue',
            onPressed: _onContinue,
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmStep() {
    final amount = double.tryParse(_amountController.text) ?? 0;
    const fee = 0.0; // TODO: Calculate fee
    final total = amount + fee;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Confirm Transfer',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 32),

          // Summary Card
          AppCard(
            child: Column(
              children: [
                _SummaryRow(label: 'To', value: _recipientName ?? 'Unknown'),
                const Divider(),
                _SummaryRow(label: 'Phone', value: _phoneController.text),
                const Divider(),
                _SummaryRow(
                  label: 'Amount',
                  value: 'EGP ${amount.toStringAsFixed(2)}',
                ),
                const Divider(),
                _SummaryRow(
                  label: 'Fee',
                  value: 'EGP ${fee.toStringAsFixed(2)}',
                ),
                const Divider(),
                _SummaryRow(
                  label: 'Total',
                  value: 'EGP ${total.toStringAsFixed(2)}',
                  isTotal: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          const Text(
            'Enter your PIN to confirm',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 16),

          BlocBuilder<TransactionBloc, TransactionState>(
            builder: (context, state) {
              if (state is SendMoneyLoading) {
                return const LoadingIndicator(message: 'Processing...');
              }
              return PinInput(
                length: 4,
                onCompleted: _onConfirm,
              );
            },
          ),

          const Spacer(),

          AppButton(
            text: 'Cancel',
            isOutlined: true,
            onPressed: () => context.pop(),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isTotal;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.isTotal = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isTotal ? AppTheme.textPrimary : AppTheme.textSecondary,
              fontWeight: isTotal ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
              fontSize: isTotal ? 18 : 14,
              color: isTotal ? AppTheme.primaryColor : AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

// lib/presentation/pages/customer/receive_money/receive_money_page.dart

class ReceiveMoneyPage extends StatefulWidget {
  const ReceiveMoneyPage({super.key});

  @override
  State<ReceiveMoneyPage> createState() => _ReceiveMoneyPageState();
}

class _ReceiveMoneyPageState extends State<ReceiveMoneyPage> {
  final _amountController = TextEditingController();
  bool _hasAmount = false;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  String _generateQrData() {
    final walletState = context.read<WalletBloc>().state;
    if (walletState is WalletLoaded) {
      final data = {
        'type': 'healthpay_transfer',
        'wallet_id': walletState.wallet.id,
        'wallet_number': walletState.wallet.walletNumber,
        if (_hasAmount) 'amount': _amountController.text,
      };
      return Uri(queryParameters: data.map((k, v) => MapEntry(k, v.toString())))
          .query;
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Receive Money'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 24),

              // QR Code
              QrGenerator(
                data: _generateQrData(),
                size: 250,
              ),
              const SizedBox(height: 24),

              Text(
                'Scan to pay me',
                style: context.textTheme.titleLarge,
              ),
              const SizedBox(height: 8),

              BlocBuilder<WalletBloc, WalletState>(
                builder: (context, state) {
                  if (state is WalletLoaded) {
                    return Text(
                      state.wallet.walletNumber ?? 'Loading...',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 16,
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
              const SizedBox(height: 32),

              // Optional Amount
              SwitchListTile(
                title: const Text('Request specific amount'),
                value: _hasAmount,
                onChanged: (value) => setState(() => _hasAmount = value),
              ),

              if (_hasAmount) ...[
                const SizedBox(height: 16),
                AppTextField(
                  controller: _amountController,
                  label: 'Amount',
                  hint: '0.00',
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  prefixIcon: const Icon(Icons.attach_money),
                  onChanged: (_) => setState(() {}),
                ),
              ],
              const SizedBox(height: 32),

              // Share Button
              AppButton(
                text: 'Share QR Code',
                icon: const Icon(Icons.share, color: Colors.white),
                onPressed: () {
                  // TODO: Share QR code
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// lib/presentation/pages/customer/transactions/transaction_history_page.dart

class TransactionHistoryPage extends StatefulWidget {
  const TransactionHistoryPage({super.key});

  @override
  State<TransactionHistoryPage> createState() => _TransactionHistoryPageState();
}

class _TransactionHistoryPageState extends State<TransactionHistoryPage> {
  String? _selectedType;
  String? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadTransactions();
  }

  void _loadTransactions() {
    final walletState = context.read<WalletBloc>().state;
    if (walletState is WalletLoaded) {
      context.read<TransactionBloc>().add(TransactionLoadRequested(
            walletId: walletState.wallet.id,
            type: _selectedType,
            status: _selectedStatus,
          ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: BlocBuilder<TransactionBloc, TransactionState>(
        builder: (context, state) {
          if (state is TransactionLoading) {
            return const LoadingIndicator(message: 'Loading transactions...');
          }

          if (state is TransactionError) {
            return AppErrorWidget(
              message: state.message,
              onRetry: _loadTransactions,
            );
          }

          if (state is TransactionLoaded) {
            if (state.transactions.isEmpty) {
              return const EmptyState(
                title: 'No transactions',
                description: 'Your transactions will appear here',
                icon: Icons.receipt_long_outlined,
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<TransactionBloc>().add(TransactionRefreshRequested());
              },
              child: ListView.builder(
                itemCount: state.transactions.length + (state.hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == state.transactions.length) {
                    // Load more
                    if (state is! TransactionLoadingMore) {
                      context
                          .read<TransactionBloc>()
                          .add(TransactionLoadMoreRequested());
                    }
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }

                  final transaction = state.transactions[index];
                  return TransactionItem(
                    reference: transaction.reference,
                    type: transaction.type,
                    status: transaction.status,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    recipientName: transaction.recipientName,
                    description: transaction.description,
                    createdAt: transaction.createdAt,
                    onTap: () => context.push(
                      '/customer/transactions/${transaction.id}',
                    ),
                  );
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Filter Transactions',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Type Filter
                  const Text('Type', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _FilterChip(
                        label: 'All',
                        isSelected: _selectedType == null,
                        onSelected: () {
                          setSheetState(() => _selectedType = null);
                        },
                      ),
                      _FilterChip(
                        label: 'Sent',
                        isSelected: _selectedType == 'transfer_sent',
                        onSelected: () {
                          setSheetState(() => _selectedType = 'transfer_sent');
                        },
                      ),
                      _FilterChip(
                        label: 'Received',
                        isSelected: _selectedType == 'transfer_received',
                        onSelected: () {
                          setSheetState(() => _selectedType = 'transfer_received');
                        },
                      ),
                      _FilterChip(
                        label: 'Top Up',
                        isSelected: _selectedType == 'topup',
                        onSelected: () {
                          setSheetState(() => _selectedType = 'topup');
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Apply Button
                  AppButton(
                    text: 'Apply Filter',
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {});
                      _loadTransactions();
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onSelected;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onSelected(),
      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
      checkmarkColor: AppTheme.primaryColor,
    );
  }
}
