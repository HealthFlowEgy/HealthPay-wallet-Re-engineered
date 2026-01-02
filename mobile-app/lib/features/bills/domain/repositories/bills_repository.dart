import 'package:healthpay/features/bills/presentation/bloc/bills_bloc.dart';

abstract class BillsRepository {
  Future<List<BillCategory>> getBillCategories();
  Future<List<BillProvider>> getProviders(String categoryId);
  Future<BillInquiry> inquireBill({
    required String providerId,
    required String accountNumber,
  });
  Future<BillPaymentResult> payBill({
    required String billId,
    required String pin,
  });
}
