# Changelog

## [3.0.0] — 2026-02-27

### Added

- **EC256 key support** — `createKeys(alias, KeyType.EC256)` for Secure Enclave (iOS) / StrongBox (Android)
- **Device integrity check** — `getDeviceIntegrity()` detects root/jailbreak with risk levels
- **Biometric event listener** — `onBiometricChange(callback)` for real-time biometric changes
- **CHANGELOG.md** — Full version history
- `KeyType` enum (`EC256`, `RSA2048`)
- `DeviceIntegrityResult` type with `isCompromised`, `riskLevel`
- `RiskLevel` type (`NONE`, `LOW`, `MEDIUM`, `HIGH`)
- `CreateKeysResult` now returns `keyType`
- `createSignature` auto-detects EC vs RSA algorithm
- `deleteKeysWithTag` (iOS) now handles both EC and RSA keys
- ProGuard consumer rules for `minifyEnabled true`

### Changed

- `createKeys(alias?)` → `createKeys(alias?, keyType?)` — backward compatible
- `biometricKeysExist` checks both EC and RSA key types
- Android setup section added to README

## [2.2.0] — 2026-02-26

### Added

- **`getStatus()`** — composite method returning everything in one call (`BiometricStatus`)
- **`MIGRATION.md`** — Full migration guide from `react-native-biometrics`
- `useBiometrics()` hook now returns `biometryTypes[]` and `securityLevel`
- Quick Status Check section in README

## [2.1.0] — 2026-02-26

### Added

- **`biometryTypes[]`** — returns all available biometric types (e.g. `['Fingerprint', 'FaceID']` on Samsung)
- Biometric type priority fix on Android (Fingerprint > Face > Iris)

## [2.0.0] — 2026-02-25

### Added

- **Multi-alias key management** — separate RSA key pairs per alias (`createKeys('login')`, `createKeys('payment')`)
- **Biometric change detection** — `getBiometricStateHash()` + `isBiometricChanged()`
- **AbortSignal cancel** — `authenticate({ signal: controller.signal })`
- **Prompt subtitle** — Android-only subtitle support
- **`useBiometrics()` React Hook** — declarative biometrics interface
- **`getStatus()`** — composite status check
- **Expo Config Plugin** — auto `NSFaceIDUsageDescription`
- Typed errors with `BiometricError` enum (10 error codes)
- `SecurityLevel` enum
- `canAuthenticate()`, `isEnrolled()`, `getSecurityLevel()`
- `disableDeviceFallback` option
- New Architecture (TurboModules) support

## [1.0.0] — 2026-02-24

### Initial Release

- `getBiometryType()` — detect Face ID, Touch ID, Fingerprint, Iris
- `authenticate()` — biometric authentication with typed results
- `createKeys()` / `createSignature()` / `deleteKeys()` / `biometricKeysExist()` — RSA 2048 crypto
- iOS and Android support
- TypeScript support
