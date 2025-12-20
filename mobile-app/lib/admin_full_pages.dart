// lib/presentation/pages/admin/kyc/kyc_management_page.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/config/config.dart';
import '../../../widgets/common/widgets.dart';

class KycManagementPageFull extends StatefulWidget {
  const KycManagementPageFull({super.key});

  @override
  State<KycManagementPageFull> createState() => _KycManagementPageFullState();
}

class _KycManagementPageFullState extends State<KycManagementPageFull>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedType = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KYC Management'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'Approved'),
            Tab(text: 'Rejected'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Document Type Filter
          Padding(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip(
                    label: 'All',
                    isSelected: _selectedType == 'all',
                    onSelected: () => setState(() => _selectedType = 'all'),
                  ),
                  _FilterChip(
                    label: 'National ID',
                    isSelected: _selectedType == 'national_id',
                    onSelected: () => setState(() => _selectedType = 'national_id'),
                  ),
                  _FilterChip(
                    label: 'Passport',
                    isSelected: _selectedType == 'passport',
                    onSelected: () => setState(() => _selectedType = 'passport'),
                  ),
                  _FilterChip(
                    label: 'Driver License',
                    isSelected: _selectedType == 'driver_license',
                    onSelected: () => setState(() => _selectedType = 'driver_license'),
                  ),
                ],
              ),
            ),
          ),

          // Tab Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildKycList('pending'),
                _buildKycList('approved'),
                _buildKycList('rejected'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKycList(String status) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 10,
      itemBuilder: (context, index) {
        return _KycDocumentCard(
          userName: 'Ahmed Hassan ${index + 1}',
          phone: '+20 10 ${1234 + index} ${5678 + index}',
          documentType: index % 3 == 0
              ? 'National ID'
              : index % 3 == 1
                  ? 'Passport'
                  : 'Driver License',
          documentNumber: '2${9000000000000 + index}',
          submittedAt: DateTime.now().subtract(Duration(hours: index * 2)),
          status: status,
          onView: () => _showKycDetails(index),
          onApprove: status == 'pending' ? () => _approveKyc(index) : null,
          onReject: status == 'pending' ? () => _rejectKyc(index) : null,
        );
      },
    );
  }

  void _showKycDetails(int index) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.8,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: AppTheme.primaryLight,
                        child: const Text('AH', style: TextStyle(color: Colors.white)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Ahmed Hassan ${index + 1}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '+20 10 ${1234 + index} ${5678 + index}',
                              style: TextStyle(color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Document Image Preview
                  const Text(
                    'Document Image',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.image, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text('Document Image Preview'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Document Details
                  const Text(
                    'Document Details',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  AppCard(
                    child: Column(
                      children: [
                        _DetailRow(label: 'Type', value: 'National ID'),
                        const Divider(),
                        _DetailRow(label: 'Number', value: '2${9000000000000 + index}'),
                        const Divider(),
                        _DetailRow(label: 'Expiry', value: '15 Jan 2030'),
                        const Divider(),
                        _DetailRow(
                          label: 'Submitted',
                          value: DateFormat('dd MMM yyyy, HH:mm')
                              .format(DateTime.now().subtract(Duration(hours: index * 2))),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Actions
                  Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          text: 'Reject',
                          backgroundColor: AppTheme.errorColor,
                          onPressed: () {
                            Navigator.pop(context);
                            _rejectKyc(index);
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: AppButton(
                          text: 'Approve',
                          backgroundColor: AppTheme.successColor,
                          onPressed: () {
                            Navigator.pop(context);
                            _approveKyc(index);
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _approveKyc(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Approve KYC'),
        content: const Text('Are you sure you want to approve this KYC document?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('KYC document approved'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.successColor),
            child: const Text('Approve'),
          ),
        ],
      ),
    );
  }

  void _rejectKyc(int index) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject KYC'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Please provide a reason for rejection:'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter reason...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('KYC document rejected'),
                  backgroundColor: AppTheme.errorColor,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }
}

class _KycDocumentCard extends StatelessWidget {
  final String userName;
  final String phone;
  final String documentType;
  final String documentNumber;
  final DateTime submittedAt;
  final String status;
  final VoidCallback onView;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  const _KycDocumentCard({
    required this.userName,
    required this.phone,
    required this.documentType,
    required this.documentNumber,
    required this.submittedAt,
    required this.status,
    required this.onView,
    this.onApprove,
    this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: AppTheme.primaryLight,
                child: Text(
                  userName.substring(0, 1),
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      userName,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      phone,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusBadge(status: status),
            ],
          ),
          const Divider(height: 24),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Document Type',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    Text(documentType, style: const TextStyle(fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Document Number',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    Text(
                      documentNumber.substring(0, 4) + '****',
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                DateFormat('dd MMM yyyy, HH:mm').format(submittedAt),
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
              Row(
                children: [
                  if (onReject != null)
                    TextButton(
                      onPressed: onReject,
                      child: const Text('Reject', style: TextStyle(color: AppTheme.errorColor)),
                    ),
                  if (onApprove != null)
                    ElevatedButton(
                      onPressed: onApprove,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.successColor,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                      child: const Text('Approve'),
                    ),
                  if (onApprove == null && onReject == null)
                    TextButton(
                      onPressed: onView,
                      child: const Text('View Details'),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
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
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onSelected(),
        selectedColor: AppTheme.primaryColor.withOpacity(0.2),
        checkmarkColor: AppTheme.primaryColor,
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  Color get _color {
    switch (status) {
      case 'approved':
        return AppTheme.successColor;
      case 'pending':
        return AppTheme.warningColor;
      case 'rejected':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: _color,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: AppTheme.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// lib/presentation/pages/admin/withdrawals/withdrawal_requests_page.dart

class WithdrawalRequestsPageFull extends StatefulWidget {
  const WithdrawalRequestsPageFull({super.key});

  @override
  State<WithdrawalRequestsPageFull> createState() => _WithdrawalRequestsPageFullState();
}

class _WithdrawalRequestsPageFullState extends State<WithdrawalRequestsPageFull>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Withdrawal Requests'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'Processing'),
            Tab(text: 'Completed'),
            Tab(text: 'Rejected'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildWithdrawalList('pending'),
          _buildWithdrawalList('processing'),
          _buildWithdrawalList('completed'),
          _buildWithdrawalList('rejected'),
        ],
      ),
    );
  }

  Widget _buildWithdrawalList(String status) {
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 10,
      itemBuilder: (context, index) {
        return _WithdrawalCard(
          reference: 'WDR-${DateTime.now().millisecondsSinceEpoch - index * 1000}',
          merchantName: 'Tech Solutions ${index + 1}',
          merchantCode: 'MCH-${10000 + index}',
          amount: 10000 + (index * 5000),
          fee: 5.0,
          bankName: 'National Bank of Egypt',
          accountNumber: '1234****${5678 + index}',
          status: status,
          createdAt: DateTime.now().subtract(Duration(hours: index * 3)),
          onApprove: status == 'pending' ? () => _approveWithdrawal(index) : null,
          onReject: status == 'pending' ? () => _rejectWithdrawal(index) : null,
          onMarkProcessing: status == 'pending' ? () => _markProcessing(index) : null,
          onMarkCompleted: status == 'processing' ? () => _markCompleted(index) : null,
        );
      },
    );
  }

  void _approveWithdrawal(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Approve Withdrawal'),
        content: const Text('Are you sure you want to approve this withdrawal request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Withdrawal approved and marked for processing'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('Approve'),
          ),
        ],
      ),
    );
  }

  void _rejectWithdrawal(int index) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Withdrawal'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Please provide a reason for rejection:'),
            const SizedBox(height: 16),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter reason...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Withdrawal rejected'),
                  backgroundColor: AppTheme.errorColor,
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.errorColor),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }

  void _markProcessing(int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Withdrawal marked as processing'),
        backgroundColor: AppTheme.infoColor,
      ),
    );
  }

  void _markCompleted(int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Mark as Completed'),
        content: const Text('Confirm that this withdrawal has been processed and funds transferred?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Withdrawal marked as completed'),
                  backgroundColor: AppTheme.successColor,
                ),
              );
            },
            child: const Text('Complete'),
          ),
        ],
      ),
    );
  }
}

