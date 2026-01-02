import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:healthpay/core/theme/app_theme.dart';
import 'package:healthpay/core/router/app_router.dart';
import 'package:healthpay/injection_container.dart';
import 'package:healthpay/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:healthpay/features/settings/presentation/bloc/settings_bloc.dart';
import 'package:healthpay/l10n/app_localizations.dart';

class HealthPayApp extends StatelessWidget {
  const HealthPayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (_) => sl<AuthBloc>()..add(CheckAuthStatus()),
        ),
        BlocProvider<SettingsBloc>(
          create: (_) => sl<SettingsBloc>()..add(LoadSettings()),
        ),
      ],
      child: BlocBuilder<SettingsBloc, SettingsState>(
        buildWhen: (previous, current) => previous.locale != current.locale,
        builder: (context, settingsState) {
          return MaterialApp.router(
            title: 'HealthPay',
            debugShowCheckedModeBanner: false,
            
            // Theme
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.light,
            
            // Localization
            locale: settingsState.locale,
            supportedLocales: const [
              Locale('ar'),
              Locale('en'),
            ],
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            
            // Router
            routerConfig: AppRouter.router,
          );
        },
      ),
    );
  }
}
