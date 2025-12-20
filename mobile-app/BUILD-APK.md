# 📱 Building HealthPay APK

Three options to build the APK - choose what works best for you:

---

## Option 1: GitHub Actions (Easiest - No Setup Required)

**Best for:** Quick builds, CI/CD, team collaboration

### Steps:
1. Create a GitHub repository
2. Push all project files
3. Copy `.github/workflows/build-apk.yml` to your repo
4. Push to trigger build
5. Download APK from **Actions → Artifacts**

```bash
# Initialize and push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/healthpay-wallet.git
git push -u origin main
```

The APK will be automatically built and available for download in ~10 minutes.

---

## Option 2: Local Build (Standard)

**Best for:** Developers with Flutter installed

### Prerequisites:
```bash
# Check Flutter
flutter doctor

# Required:
# ✓ Flutter (3.19+)
# ✓ Android toolchain
# ✓ Android Studio or VS Code
```

### Build Steps:
```bash
# 1. Navigate to project
cd healthpay-flutter

# 2. Get dependencies
flutter pub get

# 3. Generate code (Freezed models)
dart run build_runner build --delete-conflicting-outputs

# 4. Build APK
flutter build apk --release
```

### Output:
```
build/app/outputs/flutter-apk/app-release.apk
```

### Or use the build script:
```bash
chmod +x build-apk.sh
./build-apk.sh
```

---

## Option 3: Docker Build (No Flutter Installation Needed)

**Best for:** Clean builds, reproducible environment, CI servers

### Build with Docker:
```bash
# Build the Docker image
docker build -t healthpay-builder .

# Run container and extract APK
docker run -v $(pwd)/output:/app/output healthpay-builder
```

### Output:
```
output/healthpay-wallet.apk
```

### One-liner:
```bash
docker build -t healthpay-builder . && docker run -v $(pwd)/output:/app/output healthpay-builder
```

---

## 📱 Installing the APK

### Via ADB (USB):
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

### Via File Transfer:
1. Copy APK to phone
2. Open file manager
3. Tap APK file
4. Allow "Install from unknown sources" if prompted
5. Install

---

## 🔐 Signing for Production

For Play Store release, you need to sign the APK:

### 1. Generate Keystore:
```bash
keytool -genkey -v -keystore healthpay-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias healthpay
```

### 2. Create `android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=healthpay
storeFile=../healthpay-release-key.jks
```

### 3. Update `android/app/build.gradle`:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 4. Build signed APK:
```bash
flutter build apk --release
```

---

## 📊 Build Variants

| Command | Output | Size | Use Case |
|---------|--------|------|----------|
| `flutter build apk --debug` | Debug APK | ~80MB | Testing |
| `flutter build apk --release` | Release APK | ~25MB | Distribution |
| `flutter build apk --split-per-abi` | Per-ABI APKs | ~15MB each | Smaller downloads |
| `flutter build appbundle` | App Bundle | ~15MB | Play Store |

### Split APK by Architecture:
```bash
flutter build apk --split-per-abi --release
```

Outputs:
- `app-armeabi-v7a-release.apk` (older devices)
- `app-arm64-v8a-release.apk` (most modern devices)
- `app-x86_64-release.apk` (emulators)

---

## 🐛 Troubleshooting

### "SDK not found"
```bash
flutter doctor --android-licenses
flutter config --android-sdk /path/to/android/sdk
```

### "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter build apk
```

### "build_runner errors"
```bash
flutter clean
flutter pub get
dart run build_runner clean
dart run build_runner build --delete-conflicting-outputs
```

### "Java version mismatch"
Ensure Java 17 is installed and set:
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

---

## 📁 Expected Build Output

```
build/
└── app/
    └── outputs/
        ├── flutter-apk/
        │   ├── app-debug.apk          # Debug build
        │   ├── app-release.apk        # Release build
        │   └── app-arm64-v8a-release.apk  # If split
        └── bundle/
            └── release/
                └── app-release.aab    # Play Store bundle
```

---

## ⏱️ Build Times

| Environment | Debug | Release |
|-------------|-------|---------|
| Local (M1 Mac) | ~2 min | ~3 min |
| Local (Windows) | ~3 min | ~5 min |
| GitHub Actions | ~5 min | ~8 min |
| Docker | ~10 min | ~15 min |

---

## 🚀 Next Steps After Building

1. **Test on device** - Install and verify all features
2. **Test on emulator** - Test different screen sizes
3. **Add app icons** - Run `flutter pub run flutter_launcher_icons`
4. **Add splash screen** - Configure native splash
5. **Configure Firebase** - Add google-services.json
6. **Prepare for release** - Create signed builds

---

*Need help? Check `flutter doctor -v` for environment issues.*
