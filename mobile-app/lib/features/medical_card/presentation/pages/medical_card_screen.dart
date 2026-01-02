import 'package:flutter/material.dart';
import 'package:healthpay/core/theme/app_colors.dart';
import 'package:healthpay/core/theme/app_typography.dart';
import 'package:qr_flutter/qr_flutter.dart';

class MedicalCardScreen extends StatelessWidget {
  const MedicalCardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('البطاقة الطبية')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Card Visual
            Container(
              height: 200,
              decoration: BoxDecoration(gradient: AppColors.cardGradient, borderRadius: BorderRadius.circular(20)),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('HealthPay Medical', style: AppTypography.labelMedium.copyWith(color: Colors.white)),
                    const Icon(Icons.contactless, color: Colors.white),
                  ]),
                  const Spacer(),
                  Text('**** **** **** 1234', style: AppTypography.headline2.copyWith(color: Colors.white, letterSpacing: 2)),
                  const SizedBox(height: 8),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('CARD HOLDER', style: AppTypography.caption.copyWith(color: Colors.white70)),
                      Text('محمد أحمد', style: AppTypography.labelMedium.copyWith(color: Colors.white)),
                    ]),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text('EXPIRES', style: AppTypography.caption.copyWith(color: Colors.white70)),
                      Text('12/28', style: AppTypography.labelMedium.copyWith(color: Colors.white)),
                    ]),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // QR Code
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)]),
              child: Column(children: [
                Text('رمز QR للمسح', style: AppTypography.labelLarge),
                const SizedBox(height: 16),
                QrImageView(data: 'healthpay:card:1234', version: QrVersions.auto, size: 180),
              ]),
            ),
            const SizedBox(height: 24),
            // Balance
            Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              _buildStat('الرصيد', '500.00 ج.م'),
              _buildStat('الحد اليومي', '2,000 ج.م'),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(children: [
      Text(label, style: AppTypography.caption),
      const SizedBox(height: 4),
      Text(value, style: AppTypography.labelLarge.copyWith(color: AppColors.primary)),
    ]);
  }
}
