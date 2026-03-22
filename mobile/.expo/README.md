# Expo Configuration

This directory contains Expo configuration files and build artifacts.

## Expo SDK 53 Compatibility

This project is configured to work with Expo SDK 53 and the latest Expo Go app. Make sure you have the latest version installed on your device.

### Installation Instructions

1. **Install the latest Expo Go on your device:**
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Scan the QR code with Expo Go**

### Compatibility Notes

- SDK Version: 53.0.0
- React Native: 0.76.1
- Node.js: 18+ required
- Expo CLI: Latest version recommended

### Troubleshooting

If you encounter compatibility issues:
1. Clear Expo cache: `expo start -c`
2. Reset Metro bundler: `npx react-native start --reset-cache`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
