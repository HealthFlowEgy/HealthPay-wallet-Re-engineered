import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:healthpay/core/constants/api_constants.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/core/network/secure_storage.dart';

/// GraphQL Client Service
class GraphQLService {
  static GraphQLService? _instance;
  late GraphQLClient _client;
  final SecureStorageService _secureStorage;

  GraphQLService._({required SecureStorageService secureStorage})
      : _secureStorage = secureStorage {
    _initClient();
  }

  factory GraphQLService({required SecureStorageService secureStorage}) {
    _instance ??= GraphQLService._(secureStorage: secureStorage);
    return _instance!;
  }

  GraphQLClient get client => _client;

  void _initClient() {
    final httpLink = HttpLink(
      ApiConstants.baseUrl,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    );

    final authLink = AuthLink(
      getToken: () async {
        final token = await _secureStorage.getAccessToken();
        return token != null ? 'Bearer $token' : null;
      },
    );

    final link = authLink.concat(httpLink);

    _client = GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }

  /// Reinitialize client (e.g., after login)
  void reinitialize() {
    _initClient();
  }

  /// Execute a query
  Future<QueryResult> query(
    String query, {
    Map<String, dynamic>? variables,
    FetchPolicy? fetchPolicy,
  }) async {
    try {
      final result = await _client.query(
        QueryOptions(
          document: gql(query),
          variables: variables ?? {},
          fetchPolicy: fetchPolicy ?? FetchPolicy.networkOnly,
        ),
      );

      if (result.hasException) {
        throw _handleException(result.exception!);
      }

      return result;
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  /// Execute a mutation
  Future<QueryResult> mutate(
    String mutation, {
    Map<String, dynamic>? variables,
  }) async {
    try {
      final result = await _client.mutate(
        MutationOptions(
          document: gql(mutation),
          variables: variables ?? {},
        ),
      );

      if (result.hasException) {
        throw _handleException(result.exception!);
      }

      return result;
    } catch (e) {
      if (e is AppException) rethrow;
      throw ServerException(message: e.toString());
    }
  }

  /// Handle GraphQL exceptions
  AppException _handleException(OperationException exception) {
    if (exception.linkException != null) {
      if (kDebugMode) {
        print('Link Exception: ${exception.linkException}');
      }
      return const NetworkException();
    }

    if (exception.graphqlErrors.isNotEmpty) {
      final error = exception.graphqlErrors.first;
      final code = error.extensions?['code'] as String?;
      final message = error.message;

      switch (code) {
        case 'UNAUTHENTICATED':
          return const UnauthorizedException();
        case 'INVALID_PIN':
          return PinException(
            message: message,
            code: code,
            remainingAttempts:
                error.extensions?['remainingAttempts'] as int?,
          );
        case 'RATE_LIMITED':
          return const RateLimitException();
        case 'INSUFFICIENT_BALANCE':
          return ServerException(message: message, code: code);
        default:
          return GraphQLException(
            message: message,
            code: code,
            errors: exception.graphqlErrors.map((e) => e.message).toList(),
          );
      }
    }

    return const ServerException(message: 'An unknown error occurred');
  }
}

/// GraphQL Queries
class GqlQueryStrings {
  GqlQueryStrings._();

  static const String getMe = '''
    query GetMe {
      me {
        id
        phoneNumber
        name
        email
        role
        kycLevel
        wallet {
          id
          balance
          pendingBalance
          currency
        }
        createdAt
        updatedAt
      }
    }
  ''';

  static const String getWallet = '''
    query GetWallet(\$id: ID!) {
      wallet(id: \$id) {
        id
        balance
        pendingBalance
        currency
        userId
        createdAt
        updatedAt
      }
    }
  ''';

  static const String getTransactions = '''
    query GetTransactions(\$walletId: ID!, \$limit: Int, \$offset: Int) {
      transactionsByWallet(walletId: \$walletId, limit: \$limit, offset: \$offset) {
        id
        type
        amount
        fee
        net
        currency
        status
        description
        reference
        fromWalletId
        toWalletId
        merchant {
          id
          businessName
        }
        createdAt
      }
    }
  ''';

  static const String validateRecipient = '''
    query ValidateRecipient(\$phoneNumber: String!) {
      validateRecipient(phoneNumber: \$phoneNumber) {
        valid
        name
        phoneNumber
        message
      }
    }
  ''';

  static const String getBillCategories = '''
    query GetBillCategories {
      billCategories {
        id
        name
        nameAr
        icon
        order
      }
    }
  ''';

  static const String getBillers = '''
    query GetBillers(\$categoryId: ID!) {
      billers(categoryId: \$categoryId) {
        id
        name
        nameAr
        code
        categoryId
        accountFormat
        accountHint
      }
    }
  ''';

  static const String inquireBill = '''
    query InquireBill(\$billerId: ID!, \$accountNumber: String!) {
      inquireBill(billerId: \$billerId, accountNumber: \$accountNumber) {
        success
        subscriberName
        amount
        dueDate
        period
        billNumber
        errorMessage
      }
    }
  ''';

  static const String getNotifications = '''
    query GetNotifications(\$userId: ID!, \$limit: Int) {
      notifications(userId: \$userId, limit: \$limit) {
        id
        type
        title
        titleAr
        body
        bodyAr
        read
        createdAt
      }
    }
  ''';

  static const String getMedicalCard = '''
    query GetMedicalCard(\$userId: ID!) {
      medicalCard(userId: \$userId) {
        id
        cardNumber
        balance
        dailyLimit
        status
        expiryDate
        beneficiaries {
          id
          name
          relation
        }
      }
    }
  ''';

  static const String getTopUpMethods = '''
    query GetTopUpMethods {
      topUpMethods {
        id
        name
        nameAr
        type
        icon
        minAmount
        maxAmount
        fee
        feeType
        enabled
      }
    }
  ''';
}

/// GraphQL Mutations
class GqlMutationStrings {
  GqlMutationStrings._();

  static const String sendOTP = '''
    mutation SendOTP(\$input: SendOTPInput!) {
      sendOTP(input: \$input) {
        success
        message
        expiresIn
        messageId
      }
    }
  ''';

  static const String verifyOTP = '''
    mutation VerifyOTP(\$input: VerifyOTPInput!) {
      verifyOTP(input: \$input) {
        success
        message
        token
        user {
          id
          phoneNumber
          name
          email
          role
          wallet {
            id
            balance
            pendingBalance
            currency
          }
        }
        isNewUser
      }
    }
  ''';

  static const String setPin = '''
    mutation SetPin(\$phoneNumber: String!, \$pin: String!) {
      setPin(phoneNumber: \$phoneNumber, pin: \$pin) {
        success
        message
      }
    }
  ''';

  static const String verifyPin = '''
    mutation VerifyPin(\$userId: ID!, \$pin: String!) {
      verifyPin(userId: \$userId, pin: \$pin) {
        success
        message
      }
    }
  ''';

  static const String transferMoney = '''
    mutation TransferMoney(\$input: TransferInput!) {
      transferMoney(input: \$input) {
        success
        reference
        message
        newBalance
        transaction {
          id
          amount
          createdAt
        }
      }
    }
  ''';

  static const String topUpWallet = '''
    mutation TopUpWallet(\$input: TopUpInput!) {
      topUpWallet(input: \$input) {
        success
        message
        reference
        newBalance
        paymentUrl
      }
    }
  ''';

  static const String payBill = '''
    mutation PayBill(\$input: PayBillInput!) {
      payBill(input: \$input) {
        success
        reference
        message
        newBalance
      }
    }
  ''';

  static const String updateProfile = '''
    mutation UpdateProfile(\$userId: ID!, \$input: UpdateProfileInput!) {
      updateProfile(userId: \$userId, input: \$input) {
        success
        message
        user {
          id
          name
          email
        }
      }
    }
  ''';

  static const String changePin = '''
    mutation ChangePin(\$userId: ID!, \$oldPin: String!, \$newPin: String!) {
      changePin(userId: \$userId, oldPin: \$oldPin, newPin: \$newPin) {
        success
        message
      }
    }
  ''';

  static const String markNotificationRead = '''
    mutation MarkNotificationRead(\$notificationId: ID!) {
      markNotificationRead(notificationId: \$notificationId) {
        success
      }
    }
  ''';

  static const String saveBiller = '''
    mutation SaveBiller(\$input: SaveBillerInput!) {
      saveBiller(input: \$input) {
        success
        message
      }
    }
  ''';

  static const String deleteSavedBiller = '''
    mutation DeleteSavedBiller(\$billerId: ID!) {
      deleteSavedBiller(billerId: \$billerId) {
        success
      }
    }
  ''';
}
