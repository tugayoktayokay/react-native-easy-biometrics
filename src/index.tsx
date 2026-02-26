import { NativeModules } from 'react-native';
import { useState, useEffect, useCallback } from 'react';

const { EasyBiometrics: RNBiometricsNative } = NativeModules;

// ─── Enums & Types ───────────────────────────────────────────────

/**
 * Types of biometric authentication available on the device.
 */
export enum BiometryType {
  FACE_ID = 'FaceID',
  TOUCH_ID = 'TouchID',
  FINGERPRINT = 'Fingerprint',
  IRIS = 'Iris',
  NONE = 'None',
}

/**
 * Error codes returned when biometric authentication fails.
 */
export enum BiometricError {
  /** User cancelled the authentication prompt */
  USER_CANCEL = 'user_cancel',
  /** Too many failed attempts, device is locked out */
  LOCKOUT = 'lockout',
  /** No biometric data is enrolled on the device */
  NOT_ENROLLED = 'not_enrolled',
  /** Biometric hardware is not available */
  NOT_AVAILABLE = 'not_available',
  /** System cancelled (e.g. another app came to foreground) */
  SYSTEM_CANCEL = 'system_cancel',
  /** Device passcode is not set */
  PASSCODE_NOT_SET = 'passcode_not_set',
  /** Authentication failed (biometric didn't match) */
  AUTHENTICATION_FAILED = 'authentication_failed',
  /** App cancelled the authentication */
  APP_CANCEL = 'app_cancel',
  /** Permanent lockout, device credential is required */
  LOCKOUT_PERMANENT = 'lockout_permanent',
  /** Unknown error */
  UNKNOWN = 'unknown',
}

/**
 * Security level of the biometric authentication.
 */
export enum SecurityLevel {
  /** No enrolled authentication */
  NONE = 0,
  /** Non-biometric authentication (PIN, Pattern, Password) */
  SECRET = 1,
  /** Weak biometric (e.g. 2D camera-based face unlock) */
  BIOMETRIC_WEAK = 2,
  /** Strong biometric (e.g. fingerprint, 3D face scan) */
  BIOMETRIC_STRONG = 3,
}

/**
 * Result of a biometric authentication attempt.
 */
export type AuthResult =
  | { success: true }
  | { success: false; error: BiometricError; message: string };

/**
 * Options for biometric authentication.
 * Only `promptMessage` is required — everything else has sensible defaults.
 */
export interface AuthOptions {
  /** Message/description displayed on the biometric prompt (required) */
  promptMessage: string;
  /** Title displayed on the biometric prompt. Defaults to 'Authentication' */
  promptTitle?: string;
  /** Subtitle displayed below the title (Android only) */
  promptSubtitle?: string;
  /** Custom text for the cancel button (Android only). Defaults to 'Cancel' */
  cancelButtonText?: string;
  /** Custom text for the fallback button, e.g. "Use Passcode" (iOS only). Set to empty string to hide. */
  fallbackLabel?: string;
  /** If true, only biometrics will be allowed (no device credential fallback). Defaults to false. */
  disableDeviceFallback?: boolean;
  /** Optional AbortSignal to programmatically cancel the prompt */
  signal?: AbortSignal;
}

/**
 * Result of sensor availability check.
 */
export interface SensorResult {
  /** Whether biometric authentication is available */
  available: boolean;
  /** The primary biometric sensor type (strongest available) */
  biometryType: BiometryType;
  /** All supported biometric types on the device (e.g. ['Fingerprint', 'FaceID'] on Samsung) */
  biometryTypes: BiometryType[];
  /** Error message if biometrics are not available */
  error?: string;
}

/**
 * Complete biometric status — everything in one call.
 * Combines getBiometryType(), isEnrolled(), and getSecurityLevel().
 */
export interface BiometricStatus {
  /** Whether biometric authentication is available */
  available: boolean;
  /** The primary biometric sensor type (strongest available) */
  biometryType: BiometryType;
  /** All supported biometric types on the device */
  biometryTypes: BiometryType[];
  /** Whether biometric data is enrolled */
  enrolled: boolean;
  /** Device security level */
  securityLevel: SecurityLevel;
  /** Error message if biometrics are not available */
  error?: string;
}

/**
 * Result of key creation.
 */
export interface CreateKeysResult {
  /** Base64-encoded public key */
  publicKey: string;
}

/**
 * Result of signature creation.
 */
export interface CreateSignatureResult {
  /** Whether the signature was successfully created */
  success: boolean;
  /** Base64-encoded signature (undefined if not successful) */
  signature?: string;
  /** Error message if signature creation failed */
  error?: string;
}

