// lib/presentation/pages/admin/dashboard/admin_dashboard_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

import '../../../../core/config/config.dart';
import '../../../widgets/common/widgets.dart';

class AdminDashboardPage extends StatelessWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            // Refresh dashboard data
          },
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                floating: true,
                title: const Text('Admin Dashboard'),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(Icons.logout),
                    onPressed: () => _showLogoutDialog(context),
                  ),
                ],
              ),

              // Stats Cards
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.5,
                  ),
                  delegate: SliverChildListDelegate([
                    _StatCard(
                      title: 'Total Users',
                      value: '12,456',
                      icon: Icons.people,
                      color: AppTheme.primaryColor,
                      trend: '+12%',
                      isPositive: true,
                    ),
                    _StatCard(
                      title: 'Active Merchants',
                      value: '234',
                      icon: Icons.store,
                      color: AppTheme.secondaryColor,
                      trend: '+8%',
                      isPositive: true,
                    ),
                    _StatCard(
                      title: 'Today\'s Volume',
                      value: 'EGP 2.5M',
                      icon: Icons.trending_up,
                      color: AppTheme.successColor,
                      trend: '+23%',
                      isPositive: true,
                    ),
                    _StatCard(
                      title: 'Pending KYC',
                      value: '45',
                      icon: Icons.verified_user,
                      color: AppTheme.warningColor,
                      trend: '-5%',
                      isPositive: false,
                    ),
                  ]),
                ),
              ),

              // Quick Actions
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Quick Actions',
                        style: context.textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _QuickActionCard(
                              icon: Icons.people,
                              title: 'Users',
                              onTap: () => context.go('/admin/users'),
                            ),
                            _QuickActionCard(
                              icon: Icons.store,
                              title: 'Merchants',
                              onTap: () => context.go('/admin/merchants'),
                            ),
                            _QuickActionCard(
                              icon: Icons.receipt_long,
                              title: 'Transactions',
                              onTap: () => context.go('/admin/transactions'),
                            ),
                            _QuickActionCard(
                              icon: Icons.verified_user,
                              title: 'KYC',
                              badge: '45',
                              onTap: () => context.go('/admin/kyc'),
                            ),
                            _QuickActionCard(
                              icon: Icons.account_balance_wallet,
                              title: 'Withdrawals',
                              badge: '12',
                              onTap: () => context.go('/admin/withdrawals'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Transaction Chart
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Transaction Volume',
                              style: context.textTheme.titleMedium,
                            ),
                            TextButton(
                              onPressed: () {},
                              child: const Text('This Week'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 200,
                          child: _TransactionChart(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Recent Activity
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Recent Activity',
                            style: context.textTheme.titleLarge,
                          ),
                          TextButton(
                            onPressed: () {},
                            child: const Text('See All'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _ActivityItem(
                        icon: Icons.person_add,
                        title: 'New user registered',
                        subtitle: 'Ahmed Hassan - +201234567890',
                        time: '2 min ago',
                      ),
                      _ActivityItem(
                        icon: Icons.store,
                        title: 'Merchant application',
                        subtitle: 'Cairo Pharmacy submitted KYC',
                        time: '15 min ago',
                      ),
                      _ActivityItem(
                        icon: Icons.warning,
                        title: 'Failed transaction',
                        subtitle: 'Transaction #TXN123456 failed',
                        time: '1 hour ago',
                        isWarning: true,
                      ),
                      _ActivityItem(
                        icon: Icons.account_balance_wallet,
                        title: 'Withdrawal request',
                        subtitle: 'EGP 50,000 from Medical Center',
                        time: '2 hours ago',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              context.read<AuthBloc>().add(AuthLogoutRequested());
              context.go('/admin-login');
            },
            child: const Text('Logout', style: TextStyle(color: AppTheme.errorColor)),
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
  final String trend;
  final bool isPositive;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.trend,
    required this.isPositive,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPositive
                      ? AppTheme.successColor.withOpacity(0.1)
                      : AppTheme.errorColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  trend,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isPositive ? AppTheme.successColor : AppTheme.errorColor,
                  ),
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? badge;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 80,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Badge(
                isLabelVisible: badge != null,
                label: Text(badge ?? ''),
                child: Icon(icon, color: AppTheme.primaryColor),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(fontSize: 12),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TransactionChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LineChart(
      LineChartData(
        gridData: FlGridData(show: false),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                if (value.toInt() < days.length) {
                  return Text(
                    days[value.toInt()],
                    style: TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                  );
                }
                return const Text('');
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: const [
              FlSpot(0, 3),
              FlSpot(1, 1.5),
              FlSpot(2, 4),
              FlSpot(3, 3.5),
              FlSpot(4, 5),
              FlSpot(5, 4.2),
              FlSpot(6, 6),
            ],
            isCurved: true,
            color: AppTheme.primaryColor,
            barWidth: 3,
            dotData: FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: AppTheme.primaryColor.withOpacity(0.1),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String time;
  final bool isWarning;

  const _ActivityItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isWarning
                  ? AppTheme.warningColor.withOpacity(0.1)
                  : AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: isWarning ? AppTheme.warningColor : AppTheme.primaryColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            time,
            style: TextStyle(
              fontSize: 11,
              color: AppTheme.textHint,
            ),
          ),
        ],
      ),
    );
  }
}

// lib/presentation/pages/admin/users/user_management_page.dart

class UserManagementPage extends StatefulWidget {
  const UserManagementPage({super.key});

  @override
  State<UserManagementPage> createState() => _UserManagementPageState();
}

class _UserManagementPageState extends State<UserManagementPage> {
  final _searchController = TextEditingController();
  String _selectedStatus = 'all';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterSheet(context),
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
              hint: 'Search by name, phone, or email',
              prefixIcon: const Icon(Icons.search),
              onChanged: (value) {
                // Search users
              },
            ),
          ),

          // Status Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _StatusChip(
                  label: 'All',
                  isSelected: _selectedStatus == 'all',
                  onTap: () => setState(() => _selectedStatus = 'all'),
                ),
                _StatusChip(
                  label: 'Active',
                  isSelected: _selectedStatus == 'active',
                  color: AppTheme.successColor,
                  onTap: () => setState(() => _selectedStatus = 'active'),
                ),
                _StatusChip(
                  label: 'Pending',
                  isSelected: _selectedStatus == 'pending',
                  color: AppTheme.warningColor,
                  onTap: () => setState(() => _selectedStatus = 'pending'),
                ),
                _StatusChip(
                  label: 'Suspended',
                  isSelected: _selectedStatus == 'suspended',
                  color: AppTheme.errorColor,
                  onTap: () => setState(() => _selectedStatus = 'suspended'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // User List
          Expanded(
            child: ListView.builder(
              itemCount: 20,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemBuilder: (context, index) {
                return _UserListItem(
                  name: 'Ahmed Mohamed',
                  phone: '+201234567${890 + index}',
                  email: 'ahmed$index@example.com',
                  status: index % 3 == 0
                      ? 'pending'
                      : index % 5 == 0
                          ? 'suspended'
                          : 'active',
                  kycStatus: index % 2 == 0 ? 'approved' : 'pending',
                  createdAt: DateTime.now().subtract(Duration(days: index)),
                  onTap: () => _showUserDetails(context, index),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    // Show filter sheet
  }

  void _showUserDetails(BuildContext context, int index) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => _UserDetailSheet(
          scrollController: scrollController,
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final Color? color;
  final VoidCallback onTap;

  const _StatusChip({
    required this.label,
    required this.isSelected,
    this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onTap(),
        selectedColor: (color ?? AppTheme.primaryColor).withOpacity(0.2),
        checkmarkColor: color ?? AppTheme.primaryColor,
      ),
    );
  }
}

class _UserListItem extends StatelessWidget {
  final String name;
  final String phone;
  final String email;
  final String status;
  final String kycStatus;
  final DateTime createdAt;
  final VoidCallback onTap;

  const _UserListItem({
    required this.name,
    required this.phone,
    required this.email,
    required this.status,
    required this.kycStatus,
    required this.createdAt,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: _getStatusColor().withOpacity(0.2),
          child: Text(
            name[0],
            style: TextStyle(color: _getStatusColor()),
          ),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(phone, style: const TextStyle(fontSize: 12)),
            Row(
              children: [
                _Badge(
                  label: status.toUpperCase(),
                  color: _getStatusColor(),
                ),
                const SizedBox(width: 4),
                _Badge(
                  label: 'KYC: $kycStatus',
                  color: kycStatus == 'approved'
                      ? AppTheme.successColor
                      : AppTheme.warningColor,
                ),
              ],
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case 'active':
        return AppTheme.successColor;
      case 'pending':
        return AppTheme.warningColor;
      case 'suspended':
        return AppTheme.errorColor;
      default:
        return AppTheme.textSecondary;
    }
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;

  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _UserDetailSheet extends StatelessWidget {
  final ScrollController scrollController;

  const _UserDetailSheet({required this.scrollController});

  @override
  Widget build(BuildContext context) {
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.all(24),
      children: [
        // Header
        Center(
          child: Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.dividerColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Profile
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: AppTheme.primaryColor,
                child: const Text(
                  'AM',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Ahmed Mohamed',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '+201234567890',
                style: TextStyle(color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Actions
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _ActionButton(
              icon: Icons.block,
              label: 'Suspend',
              color: AppTheme.warningColor,
              onTap: () {},
            ),
            _ActionButton(
              icon: Icons.delete,
              label: 'Block',
              color: AppTheme.errorColor,
              onTap: () {},
            ),
            _ActionButton(
              icon: Icons.verified_user,
              label: 'KYC',
              color: AppTheme.primaryColor,
              onTap: () {},
            ),
            _ActionButton(
              icon: Icons.receipt,
              label: 'Transactions',
              color: AppTheme.secondaryColor,
              onTap: () {},
            ),
          ],
        ),

        const SizedBox(height: 24),

        // Details
        _DetailSection(
          title: 'Personal Information',
          items: [
            _DetailItem(label: 'Email', value: 'ahmed@example.com'),
            _DetailItem(label: 'National ID', value: '29012345678901'),
            _DetailItem(label: 'Date of Birth', value: '15 Jan 1990'),
            _DetailItem(label: 'Address', value: 'Cairo, Egypt'),
          ],
        ),

        _DetailSection(
          title: 'Account Status',
          items: [
            _DetailItem(label: 'Status', value: 'Active'),
            _DetailItem(label: 'KYC Level', value: 'Level 2 - Verified'),
            _DetailItem(label: 'Joined', value: '15 Oct 2024'),
            _DetailItem(label: 'Last Login', value: '2 hours ago'),
          ],
        ),

        _DetailSection(
          title: 'Wallet Information',
          items: [
            _DetailItem(label: 'Wallet Number', value: 'HP123456789'),
            _DetailItem(label: 'Balance', value: 'EGP 5,234.50'),
            _DetailItem(label: 'Daily Limit', value: 'EGP 10,000.00'),
            _DetailItem(label: 'Monthly Limit', value: 'EGP 100,000.00'),
          ],
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
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
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, color: color),
          ),
        ],
      ),
    );
  }
}

class _DetailSection extends StatelessWidget {
  final String title;
  final List<_DetailItem> items;

  const _DetailSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        AppCard(
          child: Column(children: items),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _DetailItem extends StatelessWidget {
  final String label;
  final String value;

  const _DetailItem({required this.label, required this.value});

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
