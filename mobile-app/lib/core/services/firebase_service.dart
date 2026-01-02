import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:healthpay/core/config/environment.dart';

/// Firebase service for handling push notifications, analytics, and crashlytics
class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  FirebaseMessaging? _messaging;
  FirebaseAnalytics? _analytics;

  /// Initialize Firebase services
  Future<void> initialize() async {
    try {
      await Firebase.initializeApp();

      // Initialize Crashlytics
      if (Environment.enableCrashlytics) {
        FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
        PlatformDispatcher.instance.onError = (error, stack) {
          FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
          return true;
        };
      }

      // Initialize Analytics
      if (Environment.enableAnalytics) {
        _analytics = FirebaseAnalytics.instance;
      }

      // Initialize Messaging
      if (Environment.enablePushNotifications) {
        _messaging = FirebaseMessaging.instance;
        await _setupMessaging();
      }
    } catch (e) {
      debugPrint('Firebase initialization error: $e');
    }
  }

  Future<void> _setupMessaging() async {
    if (_messaging == null) return;

    // Request permission
    final settings = await _messaging!.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('Push notification permission: ${settings.authorizationStatus}');

    // Get FCM token
    final token = await _messaging!.getToken();
    debugPrint('FCM Token: $token');

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

    // Handle notification taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message: ${message.notification?.title}');
    // Show local notification
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    debugPrint('Background message: ${message.notification?.title}');
  }

  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('Notification tapped: ${message.data}');
    // Navigate to appropriate screen
  }

  /// Log analytics event
  Future<void> logEvent(String name, {Map<String, dynamic>? parameters}) async {
    if (_analytics == null) return;
    await _analytics!.logEvent(name: name, parameters: parameters);
  }

  /// Set user ID for analytics
  Future<void> setUserId(String userId) async {
    if (_analytics == null) return;
    await _analytics!.setUserId(id: userId);
  }

  /// Log screen view
  Future<void> logScreenView(String screenName) async {
    if (_analytics == null) return;
    await _analytics!.logScreenView(screenName: screenName);
  }

  /// Get FCM token
  Future<String?> getFCMToken() async {
    return _messaging?.getToken();
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging?.subscribeToTopic(topic);
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging?.unsubscribeFromTopic(topic);
  }
}
