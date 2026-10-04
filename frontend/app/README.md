# MedicalApp Mobile

Flutter client for the MedicalApp user and pharmacy-owner workflows. Admin pages are intentionally not included.

## Run

From the workspace root, enter `frontend/app` before running Flutter commands:

```powershell
cd frontend/app
```

Start the backend on port 5000, then run the Android emulator with:

```powershell
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

For a physical Android device, use the development computer's LAN address instead of `10.0.2.2` and allow port 5000 through the firewall:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:5000
```

For iOS Simulator, use `http://localhost:5000` with `--dart-define=API_BASE_URL=http://localhost:5000`. iOS builds require macOS and Xcode.

For Chrome on the same development computer, enable the Flutter web platform if it is not present, then run:

```powershell
flutter create --platforms=web .
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:5000
```

## Verify / Build

```powershell
flutter analyze
flutter test
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

The debug APK is written to `build/app/outputs/flutter-apk/app-debug.apk`.
