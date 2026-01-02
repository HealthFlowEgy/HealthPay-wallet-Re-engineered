import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:healthpay/core/constants/app_constants.dart';

part 'settings_event.dart';
part 'settings_state.dart';

class SettingsBloc extends Bloc<SettingsEvent, SettingsState> {
  final SharedPreferences sharedPreferences;

  SettingsBloc({required this.sharedPreferences}) : super(SettingsState.initial()) {
    on<LoadSettings>(_onLoadSettings);
    on<ChangeLocale>(_onChangeLocale);
    on<ToggleNotifications>(_onToggleNotifications);
  }

  void _onLoadSettings(LoadSettings event, Emitter<SettingsState> emit) {
    final localeCode = sharedPreferences.getString(StorageKeys.locale) ?? 'ar';
    emit(state.copyWith(locale: Locale(localeCode)));
  }

  Future<void> _onChangeLocale(ChangeLocale event, Emitter<SettingsState> emit) async {
    await sharedPreferences.setString(StorageKeys.locale, event.locale.languageCode);
    emit(state.copyWith(locale: event.locale));
  }

  void _onToggleNotifications(ToggleNotifications event, Emitter<SettingsState> emit) {
    emit(state.copyWith(notificationsEnabled: event.enabled));
  }
}