// ─── Core API ────────────────────────────────────────────────────

/**
 * Check if biometric authentication hardware is available.
 */
const canAuthenticate = (): Promise<boolean> => {
  return RNBiometricsNative.canAuthenticate();
};

/**
 * Detect what type of biometric sensor is available on the device.
 * Returns the biometry type (FaceID, TouchID, Fingerprint, Iris, or None).
 */
const getBiometryType = async (): Promise<SensorResult> => {
  try {
    const result = await RNBiometricsNative.getBiometryType();
    return {
      available: result.available,
      biometryType: result.biometryType as BiometryType,
      biometryTypes: (result.biometryTypes || []) as BiometryType[],
      error: result.error,
    };
  } catch (e: any) {
    return {
      available: false,
      biometryType: BiometryType.NONE,
      biometryTypes: [],
      error: e.message,
    };
  }
};

/**
 * Check if the user has enrolled biometric data (fingerprint, face, etc.).
 * Returns false if hardware is available but no biometrics are enrolled.
 */
const isEnrolled = (): Promise<boolean> => {
  return RNBiometricsNative.isEnrolled();
};

/**
 * Get the security level of the device's enrolled authentication.
 */
const getSecurityLevel = async (): Promise<SecurityLevel> => {
  const level = await RNBiometricsNative.getSecurityLevel();
  return level as SecurityLevel;
};

/**
 * Get the complete biometric status in a single call.
 * Combines getBiometryType(), isEnrolled(), and getSecurityLevel().
 *
 * @example
 * ```ts
 * const status = await getStatus();
 * if (status.available && status.enrolled) {
 *   console.log(`Ready: ${status.biometryType} (${status.securityLevel})`);
 * }
 * ```
 */
const getStatus = async (): Promise<BiometricStatus> => {
  try {
    const [sensor, enrolled, securityLevel] = await Promise.all([
      getBiometryType(),
      isEnrolled(),
      getSecurityLevel(),
    ]);
    return {
      available: sensor.available,
      biometryType: sensor.biometryType,
      biometryTypes: sensor.biometryTypes,
      enrolled,
      securityLevel,
      error: sensor.error,
    };
  } catch (e: any) {
    return {
      available: false,
      biometryType: BiometryType.NONE,
      biometryTypes: [],
      enrolled: false,
      securityLevel: SecurityLevel.NONE,
      error: e.message,
    };
  }
};

/**
 * Request biometric authentication.
 * Only `promptMessage` is required — everything else has sensible defaults.
 *
 * @example
 * ```ts
 * // Simplest usage:
 * const result = await authenticate({ promptMessage: 'Verify your identity' });
 *
 * // With all options:
 * const result = await authenticate({
 *   promptMessage: 'Confirm payment',
 *   promptTitle: 'Payment',
 *   cancelButtonText: 'Cancel',
 *   disableDeviceFallback: true,
 * });
 * ```
 */
const authenticate = async (options: AuthOptions): Promise<AuthResult> => {
  const {
    promptTitle = 'Authentication',
    promptMessage,
    promptSubtitle = '',
    cancelButtonText = 'Cancel',
    fallbackLabel,
    disableDeviceFallback = false,
    signal,
  } = options;

  if (typeof promptMessage !== 'string' || !promptMessage) {
    throw new Error('promptMessage must be a non-empty string');
  }

  signal?.addEventListener('abort', () =>
    RNBiometricsNative.cancelBioAuthRequest()
  );

  try {
    await RNBiometricsNative.authenticate(
      promptTitle,
      promptMessage,
      promptSubtitle,
      cancelButtonText,
      fallbackLabel ?? '',
      disableDeviceFallback
    );
    return { success: true };
  } catch (e: any) {
    const errorCode = e.code || BiometricError.UNKNOWN;
    return {
      success: false,
      error: errorCode as BiometricError,
      message: e.message || 'Authentication failed',
    };
  }
};

// ─── Crypto Key Management ──────────────────────────────────────

/**
 * Generate a new RSA 2048 key pair protected by biometric authentication.
 * The private key is stored securely in the device's Keychain (iOS) or Keystore (Android).
 * Returns the public key as a base64-encoded string.
 *
 * @param keyAlias - Optional alias for the key pair. Defaults to 'default'. Use different aliases to manage multiple key pairs.
 */
const createKeys = async (
  keyAlias: string = 'default'
): Promise<CreateKeysResult> => {
  const publicKey = await RNBiometricsNative.createKeys(keyAlias);
  return { publicKey };
};

