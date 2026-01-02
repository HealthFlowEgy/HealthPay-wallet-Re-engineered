part of 'settings_bloc.dart';

class SettingsState extends Equatable {
  final Locale locale;
  final bool notificationsEnabled;
  final bool biometricEnabled;

  const SettingsState({
    required this.locale,
    required this.notificationsEnabled,
    required this.biometricEnabled,
  });

  factory SettingsState.initial() => const SettingsState(
    locale: Locale('ar'),
    notificationsEnabled: true,
    biometricEnabled: false,
  );

  SettingsState copyWith({Locale? locale, bool? notificationsEnabled, bool? biometricEnabled}) {
    return SettingsState(
      locale: locale ?? this.locale,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
    );
  }

  @override
  List<Object?> get props => [locale, notificationsEnabled, biometricEnabled];
}
