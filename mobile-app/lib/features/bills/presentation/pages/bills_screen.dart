import 'package:flutter/material.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';

class BillsScreen extends StatelessWidget {
  const BillsScreen({super.key});

  final _categories = const [
    {'icon': Icons.bolt, 'name': 'الكهرباء', 'color': Color(0xFFFEF3C7)},
    {'icon': Icons.water_drop, 'name': 'المياه', 'color': Color(0xFFDBEAFE)},
    {'icon': Icons.local_fire_department, 'name': 'الغاز', 'color': Color(0xFFFEE2E2)},
    {'icon': Icons.wifi, 'name': 'الإنترنت', 'color': Color(0xFFD1FAE5)},
    {'icon': Icons.phone_android, 'name': 'الموبايل', 'color': Color(0xFFE9D5FF)},
    {'icon': Icons.phone, 'name': 'التليفون', 'color': Color(0xFFCCFBF1)},
    {'icon': Icons.tv, 'name': 'الاشتراكات', 'color': Color(0xFFFCE7F3)},
    {'icon': Icons.favorite, 'name': 'التبرعات', 'color': Color(0xFFFED7AA)},
    {'icon': Icons.account_balance, 'name': 'الحكومة', 'color': Color(0xFFE2E8F0)},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('دفع الفواتير')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('الفئات', style: AppTypography.headline3),
            const SizedBox(height: 16),
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, mainAxisSpacing: 16, crossAxisSpacing: 16, childAspectRatio: 1),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  return InkWell(
                    onTap: () {},
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: BoxDecoration(color: cat['color'] as Color, borderRadius: BorderRadius.circular(16)),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(cat['icon'] as IconData, size: 32, color: AppColors.textPrimary),
                        const SizedBox(height: 8),
                        Text(cat['name'] as String, style: AppTypography.labelSmall),
                      ]),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
