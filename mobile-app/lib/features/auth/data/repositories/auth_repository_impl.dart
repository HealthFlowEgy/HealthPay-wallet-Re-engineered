import 'package:dartz/dartz.dart';
import 'package:local_auth/local_auth.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/core/errors/failures.dart';
import 'package:healthpay/core/network/network_info.dart';
import 'package:healthpay/core/network/secure_storage.dart';
import 'package:healthpay/core/utils/helpers.dart';
import 'package:healthpay/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:healthpay/features/auth/domain/entities/user.dart';
import 'package:healthpay/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService secureStorage;
  final NetworkInfo networkInfo;
  final LocalAuthentication _localAuth = LocalAuthentication();

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
    required this.networkInfo,
  });

  @override
  Future<Either<Failure, OTPResponse>> sendOTP(String phoneNumber) async {
    if (!await networkInfo.isConnected) {
      return const Left(NetworkFailure());
    }

    try {
      final result = await remoteDataSource.sendOTP(phoneNumber);
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AuthResponse>> verifyOTP({
    required String phoneNumber,
    required String code,
  }) async {
    if (!await networkInfo.isConnected) {
      return const Left(NetworkFailure());
    }

    try {
      final result = await remoteDataSource.verifyOTP(
        phoneNumber: phoneNumber,
        code: code,
      );

      if (result.success && result.token != null) {
        await secureStorage.saveAccessToken(result.token!);
        if (result.user != null) {
          await secureStorage.saveUserId(result.user!.id);
        }
      }

      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, PinResponse>> setPin({
    required String phoneNumber,
    required String pin,
  }) async {
    if (!await networkInfo.isConnected) {
      return const Left(NetworkFailure());
    }

    try {
      final result = await remoteDataSource.setPin(
        phoneNumber: phoneNumber,
        pin: pin,
      );

      if (result.success) {
        // Store hashed PIN locally
        final hashedPin = Helpers.hashPin(pin);
        await secureStorage.savePin(hashedPin);
      }

      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, bool>> verifyPin(String pin) async {
    try {
      // Check for lockout
      final lockoutTime = await secureStorage.getLockoutTime();
      if (lockoutTime != null && DateTime.now().isBefore(lockoutTime)) {
        return Left(PinFailure(
          message: 'Account locked. Try again later.',
          lockoutUntil: lockoutTime,
        ));
      }

      final storedHash = await secureStorage.getPin();
      if (storedHash == null) {
        return const Left(PinFailure(message: 'PIN not set'));
      }

      final isValid = Helpers.verifyPin(pin, storedHash);

      if (isValid) {
        await secureStorage.resetPinAttempts();
        return const Right(true);
      } else {
        // Increment attempts
        int attempts = await secureStorage.getPinAttempts();
        attempts++;
        await secureStorage.savePinAttempts(attempts);

        if (attempts >= 5) {
          // Lock account for 30 minutes
          final lockoutUntil = DateTime.now().add(const Duration(minutes: 30));
          await secureStorage.saveLockoutTime(lockoutUntil);
          return Left(PinFailure(
            message: 'Too many attempts. Account locked for 30 minutes.',
            remainingAttempts: 0,
            lockoutUntil: lockoutUntil,
          ));
        }

        return Left(PinFailure(
          message: 'Invalid PIN',
          remainingAttempts: 5 - attempts,
        ));
      }
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, bool>> hasPin() async {
    try {
      final hasPin = await secureStorage.hasPin();
      return Right(hasPin);
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    if (!await networkInfo.isConnected) {
      return const Left(NetworkFailure());
    }

    try {
      final user = await remoteDataSource.getCurrentUser();
      return Right(user);
    } on UnauthorizedException {
      await logout();
      return const Left(AuthFailure(message: 'Session expired'));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, code: e.code));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    return await secureStorage.isLoggedIn();
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await secureStorage.clearAll();
      return const Right(null);
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<bool> isBiometricAvailable() async {
    try {
      final isAvailable = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return isAvailable && isDeviceSupported;
    } catch (e) {
      return false;
    }
  }

  @override
  Future<Either<Failure, bool>> authenticateWithBiometric() async {
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Please authenticate to access your wallet',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
      return Right(authenticated);
    } catch (e) {
      return Left(AuthFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> setBiometricEnabled(bool enabled) async {
    try {
      await secureStorage.setBiometricEnabled(enabled);
      return const Right(null);
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<bool> isBiometricEnabled() async {
    return await secureStorage.isBiometricEnabled();
  }
}
