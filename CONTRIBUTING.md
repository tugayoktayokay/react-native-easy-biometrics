# Contributing to React Native Easy Biometrics

Thank you for your interest in contributing! 🎉

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/react-native-easy-biometrics.git
   cd react-native-easy-biometrics
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Build** the library:
   ```bash
   npx react-native-builder-bob build
   ```

## Development

### Project Structure

```
├── src/index.tsx          # TypeScript API (types, functions, hooks)
├── android/               # Android native module (Java)
├── ios/                   # iOS native module (Obj-C++)
├── example/               # Example React Native app
├── lib/                   # Built output (do not edit)
└── plugin/                # Expo Config Plugin
```

### Making Changes

1. **TypeScript changes** → Edit `src/index.tsx`
2. **Android changes** → Edit `android/src/main/java/.../EasyBiometricsModule.java`
3. **iOS changes** → Edit `ios/EasyBiometrics.mm`
4. **Always rebuild** after changes:
   ```bash
   npx react-native-builder-bob build
   ```

### Testing

- Test on **real devices** whenever possible (biometric APIs are not available on emulators/simulators)
- Test both **iOS** and **Android** platforms
- Test with both **Old Architecture** and **New Architecture** enabled

## Pull Request Guidelines

1. **One feature/fix per PR** — keep changes focused
2. **Update types** — add/update TypeScript types if changing the API
3. **Update README** — document new features
4. **Update CHANGELOG** — add entry under `## [Unreleased]`
5. **Test on both platforms** — mention in PR description which devices you tested on

### Commit Messages

Use conventional commits:

```
feat: add encrypted storage API
fix: handle null keyAlias on Android
docs: update API reference table
chore: bump version to 3.1.0
```

## Code Style

- **Java**: Follow Android conventions (4-space indent)
- **Objective-C++**: Follow Apple conventions (2-space indent)
- **TypeScript**: Use Prettier defaults

## Reporting Issues

When reporting a bug, please include:

- Device model and OS version
- React Native version
- Output of `getDiagnosticInfo()`
- Steps to reproduce
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
