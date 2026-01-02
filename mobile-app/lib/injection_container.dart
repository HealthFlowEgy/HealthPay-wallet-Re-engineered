import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Core
import 'package:healthpay/core/network/graphql_client.dart';
import 'package:healthpay/core/network/network_info.dart';
import 'package:healthpay/core/network/secure_storage.dart';

// Features - Auth
import 'package:healthpay/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:healthpay/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:healthpay/features/auth/domain/repositories/auth_repository.dart';
import 'package:healthpay/features/auth/domain/usecases/send_otp.dart';
import 'package:healthpay/features/auth/domain/usecases/verify_otp.dart';
import 'package:healthpay/features/auth/domain/usecases/set_pin.dart';
import 'package:healthpay/features/auth/domain/usecases/verify_pin.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';

// Features - Dashboard
import 'package:healthpay/features/dashboard/data/datasources/dashboard_remote_datasource.dart';
import 'package:healthpay/features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'package:healthpay/features/dashboard/domain/repositories/dashboard_repository.dart';
import 'package:healthpay/features/dashboard/presentation/bloc/dashboard_bloc.dart';

// Features - Transfer
import 'package:healthpay/features/transfer/data/datasources/transfer_remote_datasource.dart';
import 'package:healthpay/features/transfer/data/repositories/transfer_repository_impl.dart';
import 'package:healthpay/features/transfer/domain/repositories/transfer_repository.dart';
import 'package:healthpay/features/transfer/presentation/bloc/transfer_bloc.dart';

// Features - TopUp
import 'package:healthpay/features/topup/data/datasources/topup_remote_datasource.dart';
import 'package:healthpay/features/topup/data/repositories/topup_repository_impl.dart';
import 'package:healthpay/features/topup/domain/repositories/topup_repository.dart';
import 'package:healthpay/features/topup/presentation/bloc/topup_bloc.dart';

// Features - Bills
import 'package:healthpay/features/bills/data/datasources/bills_remote_datasource.dart';
import 'package:healthpay/features/bills/data/repositories/bills_repository_impl.dart';
import 'package:healthpay/features/bills/domain/repositories/bills_repository.dart';
import 'package:healthpay/features/bills/presentation/bloc/bills_bloc.dart';

// Features - Transactions
import 'package:healthpay/features/transactions/data/datasources/transactions_remote_datasource.dart';
import 'package:healthpay/features/transactions/data/repositories/transactions_repository_impl.dart';
import 'package:healthpay/features/transactions/domain/repositories/transactions_repository.dart';
import 'package:healthpay/features/transactions/presentation/bloc/transactions_bloc.dart';

// Features - Settings
import 'package:healthpay/features/settings/presentation/bloc/settings_bloc.dart';

final sl = GetIt.instance;

Future<void> initializeDependencies() async {
  //! External
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPreferences);
  sl.registerLazySingleton(() => Connectivity());

  //! Core
  sl.registerLazySingleton(() => SecureStorageService());
  sl.registerLazySingleton(() => GraphQLService(secureStorage: sl()));
  sl.registerLazySingleton<NetworkInfo>(() => NetworkInfoImpl(connectivity: sl()));

  //! Features - Auth
  // Data sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(graphQLService: sl()),
  );
  
  // Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDataSource: sl(),
      secureStorage: sl(),
      networkInfo: sl(),
    ),
  );
  
  // Use cases
  sl.registerLazySingleton(() => SendOTP(sl()));
  sl.registerLazySingleton(() => VerifyOTP(sl()));
  sl.registerLazySingleton(() => SetPin(sl()));
  sl.registerLazySingleton(() => VerifyPin(sl()));
  
  // Bloc
  sl.registerFactory(
    () => AuthBloc(
      sendOTP: sl(),
      verifyOTP: sl(),
      setPin: sl(),
      verifyPin: sl(),
      secureStorage: sl(),
    ),
  );

  //! Features - Dashboard
  sl.registerLazySingleton<DashboardRemoteDataSource>(
    () => DashboardRemoteDataSourceImpl(graphQLService: sl()),
  );
  
  sl.registerLazySingleton<DashboardRepository>(
    () => DashboardRepositoryImpl(
      remoteDataSource: sl(),
      networkInfo: sl(),
    ),
  );
  
  sl.registerFactory(
    () => DashboardBloc(repository: sl()),
  );

  //! Features - Transfer
  sl.registerLazySingleton<TransferRemoteDataSource>(
    () => TransferRemoteDataSourceImpl(graphQLService: sl()),
  );
  
  sl.registerLazySingleton<TransferRepository>(
    () => TransferRepositoryImpl(
      remoteDataSource: sl(),
      networkInfo: sl(),
    ),
  );
  
  sl.registerFactory(
    () => TransferBloc(repository: sl()),
  );

  //! Features - TopUp
  sl.registerLazySingleton<TopUpRemoteDataSource>(
    () => TopUpRemoteDataSourceImpl(client: sl<GraphQLService>().client),
  );
  
  sl.registerLazySingleton<TopUpRepository>(
    () => TopUpRepositoryImpl(remoteDataSource: sl()),
  );
  
  sl.registerFactory(
    () => TopUpBloc(repository: sl()),
  );

  //! Features - Bills
  sl.registerLazySingleton<BillsRemoteDataSource>(
    () => BillsRemoteDataSourceImpl(client: sl<GraphQLService>().client),
  );
  
  sl.registerLazySingleton<BillsRepository>(
    () => BillsRepositoryImpl(remoteDataSource: sl()),
  );
  
  sl.registerFactory(
    () => BillsBloc(repository: sl()),
  );

  //! Features - Transactions
  sl.registerLazySingleton<TransactionsRemoteDataSource>(
    () => TransactionsRemoteDataSourceImpl(client: sl<GraphQLService>().client),
  );
  
  sl.registerLazySingleton<TransactionsRepository>(
    () => TransactionsRepositoryImpl(remoteDataSource: sl()),
  );
  
  sl.registerFactory(
    () => TransactionsBloc(repository: sl()),
  );

  //! Features - Settings
  sl.registerFactory(
    () => SettingsBloc(sharedPreferences: sl()),
  );
}
