import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:healthpay/core/constants/app_constants.dart';

/// Secure Storage Service for sensitive data
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(
            encryptedSharedPreferences: true,
          ),
          iOptions: IOSOptions(
            accessibility: KeychainAccessibility.first_unlock_this_device,
          ),
        );

  // Token Management
  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: StorageKeys.accessToken, value: token);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: StorageKeys.accessToken);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: StorageKeys.refreshToken, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: StorageKeys.refreshToken);
  }

  Future<void> deleteTokens() async {
    await _storage.delete(key: StorageKeys.accessToken);
    await _storage.delete(key: StorageKeys.refreshToken);
  }

  // User ID
  Future<void> saveUserId(String userId) async {
    await _storage.write(key: StorageKeys.userId, value: userId);
  }

  Future<String?> getUserId() async {
    return await _storage.read(key: StorageKeys.userId);
  }

  // PIN Management
  Future<void> savePin(String hashedPin) async {
    await _storage.write(key: StorageKeys.userPin, value: hashedPin);
  }

  Future<String?> getPin() async {
    return await _storage.read(key: StorageKeys.userPin);
  }

  Future<bool> hasPin() async {
    final pin = await getPin();
    return pin != null && pin.isNotEmpty;
  }

  // PIN Attempts
  Future<void> savePinAttempts(int attempts) async {
    await _storage.write(
      key: StorageKeys.pinAttempts,
      value: attempts.toString(),
    );
  }

  Future<int> getPinAttempts() async {
    final attempts = await _storage.read(key: StorageKeys.pinAttempts);
    return int.tryParse(attempts ?? '0') ?? 0;
  }

  Future<void> resetPinAttempts() async {
    await _storage.delete(key: StorageKeys.pinAttempts);
  }

  // PIN Lockout
  Future<void> saveLockoutTime(DateTime time) async {
    await _storage.write(
      key: StorageKeys.pinLockoutTime,
      value: time.toIso8601String(),
    );
  }

  Future<DateTime?> getLockoutTime() async {
    final timeStr = await _storage.read(key: StorageKeys.pinLockoutTime);
    if (timeStr == null) return null;
    return DateTime.tryParse(timeStr);
  }

  Future<void> clearLockout() async {
    await _storage.delete(key: StorageKeys.pinLockoutTime);
    await resetPinAttempts();
  }

  // Biometric
  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(
      key: StorageKeys.biometricEnabled,
      value: enabled.toString(),
    );
  }

  Future<bool> isBiometricEnabled() async {
    final value = await _storage.read(key: StorageKeys.biometricEnabled);
    return value == 'true';
  }

  // FCM Token
  Future<void> saveFcmToken(String token) async {
    await _storage.write(key: StorageKeys.fcmToken, value: token);
  }

  Future<String?> getFcmToken() async {
    return await _storage.read(key: StorageKeys.fcmToken);
  }

  // Clear All
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
