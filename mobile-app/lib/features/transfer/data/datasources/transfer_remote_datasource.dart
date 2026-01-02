import 'package:healthpay/core/network/graphql_client.dart';
import 'package:healthpay/core/errors/exceptions.dart';

abstract class TransferRemoteDataSource {
  Future<Map<String, dynamic>> validateRecipient(String phoneNumber);
  Future<Map<String, dynamic>> transferMoney({required String fromWalletId, required String toPhoneNumber, required double amount, required String pin, String? description});
}

class TransferRemoteDataSourceImpl implements TransferRemoteDataSource {
  final GraphQLService graphQLService;
  TransferRemoteDataSourceImpl({required this.graphQLService});

  @override
  Future<Map<String, dynamic>> validateRecipient(String phoneNumber) async {
    try {
      final result = await graphQLService.query(GqlQueryStrings.validateRecipient, variables: {'phoneNumber': phoneNumber});
      return result.data?['validateRecipient'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> transferMoney({required String fromWalletId, required String toPhoneNumber, required double amount, required String pin, String? description}) async {
    try {
      final result = await graphQLService.mutate(GqlMutationStrings.transferMoney, variables: {
        'input': {'fromWalletId': fromWalletId, 'toPhoneNumber': toPhoneNumber, 'amount': amount, 'pin': pin, 'description': description}
      });
      return result.data?['transferMoney'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }
}
