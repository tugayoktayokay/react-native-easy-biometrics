package com.reactnativeeasybiometrics;

import android.app.Activity;
import android.os.Build;
import android.content.pm.PackageManager;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import androidx.annotation.NonNull;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.RSAKeyGenParameterSpec;
import java.security.spec.ECGenParameterSpec;
import java.util.Enumeration;
import java.util.concurrent.Executor;
import android.util.Base64;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.module.annotations.ReactModule;

import androidx.biometric.BiometricPrompt;
import androidx.biometric.BiometricManager;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;


@ReactModule(name = EasyBiometricsModule.NAME)
public class EasyBiometricsModule extends ReactContextBaseJavaModule {
    public static final String NAME = "EasyBiometrics";
    private static final String KEY_ALIAS_PREFIX = "com.easybiometrics.keys.";
    private BiometricPrompt currentPrompt;

    static final int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG
        | BiometricManager.Authenticators.BIOMETRIC_WEAK
        | BiometricManager.Authenticators.DEVICE_CREDENTIAL;

    public EasyBiometricsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    private String getKeyAlias(String alias) {
        return KEY_ALIAS_PREFIX + (alias != null ? alias : "default");
    }

    // ─── canAuthenticate ───────────────────────────────────────

    @ReactMethod
    public void canAuthenticate(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            BiometricManager biometricManager = BiometricManager.from(context);

            int res = biometricManager.canAuthenticate(authenticators);
            boolean can = res == BiometricManager.BIOMETRIC_SUCCESS;

            promise.resolve(can);
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    // ─── getBiometryType ───────────────────────────────────────

    @ReactMethod
    public void getBiometryType(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            BiometricManager biometricManager = BiometricManager.from(context);
            PackageManager pm = context.getPackageManager();

            WritableMap result = Arguments.createMap();

            int canAuth = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG |
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            );

            boolean available = (canAuth == BiometricManager.BIOMETRIC_SUCCESS);
            result.putBoolean("available", available);

            // Detect all available biometric types
            WritableArray biometryTypes = Arguments.createArray();
            String biometryType = "None";

            if (pm.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)) {
                biometryTypes.pushString("Fingerprint");
                if (biometryType.equals("None")) biometryType = "Fingerprint";
            }
            if (pm.hasSystemFeature(PackageManager.FEATURE_FACE)) {
                biometryTypes.pushString("FaceID");
                if (biometryType.equals("None")) biometryType = "FaceID";
            }
            if (pm.hasSystemFeature(PackageManager.FEATURE_IRIS)) {
                biometryTypes.pushString("Iris");
                if (biometryType.equals("None")) biometryType = "Iris";
            }
            if (biometryTypes.size() == 0 && available) {
                biometryType = "Fingerprint";
                biometryTypes.pushString("Fingerprint");
            }

            result.putString("biometryType", biometryType);
            result.putArray("biometryTypes", biometryTypes);

            if (!available) {
                switch (canAuth) {
                    case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                        result.putString("error", "No biometric hardware available");
                        break;
                    case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                        result.putString("error", "No biometrics enrolled");
                        break;
                    case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                        result.putString("error", "Biometric hardware unavailable");
                        break;
                    default:
                        result.putString("error", "Biometrics not available");
                        break;
                }
            }

