import 'package:healthpay/core/network/graphql_client.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/features/auth/data/models/user_model.dart';

abstract class DashboardRemoteDataSource {
  Future<UserModel> getUserWithWallet();
  Future<List<Map<String, dynamic>>> getRecentTransactions(String walletId, int limit);
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final GraphQLService graphQLService;
  DashboardRemoteDataSourceImpl({required this.graphQLService});

  @override
  Future<UserModel> getUserWithWallet() async {
    try {
      final result = await graphQLService.query(GqlQueryStrings.getMe);
      final data = result.data?['me'];
      if (data == null) throw const ServerException(message: 'Failed to get user');
      return UserModel.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getRecentTransactions(String walletId, int limit) async {
    try {
      final result = await graphQLService.query(GqlQueryStrings.getTransactions, variables: {'walletId': walletId, 'limit': limit});
      final data = result.data?['transactionsByWallet'] as List<dynamic>?;
      return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }
}
