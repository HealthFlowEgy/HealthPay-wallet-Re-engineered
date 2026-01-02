import 'package:healthpay/core/network/graphql_client.dart';
import 'package:healthpay/core/errors/exceptions.dart';
import 'package:healthpay/features/auth/data/models/user_model.dart';

/// Auth Remote Data Source Interface
abstract class AuthRemoteDataSource {
  /// Send OTP via Cequens SMS
  Future<OTPResponseModel> sendOTP(String phoneNumber);
  
  /// Verify OTP code received via SMS
  Future<AuthResponseModel> verifyOTP({
    required String phoneNumber,
    required String code,
  });
  
  /// Resend OTP via Cequens SMS
  Future<OTPResponseModel> resendOTP(String phoneNumber);
  
  /// Set user PIN
  Future<PinResponseModel> setPin({
    required String phoneNumber,
    required String pin,
  });
  
  /// Verify user PIN
  Future<PinResponseModel> verifyPin({
    required String userId,
    required String pin,
  });
  
  /// Get current authenticated user
  Future<UserModel> getCurrentUser();
  
  /// Logout user
  Future<void> logout();
}

/// Auth Remote Data Source Implementation with Cequens SMS Integration
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final GraphQLService graphQLService;

  AuthRemoteDataSourceImpl({required this.graphQLService});

  @override
  Future<OTPResponseModel> sendOTP(String phoneNumber) async {
    try {
      // Normalize phone number for Egypt
      final normalizedPhone = _normalizeEgyptPhone(phoneNumber);
      
      final result = await graphQLService.mutate(
        GqlMutationStrings.sendOTP,
        variables: {
          'input': {
            'phoneNumber': normalizedPhone,
            'purpose': 'LOGIN', // Can be LOGIN, REGISTER, RESET_PIN
          },
        },
      );

      final data = result.data?['sendOTP'];
      if (data == null) {
        throw const ServerException(
          message: 'Failed to send OTP. Please try again.',
          code: 'OTP_SEND_FAILED',
        );
      }

      final response = OTPResponseModel.fromJson(data as Map<String, dynamic>);
      
      // Check if SMS was actually sent
      if (!response.success) {
        throw ServerException(
          message: response.message ?? 'Failed to send SMS. Please check your phone number.',
          code: 'SMS_SEND_FAILED',
        );
      }

      return response;
    } on AppException {
      rethrow;
    } catch (e) {
      throw ServerException(
        message: 'Unable to send verification code. Please check your connection.',
        code: 'NETWORK_ERROR',
      );
    }
  }

  @override
  Future<OTPResponseModel> resendOTP(String phoneNumber) async {
    // Resend uses the same endpoint as sendOTP
    return sendOTP(phoneNumber);
  }

  @override
  Future<AuthResponseModel> verifyOTP({
    required String phoneNumber,
    required String code,
  }) async {
    try {
      // Normalize phone number for Egypt
      final normalizedPhone = _normalizeEgyptPhone(phoneNumber);
      
      final result = await graphQLService.mutate(
        GqlMutationStrings.verifyOTP,
        variables: {
          'input': {
            'phoneNumber': normalizedPhone,
            'code': code, // Backend expects 'code' not 'otp'
          },
        },
      );

      final data = result.data?['verifyOTP'];
      if (data == null) {
        throw const ServerException(
          message: 'Failed to verify OTP. Please try again.',
          code: 'OTP_VERIFY_FAILED',
        );
      }

      final response = AuthResponseModel.fromJson(data as Map<String, dynamic>);
      
      if (!response.success) {
        // Handle specific error cases
        final message = response.message ?? 'Invalid verification code';
        if (message.toLowerCase().contains('expired')) {
          throw const ServerException(
            message: 'Verification code has expired. Please request a new one.',
            code: 'OTP_EXPIRED',
          );
        } else if (message.toLowerCase().contains('invalid')) {
          throw const ServerException(
            message: 'Invalid verification code. Please check and try again.',
            code: 'OTP_INVALID',
          );
        }
        throw ServerException(message: message, code: 'OTP_VERIFY_FAILED');
      }

      return response;
    } on AppException {
      rethrow;
    } catch (e) {
      throw ServerException(
        message: 'Unable to verify code. Please check your connection.',
        code: 'NETWORK_ERROR',
      );
    }
  }

  @override
  Future<PinResponseModel> setPin({
    required String phoneNumber,
    required String pin,
  }) async {
    try {
      final normalizedPhone = _normalizeEgyptPhone(phoneNumber);
      
      final result = await graphQLService.mutate(
        GqlMutationStrings.setPin,
        variables: {
          'phoneNumber': normalizedPhone,
          'pin': pin,
        },
      );

      final data = result.data?['setPin'];
      if (data == null) {
        throw const ServerException(
          message: 'Failed to set PIN. Please try again.',
          code: 'PIN_SET_FAILED',
        );
      }

      return PinResponseModel.fromJson(data as Map<String, dynamic>);
    } on AppException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<PinResponseModel> verifyPin({
    required String userId,
    required String pin,
  }) async {
    try {
      final result = await graphQLService.mutate(
        GqlMutationStrings.verifyPin,
        variables: {
          'userId': userId,
          'pin': pin,
        },
      );

      final data = result.data?['verifyPin'];
      if (data == null) {
        throw const ServerException(
          message: 'Failed to verify PIN. Please try again.',
          code: 'PIN_VERIFY_FAILED',
        );
      }

      return PinResponseModel.fromJson(data as Map<String, dynamic>);
    } on AppException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<UserModel> getCurrentUser() async {
    try {
      final result = await graphQLService.query(GqlQueryStrings.getMe);

      final data = result.data?['me'];
      if (data == null) {
        throw const UnauthorizedException();
      }

      return UserModel.fromJson(data as Map<String, dynamic>);
    } on AppException {
      rethrow;
    } catch (e) {
      throw ServerException(message: e.toString());
    }
  }

  @override
  Future<void> logout() async {
    // Clear any server-side session if needed
    // For now, just return as logout is handled client-side
    return;
  }

  /// Normalize Egyptian phone number to international format
  /// Converts: 01012345678 -> 201012345678
  /// Converts: +201012345678 -> 201012345678
  String _normalizeEgyptPhone(String phone) {
    // Remove any non-digit characters except +
    String cleaned = phone.replaceAll(RegExp(r'[^\d+]'), '');
    
    // Remove + if present
    cleaned = cleaned.replaceAll('+', '');
    
    // If starts with 0, add Egypt country code
    if (cleaned.startsWith('0')) {
      cleaned = '20${cleaned.substring(1)}';
    }
    
    // If doesn't start with 20, add it
    if (!cleaned.startsWith('20')) {
      cleaned = '20$cleaned';
    }
    
    return cleaned;
  }
}
