# ============================================================
# HealthPay Flutter App - Docker Build
# ============================================================
# 
# Build APK using Docker (no local Flutter installation needed)
# 
# Usage:
#   docker build -t healthpay-builder .
#   docker run -v $(pwd)/output:/app/output healthpay-builder
# 
# The APK will be copied to ./output/ directory
# ============================================================

FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    openjdk-17-jdk \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set up environment variables
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
ENV PATH="$PATH:/opt/flutter/bin"

# Install Android SDK command-line tools
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    cd $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip && \
    unzip -q commandlinetools-linux-10406996_latest.zip && \
    mv cmdline-tools latest && \
    rm commandlinetools-linux-10406996_latest.zip

# Accept Android licenses and install required components
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Install Flutter
RUN cd /opt && \
    git clone https://github.com/flutter/flutter.git -b stable --depth 1 && \
    flutter config --no-analytics && \
    flutter precache --android && \
    flutter doctor -v

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Get dependencies
RUN flutter pub get

# Generate code
RUN dart run build_runner build --delete-conflicting-outputs || true

# Build APK
RUN flutter build apk --release

# Create output directory and copy APK
RUN mkdir -p /app/output && \
    cp build/app/outputs/flutter-apk/app-release.apk /app/output/healthpay-wallet.apk

# Entry point - copy APK to mounted volume
CMD cp /app/output/healthpay-wallet.apk /app/output/ && \
    echo "✅ APK built successfully!" && \
    echo "📁 Output: output/healthpay-wallet.apk" && \
    ls -lh /app/output/
