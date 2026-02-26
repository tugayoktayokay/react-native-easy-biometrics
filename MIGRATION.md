# Migrating from react-native-biometrics

This guide helps you migrate from `react-native-biometrics` (by SelfLender, unmaintained) or `@sbaiahmed1/react-native-biometrics` to `react-native-easy-biometrics`.

## Installation

```bash
# Remove old package
npm uninstall react-native-biometrics
# or
npm uninstall @sbaiahmed1/react-native-biometrics

# Install
npm install react-native-easy-biometrics
```

## API Mapping

| react-native-biometrics           | react-native-easy-biometrics                             | Notes                                         |
| --------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| `isSensorAvailable()`             | `getBiometryType()`                                      | Returns `SensorResult` with `biometryTypes[]` |
| `simplePrompt(reason)`            | `authenticate({ promptMessage })`                        | Options object instead of positional args     |
| `createKeys()`                    | `createKeys(keyAlias?)`                                  | Optional alias for multi-key support          |
| `createSignature(title, payload)` | `createSignature({ promptMessage, payload, keyAlias? })` | Options object                                |
| `deleteKeys()`                    | `deleteKeys(keyAlias?)`                                  | Optional alias                                |
| `biometricKeysExist()`            | `biometricKeysExist(keyAlias?)`                          | Optional alias                                |
| ❌ Not available                  | `getStatus()`                                            | Everything in one call                        |
| ❌ Not available                  | `getSecurityLevel()`                                     | None/Secret/Weak/Strong                       |
| ❌ Not available                  | `useBiometrics()`                                        | React Hook                                    |
| ❌ Not available                  | `signal: AbortSignal`                                    | Cancel auth programmatically                  |
| ❌ Not available                  | `getBiometricStateHash()`                                | Detect biometric changes                      |
| ❌ Not available                  | `isBiometricChanged(hash)`                               | Check if biometrics changed                   |

## Code Examples

### Before (react-native-biometrics)

```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

// Check availability
const { available, biometryType } = await rnBiometrics.isSensorAvailable();

// Authenticate
const { success } = await rnBiometrics.simplePrompt({
  promptMessage: 'Confirm fingerprint',
});

// Create keys
const { publicKey } = await rnBiometrics.createKeys();

// Sign
const { signature } = await rnBiometrics.createSignature({
  promptMessage: 'Sign transaction',
  payload: 'data-to-sign',
});
```

### After (react-native-easy-biometrics)

```typescript
import RNBiometrics from 'react-native-easy-biometrics';

// Check everything at once
const status = await RNBiometrics.getStatus();
// status.available, status.biometryType, status.biometryTypes,
// status.enrolled, status.securityLevel

// Authenticate (with more options)
const result = await RNBiometrics.authenticate({
  promptMessage: 'Confirm fingerprint',
  // Optional: promptTitle, promptSubtitle, cancelButtonText,
  //           fallbackLabel, disableDeviceFallback, signal
});

if (result.success) {
  console.log('Authenticated!');
} else {
  console.log(result.error, result.message); // Typed errors!
}

// Create keys with alias
const { publicKey } = await RNBiometrics.createKeys('login');

// Sign with alias
const { signature } = await RNBiometrics.createSignature({
  promptMessage: 'Sign transaction',
  payload: 'data-to-sign',
  keyAlias: 'login',
});
```

### Using the React Hook (new!)

```tsx
import { useBiometrics } from 'react-native-easy-biometrics';

function LoginScreen() {
  const {
    available,
    biometryType,
    biometryTypes,
    isEnrolled,
    securityLevel,
    authenticate,
    isAuthenticating,
    cancel,
    loading,
  } = useBiometrics();

  if (loading) return <ActivityIndicator />;
  if (!available) return <Text>Biometrics not available</Text>;

  const handleLogin = async () => {
    const result = await authenticate({
      promptMessage: 'Verify your identity',
    });
    if (result.success) {
      // Navigate to home
    }
  };

  return (
    <Button
      title={`Login with ${biometryType}`}
      onPress={handleLogin}
      disabled={isAuthenticating}
    />
  );
}
```

## Key Differences

1. **No class instantiation** — All methods are static, no `new ReactNativeBiometrics()` needed
2. **Typed errors** — `BiometricError` enum with 10 error types instead of generic errors
3. **Options objects** — Named parameters for clarity
4. **AbortSignal** — Cancel authentication programmatically
5. **Multi-key aliases** — Manage separate keys for login, payments, etc.
6. **React Hook** — `useBiometrics()` for declarative usage
7. **Expo support** — Config plugin for `NSFaceIDUsageDescription`

## Expo Setup

If you're using Expo, add the config plugin to `app.json`:

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
