import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:healthpay/features/transactions/presentation/bloc/transactions_bloc.dart';

abstract class TransactionsRemoteDataSource {
  Future<TransactionsResult> getTransactions({
    required int page,
    String? filter,
    DateTime? startDate,
    DateTime? endDate,
  });
  
  Future<Transaction> getTransactionDetails(String transactionId);
}

class TransactionsRemoteDataSourceImpl implements TransactionsRemoteDataSource {
  final GraphQLClient client;
  static const int _pageSize = 20;

  TransactionsRemoteDataSourceImpl({required this.client});

  @override
  Future<TransactionsResult> getTransactions({
    required int page,
    String? filter,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    const query = r'''
      query GetTransactions($input: TransactionsInput!) {
        transactions(input: $input) {
          items {
            id
            type
            amount
            status
            timestamp
            recipientName
            recipientPhone
            senderName
            senderPhone
            note
            referenceNumber
            merchantName
            billProvider
          }
          hasMore
          totalCount
        }
      }
    ''';

    final result = await client.query(
      QueryOptions(
        document: gql(query),
        variables: {
          'input': {
            'page': page,
            'pageSize': _pageSize,
            if (filter != null && filter != 'all') 'filter': filter,
            if (startDate != null) 'startDate': startDate.toIso8601String(),
            if (endDate != null) 'endDate': endDate.toIso8601String(),
          },
        },
        fetchPolicy: FetchPolicy.networkOnly,
      ),
    );

    if (result.hasException) {
      // Return mock data for demo
      return _getMockTransactions(page, filter);
    }

    final data = result.data!['transactions'];
    final items = (data['items'] as List).map((item) => Transaction(
      id: item['id'],
      type: item['type'],
      amount: (item['amount'] as num).toDouble(),
      status: item['status'],
      timestamp: DateTime.parse(item['timestamp']),
      recipientName: item['recipientName'],
      recipientPhone: item['recipientPhone'],
      senderName: item['senderName'],
      senderPhone: item['senderPhone'],
      note: item['note'],
      referenceNumber: item['referenceNumber'],
      merchantName: item['merchantName'],
      billProvider: item['billProvider'],
    )).toList();

    return TransactionsResult(
      transactions: items,
      hasMore: data['hasMore'] ?? false,
      totalCount: data['totalCount'] ?? items.length,
    );
  }

  @override
  Future<Transaction> getTransactionDetails(String transactionId) async {
    const query = r'''
      query GetTransaction($id: ID!) {
        transaction(id: $id) {
          id
          type
          amount
          status
          timestamp
          recipientName
          recipientPhone
          senderName
          senderPhone
          note
          referenceNumber
          merchantName
          billProvider
        }
      }
    ''';

    final result = await client.query(
      QueryOptions(
        document: gql(query),
        variables: {'id': transactionId},
      ),
    );

    if (result.hasException) {
      throw Exception('Failed to load transaction details');
    }

    final data = result.data!['transaction'];
    return Transaction(
      id: data['id'],
      type: data['type'],
      amount: (data['amount'] as num).toDouble(),
      status: data['status'],
      timestamp: DateTime.parse(data['timestamp']),
      recipientName: data['recipientName'],
      recipientPhone: data['recipientPhone'],
      senderName: data['senderName'],
      senderPhone: data['senderPhone'],
      note: data['note'],
      referenceNumber: data['referenceNumber'],
      merchantName: data['merchantName'],
      billProvider: data['billProvider'],
    );
  }

  // Mock data for demo purposes
  TransactionsResult _getMockTransactions(int page, String? filter) {
    final now = DateTime.now();
    final mockTransactions = <Transaction>[
      Transaction(
        id: 'txn-001',
        type: 'transfer_in',
        amount: 500.00,
        status: 'completed',
        timestamp: now.subtract(const Duration(hours: 2)),
        senderName: 'أحمد محمد',
        senderPhone: '01012345678',
        referenceNumber: 'REF-001',
      ),
      Transaction(
        id: 'txn-002',
        type: 'transfer_out',
        amount: 200.00,
        status: 'completed',
        timestamp: now.subtract(const Duration(hours: 5)),
        recipientName: 'محمد علي',
        recipientPhone: '01098765432',
        note: 'سداد دين',
        referenceNumber: 'REF-002',
      ),
      Transaction(
        id: 'txn-003',
        type: 'topup',
        amount: 1000.00,
        status: 'completed',
        timestamp: now.subtract(const Duration(days: 1)),
        referenceNumber: 'REF-003',
      ),
      Transaction(
        id: 'txn-004',
        type: 'bill_payment',
        amount: 350.50,
        status: 'completed',
        timestamp: now.subtract(const Duration(days: 2)),
        billProvider: 'كهرباء شمال القاهرة',
        referenceNumber: 'REF-004',
      ),
      Transaction(
        id: 'txn-005',
        type: 'merchant_payment',
        amount: 150.00,
        status: 'completed',
        timestamp: now.subtract(const Duration(days: 3)),
        merchantName: 'صيدلية الشفاء',
        referenceNumber: 'REF-005',
      ),
      Transaction(
        id: 'txn-006',
        type: 'transfer_out',
        amount: 100.00,
        status: 'pending',
        timestamp: now.subtract(const Duration(days: 4)),
        recipientName: 'سارة أحمد',
        recipientPhone: '01111111111',
        referenceNumber: 'REF-006',
      ),
    ];

    // Apply filter
    List<Transaction> filtered = mockTransactions;
    if (filter == 'incoming') {
      filtered = mockTransactions.where((t) => t.isIncoming).toList();
    } else if (filter == 'outgoing') {
      filtered = mockTransactions.where((t) => t.isOutgoing).toList();
    }

    // Paginate
    final start = (page - 1) * _pageSize;
    final end = start + _pageSize;
    final paged = filtered.skip(start).take(_pageSize).toList();

    return TransactionsResult(
      transactions: paged,
      hasMore: end < filtered.length,
      totalCount: filtered.length,
    );
  }
}
