import 'package:healthpay/core/network/graphql_client.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/features/topup/presentation/bloc/topup_bloc.dart';

abstract class TopUpRemoteDataSource {
  Future<List<TopUpMethod>> getTopUpMethods();
  Future<Map<String, dynamic>> topUpWallet({
    required String walletId,
    required double amount,
    required String methodId,
    required String pin,
  });
}

class TopUpRemoteDataSourceImpl implements TopUpRemoteDataSource {
  final GraphQLService graphQLService;

  TopUpRemoteDataSourceImpl({required this.graphQLService});

  @override
  Future<List<TopUpMethod>> getTopUpMethods() async {
    try {
      final result = await graphQLService.query(
        GqlQueryStrings.topUpMethods,
        variables: {},
      );
      
      final methodsList = result.data?['topUpMethods'] as List<dynamic>? ?? [];
      return methodsList
          .map((json) => TopUpMethod.fromJson(json as Map<String, dynamic>))
          .where((method) => method.enabled)
          .toList();
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<Map<String, dynamic>> topUpWallet({
    required String walletId,
    required double amount,
    required String methodId,
    required String pin,
  }) async {
    try {
      final result = await graphQLService.mutate(
        GqlMutationStrings.topUpWallet,
        variables: {
          'input': {
            'walletId': walletId,
            'amount': amount,
            'methodId': methodId,
            'pin': pin,
          }
        },
      );
      return result.data?['topUpWallet'] as Map<String, dynamic>? ?? {};
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }
}
