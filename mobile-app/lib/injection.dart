// lib/core/di/injection.dart

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';

import '../network/network.dart';
import '../services/services.dart';
import '../../data/repositories/repositories.dart';
import '../../presentation/bloc/auth/auth_bloc.dart';
import '../../presentation/bloc/wallet/wallet_bloc.dart';
import '../../presentation/bloc/locale/locale_bloc.dart';
import '../../presentation/bloc/theme/theme_bloc.dart';
import '../../router/app_router.dart';

final getIt = GetIt.instance;

@InjectableInit()
Future<void> configureDependencies() async {
  // ==================== EXTERNAL ====================
  getIt.registerLazySingleton<Connectivity>(() => Connectivity());

  // ==================== CORE SERVICES ====================
  getIt.registerLazySingleton<SecureStorageService>(
    () => SecureStorageService(),
  );

  getIt.registerLazySingleton<BiometricService>(
    () => BiometricService(),
  );

  getIt.registerLazySingleton<NotificationService>(
    () => NotificationService(),
  );

  // ==================== NETWORK ====================
  getIt.registerLazySingleton<NetworkInfo>(
    () => NetworkInfoImpl(getIt<Connectivity>()),
  );

  getIt.registerLazySingleton<GraphQLConfig>(
    () => GraphQLConfig(getIt<SecureStorageService>()),
  );

  getIt.registerLazySingleton<GraphQLService>(
    () => GraphQLService(getIt<GraphQLConfig>()),
  );

  // ==================== REPOSITORIES ====================
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      getIt<GraphQLService>(),
      getIt<SecureStorageService>(),
    ),
  );

  getIt.registerLazySingleton<WalletRepository>(
    () => WalletRepositoryImpl(getIt<GraphQLService>()),
  );

  getIt.registerLazySingleton<TransactionRepository>(
    () => TransactionRepositoryImpl(getIt<GraphQLService>()),
  );

  // ==================== BLOCS ====================
  getIt.registerFactory<AuthBloc>(
    () => AuthBloc(
      getIt<AuthRepository>(),
      getIt<BiometricService>(),
      getIt<SecureStorageService>(),
    ),
  );

  getIt.registerFactory<WalletBloc>(
    () => WalletBloc(
      getIt<WalletRepository>(),
      getIt<TransactionRepository>(),
    ),
  );

  getIt.registerFactory<TransactionBloc>(
    () => TransactionBloc(getIt<TransactionRepository>()),
  );

  getIt.registerFactory<LocaleBloc>(
    () => LocaleBloc(getIt<SecureStorageService>()),
  );

  getIt.registerFactory<ThemeBloc>(
    () => ThemeBloc(getIt<SecureStorageService>()),
  );

  // ==================== ROUTER ====================
  getIt.registerLazySingleton<AppRouter>(() => AppRouter());
}

// lib/presentation/bloc/bloc_observer.dart

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';

class AppBlocObserver extends BlocObserver {
  final Logger _logger = Logger(
    printer: PrettyPrinter(
      methodCount: 0,
      errorMethodCount: 5,
      lineLength: 50,
      colors: true,
      printEmojis: true,
    ),
  );

  @override
  void onCreate(BlocBase bloc) {
    super.onCreate(bloc);
    _logger.d('onCreate -- ${bloc.runtimeType}');
  }

  @override
  void onEvent(Bloc bloc, Object? event) {
    super.onEvent(bloc, event);
    _logger.d('onEvent -- ${bloc.runtimeType}: $event');
  }

  @override
  void onChange(BlocBase bloc, Change change) {
    super.onChange(bloc, change);
    _logger.d('onChange -- ${bloc.runtimeType}: ${change.currentState.runtimeType} -> ${change.nextState.runtimeType}');
  }

  @override
  void onTransition(Bloc bloc, Transition transition) {
    super.onTransition(bloc, transition);
    _logger.d('onTransition -- ${bloc.runtimeType}: ${transition.currentState.runtimeType} -> ${transition.nextState.runtimeType}');
  }

  @override
  void onError(BlocBase bloc, Object error, StackTrace stackTrace) {
    _logger.e('onError -- ${bloc.runtimeType}', error: error, stackTrace: stackTrace);
    super.onError(bloc, error, stackTrace);
  }

  @override
  void onClose(BlocBase bloc) {
    super.onClose(bloc);
    _logger.d('onClose -- ${bloc.runtimeType}');
  }
}

// lib/presentation/bloc/locale/locale_bloc.dart

import 'dart:ui';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../core/constants/storage_keys.dart';
import '../../../core/services/services.dart';

// Events
abstract class LocaleEvent extends Equatable {
  const LocaleEvent();

  @override
  List<Object?> get props => [];
}

class LocaleLoadRequested extends LocaleEvent {}

class LocaleChanged extends LocaleEvent {
  final Locale locale;
  const LocaleChanged(this.locale);

  @override
  List<Object?> get props => [locale];
}

// State
class LocaleState extends Equatable {
  final Locale locale;

  const LocaleState({this.locale = const Locale('en')});

  @override
  List<Object?> get props => [locale];

  LocaleState copyWith({Locale? locale}) {
    return LocaleState(locale: locale ?? this.locale);
  }
}

// Bloc
@injectable
class LocaleBloc extends Bloc<LocaleEvent, LocaleState> {
  final SecureStorageService _storageService;

  LocaleBloc(this._storageService) : super(const LocaleState()) {
    on<LocaleLoadRequested>(_onLoadRequested);
    on<LocaleChanged>(_onChanged);
  }

  Future<void> _onLoadRequested(
    LocaleLoadRequested event,
    Emitter<LocaleState> emit,
  ) async {
    // For now, we'll use shared preferences for locale
    // In a real app, you'd load this from storage
    emit(const LocaleState(locale: Locale('en')));
  }

  Future<void> _onChanged(
    LocaleChanged event,
    Emitter<LocaleState> emit,
  ) async {
    emit(state.copyWith(locale: event.locale));
  }
}

// lib/presentation/bloc/theme/theme_bloc.dart

import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../core/services/services.dart';

// Events
abstract class ThemeEvent extends Equatable {
  const ThemeEvent();

  @override
  List<Object?> get props => [];
}

class ThemeLoadRequested extends ThemeEvent {}

class ThemeChanged extends ThemeEvent {
  final ThemeMode themeMode;
  const ThemeChanged(this.themeMode);

  @override
  List<Object?> get props => [themeMode];
}

// State
class ThemeState extends Equatable {
  final ThemeMode themeMode;

  const ThemeState({this.themeMode = ThemeMode.light});

  @override
  List<Object?> get props => [themeMode];

  ThemeState copyWith({ThemeMode? themeMode}) {
    return ThemeState(themeMode: themeMode ?? this.themeMode);
  }
}

// Bloc
@injectable
class ThemeBloc extends Bloc<ThemeEvent, ThemeState> {
  final SecureStorageService _storageService;

  ThemeBloc(this._storageService) : super(const ThemeState()) {
    on<ThemeLoadRequested>(_onLoadRequested);
    on<ThemeChanged>(_onChanged);
  }

  Future<void> _onLoadRequested(
    ThemeLoadRequested event,
    Emitter<ThemeState> emit,
  ) async {
    emit(const ThemeState(themeMode: ThemeMode.light));
  }

  Future<void> _onChanged(
    ThemeChanged event,
    Emitter<ThemeState> emit,
  ) async {
    emit(state.copyWith(themeMode: event.themeMode));
  }
}