/**
 * Create a RSA PKCS#1v1.5 SHA-256 signature using the biometric-protected private key.
 * The user will be prompted for biometric authentication before signing.
 */
const createSignature = async (options: {
  /** Data/payload to sign */
  payload: string;
  /** Message displayed in the biometric prompt */
  promptMessage: string;
  /** Key alias to use for signing. Defaults to 'default'. */
  keyAlias?: string;
}): Promise<CreateSignatureResult> => {
  try {
    const signature = await RNBiometricsNative.createSignature(
      options.payload,
      options.promptMessage,
      options.keyAlias || 'default'
    );
    return { success: true, signature };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/**
 * Check if biometric-protected cryptographic keys exist on the device.
 *
 * @param keyAlias - Optional alias. Defaults to 'default'.
 */
const biometricKeysExist = async (
  keyAlias: string = 'default'
): Promise<boolean> => {
  return RNBiometricsNative.biometricKeysExist(keyAlias);
};

/**
 * Delete the biometric-protected cryptographic keys from the device.
 *
 * @param keyAlias - Optional alias. Defaults to 'default'.
 */
const deleteKeys = async (keyAlias: string = 'default'): Promise<boolean> => {
  return RNBiometricsNative.deleteKeys(keyAlias);
};

// ─── Biometric Change Detection ─────────────────────────────────

/**
 * Get a hash representing the current biometric enrollment state.
 * Save this hash and compare later using `isBiometricChanged()` to detect
 * if biometrics have been added or removed since last check.
 *
 * Returns null if biometrics are not available.
 */
const getBiometricStateHash = async (): Promise<string | null> => {
  try {
    return await RNBiometricsNative.getBiometricStateHash();
  } catch {
    return null;
  }
};

/**
 * Check if the biometric enrollment has changed since the given state hash.
 * Returns true if biometrics were added or removed.
 *
 * @param savedHash - A hash previously obtained from `getBiometricStateHash()`.
 */
const isBiometricChanged = async (savedHash: string): Promise<boolean> => {
  try {
    const currentHash = await RNBiometricsNative.getBiometricStateHash();
    if (!currentHash || !savedHash) return true;
    return currentHash !== savedHash;
  } catch {
    return true;
  }
};

// ─── React Hook ─────────────────────────────────────────────────

/**
 * React Hook that provides a complete biometrics interface.
 *
 * @example
 * ```tsx
 * const { available, biometryType, authenticate, isAuthenticating } = useBiometrics();
 *
 * if (available) {
 *   const result = await authenticate({ promptMessage: 'Verify your identity' });
 * }
 * ```
 */
export const useBiometrics = () => {
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>(
    BiometryType.NONE
  );
  const [biometryTypes, setBiometryTypes] = useState<BiometryType[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(
    SecurityLevel.NONE
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const status = await getStatus();
        if (mounted) {
          setAvailable(status.available);
          setBiometryType(status.biometryType);
          setBiometryTypes(status.biometryTypes);
          setEnrolled(status.enrolled);
          setSecurityLevel(status.securityLevel);
        }
      } catch {
        // Silently handle — available stays false
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const wrappedAuthenticate = useCallback(
    async (options: AuthOptions): Promise<AuthResult> => {
      setIsAuthenticating(true);
      try {
        return await authenticate(options);
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    RNBiometricsNative.cancelBioAuthRequest();
  }, []);

  return {
    /** Whether biometric hardware is available */
    available,
    /** Primary biometric sensor type (FaceID, TouchID, Fingerprint, etc.) */
    biometryType,
    /** All supported biometric types on the device */
    biometryTypes,
    /** Whether biometric data is enrolled */
    isEnrolled: enrolled,
    /** Device security level */
    securityLevel,
    /** Whether authentication is currently in progress */
    isAuthenticating,
    /** Whether the hook is still loading initial state */
    loading,
    /** Authenticate with biometrics */
    authenticate: wrappedAuthenticate,
    /** Cancel an in-progress authentication */
    cancel,
  };
};

// ─── Default Export ─────────────────────────────────────────────

const RNBiometrics = {
  canAuthenticate,
  getBiometryType,
  isEnrolled,
  getSecurityLevel,
  getStatus,
  authenticate,
  // Crypto
  createKeys,
  createSignature,
  biometricKeysExist,
  deleteKeys,
  // Biometric change detection
  getBiometricStateHash,
  isBiometricChanged,
};

export default RNBiometrics;
