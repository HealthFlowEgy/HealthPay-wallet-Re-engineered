import 'package:healthpay/features/bills/data/datasources/bills_remote_datasource.dart';
import 'package:healthpay/features/bills/domain/repositories/bills_repository.dart';
import 'package:healthpay/features/bills/presentation/bloc/bills_bloc.dart';

class BillsRepositoryImpl implements BillsRepository {
  final BillsRemoteDataSource remoteDataSource;

  BillsRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<BillCategory>> getBillCategories() async {
    return remoteDataSource.getBillCategories();
  }

  @override
  Future<List<BillProvider>> getProviders(String categoryId) async {
    return remoteDataSource.getProviders(categoryId);
  }

  @override
  Future<BillInquiry> inquireBill({
    required String providerId,
    required String accountNumber,
  }) async {
    return remoteDataSource.inquireBill(
      providerId: providerId,
      accountNumber: accountNumber,
    );
  }

  @override
  Future<BillPaymentResult> payBill({
    required String billId,
    required String pin,
  }) async {
    return remoteDataSource.payBill(billId: billId, pin: pin);
  }
}
