# React Native Easy Biometrics

<p align="center">
  <strong>The most complete biometric authentication library for React Native</strong>
</p>

<p align="center">
  Face ID · Touch ID · Fingerprint · Iris · Crypto Keys · Multi-Alias · Change Detection · React Hook · Expo Plugin
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-easy-biometrics"><img src="https://img.shields.io/npm/v/react-native-easy-biometrics.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-native-easy-biometrics"><img src="https://img.shields.io/npm/dm/react-native-easy-biometrics.svg" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-brightgreen.svg" alt="platforms" />
  <img src="https://img.shields.io/badge/New%20Architecture-ready-blue.svg" alt="new architecture" />
  <img src="https://img.shields.io/badge/Expo-compatible-blueviolet.svg" alt="expo compatible" />
</p>

---

## ✨ Features

| Feature                                                   | iOS | Android |
| --------------------------------------------------------- | :-: | :-----: |
| Biometry type detection (FaceID/TouchID/Fingerprint/Iris) | ✅  |   ✅    |
| Enrollment check                                          | ✅  |   ✅    |
| Biometric authentication with options                     | ✅  |   ✅    |
| Prompt subtitle                                           |  —  |   ✅    |
| Typed error codes (10 error types)                        | ✅  |   ✅    |
| Cancel via `AbortSignal`                                  | ✅  |   ✅    |
| Security level detection (None/Secret/Weak/Strong)        | ✅  |   ✅    |
| RSA 2048 key pair generation                              | ✅  |   ✅    |
| Multiple key aliases                                      | ✅  |   ✅    |
| Biometric-protected payload signing                       | ✅  |   ✅    |
| Biometric change detection                                | ✅  |   ✅    |
| Device credential fallback control                        | ✅  |   ✅    |
| `useBiometrics()` React Hook                              | ✅  |   ✅    |
| Expo Config Plugin                                        | ✅  |   ✅    |
| New Architecture (TurboModules)                           | ✅  |   ✅    |

## 📦 Installation

```bash
npm install react-native-easy-biometrics
# or
yarn add react-native-easy-biometrics
```

### iOS

```bash
cd ios && pod install
```

Add this to your `Info.plist` (or use the Expo plugin to do it automatically):

```xml
<key>NSFaceIDUsageDescription</key>
<string>Allow the app to use Face ID for authentication</string>
```

### Expo

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-easy-biometrics",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID for secure login"
        }
      ]
    ]
  }
}
```

Then run:

```bash
npx expo prebuild
```

## 🚀 Quick Start

### Using the React Hook (recommended)

```tsx
import { useBiometrics, BiometryType } from 'react-native-easy-biometrics';

function LoginScreen() {
  const { available, biometryType, authenticate, isAuthenticating } =
    useBiometrics();

  const handleLogin = async () => {
    const result = await authenticate({
      promptMessage: 'Verify your identity to continue',
    });

    if (result.success) {
      // Navigate to home
    } else {
      console.log('Auth failed:', result.error, result.message);
    }
  };

  if (!available) return <Text>Biometrics not available</Text>;

  return (
    <Button
      title={`Login with ${biometryType}`}
      onPress={handleLogin}
      disabled={isAuthenticating}
    />
  );
}
```

### Using the API directly

```typescript
import RNBiometrics, {
  BiometryType,
  BiometricError,
} from 'react-native-easy-biometrics';

// 1. Check what's available
const sensor = await RNBiometrics.getBiometryType();
console.log(sensor.biometryType); // 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris' | 'None'
console.log(sensor.biometryTypes); // e.g. ['Fingerprint', 'FaceID'] on Samsung

// 2. Check if enrolled
const enrolled = await RNBiometrics.isEnrolled();

// 3. Authenticate — only promptMessage is required!
const result = await RNBiometrics.authenticate({
  promptMessage: 'Verify your identity to continue',
});

// Or with all options:
const result2 = await RNBiometrics.authenticate({
  promptMessage: 'Verify your identity to continue',
  promptTitle: 'Confirm Payment', // default: 'Authentication'
  promptSubtitle: '$99.99 — Apple Store', // Android only, ignored on iOS
  cancelButtonText: 'Use Password', // Android only, default: 'Cancel'
  fallbackLabel: 'Enter Passcode', // iOS only
  disableDeviceFallback: false, // default: false
});

if (result.success) {
  console.log('Authenticated!');
} else {
  switch (result.error) {
    case BiometricError.USER_CANCEL:
      console.log('User cancelled');
      break;
    case BiometricError.LOCKOUT:
      console.log('Too many attempts');
      break;
    case BiometricError.NOT_ENROLLED:
      console.log('No biometrics enrolled');
      break;
  }
}
```

### Cancelling authentication

```typescript
const controller = new AbortController();

