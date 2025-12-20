// lib/app.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

import 'core/config/theme_config.dart';
import 'core/di/injection.dart';
import 'core/network/graphql_config.dart';
import 'presentation/bloc/auth/auth_bloc.dart';
import 'presentation/bloc/locale/locale_bloc.dart';
import 'presentation/bloc/theme/theme_bloc.dart';
import 'router/app_router.dart';
import 'l10n/app_localizations.dart';

class HealthPayApp extends StatelessWidget {
  const HealthPayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GraphQLProvider(
      client: getIt<GraphQLConfig>().client,
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (_) => getIt<AuthBloc>()..add(AuthCheckRequested()),
          ),
          BlocProvider<LocaleBloc>(
            create: (_) => getIt<LocaleBloc>()..add(LocaleLoadRequested()),
          ),
          BlocProvider<ThemeBloc>(
            create: (_) => getIt<ThemeBloc>()..add(ThemeLoadRequested()),
          ),
        ],
        child: BlocBuilder<LocaleBloc, LocaleState>(
          builder: (context, localeState) {
            return BlocBuilder<ThemeBloc, ThemeState>(
              builder: (context, themeState) {
                return MaterialApp.router(
                  title: 'HealthPay Wallet',
                  debugShowCheckedModeBanner: false,
                  
                  // Theme
                  theme: AppTheme.lightTheme,
                  darkTheme: AppTheme.darkTheme,
                  themeMode: themeState.themeMode,
                  
                  // Localization
                  locale: localeState.locale,
                  supportedLocales: AppLocalizations.supportedLocales,
                  localizationsDelegates: const [
                    AppLocalizations.delegate,
                    GlobalMaterialLocalizations.delegate,
                    GlobalWidgetsLocalizations.delegate,
                    GlobalCupertinoLocalizations.delegate,
                  ],
                  
                  // Routing
                  routerConfig: getIt<AppRouter>().config,
                );
              },
            );
          },
        ),
      ),
    );
  }
}
