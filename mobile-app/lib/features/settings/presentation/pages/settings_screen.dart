import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:healthpay/core/constants/route_constants.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:healthpay/features/settings/presentation/bloc/settings_bloc.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: ListView(
        children: [
          _buildSection('الحساب', [
            _buildTile(Icons.person_outline, 'الملف الشخصي', () => context.push(RouteConstants.profile)),
            _buildTile(Icons.lock_outline, 'تغيير رمز PIN', () {}),
            _buildTile(Icons.fingerprint, 'البصمة', trailing: BlocBuilder<SettingsBloc, SettingsState>(
              builder: (context, state) => Switch(value: state.biometricEnabled, onChanged: (v) {}),
            )),
          ]),
          _buildSection('التفضيلات', [
            _buildTile(Icons.language, 'اللغة', trailing: BlocBuilder<SettingsBloc, SettingsState>(
              builder: (context, state) => TextButton(
                onPressed: () {
                  final newLocale = state.locale.languageCode == 'ar' ? const Locale('en') : const Locale('ar');
                  context.read<SettingsBloc>().add(ChangeLocale(newLocale));
                },
                child: Text(state.locale.languageCode == 'ar' ? 'العربية' : 'English'),
              ),
            )),
            _buildTile(Icons.notifications_outlined, 'الإشعارات', trailing: Switch(value: true, onChanged: (v) {})),
          ]),
          _buildSection('الدعم', [
            _buildTile(Icons.help_outline, 'المساعدة', () {}),
            _buildTile(Icons.privacy_tip_outlined, 'سياسة الخصوصية', () {}),
            _buildTile(Icons.description_outlined, 'الشروط والأحكام', () {}),
          ]),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: () {
                context.read<AuthBloc>().add(LogoutEvent());
                context.go(RouteConstants.login);
              },
              icon: Icon(Icons.logout, color: AppColors.error),
              label: Text('تسجيل الخروج', style: TextStyle(color: AppColors.error)),
              style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.error)),
            ),
          ),
          const SizedBox(height: 32),
          Center(child: Text('الإصدار 1.0.0', style: AppTypography.caption)),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.all(16), child: Text(title, style: AppTypography.labelMedium.copyWith(color: AppColors.textSecondary))),
        ...children,
      ],
    );
  }

  Widget _buildTile(IconData icon, String title, [VoidCallback? onTap, Widget? trailing]) {
    return ListTile(leading: Icon(icon, color: AppColors.textSecondary), title: Text(title), trailing: trailing ?? const Icon(Icons.chevron_right), onTap: onTap);
  }
}