class _WithdrawalCard extends StatelessWidget {
  final String reference;
  final String merchantName;
  final String merchantCode;
  final double amount;
  final double fee;
  final String bankName;
  final String accountNumber;
  final String status;
  final DateTime createdAt;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;
  final VoidCallback? onMarkProcessing;
  final VoidCallback? onMarkCompleted;

  const _WithdrawalCard({
    required this.reference,
    required this.merchantName,
    required this.merchantCode,
    required this.amount,
    required this.fee,
    required this.bankName,
    required this.accountNumber,
    required this.status,
    required this.createdAt,
    this.onApprove,
    this.onReject,
    this.onMarkProcessing,
    this.onMarkCompleted,
  });

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);

    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
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
                    reference,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontFamily: 'monospace',
                    ),
                  ),
                  Text(
                    DateFormat('dd MMM yyyy, HH:mm').format(createdAt),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              _StatusBadge(status: status),
            ],
          ),
          const Divider(height: 24),

          // Merchant Info
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.store, color: AppTheme.primaryColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(merchantName, style: const TextStyle(fontWeight: FontWeight.w500)),
                    Text(
                      merchantCode,
                      style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formatter.format(amount),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  Text(
                    'Fee: ${formatter.format(fee)}',
                    style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Bank Info
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.account_balance, size: 20, color: AppTheme.textSecondary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(bankName, style: const TextStyle(fontWeight: FontWeight.w500)),
                      Text(
                        'Account: $accountNumber',
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Actions
          if (onApprove != null || onReject != null || onMarkCompleted != null) ...[
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (onReject != null)
                  TextButton(
                    onPressed: onReject,
                    child: const Text('Reject', style: TextStyle(color: AppTheme.errorColor)),
                  ),
                if (onApprove != null)
                  ElevatedButton(
                    onPressed: onApprove,
                    child: const Text('Approve'),
                  ),
                if (onMarkCompleted != null)
                  ElevatedButton(
                    onPressed: onMarkCompleted,
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.successColor),
                    child: const Text('Mark Completed'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// lib/presentation/pages/admin/transactions/transaction_monitoring_page.dart

class TransactionMonitoringPageFull extends StatefulWidget {
  const TransactionMonitoringPageFull({super.key});

  @override
  State<TransactionMonitoringPageFull> createState() => _TransactionMonitoringPageFullState();
}

class _TransactionMonitoringPageFullState extends State<TransactionMonitoringPageFull> {
  final _searchController = TextEditingController();
  String? _selectedType;
  String? _selectedStatus;
  DateTimeRange? _dateRange;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction Monitoring'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterSheet,
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: _exportTransactions,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: AppTextField(
              controller: _searchController,
              hint: 'Search by reference, phone, or name...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _searchController.clear();
                  setState(() {});
                },
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),

          // Stats Cards
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: _MiniStatCard(
                    title: 'Today',
                    value: '1,234',
                    subtitle: 'EGP 2.5M',
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _MiniStatCard(
                    title: 'Pending',
                    value: '23',
                    subtitle: 'EGP 45K',
                    color: AppTheme.warningColor,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _MiniStatCard(
                    title: 'Failed',
                    value: '5',
                    subtitle: 'EGP 12K',
                    color: AppTheme.errorColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Transaction List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 20,
              itemBuilder: (context, index) {
                return _AdminTransactionItem(
                  reference: 'TXN-${DateTime.now().millisecondsSinceEpoch - index * 1000}',
                  type: index % 4 == 0
                      ? 'topup'
                      : index % 4 == 1
                          ? 'transfer'
                          : index % 4 == 2
                              ? 'payment'
                              : 'withdrawal',
                  status: index % 5 == 0
                      ? 'pending'
                      : index % 5 == 1
                          ? 'failed'
                          : 'completed',
                  amount: 100 + (index * 50),
                  senderPhone: '+20 10 ${1234 + index} 5678',
                  recipientPhone: '+20 11 ${4321 + index} 8765',
                  createdAt: DateTime.now().subtract(Duration(hours: index)),
                  onTap: () => _showTransactionDetails(index),
                );
              },
            ),
          ),
        ],
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
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
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
                        onSelected: () => setSheetState(() => _selectedType = null),
                      ),
                      _FilterChip(
                        label: 'Transfer',
                        isSelected: _selectedType == 'transfer',
                        onSelected: () => setSheetState(() => _selectedType = 'transfer'),
                      ),
                      _FilterChip(
                        label: 'Top Up',
                        isSelected: _selectedType == 'topup',
                        onSelected: () => setSheetState(() => _selectedType = 'topup'),
                      ),
                      _FilterChip(
                        label: 'Payment',
                        isSelected: _selectedType == 'payment',
                        onSelected: () => setSheetState(() => _selectedType = 'payment'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Status Filter
                  const Text('Status', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _FilterChip(
                        label: 'All',
                        isSelected: _selectedStatus == null,
                        onSelected: () => setSheetState(() => _selectedStatus = null),
                      ),
                      _FilterChip(
                        label: 'Completed',
                        isSelected: _selectedStatus == 'completed',
                        onSelected: () => setSheetState(() => _selectedStatus = 'completed'),
                      ),
                      _FilterChip(
                        label: 'Pending',
                        isSelected: _selectedStatus == 'pending',
                        onSelected: () => setSheetState(() => _selectedStatus = 'pending'),
                      ),
                      _FilterChip(
                        label: 'Failed',
                        isSelected: _selectedStatus == 'failed',
                        onSelected: () => setSheetState(() => _selectedStatus = 'failed'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Date Range
                  OutlinedButton.icon(
                    onPressed: () async {
                      final range = await showDateRangePicker(
                        context: context,
                        firstDate: DateTime(2024),
                        lastDate: DateTime.now(),
                      );
                      if (range != null) {
                        setSheetState(() => _dateRange = range);
                      }
                    },
                    icon: const Icon(Icons.date_range),
                    label: Text(_dateRange != null
                        ? '${DateFormat('dd/MM').format(_dateRange!.start)} - ${DateFormat('dd/MM').format(_dateRange!.end)}'
                        : 'Select Date Range'),
                  ),
                  const SizedBox(height: 24),

                  AppButton(
                    text: 'Apply Filters',
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {});
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

  void _showTransactionDetails(int index) {
    // Show transaction details modal
  }

  void _exportTransactions() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Export started. You will be notified when ready.')),
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color color;

  const _MiniStatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 12, color: color)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          Text(subtitle, style: TextStyle(fontSize: 11, color: color.withOpacity(0.7))),
        ],
      ),
    );
  }
}

class _AdminTransactionItem extends StatelessWidget {
  final String reference;
  final String type;
  final String status;
  final double amount;
  final String senderPhone;
  final String recipientPhone;
  final DateTime createdAt;
  final VoidCallback onTap;

  const _AdminTransactionItem({
    required this.reference,
    required this.type,
    required this.status,
    required this.amount,
    required this.senderPhone,
    required this.recipientPhone,
    required this.createdAt,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _getTypeColor().withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(_getTypeIcon(), color: _getTypeColor(), size: 20),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                reference,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontFamily: 'monospace',
                  fontSize: 13,
                ),
              ),
            ),
            _StatusBadge(status: status),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text('$senderPhone → $recipientPhone', style: const TextStyle(fontSize: 12)),
            Text(
              DateFormat('dd MMM, HH:mm').format(createdAt),
              style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
            ),
          ],
        ),
        trailing: Text(
          formatter.format(amount),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        isThreeLine: true,
      ),
    );
  }

  IconData _getTypeIcon() {
    switch (type) {
      case 'topup':
        return Icons.add_circle_outline;
      case 'transfer':
        return Icons.swap_horiz;
      case 'payment':
        return Icons.shopping_bag_outlined;
      case 'withdrawal':
        return Icons.remove_circle_outline;
      default:
        return Icons.receipt;
    }
  }

  Color _getTypeColor() {
    switch (type) {
      case 'topup':
        return AppTheme.successColor;
      case 'transfer':
        return AppTheme.primaryColor;
      case 'payment':
        return AppTheme.secondaryColor;
      case 'withdrawal':
        return AppTheme.warningColor;
      default:
        return AppTheme.textSecondary;
    }
  }
}
