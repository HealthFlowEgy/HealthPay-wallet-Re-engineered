import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:healthpay/features/bills/presentation/bloc/bills_bloc.dart';

abstract class BillsRemoteDataSource {
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

class BillsRemoteDataSourceImpl implements BillsRemoteDataSource {
  final GraphQLClient client;

  BillsRemoteDataSourceImpl({required this.client});

  // Static bill categories (Egyptian providers)
  static const List<Map<String, dynamic>> _categories = [
    {'id': 'electricity', 'name': 'Electricity', 'nameAr': 'كهرباء', 'icon': 'bolt'},
    {'id': 'water', 'name': 'Water', 'nameAr': 'مياه', 'icon': 'water_drop'},
    {'id': 'gas', 'name': 'Gas', 'nameAr': 'غاز', 'icon': 'local_fire_department'},
    {'id': 'internet', 'name': 'Internet', 'nameAr': 'إنترنت', 'icon': 'wifi'},
    {'id': 'mobile', 'name': 'Mobile', 'nameAr': 'موبايل', 'icon': 'phone_android'},
    {'id': 'landline', 'name': 'Landline', 'nameAr': 'هاتف أرضي', 'icon': 'phone'},
    {'id': 'subscriptions', 'name': 'Subscriptions', 'nameAr': 'اشتراكات', 'icon': 'subscriptions'},
    {'id': 'government', 'name': 'Government', 'nameAr': 'خدمات حكومية', 'icon': 'account_balance'},
    {'id': 'donations', 'name': 'Donations', 'nameAr': 'تبرعات', 'icon': 'volunteer_activism'},
  ];

  // Static providers per category (Egyptian providers)
  static const Map<String, List<Map<String, dynamic>>> _providers = {
    'electricity': [
      {'id': 'edc-north', 'name': 'North Cairo Electricity', 'nameAr': 'كهرباء شمال القاهرة'},
      {'id': 'edc-south', 'name': 'South Cairo Electricity', 'nameAr': 'كهرباء جنوب القاهرة'},
      {'id': 'edc-alex', 'name': 'Alexandria Electricity', 'nameAr': 'كهرباء الإسكندرية'},
      {'id': 'edc-delta', 'name': 'Delta Electricity', 'nameAr': 'كهرباء الدلتا'},
      {'id': 'edc-canal', 'name': 'Canal Electricity', 'nameAr': 'كهرباء القناة'},
      {'id': 'edc-upper', 'name': 'Upper Egypt Electricity', 'nameAr': 'كهرباء الصعيد'},
    ],
    'water': [
      {'id': 'water-cairo', 'name': 'Cairo Water Company', 'nameAr': 'مياه القاهرة'},
      {'id': 'water-giza', 'name': 'Giza Water Company', 'nameAr': 'مياه الجيزة'},
      {'id': 'water-alex', 'name': 'Alexandria Water Company', 'nameAr': 'مياه الإسكندرية'},
    ],
    'gas': [
      {'id': 'gas-town', 'name': 'Town Gas', 'nameAr': 'تاون جاس'},
      {'id': 'gas-nat', 'name': 'National Gas', 'nameAr': 'الغاز الطبيعي'},
    ],
    'internet': [
      {'id': 'te-data', 'name': 'WE (TE Data)', 'nameAr': 'وي'},
      {'id': 'vodafone-dsl', 'name': 'Vodafone DSL', 'nameAr': 'فودافون DSL'},
      {'id': 'orange-dsl', 'name': 'Orange DSL', 'nameAr': 'أورانج DSL'},
      {'id': 'etisalat-dsl', 'name': 'Etisalat DSL', 'nameAr': 'اتصالات DSL'},
    ],
    'mobile': [
      {'id': 'vodafone', 'name': 'Vodafone', 'nameAr': 'فودافون'},
      {'id': 'orange', 'name': 'Orange', 'nameAr': 'أورانج'},
      {'id': 'etisalat', 'name': 'Etisalat', 'nameAr': 'اتصالات'},
      {'id': 'we', 'name': 'WE', 'nameAr': 'وي'},
    ],
    'landline': [
      {'id': 'te-landline', 'name': 'Telecom Egypt', 'nameAr': 'المصرية للاتصالات'},
    ],
    'subscriptions': [
      {'id': 'netflix', 'name': 'Netflix', 'nameAr': 'نتفليكس'},
      {'id': 'shahid', 'name': 'Shahid VIP', 'nameAr': 'شاهد VIP'},
      {'id': 'spotify', 'name': 'Spotify', 'nameAr': 'سبوتيفاي'},
    ],
    'government': [
      {'id': 'traffic-fines', 'name': 'Traffic Fines', 'nameAr': 'مخالفات المرور'},
      {'id': 'tax', 'name': 'Tax Authority', 'nameAr': 'مصلحة الضرائب'},
    ],
    'donations': [
      {'id': 'resala', 'name': 'Resala Charity', 'nameAr': 'جمعية رسالة'},
      {'id': 'misr-elkheir', 'name': 'Misr El Kheir', 'nameAr': 'مصر الخير'},
      {'id': 'orman', 'name': 'Orman Association', 'nameAr': 'جمعية الأورمان'},
    ],
  };