            promise.resolve(result);
        } catch (Exception e) {
            WritableMap result = Arguments.createMap();
            result.putBoolean("available", false);
            result.putString("biometryType", "None");
            result.putString("error", e.getMessage());
            promise.resolve(result);
        }
    }

    // ─── isEnrolled ────────────────────────────────────────────

    @ReactMethod
    public void isEnrolled(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            BiometricManager biometricManager = BiometricManager.from(context);

            int canAuth = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG |
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            );

            promise.resolve(canAuth == BiometricManager.BIOMETRIC_SUCCESS);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    // ─── getSecurityLevel ──────────────────────────────────────

    @ReactMethod
    public void getSecurityLevel(Promise promise) {
        try {
            ReactApplicationContext context = getReactApplicationContext();
            BiometricManager biometricManager = BiometricManager.from(context);

            int canAuthStrong = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG
            );
            if (canAuthStrong == BiometricManager.BIOMETRIC_SUCCESS) {
                promise.resolve(3);
                return;
            }

            int canAuthWeak = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            );
            if (canAuthWeak == BiometricManager.BIOMETRIC_SUCCESS) {
                promise.resolve(2);
                return;
            }

            int canAuthDevice = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
            );
            if (canAuthDevice == BiometricManager.BIOMETRIC_SUCCESS) {
                promise.resolve(1);
                return;
            }

            promise.resolve(0);
        } catch (Exception e) {
            promise.resolve(0);
        }
    }

    // ─── getBiometricStateHash ─────────────────────────────────

    @ReactMethod
    public void getBiometricStateHash(Promise promise) {
        try {
            // On Android, we hash the enrolled biometric key aliases to detect changes.
            // A more robust approach: we generate a fingerprint from the KeyStore state.
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            // Build a hash from all biometric keystore aliases
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            Enumeration<String> aliases = keyStore.aliases();
            StringBuilder sb = new StringBuilder();
            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                if (alias.startsWith(KEY_ALIAS_PREFIX)) {
                    sb.append(alias);
                    sb.append(":");
                    sb.append(keyStore.getCreationDate(alias).getTime());
                    sb.append(";");
                }
            }

            // Also hash the biometric manager state
            ReactApplicationContext context = getReactApplicationContext();
            BiometricManager biometricManager = BiometricManager.from(context);
            int strongAuth = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG
            );
            int weakAuth = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_WEAK
            );
            sb.append("strong:").append(strongAuth).append(";");
            sb.append("weak:").append(weakAuth).append(";");
            sb.append("sdk:").append(Build.VERSION.SDK_INT).append(";");

            byte[] hash = digest.digest(sb.toString().getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            promise.resolve(hexString.toString());
        } catch (Exception e) {
            promise.resolve(null);
        }
    }

    // ─── authenticate ─────────────────────────────────────────

    @ReactMethod
    public void authenticate(final String title, final String message, final String subtitle,
                             final String cancelButtonText, final String fallbackLabel,
                             final boolean disableDeviceFallback, final Promise promise) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    ReactApplicationContext context = getReactApplicationContext();
                    Activity activity = getCurrentActivity();
                    Executor mainExecutor = ContextCompat.getMainExecutor(context);

                    final BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            super.onAuthenticationError(errorCode, errString);
                            String code = mapAndroidErrorCode(errorCode);
                            promise.reject(code, errString.toString());
                        }

                        @Override
                        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                            super.onAuthenticationSucceeded(result);
                            promise.resolve(true);
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            super.onAuthenticationFailed();
                        }
                    };

                    if (activity == null) {
                        promise.reject("not_available", "Activity is null");
                        return;
                    }

                    BiometricPrompt prompt = new BiometricPrompt((FragmentActivity) activity, mainExecutor, callback);
                    currentPrompt = prompt;

                    BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
                            .setTitle(title)
                            .setSubtitle(subtitle != null && !subtitle.isEmpty() ? subtitle : message);

                    // Set description (message body) if subtitle is provided
                    if (subtitle != null && !subtitle.isEmpty()) {
                        builder.setDescription(message);
                    }

                    if (disableDeviceFallback) {
                        builder.setAllowedAuthenticators(
                            BiometricManager.Authenticators.BIOMETRIC_STRONG |
                            BiometricManager.Authenticators.BIOMETRIC_WEAK
                        );
                        if (cancelButtonText != null && !cancelButtonText.isEmpty()) {
                            builder.setNegativeButtonText(cancelButtonText);
                        } else {
                            builder.setNegativeButtonText("Cancel");
                        }
                    } else {
                        builder.setAllowedAuthenticators(authenticators);
                    }

                    prompt.authenticate(builder.build());
                } catch (Exception e) {
                    promise.reject("unknown", e.getMessage());
                }
            }
        });
    }

    // ─── cancelBioAuthRequest ──────────────────────────────────

    @ReactMethod
    public void cancelBioAuthRequest() {
        if (currentPrompt != null) {
            currentPrompt.cancelAuthentication();
            currentPrompt = null;
        }
    }

    // ─── Crypto Key Management ─────────────────────────────────

    @ReactMethod
    public void createKeys(final String alias, final String keyType, final Promise promise) {
        try {
            String keyAlias = getKeyAlias(alias);

            // Delete existing keys for this alias first
            deleteKeysByAlias(keyAlias);

            boolean isEC = "ec256".equalsIgnoreCase(keyType);
            String algorithm = isEC ? KeyProperties.KEY_ALGORITHM_EC : KeyProperties.KEY_ALGORITHM_RSA;

            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(
                algorithm,
                "AndroidKeyStore"
            );

            KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
                keyAlias,
                KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
            )
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setUserAuthenticationRequired(true);

            if (isEC) {
                builder.setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"));
            } else {
                builder.setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
                       .setAlgorithmParameterSpec(new RSAKeyGenParameterSpec(2048, RSAKeyGenParameterSpec.F4));
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                builder.setInvalidatedByBiometricEnrollment(true);
            }

            // Try StrongBox for EC keys (hardware-backed)
            if (isEC && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                try {
                    builder.setIsStrongBoxBacked(true);
                } catch (Exception ignored) {
                    // StrongBox not available, fall back to TEE
                }
            }

            keyPairGenerator.initialize(builder.build());
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            PublicKey publicKey = keyPair.getPublic();
            String base64PublicKey = Base64.encodeToString(publicKey.getEncoded(), Base64.NO_WRAP);

            WritableMap result = Arguments.createMap();
            result.putString("publicKey", base64PublicKey);
            result.putString("keyType", isEC ? "ec256" : "rsa2048");
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("key_error", "Failed to generate key pair: " + e.getMessage());
        }
    }

    @ReactMethod
    public void createSignature(final String payload, final String promptMessage, final String alias, final Promise promise) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Activity activity = getCurrentActivity();
                    if (activity == null) {
                        promise.reject("signature_error", "Activity is null");
                        return;
                    }

                    String keyAlias = getKeyAlias(alias);

                    KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
                    keyStore.load(null);

                    PrivateKey privateKey = (PrivateKey) keyStore.getKey(keyAlias, null);
                    if (privateKey == null) {
                        promise.reject("signature_error", "Private key not found. Call createKeys() first.");
                        return;
                    }

                    // Auto-detect key algorithm
                    String keyAlgo = privateKey.getAlgorithm();
                    String sigAlgo = "EC".equals(keyAlgo) ? "SHA256withECDSA" : "SHA256withRSA";
                    final Signature signature = Signature.getInstance(sigAlgo);
                    signature.initSign(privateKey);

                    ReactApplicationContext context = getReactApplicationContext();
                    Executor mainExecutor = ContextCompat.getMainExecutor(context);

                    BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(signature);

                    BiometricPrompt biometricPrompt = new BiometricPrompt(
                        (FragmentActivity) activity,
                        mainExecutor,
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                                super.onAuthenticationError(errorCode, errString);
                                promise.reject(mapAndroidErrorCode(errorCode), errString.toString());
                            }

                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                super.onAuthenticationSucceeded(result);
                                try {
                                    BiometricPrompt.CryptoObject crypto = result.getCryptoObject();
                                    Signature sig = crypto != null ? crypto.getSignature() : null;
                                    if (sig == null) {
                                        promise.reject("signature_error", "Crypto object unavailable");
                                        return;
                                    }
                                    sig.update(payload.getBytes("UTF-8"));
                                    byte[] signed = sig.sign();
                                    String base64Signature = Base64.encodeToString(signed, Base64.NO_WRAP);
                                    promise.resolve(base64Signature);
                                } catch (Exception e) {
                                    promise.reject("signature_error", e.getMessage());
                                }
                            }
                        }
                    );

                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle("Authentication Required")
                        .setSubtitle(promptMessage)
                        .setNegativeButtonText("Cancel")
                        .build();

                    biometricPrompt.authenticate(promptInfo, cryptoObject);
                } catch (Exception e) {
                    promise.reject("signature_error", e.getMessage());
                }
            }
        });
    }

    @ReactMethod
    public void biometricKeysExist(final String alias, Promise promise) {
        try {
            String keyAlias = getKeyAlias(alias);
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            promise.resolve(keyStore.containsAlias(keyAlias));
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void deleteKeys(final String alias, Promise promise) {
        try {
            String keyAlias = getKeyAlias(alias);
            boolean deleted = deleteKeysByAlias(keyAlias);
            promise.resolve(deleted);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    // ─── Device Integrity ─────────────────────────────────────────

    @ReactMethod
    public void getDeviceIntegrity(final Promise promise) {
        try {
            WritableMap result = Arguments.createMap();

            // Root detection
            boolean isRooted = checkRooted();
            result.putBoolean("isRooted", isRooted);
            result.putBoolean("isCompromised", isRooted);

            // Secure hardware check
            boolean hasSecureHardware = false;
            try {
                KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
                keyStore.load(null);
                KeyPairGenerator kpg = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore"
                );
                KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
                    "com.easybiometrics.integrity.test",
                    KeyProperties.PURPOSE_SIGN
                )
                .setDigests(KeyProperties.DIGEST_SHA256)
                .build();
                kpg.initialize(spec);
                KeyPair testKey = kpg.generateKeyPair();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    java.security.KeyFactory factory = java.security.KeyFactory.getInstance(
                        testKey.getPrivate().getAlgorithm(), "AndroidKeyStore"
                    );
                    android.security.keystore.KeyInfo keyInfo = factory.getKeySpec(
                        testKey.getPrivate(), android.security.keystore.KeyInfo.class
                    );
                    hasSecureHardware = keyInfo.getSecurityLevel() ==
                        android.security.keystore.KeyProperties.SECURITY_LEVEL_TRUSTED_ENVIRONMENT ||
                        keyInfo.getSecurityLevel() ==
                        android.security.keystore.KeyProperties.SECURITY_LEVEL_STRONGBOX;
                } else {
                    hasSecureHardware = true; // Assume TEE on older devices
                }
                // Clean up test key
                keyStore.deleteEntry("com.easybiometrics.integrity.test");
            } catch (Exception ignored) {
                hasSecureHardware = false;
            }
            result.putBoolean("hasSecureHardware", hasSecureHardware);

            // Keyguard secure
            boolean isKeyguardSecure = false;
            try {
                android.app.KeyguardManager km = (android.app.KeyguardManager)
                    getReactApplicationContext().getSystemService(android.content.Context.KEYGUARD_SERVICE);
                if (km != null) {
                    isKeyguardSecure = km.isKeyguardSecure();
                }
            } catch (Exception ignored) {}
            result.putBoolean("isKeyguardSecure", isKeyguardSecure);

            // Risk level
            String riskLevel = "NONE";
            if (isRooted) riskLevel = "HIGH";
            else if (!isKeyguardSecure) riskLevel = "MEDIUM";
            else if (!hasSecureHardware) riskLevel = "LOW";
            result.putString("riskLevel", riskLevel);

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("integrity_error", e.getMessage());
        }
    }

    private boolean checkRooted() {
        // Check for su binary
        String[] paths = {
            "/system/app/Superuser.apk",
            "/sbin/su", "/system/bin/su", "/system/xbin/su",
            "/data/local/xbin/su", "/data/local/bin/su",
            "/system/sd/xbin/su", "/system/bin/failsafe/su",
            "/data/local/su", "/su/bin/su"
        };
        for (String path : paths) {
            if (new java.io.File(path).exists()) return true;
        }
        // Check build tags
        String buildTags = android.os.Build.TAGS;
        if (buildTags != null && buildTags.contains("test-keys")) return true;
        // Check for Magisk
        try {
            Runtime.getRuntime().exec("su");
            return true;
        } catch (Exception ignored) {}
        return false;
    }

    // ─── Encrypted Storage ────────────────────────────────────────

    private static final String SECURE_STORE_KEY_ALIAS = "com.easybiometrics.securestore";
    private static final String SECURE_STORE_PREFS = "com.easybiometrics.securestore.data";

    private javax.crypto.SecretKey getOrCreateSecureStoreKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);

        if (keyStore.containsAlias(SECURE_STORE_KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(SECURE_STORE_KEY_ALIAS, null)).getSecretKey();
        }

        javax.crypto.KeyGenerator keyGenerator = javax.crypto.KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore"
        );

        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
            SECURE_STORE_KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .setUserAuthenticationRequired(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setUserAuthenticationParameters(0,
                KeyProperties.AUTH_BIOMETRIC_STRONG | KeyProperties.AUTH_DEVICE_CREDENTIAL);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            builder.setInvalidatedByBiometricEnrollment(false);
        }

        keyGenerator.init(builder.build());
        return keyGenerator.generateKey();
    }

    @ReactMethod
    public void secureStore(final String key, final String value, final String promptMessage, final Promise promise) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Activity activity = getCurrentActivity();
                    if (activity == null) {
                        promise.reject("storage_error", "Activity is null");
                        return;
                    }

                    javax.crypto.SecretKey secretKey = getOrCreateSecureStoreKey();
                    final javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
                    cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, secretKey);

                    BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(cipher);

                    ReactApplicationContext context = getReactApplicationContext();
                    Executor mainExecutor = ContextCompat.getMainExecutor(context);

                    BiometricPrompt biometricPrompt = new BiometricPrompt(
                        (FragmentActivity) activity,
                        mainExecutor,
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                                promise.reject(mapAndroidErrorCode(errorCode), errString.toString());
                            }

                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                try {
                                    javax.crypto.Cipher authedCipher = result.getCryptoObject().getCipher();
                                    byte[] encrypted = authedCipher.doFinal(value.getBytes("UTF-8"));
                                    byte[] iv = authedCipher.getIV();

                                    // Store IV + encrypted data together
                                    byte[] combined = new byte[iv.length + encrypted.length];
                                    System.arraycopy(iv, 0, combined, 0, iv.length);
                                    System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

                                    String encoded = Base64.encodeToString(combined, Base64.NO_WRAP);

                                    android.content.SharedPreferences prefs = getReactApplicationContext()
                                        .getSharedPreferences(SECURE_STORE_PREFS, android.content.Context.MODE_PRIVATE);
                                    prefs.edit().putString(key, encoded).apply();

                                    promise.resolve(true);
                                } catch (Exception e) {
                                    promise.reject("storage_error", e.getMessage());
                                }
                            }
                        }
                    );

                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle("Secure Storage")
                        .setSubtitle(promptMessage != null ? promptMessage : "Authenticate to store data")
                        .setNegativeButtonText("Cancel")
                        .build();

                    biometricPrompt.authenticate(promptInfo, cryptoObject);
                } catch (Exception e) {
                    promise.reject("storage_error", e.getMessage());
                }
            }
        });
    }

    @ReactMethod
    public void secureGet(final String key, final String promptMessage, final Promise promise) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Activity activity = getCurrentActivity();
                    if (activity == null) {
                        promise.reject("storage_error", "Activity is null");
                        return;
                    }

                    android.content.SharedPreferences prefs = getReactApplicationContext()
                        .getSharedPreferences(SECURE_STORE_PREFS, android.content.Context.MODE_PRIVATE);
                    String encoded = prefs.getString(key, null);

                    if (encoded == null) {
                        promise.resolve(null);
                        return;
                    }

                    byte[] combined = Base64.decode(encoded, Base64.NO_WRAP);
                    // GCM IV is always 12 bytes
                    byte[] iv = new byte[12];
                    byte[] encrypted = new byte[combined.length - 12];
                    System.arraycopy(combined, 0, iv, 0, 12);
                    System.arraycopy(combined, 12, encrypted, 0, encrypted.length);

                    javax.crypto.SecretKey secretKey = getOrCreateSecureStoreKey();
                    final javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding");
                    javax.crypto.spec.GCMParameterSpec gcmSpec = new javax.crypto.spec.GCMParameterSpec(128, iv);
                    cipher.init(javax.crypto.Cipher.DECRYPT_MODE, secretKey, gcmSpec);

                    BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(cipher);

                    ReactApplicationContext context = getReactApplicationContext();
                    Executor mainExecutor = ContextCompat.getMainExecutor(context);

                    BiometricPrompt biometricPrompt = new BiometricPrompt(
                        (FragmentActivity) activity,
                        mainExecutor,
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                                promise.reject(mapAndroidErrorCode(errorCode), errString.toString());
                            }

                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                try {
                                    javax.crypto.Cipher authedCipher = result.getCryptoObject().getCipher();
                                    byte[] decrypted = authedCipher.doFinal(encrypted);
                                    promise.resolve(new String(decrypted, "UTF-8"));
                                } catch (Exception e) {
                                    promise.reject("storage_error", "Decryption failed: " + e.getMessage());
                                }
                            }
                        }
                    );

                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle("Secure Storage")
                        .setSubtitle(promptMessage != null ? promptMessage : "Authenticate to access data")
                        .setNegativeButtonText("Cancel")
                        .build();

                    biometricPrompt.authenticate(promptInfo, cryptoObject);
                } catch (Exception e) {
                    promise.reject("storage_error", e.getMessage());
                }
            }
        });
    }

    @ReactMethod
    public void secureDelete(final String key, final Promise promise) {
        try {
            android.content.SharedPreferences prefs = getReactApplicationContext()
                .getSharedPreferences(SECURE_STORE_PREFS, android.content.Context.MODE_PRIVATE);
            prefs.edit().remove(key).apply();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("storage_error", e.getMessage());
        }
    }

    @ReactMethod
    public void secureGetAllKeys(final Promise promise) {
        try {
            android.content.SharedPreferences prefs = getReactApplicationContext()
                .getSharedPreferences(SECURE_STORE_PREFS, android.content.Context.MODE_PRIVATE);
            WritableArray keys = Arguments.createArray();
            for (String key : prefs.getAll().keySet()) {
                keys.pushString(key);
            }
            promise.resolve(keys);
        } catch (Exception e) {
            promise.reject("storage_error", e.getMessage());
        }
    }

    // ─── Screen Capture Protection ────────────────────────────────

    @ReactMethod
    public void setScreenCaptureProtection(final boolean enabled, final Promise promise) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Activity activity = getCurrentActivity();
                    if (activity == null) {
                        promise.reject("screen_error", "Activity is null");
                        return;
                    }
                    if (enabled) {
                        activity.getWindow().setFlags(
                            android.view.WindowManager.LayoutParams.FLAG_SECURE,
                            android.view.WindowManager.LayoutParams.FLAG_SECURE
                        );
                    } else {
                        activity.getWindow().clearFlags(
                            android.view.WindowManager.LayoutParams.FLAG_SECURE
                        );
                    }
                    promise.resolve(true);
                } catch (Exception e) {
                    promise.reject("screen_error", e.getMessage());
                }
            }
        });
    }

    // ─── Diagnostics ──────────────────────────────────────────────

    @ReactMethod
    public void getDiagnosticInfo(final Promise promise) {
        try {
            WritableMap result = Arguments.createMap();
            result.putString("platform", "android");
            result.putString("osVersion", Build.VERSION.RELEASE);
            result.putInt("sdkVersion", Build.VERSION.SDK_INT);
            result.putString("device", Build.MANUFACTURER + " " + Build.MODEL);
            result.putString("brand", Build.BRAND);
            result.putString("model", Build.MODEL);

            // Biometric capabilities
            BiometricManager biometricManager = BiometricManager.from(getReactApplicationContext());
            int canStrong = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            int canWeak = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK);
            int canCredential = biometricManager.canAuthenticate(BiometricManager.Authenticators.DEVICE_CREDENTIAL);

            result.putBoolean("hasBiometricStrong", canStrong == BiometricManager.BIOMETRIC_SUCCESS);
            result.putBoolean("hasBiometricWeak", canWeak == BiometricManager.BIOMETRIC_SUCCESS);
            result.putBoolean("hasDeviceCredential", canCredential == BiometricManager.BIOMETRIC_SUCCESS);

            // Hardware features
            PackageManager pm = getReactApplicationContext().getPackageManager();
            result.putBoolean("hasFingerprint", pm.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT));
            result.putBoolean("hasFaceDetect", pm.hasSystemFeature("android.hardware.biometrics.face"));
            result.putBoolean("hasIris", pm.hasSystemFeature("android.hardware.biometrics.iris"));
            result.putBoolean("hasStrongBox", Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
                pm.hasSystemFeature(PackageManager.FEATURE_STRONGBOX_KEYSTORE));

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("diagnostic_error", e.getMessage());
        }
    }

    // ─── Private Helpers ───────────────────────────────────────

    private boolean deleteKeysByAlias(String alias) {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            if (keyStore.containsAlias(alias)) {
                keyStore.deleteEntry(alias);
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private String mapAndroidErrorCode(int errorCode) {
        switch (errorCode) {
            case BiometricPrompt.ERROR_USER_CANCELED:
                return "user_cancel";
            case BiometricPrompt.ERROR_CANCELED:
                return "system_cancel";
            case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
                return "user_cancel";
            case BiometricPrompt.ERROR_HW_NOT_PRESENT:
            case BiometricPrompt.ERROR_HW_UNAVAILABLE:
                return "not_available";
            case BiometricPrompt.ERROR_NO_BIOMETRICS:
                return "not_enrolled";
            case BiometricPrompt.ERROR_LOCKOUT:
                return "lockout";
            case BiometricPrompt.ERROR_LOCKOUT_PERMANENT:
                return "lockout_permanent";
            case BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL:
                return "passcode_not_set";
            case BiometricPrompt.ERROR_TIMEOUT:
                return "authentication_failed";
            default:
                return "unknown";
        }
    }
}
