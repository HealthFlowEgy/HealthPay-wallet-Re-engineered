import 'package:flutter/material.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الملف الشخصي')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Avatar
            const CircleAvatar(radius: 50, backgroundColor: AppColors.primarySurface, child: Text('م أ', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primary))),
            const SizedBox(height: 16),
            Text('محمد أحمد', style: AppTypography.headline2),
            Text('+20 101 234 5678', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(20)),
              child: Text('تم التحقق', style: AppTypography.caption.copyWith(color: AppColors.success))),
            const SizedBox(height: 32),
            // Info Cards
            _buildInfoCard('البريد الإلكتروني', 'mohammed@email.com', Icons.email_outlined),
            _buildInfoCard('الرقم القومي', '2************1', Icons.badge_outlined),
            _buildInfoCard('تاريخ الانضمام', '1 يناير 2024', Icons.calendar_today_outlined),
            const SizedBox(height: 24),
            SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () {}, child: const Text('تعديل الملف الشخصي'))),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
        child: Row(children: [
          Icon(icon, color: AppColors.textSecondary),
          const SizedBox(width: 16),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: AppTypography.caption),
            Text(value, style: AppTypography.labelMedium),
          ]),
        ]),
      ),
    );
  }
}
