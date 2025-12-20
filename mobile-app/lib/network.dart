// lib/core/network/graphql_config.dart

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:injectable/injectable.dart';

import '../config/config.dart';
import '../services/secure_storage_service.dart';

@singleton
class GraphQLConfig {
  final SecureStorageService _storageService;
  late ValueNotifier<GraphQLClient> _client;

  GraphQLConfig(this._storageService) {
    _initClient();
  }

  void _initClient() {
    final httpLink = HttpLink(
      ApiConfig.graphqlEndpoint,
      defaultHeaders: ApiConfig.defaultHeaders,
    );

    final authLink = AuthLink(
      getToken: () async {
        final token = await _storageService.getAccessToken();
        return token != null ? 'Bearer $token' : null;
      },
    );

    final wsLink = WebSocketLink(
      ApiConfig.wsEndpoint,
      config: SocketClientConfig(
        autoReconnect: true,
        inactivityTimeout: const Duration(seconds: 30),
        initialPayload: () async {
          final token = await _storageService.getAccessToken();
          return {
            'Authorization': token != null ? 'Bearer $token' : '',
          };
        },
      ),
    );

    // Split link for queries/mutations vs subscriptions
    final link = Link.split(
      (request) => request.isSubscription,
      wsLink,
      authLink.concat(httpLink),
    );

    _client = ValueNotifier(
      GraphQLClient(
        link: link,
        cache: GraphQLCache(store: InMemoryStore()),
      ),
    );
  }

  ValueNotifier<GraphQLClient> get client => _client;

  GraphQLClient get value => _client.value;

  /// Refresh client after token update
  void refreshClient() {
    _initClient();
  }

  /// Clear cache
  void clearCache() {
    _client.value.cache.store.reset();
  }
}

// lib/core/network/graphql_service.dart

import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:injectable/injectable.dart';

import '../errors/exceptions.dart';
import 'graphql_config.dart';

@injectable
class GraphQLService {
  final GraphQLConfig _config;

  GraphQLService(this._config);

  GraphQLClient get _client => _config.value;

  /// Execute a GraphQL query
  Future<QueryResult> query({
    required String query,
    Map<String, dynamic>? variables,
    FetchPolicy? fetchPolicy,
  }) async {
    final options = QueryOptions(
      document: gql(query),
      variables: variables ?? {},
      fetchPolicy: fetchPolicy ?? FetchPolicy.networkOnly,
    );

    final result = await _client.query(options);

    if (result.hasException) {
      throw _handleException(result.exception!);
    }

    return result;
  }

  /// Execute a GraphQL mutation
  Future<QueryResult> mutate({
    required String mutation,
    Map<String, dynamic>? variables,
  }) async {
    final options = MutationOptions(
      document: gql(mutation),
      variables: variables ?? {},
    );

    final result = await _client.mutate(options);

    if (result.hasException) {
      throw _handleException(result.exception!);
    }

    return result;
  }

  /// Subscribe to GraphQL subscription
  Stream<QueryResult> subscribe({
    required String subscription,
    Map<String, dynamic>? variables,
  }) {
    final options = SubscriptionOptions(
      document: gql(subscription),
      variables: variables ?? {},
    );

    return _client.subscribe(options);
  }

  /// Handle GraphQL exceptions
  AppException _handleException(OperationException exception) {
    if (exception.linkException != null) {
      return NetworkException(
        message: 'Network error. Please check your connection.',
        originalError: exception.linkException,
      );
    }

    if (exception.graphqlErrors.isNotEmpty) {
      final error = exception.graphqlErrors.first;
      final code = error.extensions?['code'] as String?;
      
      switch (code) {
        case 'UNAUTHENTICATED':
          return AuthException(message: error.message);
        case 'FORBIDDEN':
          return AuthException(message: 'Access denied');
        case 'NOT_FOUND':
          return NotFoundException(message: error.message);
        case 'VALIDATION_ERROR':
          return ValidationException(message: error.message);
        default:
          return ServerException(message: error.message);
      }
    }

    return ServerException(message: 'An unexpected error occurred');
  }
}

// lib/core/network/network_info.dart

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:injectable/injectable.dart';

abstract class NetworkInfo {
  Future<bool> get isConnected;
  Stream<bool> get onConnectivityChanged;
}

@LazySingleton(as: NetworkInfo)
class NetworkInfoImpl implements NetworkInfo {
  final Connectivity _connectivity;

  NetworkInfoImpl(this._connectivity);

  @override
  Future<bool> get isConnected async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }

  @override
  Stream<bool> get onConnectivityChanged {
    return _connectivity.onConnectivityChanged.map(
      (result) => result != ConnectivityResult.none,
    );
  }
}
