@echo off
echo =========================================================
echo VETRI INDANE WORKER MOBILE APP - ANDROID APK BUILD SCRIPT
echo Developed by RDK Technologies
echo =========================================================
echo.

where flutter >nul 2>&1
if %errorlevel% neq 0 (
    echo NOTE: Flutter SDK is not detected in your system PATH.
    echo.
    echo ---------------------------------------------------------
    echo EASY WAY TO INSTALL ON ANY ANDROID PHONE RIGHT NOW:
    echo ---------------------------------------------------------
    echo 1. Connect your Android phone to the same Wi-Fi / Network.
    echo 2. Open Chrome on your Android phone and go to:
    echo    http://localhost:5173  (or your PC's IP address)
    echo 3. Tap the Chrome menu (3 dots) and select "Add to Home Screen".
    echo 4. The Vetri Indane Worker App will be installed directly
    echo    onto your Android phone home screen as a native mobile app!
    echo.
    echo ---------------------------------------------------------
    echo TO BUILD NATIVE .APK BINARY WITH FLUTTER:
    echo ---------------------------------------------------------
    echo 1. Download Flutter SDK from: https://flutter.dev
    echo 2. Add Flutter to your environment PATH.
    echo 3. Re-run this build_apk.bat script.
    echo ---------------------------------------------------------
    exit /b 0
)

echo Building Flutter Android Release APK...
call flutter build apk --release --split-per-abi

echo.
echo =========================================================
echo SUCCESS: Android APK compiled!
echo Location: flutter_app\build\app\outputs\flutter-apk\
echo =========================================================