// Start auth
RNBiometrics.authenticate({
  promptMessage: 'Verify identity',
  signal: controller.signal,
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);
```

## 🔐 Crypto Key Management

Generate RSA 2048 key pairs protected by biometric authentication. Perfect for banking apps, secure login, and payload signing.

```typescript
import RNBiometrics from 'react-native-easy-biometrics';

// Generate a key pair (private key stored in Keychain/Keystore)
const { publicKey } = await RNBiometrics.createKeys();
console.log('Public key:', publicKey); // Send to your server

// Sign a payload (user will be prompted for biometrics)
const result = await RNBiometrics.createSignature({
  payload: 'transaction-id-12345',
  promptMessage: 'Sign this transaction',
});

if (result.success) {
  // Send result.signature to your server for verification
  await verifyOnServer(result.signature, publicKey);
}

// Check if keys exist
const exists = await RNBiometrics.biometricKeysExist();

// Delete keys
await RNBiometrics.deleteKeys();
```

### Multiple Key Aliases

Use different key pairs for different purposes (e.g. login vs payments):

```typescript
// Create separate key pairs for different use cases
const loginKey = await RNBiometrics.createKeys('login');
const paymentKey = await RNBiometrics.createKeys('payment');

// Sign with a specific key
const result = await RNBiometrics.createSignature({
  payload: 'payment:99.99:USD',
  promptMessage: 'Confirm payment',
  keyAlias: 'payment',
});

// Check/delete specific keys
await RNBiometrics.biometricKeysExist('payment'); // true
await RNBiometrics.deleteKeys('payment');
await RNBiometrics.biometricKeysExist('payment'); // false
await RNBiometrics.biometricKeysExist('login'); // still true
```

> **Note:** If you don't pass a `keyAlias`, all crypto methods default to `'default'`.

## � Biometric Change Detection

Detect if biometrics have been added or removed since the last check. Useful for re-prompting authentication after a security change.

```typescript
import RNBiometrics from 'react-native-easy-biometrics';

// 1. Get and save the current biometric state hash
const hash = await RNBiometrics.getBiometricStateHash();
// Save hash to AsyncStorage or your backend

// 2. Later, check if biometrics have changed
const changed = await RNBiometrics.isBiometricChanged(savedHash);
if (changed) {
  // A fingerprint/face was added or removed!
  // Re-authenticate the user or invalidate tokens
}
```

| Platform    | How it works                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| **iOS**     | Uses `evaluatedPolicyDomainState` — a system-provided hash that changes when biometric enrollment changes                  |
| **Android** | Keys created with `setInvalidatedByBiometricEnrollment(true)` — the key becomes permanently invalid when biometrics change |

## �🔒 Security Level

Detect the security level to implement tiered access:

```typescript
import RNBiometrics, { SecurityLevel } from 'react-native-easy-biometrics';

const level = await RNBiometrics.getSecurityLevel();

switch (level) {
  case SecurityLevel.BIOMETRIC_STRONG:
    // Allow high-value operations (e.g. $10,000 transfers)
    break;
  case SecurityLevel.BIOMETRIC_WEAK:
    // Allow medium-value operations (e.g. $100 transfers)
    break;
  case SecurityLevel.SECRET:
    // Only PIN/passcode available
    break;
  case SecurityLevel.NONE:
    // No security enrolled
    break;
}
```

## 📖 API Reference

### Methods

| Method                          | Returns                          | Description                                  |
| ------------------------------- | -------------------------------- | -------------------------------------------- |
| `canAuthenticate()`             | `Promise<boolean>`               | Check if biometric auth is available         |
| `getBiometryType()`             | `Promise<SensorResult>`          | Detect biometric sensor type(s)              |
| `isEnrolled()`                  | `Promise<boolean>`               | Check if biometrics are enrolled             |
| `getSecurityLevel()`            | `Promise<SecurityLevel>`         | Get device security level                    |
| `authenticate(options)`         | `Promise<AuthResult>`            | Authenticate with typed results              |
| `createKeys(keyAlias?)`         | `Promise<CreateKeysResult>`      | Generate RSA 2048 key pair                   |
| `createSignature(options)`      | `Promise<CreateSignatureResult>` | Sign payload with biometric key              |
| `biometricKeysExist(keyAlias?)` | `Promise<boolean>`               | Check if keys exist for alias                |
| `deleteKeys(keyAlias?)`         | `Promise<boolean>`               | Delete stored keys for alias                 |
| `getBiometricStateHash()`       | `Promise<string \| null>`        | Get current biometric enrollment hash        |
| `isBiometricChanged(savedHash)` | `Promise<boolean>`               | Check if biometrics changed since saved hash |

### AuthOptions

| Option                  | Type          | Required | Platform | Description                                       |
| ----------------------- | ------------- | -------- | -------- | ------------------------------------------------- |
| `promptMessage`         | `string`      | ✅       | Both     | Message displayed on the prompt                   |
| `promptTitle`           | `string`      | —        | Both     | Title of the prompt. Default: `'Authentication'`  |
| `promptSubtitle`        | `string`      | —        | Android  | Subtitle below the title. Ignored on iOS.         |
| `cancelButtonText`      | `string`      | —        | Android  | Cancel button text. Default: `'Cancel'`           |
| `fallbackLabel`         | `string`      | —        | iOS      | Fallback button text (e.g. "Enter Passcode")      |
| `disableDeviceFallback` | `boolean`     | —        | Both     | Biometric only, no PIN fallback. Default: `false` |
| `signal`                | `AbortSignal` | —        | Both     | Cancel the prompt programmatically                |

### Hook

| Property           | Type                               | Description                  |
| ------------------ | ---------------------------------- | ---------------------------- |
| `available`        | `boolean`                          | Biometric hardware available |
| `biometryType`     | `BiometryType`                     | Type of biometric sensor     |
| `isEnrolled`       | `boolean`                          | Biometric data enrolled      |
| `isAuthenticating` | `boolean`                          | Auth in progress             |
| `loading`          | `boolean`                          | Initial state loading        |
| `authenticate`     | `(options) => Promise<AuthResult>` | Authenticate function        |
| `cancel`           | `() => void`                       | Cancel authentication        |

### Enums

**`BiometryType`**: `FaceID` | `TouchID` | `Fingerprint` | `Iris` | `None`

**`BiometricError`**: `user_cancel` | `lockout` | `not_enrolled` | `not_available` | `system_cancel` | `passcode_not_set` | `authentication_failed` | `app_cancel` | `lockout_permanent` | `unknown`

**`SecurityLevel`**: `NONE (0)` | `SECRET (1)` | `BIOMETRIC_WEAK (2)` | `BIOMETRIC_STRONG (3)`

## License

MIT
