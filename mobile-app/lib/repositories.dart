// lib/data/repositories/auth_repository.dart

import 'package:injectable/injectable.dart';

import '../../core/network/network.dart';
import '../../core/services/services.dart';
import '../graphql/mutations/mutations.dart';
import '../graphql/queries/queries.dart';
import '../models/models.dart';

abstract class AuthRepository {
  Future<OtpResponseModel> sendOtp(String phoneNumber);
  Future<AuthResponseModel> verifyOtp(String phoneNumber, String code);
  Future<AuthResponseModel> adminLogin(String email, String password);
  Future<AuthResponseModel> merchantLogin(String merchantCode, String password);
  Future<bool> hasPinSet(String userId);
  Future<void> setPin(String userId, String pin);
  Future<bool> verifyPin(String userId, String pin);
  Future<void> changePin(String userId, String currentPin, String newPin);
  Future<void> logout();
  Future<bool> isLoggedIn();
  Future<String?> getUserType();
}

@LazySingleton(as: AuthRepository)
class AuthRepositoryImpl implements AuthRepository {
  final GraphQLService _graphQLService;
  final SecureStorageService _storageService;

  AuthRepositoryImpl(this._graphQLService, this._storageService);

  @override
  Future<OtpResponseModel> sendOtp(String phoneNumber) async {
    final result = await _graphQLService.mutate(
      mutation: AuthMutations.sendOtp,
      variables: {'phoneNumber': phoneNumber},
    );
    return OtpResponseModel.fromJson(result.data!['sendOtp']);
  }

  @override
  Future<AuthResponseModel> verifyOtp(String phoneNumber, String code) async {
    final result = await _graphQLService.mutate(
      mutation: AuthMutations.verifyOtp,
      variables: {'phoneNumber': phoneNumber, 'code': code},
    );

    final authResponse = AuthResponseModel.fromJson(result.data!['verifyOtp']);

    // Save auth data
    await _storageService.saveAccessToken(authResponse.token);
    await _storageService.saveUserId(authResponse.userId);
    await _storageService.saveUserType(authResponse.userType);
    await _storageService.savePhoneNumber(phoneNumber);

    return authResponse;
  }

  @override
  Future<AuthResponseModel> adminLogin(String email, String password) async {
    final result = await _graphQLService.mutate(
      mutation: AuthMutations.adminLogin,
      variables: {'email': email, 'password': password},
    );

    final authResponse = AuthResponseModel.fromJson(result.data!['adminLogin']);

    // Save auth data
    await _storageService.saveAccessToken(authResponse.token);
    await _storageService.saveUserId(authResponse.userId);
    await _storageService.saveUserType('admin');

    return authResponse;
  }

  @override
  Future<AuthResponseModel> merchantLogin(String merchantCode, String password) async {
    final result = await _graphQLService.mutate(
      mutation: AuthMutations.merchantLogin,
      variables: {'merchantCode': merchantCode, 'password': password},
    );

    final authResponse = AuthResponseModel.fromJson(result.data!['merchantLogin']);

    // Save auth data
    await _storageService.saveAccessToken(authResponse.token);
    await _storageService.saveUserId(authResponse.userId);
    await _storageService.saveUserType('merchant');

    return authResponse;
  }

  @override
  Future<bool> hasPinSet(String userId) async {
    final result = await _graphQLService.query(
      query: UserQueries.hasPinSet,
      variables: {'userId': userId},
    );
    return result.data!['hasPinSet'] as bool;
  }

  @override
  Future<void> setPin(String userId, String pin) async {
    await _graphQLService.mutate(
      mutation: PinMutations.setPin,
      variables: {'userId': userId, 'pin': pin},
    );
  }

  @override
  Future<bool> verifyPin(String userId, String pin) async {
    final result = await _graphQLService.mutate(
      mutation: PinMutations.verifyPin,
      variables: {'userId': userId, 'pin': pin},
    );
    return result.data!['verifyPin']['success'] as bool;
  }

  @override
  Future<void> changePin(String userId, String currentPin, String newPin) async {
    await _graphQLService.mutate(
      mutation: PinMutations.changePin,
      variables: {
        'userId': userId,
        'currentPin': currentPin,
        'newPin': newPin,
      },
    );
  }

  @override
  Future<void> logout() async {
    try {
      await _graphQLService.mutate(mutation: AuthMutations.logout);
    } finally {
      await _storageService.clearAll();
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    return await _storageService.isLoggedIn();
  }

  @override
  Future<String?> getUserType() async {
    return await _storageService.getUserType();
  }
}

// lib/data/repositories/wallet_repository.dart

abstract class WalletRepository {
  Future<WalletModel> getWallet(String id);
  Future<WalletModel> getWalletByUserId(String userId);
  Future<Map<String, dynamic>> getBalance(String walletId);
  Future<WalletModel> createWallet(String userId);
  Stream<Map<String, dynamic>> watchBalance(String walletId);
}

@LazySingleton(as: WalletRepository)
class WalletRepositoryImpl implements WalletRepository {
  final GraphQLService _graphQLService;