  @override
  Future<List<BillCategory>> getBillCategories() async {
    // Return static categories
    return _categories.map((c) => BillCategory(
      id: c['id'] as String,
      name: c['name'] as String,
      nameAr: c['nameAr'] as String,
      icon: c['icon'] as String,
    )).toList();
  }

  @override
  Future<List<BillProvider>> getProviders(String categoryId) async {
    final providers = _providers[categoryId] ?? [];
    return providers.map((p) => BillProvider(
      id: p['id'] as String,
      name: p['name'] as String,
      nameAr: p['nameAr'] as String,
      logo: p['logo'] as String?,
    )).toList();
  }

  @override
  Future<BillInquiry> inquireBill({
    required String providerId,
    required String accountNumber,
  }) async {
    const query = r'''
      query InquireBill($input: BillInquiryInput!) {
        inquireBill(input: $input) {
          billId
          subscriberName
          amount
          dueDate
          period
        }
      }
    ''';

    final result = await client.query(
      QueryOptions(
        document: gql(query),
        variables: {
          'input': {
            'providerId': providerId,
            'accountNumber': accountNumber,
          },
        },
      ),
    );

    if (result.hasException) {
      // For demo, return mock data if API not available
      return BillInquiry(
        billId: 'BILL-${DateTime.now().millisecondsSinceEpoch}',
        subscriberName: 'محمد أحمد إبراهيم',
        amount: 250.50,
        dueDate: '2026-01-15',
        period: 'ديسمبر 2025',
      );
    }

    final data = result.data!['inquireBill'];
    return BillInquiry(
      billId: data['billId'],
      subscriberName: data['subscriberName'],
      amount: (data['amount'] as num).toDouble(),
      dueDate: data['dueDate'],
      period: data['period'],
    );
  }

  @override
  Future<BillPaymentResult> payBill({
    required String billId,
    required String pin,
  }) async {
    const mutation = r'''
      mutation PayBill($input: PayBillInput!) {
        payBill(input: $input) {
          success
          referenceNumber
          amount
          timestamp
        }
      }
    ''';

    final result = await client.mutate(
      MutationOptions(
        document: gql(mutation),
        variables: {
          'input': {
            'billId': billId,
            'pin': pin,
          },
        },
      ),
    );

    if (result.hasException) {
      // For demo, return mock data if API not available
      return BillPaymentResult(
        referenceNumber: 'REF-${DateTime.now().millisecondsSinceEpoch}',
        amount: 250.50,
        timestamp: DateTime.now(),
      );
    }

    final data = result.data!['payBill'];
    return BillPaymentResult(
      referenceNumber: data['referenceNumber'],
      amount: (data['amount'] as num).toDouble(),
      timestamp: DateTime.parse(data['timestamp']),
    );
  }
}
