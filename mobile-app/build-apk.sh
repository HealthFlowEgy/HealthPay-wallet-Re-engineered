#!/bin/bash

# ============================================================
# HealthPay Flutter App - APK Build Script
# ============================================================
# 
# Prerequisites:
# 1. Flutter SDK 3.19+ installed
# 2. Android SDK installed
# 3. Java 17+ installed
#
# Run this script from the project root directory
# ============================================================

set -e  # Exit on any error

echo "🏥 HealthPay APK Build Script"
echo "=============================="
echo ""

# Check Flutter
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter not found!"
    echo ""
    echo "Install Flutter:"
    echo "  macOS:   brew install flutter"
    echo "  Linux:   snap install flutter --classic"
    echo "  Windows: Download from https://flutter.dev/docs/get-started/install"
    echo ""
    exit 1
fi

echo "✅ Flutter: $(flutter --version | head -n 1)"

# Check Android SDK
if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️  ANDROID_HOME not set. Make sure Android SDK is installed."
fi

# Step 1: Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
flutter clean

# Step 2: Get dependencies
echo ""
echo "📦 Getting dependencies..."
flutter pub get

# Step 3: Generate code (Freezed, etc.)
echo ""
echo "🔧 Generating code..."
dart run build_runner build --delete-conflicting-outputs

# Step 4: Analyze code
echo ""
echo "🔍 Analyzing code..."
flutter analyze --no-fatal-infos || true

# Step 5: Build Debug APK
echo ""
echo "🔨 Building Debug APK..."
flutter build apk --debug

# Step 6: Build Release APK
echo ""
echo "🔨 Building Release APK..."
flutter build apk --release

# Step 7: Build App Bundle (for Play Store)
echo ""
echo "📦 Building App Bundle..."
flutter build appbundle --release

# Print results
echo ""
echo "✅ Build Complete!"
echo ""
echo "📁 Output files:"
echo "   Debug APK:    build/app/outputs/flutter-apk/app-debug.apk"
echo "   Release APK:  build/app/outputs/flutter-apk/app-release.apk"
echo "   App Bundle:   build/app/outputs/bundle/release/app-release.aab"
echo ""

# Get file sizes
if [ -f "build/app/outputs/flutter-apk/app-release.apk" ]; then
    SIZE=$(du -h "build/app/outputs/flutter-apk/app-release.apk" | cut -f1)
    echo "📊 Release APK size: $SIZE"
fi

echo ""
echo "🚀 To install on device:"
echo "   adb install build/app/outputs/flutter-apk/app-release.apk"
echo ""