  WalletRepositoryImpl(this._graphQLService);

  @override
  Future<WalletModel> getWallet(String id) async {
    final result = await _graphQLService.query(
      query: WalletQueries.getWallet,
      variables: {'id': id},
    );
    return WalletModel.fromJson(result.data!['wallet']);
  }

  @override
  Future<WalletModel> getWalletByUserId(String userId) async {
    final result = await _graphQLService.query(
      query: WalletQueries.getWalletByUserId,
      variables: {'userId': userId},
    );
    return WalletModel.fromJson(result.data!['walletByUserId']);
  }

  @override
  Future<Map<String, dynamic>> getBalance(String walletId) async {
    final result = await _graphQLService.query(
      query: WalletQueries.walletBalance,
      variables: {'walletId': walletId},
    );
    return result.data!['walletBalance'];
  }

  @override
  Future<WalletModel> createWallet(String userId) async {
    final result = await _graphQLService.mutate(
      mutation: WalletMutations.createWallet,
      variables: {'userId': userId},
    );
    return WalletModel.fromJson(result.data!['createWallet']);
  }

  @override
  Stream<Map<String, dynamic>> watchBalance(String walletId) {
    return _graphQLService
        .subscribe(
          subscription: WalletSubscriptions.walletBalanceChanged,
          variables: {'walletId': walletId},
        )
        .map((result) => result.data!['walletBalanceChanged']);
  }
}

// lib/data/repositories/transaction_repository.dart

abstract class TransactionRepository {
  Future<TransactionModel> getTransaction(String id);
  Future<List<TransactionModel>> getTransactionsByWallet(
    String walletId, {
    int limit = 20,
    int offset = 0,
    String? type,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
  });
  Future<TransactionModel> sendMoney({
    required String senderWalletId,
    required String recipientPhone,
    required double amount,
    required String pin,
    String? description,
  });
  Future<Map<String, dynamic>> initiatePayment({
    required String walletId,
    required double amount,
    required String paymentMethod,
  });
  Future<TransactionModel> completePayment(String paymentId, String transactionReference);
  Stream<TransactionModel> watchTransactions(String walletId);
}

@LazySingleton(as: TransactionRepository)
class TransactionRepositoryImpl implements TransactionRepository {
  final GraphQLService _graphQLService;

  TransactionRepositoryImpl(this._graphQLService);

  @override
  Future<TransactionModel> getTransaction(String id) async {
    final result = await _graphQLService.query(
      query: TransactionQueries.getTransaction,
      variables: {'id': id},
    );
    return TransactionModel.fromJson(result.data!['transaction']);
  }

  @override
  Future<List<TransactionModel>> getTransactionsByWallet(
    String walletId, {
    int limit = 20,
    int offset = 0,
    String? type,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final result = await _graphQLService.query(
      query: TransactionQueries.transactionsByWallet,
      variables: {
        'walletId': walletId,
        'limit': limit,
        'offset': offset,
        if (type != null) 'type': type,
        if (status != null) 'status': status,
        if (startDate != null) 'startDate': startDate.toIso8601String(),
        if (endDate != null) 'endDate': endDate.toIso8601String(),
      },
    );

    final items = result.data!['transactionsByWallet']['items'] as List;
    return items.map((e) => TransactionModel.fromJson(e)).toList();
  }

  @override
  Future<TransactionModel> sendMoney({
    required String senderWalletId,
    required String recipientPhone,
    required double amount,
    required String pin,
    String? description,
  }) async {
    final result = await _graphQLService.mutate(
      mutation: TransactionMutations.sendMoney,
      variables: {
        'senderWalletId': senderWalletId,
        'recipientPhone': recipientPhone,
        'amount': amount,
        'pin': pin,
        if (description != null) 'description': description,
      },
    );
    return TransactionModel.fromJson(result.data!['sendMoney']['transaction']);
  }

  @override
  Future<Map<String, dynamic>> initiatePayment({
    required String walletId,
    required double amount,
    required String paymentMethod,
  }) async {
    final result = await _graphQLService.mutate(
      mutation: TransactionMutations.initiatePayment,
      variables: {
        'walletId': walletId,
        'amount': amount,
        'paymentMethod': paymentMethod,
      },
    );
    return result.data!['initiatePayment'];
  }

  @override
  Future<TransactionModel> completePayment(
    String paymentId,
    String transactionReference,
  ) async {
    final result = await _graphQLService.mutate(
      mutation: TransactionMutations.completePayment,
      variables: {
        'paymentId': paymentId,
        'transactionReference': transactionReference,
      },
    );
    return TransactionModel.fromJson(result.data!['completePayment']['transaction']);
  }

  @override
  Stream<TransactionModel> watchTransactions(String walletId) {
    return _graphQLService
        .subscribe(
          subscription: TransactionSubscriptions.transactionCreated,
          variables: {'walletId': walletId},
        )
        .map((result) => TransactionModel.fromJson(result.data!['transactionCreated']));
  }
}
