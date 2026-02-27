import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RNBiometrics, {
  useBiometrics,
  BiometryType,
  KeyType,
} from 'react-native-easy-biometrics';

// ─── Types ─────────────────────────────────────────────────────

type ResultState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: Record<string, any> | string | null;
  error?: string;
};

const INITIAL: ResultState = { status: 'idle' };

// ─── Result Display ────────────────────────────────────────────

function ResultBox({ result }: { result: ResultState }) {
  if (result.status === 'idle') return null;
  if (result.status === 'loading') {
    return (
      <View style={rs.box}>
        <ActivityIndicator size="small" color="#818cf8" />
      </View>
    );
  }
  const isErr = result.status === 'error';
  return (
    <View style={[rs.box, isErr ? rs.errBox : rs.okBox]}>
      <Text style={[rs.label, isErr ? rs.errLabel : rs.okLabel]}>
        {isErr ? '✗ ERROR' : '✓ SUCCESS'}
      </Text>
      {result.error && <Text style={rs.errText}>{result.error}</Text>}
      {result.data != null && typeof result.data === 'object'
        ? Object.entries(result.data).map(([k, v]) => (
            <View key={k} style={rs.row}>
              <Text style={rs.key}>{k}</Text>
              <Text style={rs.val} numberOfLines={2}>
                {typeof v === 'boolean'
                  ? v
                    ? '✓ true'
                    : '✗ false'
                  : String(v ?? '—')}
              </Text>
            </View>
          ))
        : result.data != null && (
            <Text style={rs.val}>{String(result.data)}</Text>
          )}
    </View>
  );
}

const rs = StyleSheet.create({
  box: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  okBox: {
    borderColor: 'rgba(74,222,128,0.3)',
    backgroundColor: 'rgba(74,222,128,0.05)',
  },
  errBox: {
    borderColor: 'rgba(248,113,113,0.3)',
    backgroundColor: 'rgba(248,113,113,0.05)',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  okLabel: { color: '#4ade80' },
  errLabel: { color: '#f87171' },
  errText: {
    color: '#fca5a5',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  key: { color: '#94a3b8', fontSize: 13, flex: 1 },
  val: {
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1.5,
    textAlign: 'right',
  },
});

// ─── Buttons ───────────────────────────────────────────────────

function ActionButton({
  label,
  icon,
  onPress,
  color = '#4f46e5',
  compact = false,
  disabled = false,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        ab.btn,
        { backgroundColor: color },
        compact && ab.compact,
        disabled && ab.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={ab.icon}>{icon}</Text>
      <Text style={ab.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const ab = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
    gap: 8,
  },
  compact: { padding: 10, borderRadius: 10 },
  disabled: { opacity: 0.4 },
  icon: { fontSize: 16 },
  text: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

function ButtonRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 6 }}>{children}</View>;
}

function SmallButton({
  label,
  icon,
  onPress,
  color = '#334155',
}: {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[smb.btn, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={smb.icon}>{icon}</Text>
      <Text style={smb.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const smb = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 4,
    marginBottom: 6,
  },
  icon: { fontSize: 13 },
  text: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
});

// ─── Feature Card ──────────────────────────────────────────────

function FeatureCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={fc.card}>
      <View style={fc.header}>
        <Text style={fc.title}>{title}</Text>
        {badge && (
          <View style={fc.badge}>
            <Text style={fc.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

const fc = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  badge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: '#818cf8', fontSize: 11, fontWeight: '700' },
});

// ─── About Screen ──────────────────────────────────────────────

function LinkCard({
  icon,
  title,
  subtitle,
  url,
}: {
  icon: string;
  title: string;
  subtitle: string;
  url: string;
}) {
  return (
    <TouchableOpacity
      style={lc.card}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      <Text style={lc.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={lc.title}>{title}</Text>
        <Text style={lc.sub}>{subtitle}</Text>
      </View>
      <Text style={lc.arrow}>→</Text>
    </TouchableOpacity>
  );
}

const lc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  icon: { fontSize: 28 },
  title: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  arrow: { fontSize: 18, color: '#475569' },
});

function AboutScreen() {
  const features = [
    { icon: '🔐', label: 'Face ID / Touch ID / Fingerprint' },
    { icon: '🔑', label: 'RSA 2048 + EC256 (Secure Enclave)' },
    { icon: '✍️', label: 'Biometric-protected Signatures' },
    { icon: '💾', label: 'Encrypted Keychain/Keystore Storage' },
    { icon: '📸', label: 'Screenshot & Screen Recording Protection' },
    { icon: '🛡️', label: 'Jailbreak / Root Detection' },
    { icon: '🔄', label: 'Biometric Change Detection' },
    { icon: '⚡', label: 'TurboModules (New Architecture) Ready' },
    { icon: '🎣', label: 'React Hook — useBiometrics()' },
    { icon: '🚫', label: 'AbortSignal Cancel Support' },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={about.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={about.hero}>
        <Text style={about.heroIcon}>🔐</Text>
        <Text style={about.heroTitle}>Easy Biometrics</Text>
        <Text style={about.heroVersion}>v3.0.0</Text>
        <Text style={about.heroDesc}>
          Production-ready biometric auth for React Native.{'\n'}
          Supports iOS & Android with Expo compatibility.
        </Text>
      </View>

      {/* Links */}
      <Text style={about.sectionTitle}>LINKS</Text>
      <LinkCard
        icon="📦"
        title="NPM Package"
        subtitle="npmjs.com/package/react-native-easy-biometrics"
        url="https://www.npmjs.com/package/react-native-easy-biometrics"
      />
      <LinkCard
        icon="🐙"
        title="GitHub Repository"
        subtitle="github.com/tugayoktayokay/react-native-easy-biometrics"
        url="https://github.com/tugayoktayokay/react-native-easy-biometrics"
      />
      <LinkCard
        icon="📖"
        title="Documentation"
        subtitle="README & API Reference"
        url="https://github.com/tugayoktayokay/react-native-easy-biometrics#readme"
      />
      <LinkCard
        icon="🐛"
        title="Report an Issue"
        subtitle="Bug reports & feature requests"
        url="https://github.com/tugayoktayokay/react-native-easy-biometrics/issues"
      />

      {/* Features */}
      <Text style={[about.sectionTitle, { marginTop: 8 }]}>FEATURES</Text>
      <View style={about.featureCard}>
        {features.map((f, i) => (
          <View key={i} style={about.featureRow}>
            <Text style={about.featureIcon}>{f.icon}</Text>
            <Text style={about.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Tech Stack */}
      <Text style={[about.sectionTitle, { marginTop: 8 }]}>COMPATIBILITY</Text>
      <View style={about.featureCard}>
        <View style={about.featureRow}>
          <Text style={about.featureIcon}>📱</Text>
          <Text style={about.featureLabel}>iOS 13+ · Android API 23+</Text>
        </View>
        <View style={about.featureRow}>
          <Text style={about.featureIcon}>⚛️</Text>
          <Text style={about.featureLabel}>React Native 0.70+</Text>
        </View>
        <View style={about.featureRow}>
          <Text style={about.featureIcon}>🚀</Text>
          <Text style={about.featureLabel}>Expo SDK 49+</Text>
        </View>
        <View style={about.featureRow}>
          <Text style={about.featureIcon}>⚡</Text>
          <Text style={about.featureLabel}>Old & New Architecture</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={about.footer}>Made with ❤️ by Tugay Oktay</Text>
      <Text style={about.footerSub}>MIT License</Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const about = StyleSheet.create({
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  hero: { alignItems: 'center', marginBottom: 28 },
  heroIcon: { fontSize: 56, marginBottom: 8 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.5,
  },
  heroVersion: {
    fontSize: 14,
    color: '#818cf8',
    fontWeight: '700',
    marginTop: 4,
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroDesc: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  featureIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  featureLabel: { fontSize: 14, color: '#cbd5e1', flex: 1 },
  footer: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    marginTop: 20,
    fontWeight: '600',
  },
  footerSub: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
  },
});

// ─── Features Screen ───────────────────────────────────────────

function FeaturesScreen() {
  const {
    available,
    biometryType,
    isEnrolled,
    isAuthenticating,
    authenticate,
    cancel,
  } = useBiometrics();

  const [authResult, setAuthResult] = useState<ResultState>(INITIAL);
  const [sensorResult, setSensorResult] = useState<ResultState>(INITIAL);
  const [cryptoResult, setCryptoResult] = useState<ResultState>(INITIAL);
  const [changeResult, setChangeResult] = useState<ResultState>(INITIAL);
  const [storageResult, setStorageResult] = useState<ResultState>(INITIAL);
  const [screenResult, setScreenResult] = useState<ResultState>(INITIAL);
  const [diagResult, setDiagResult] = useState<ResultState>(INITIAL);
  const [integrityResult, setIntegrityResult] = useState<ResultState>(INITIAL);
  const [savedHash, setSavedHash] = useState<string | null>(null);
  const [screenProtected, setScreenProtected] = useState(false);

  const getBiometryIcon = () => {
    switch (biometryType) {
      case BiometryType.FACE_ID:
        return '🔐';
      case BiometryType.TOUCH_ID:
        return '👆';
      case BiometryType.FINGERPRINT:
        return '🔐';
      case BiometryType.IRIS:
        return '👁️';
      default:
        return '⚠️';
    }
  };

  // ── Handlers ──

  const handleAuth = async () => {
    setAuthResult({ status: 'loading' });
    const result = await authenticate({
      promptTitle: 'Verify Identity',
      promptMessage: 'Authenticate to continue',
      cancelButtonText: 'Cancel',
      disableDeviceFallback: false,
    });
    setAuthResult(
      result.success
        ? { status: 'success', data: { authenticated: true } }
        : { status: 'error', error: `${result.error}: ${result.message}` }
    );
  };

  const handleAuthSubtitle = async () => {
    setAuthResult({ status: 'loading' });
    const result = await authenticate({
      promptTitle: 'Confirm Payment',
      promptMessage: 'Authenticate to confirm',
      promptSubtitle: '$99.99 — Apple Store',
      disableDeviceFallback: true,
    });
    setAuthResult(
      result.success
        ? {
            status: 'success',
            data: { authenticated: true, prompt: 'subtitle' },
          }
        : { status: 'error', error: result.error }
    );
  };

  const handleAutoCancel = async () => {
    const controller = new AbortController();
    setAuthResult({ status: 'loading' });
    setTimeout(() => controller.abort(), 3000);
    const result = await authenticate({
      promptTitle: 'Quick Auth',
      promptMessage: 'You have 3 seconds!',
      signal: controller.signal,
      disableDeviceFallback: true,
    });
    setAuthResult(
      result.success
        ? {
            status: 'success',
            data: { authenticated: true, mode: 'before-timeout' },
          }
        : { status: 'error', error: result.error }
    );
  };

  const handleSensorInfo = async () => {
    setSensorResult({ status: 'loading' });
    try {
      const sensor = await RNBiometrics.getBiometryType();
      const level = await RNBiometrics.getSecurityLevel();
      const enrolled = await RNBiometrics.isEnrolled();
      const labels = ['NONE', 'SECRET', 'BIOMETRIC_WEAK', 'BIOMETRIC_STRONG'];
      setSensorResult({
        status: 'success',
        data: {
          biometryType: sensor.biometryType,
          allTypes: sensor.biometryTypes.join(', ') || '—',
          enrolled,
          securityLevel: `${labels[level]} (${level})`,
          platform: Platform.OS,
        },
      });
    } catch (e: any) {
      setSensorResult({ status: 'error', error: e.message });
    }
  };

  const handleCreateKeys = async (type: 'rsa' | 'ec256') => {
    setCryptoResult({ status: 'loading' });
    try {
      const alias = type === 'ec256' ? 'ec256test' : 'default';
      const keyType = type === 'ec256' ? KeyType.EC256 : undefined;
      const result = await RNBiometrics.createKeys(alias, keyType);
      setCryptoResult({
        status: 'success',
        data: {
          keyType: result.keyType,
          alias,
          publicKey: result.publicKey.substring(0, 50) + '…',
        },
      });
    } catch (e: any) {
      setCryptoResult({ status: 'error', error: e.message });
    }
  };

  const handleSign = async () => {
    setCryptoResult({ status: 'loading' });
    const result = await RNBiometrics.createSignature({
      payload: 'Hello from Easy Biometrics!',
      promptMessage: 'Sign this message',
    });
    setCryptoResult(
      result.success
        ? {
            status: 'success',
            data: {
              signed: true,
              signature: (result.signature ?? '').substring(0, 50) + '…',
            },
          }
        : { status: 'error', error: result.error }
    );
  };

  const handleKeysExist = async () => {
    setCryptoResult({ status: 'loading' });
    const exists = await RNBiometrics.biometricKeysExist();
    setCryptoResult({ status: 'success', data: { keysExist: exists } });
  };

  const handleDeleteKeys = async () => {
    setCryptoResult({ status: 'loading' });
    const deleted = await RNBiometrics.deleteKeys();
    setCryptoResult(
      deleted
        ? { status: 'success', data: { deleted: true } }
        : { status: 'error', error: 'No keys to delete' }
    );
  };

  const handleGetHash = async () => {
    setChangeResult({ status: 'loading' });
    try {
      const hash = await RNBiometrics.getBiometricStateHash();
      if (hash) {
        setSavedHash(hash);
        setChangeResult({
          status: 'success',
          data: { hash: hash.substring(0, 32) + '…', saved: true },
        });
      } else {
        setChangeResult({
          status: 'error',
          error: 'No biometric state available',
        });
      }
    } catch (e: any) {
      setChangeResult({ status: 'error', error: e.message });
    }
  };

  const handleCheckChanged = async () => {
    if (!savedHash) {
      setChangeResult({ status: 'error', error: 'Tap "Get Hash" first' });
      return;
    }
    setChangeResult({ status: 'loading' });
    const changed = await RNBiometrics.isBiometricChanged(savedHash);
    setChangeResult({
      status: changed ? 'error' : 'success',
      data: { changed, savedHash: savedHash.substring(0, 20) + '…' },
      error: changed ? 'Biometrics CHANGED!' : undefined,
    });
  };

  const handleSecureStore = async () => {
    setStorageResult({ status: 'loading' });
    try {
      await RNBiometrics.secureStore(
        'test_token',
        'my-secret-jwt-token-12345',
        'Authenticate to save'
      );
      setStorageResult({
        status: 'success',
        data: { key: 'test_token', stored: true },
      });
    } catch (e: any) {
      setStorageResult({ status: 'error', error: e.message });
    }
  };

  const handleSecureGet = async () => {
    setStorageResult({ status: 'loading' });
    try {
      const value = await RNBiometrics.secureGet(
        'test_token',
        'Authenticate to retrieve'
      );
      setStorageResult(
        value
          ? { status: 'success', data: { key: 'test_token', value } }
          : { status: 'error', error: 'No value found' }
      );
    } catch (e: any) {
      setStorageResult({ status: 'error', error: e.message });
    }
  };

  const handleSecureDelete = async () => {
    setStorageResult({ status: 'loading' });
    try {
      const d = await RNBiometrics.secureDelete('test_token');
      setStorageResult({
        status: 'success',
        data: { key: 'test_token', deleted: d },
      });
    } catch (e: any) {
      setStorageResult({ status: 'error', error: e.message });
    }
  };

  const handleListKeys = async () => {
    setStorageResult({ status: 'loading' });
    try {
      const keys = await RNBiometrics.secureGetAllKeys();
      setStorageResult({
        status: 'success',
        data: { count: keys.length, keys: keys.join(', ') || '(empty)' },
      });
    } catch (e: any) {
      setStorageResult({ status: 'error', error: e.message });
    }
  };

  const handleToggleScreen = async () => {
    const ns = !screenProtected;
    setScreenResult({ status: 'loading' });
    try {
      await RNBiometrics.setScreenCaptureProtection(ns);
      setScreenProtected(ns);
      setScreenResult({
        status: 'success',
        data: {
          protected: ns,
          note: ns ? 'Try taking a screenshot!' : 'Screenshots allowed',
        },
      });
    } catch (e: any) {
      setScreenResult({ status: 'error', error: e.message });
    }
  };

  const handleDiagnostics = async () => {
    setDiagResult({ status: 'loading' });
    try {
      const i = await RNBiometrics.getDiagnosticInfo();
      setDiagResult({
        status: 'success',
        data:
          i.platform === 'ios'
            ? {
                platform: `${i.platform} ${i.osVersion}`,
                device: `${i.device} (${i.model})`,
                faceID: i.hasFaceID,
                touchID: i.hasTouchID,
                secureEnclave: i.hasSecureEnclave,
                passcode: i.hasPasscode,
              }
            : {
                platform: `${i.platform} SDK ${i.sdkVersion}`,
                device: `${i.device} (${i.brand})`,
                fingerprint: i.hasFingerprint,
                faceDetect: i.hasFaceDetect,
                strongBio: i.hasBiometricStrong,
                strongBox: i.hasStrongBox,
              },
      });
    } catch (e: any) {
      setDiagResult({ status: 'error', error: e.message });
    }
  };

  const handleIntegrity = async () => {
    setIntegrityResult({ status: 'loading' });
    try {
      const r = await RNBiometrics.getDeviceIntegrity();
      setIntegrityResult({
        status: r.riskLevel === 'NONE' ? 'success' : 'error',
        data:
          Platform.OS === 'ios'
            ? {
                riskLevel: r.riskLevel,
                jailbroken: r.isJailbroken,
                secureEnclave: r.hasSecureEnclave,
              }
            : {
                riskLevel: r.riskLevel,
                rooted: r.isRooted,
                secureHW: r.hasSecureHardware,
                keyguard: r.isKeyguardSecure,
              },
        error: r.riskLevel !== 'NONE' ? `Risk: ${r.riskLevel}` : undefined,
      });
    } catch (e: any) {
      setIntegrityResult({ status: 'error', error: e.message });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Easy Biometrics</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v3.0</Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusPill}>
        <Text style={{ fontSize: 32 }}>{getBiometryIcon()}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusType}>{biometryType || 'None'}</Text>
          <Text style={styles.statusMeta}>
            {available ? '● Available' : '○ Unavailable'} ·{' '}
            {isEnrolled ? 'Enrolled' : 'Not enrolled'} · {Platform.OS}
          </Text>
        </View>
      </View>

      {/* Auth */}
      <FeatureCard title="🔓 Authentication">
        <ActionButton
          label={isAuthenticating ? 'Authenticating…' : 'Authenticate'}
          icon="🔐"
          onPress={handleAuth}
          disabled={isAuthenticating}
        />
        <ButtonRow>
          <SmallButton
            label="With Subtitle"
            icon="💳"
            onPress={handleAuthSubtitle}
          />
          <SmallButton
            label="3s Auto-Cancel"
            icon="⏱️"
            onPress={handleAutoCancel}
          />
        </ButtonRow>
        {isAuthenticating && (
          <ActionButton
            label="Cancel"
            icon="✋"
            onPress={cancel}
            color="#dc2626"
            compact
          />
        )}
        <ResultBox result={authResult} />
      </FeatureCard>

      {/* Sensor */}
      <FeatureCard title="📱 Sensor & Capabilities">
        <ActionButton
          label="Query Sensor Info"
          icon="🔍"
          onPress={handleSensorInfo}
          color="#0891b2"
        />
        <ResultBox result={sensorResult} />
      </FeatureCard>

      {/* Crypto */}
      <FeatureCard title="🔑 Crypto Keys" badge="RSA + EC256">
        <ButtonRow>
          <SmallButton
            label="RSA 2048"
            icon="🔑"
            onPress={() => handleCreateKeys('rsa')}
            color="#0d9488"
          />
          <SmallButton
            label="EC256 (SE)"
            icon="🔑"
            onPress={() => handleCreateKeys('ec256')}
            color="#0d9488"
          />
        </ButtonRow>
        <ActionButton
          label="Sign Payload"
          icon="✍️"
          onPress={handleSign}
          color="#7c3aed"
        />
        <ButtonRow>
          <SmallButton
            label="Keys Exist?"
            icon="🔍"
            onPress={handleKeysExist}
          />
          <SmallButton
            label="Delete Keys"
            icon="🗑️"
            onPress={handleDeleteKeys}
            color="#7f1d1d"
          />
        </ButtonRow>
        <ResultBox result={cryptoResult} />
      </FeatureCard>

      {/* Change Detection */}
      <FeatureCard title="🔄 Change Detection">
        <ButtonRow>
          <SmallButton
            label="Get Hash"
            icon="📋"
            onPress={handleGetHash}
            color="#0d9488"
          />
          <SmallButton
            label="Check Changed"
            icon="🔄"
            onPress={handleCheckChanged}
            color="#d97706"
          />
        </ButtonRow>
        <ResultBox result={changeResult} />
      </FeatureCard>

      {/* Storage */}
      <FeatureCard title="🔐 Encrypted Storage" badge="Keychain">
        <ButtonRow>
          <SmallButton
            label="Store"
            icon="💾"
            onPress={handleSecureStore}
            color="#4f46e5"
          />
          <SmallButton
            label="Retrieve"
            icon="🔓"
            onPress={handleSecureGet}
            color="#4f46e5"
          />
        </ButtonRow>
        <ButtonRow>
          <SmallButton label="List Keys" icon="📋" onPress={handleListKeys} />
          <SmallButton
            label="Delete"
            icon="🗑️"
            onPress={handleSecureDelete}
            color="#7f1d1d"
          />
        </ButtonRow>
        <ResultBox result={storageResult} />
      </FeatureCard>

      {/* Screen */}
      <FeatureCard title="📸 Screen Capture Protection">
        <ActionButton
          label={screenProtected ? 'Disable Protection' : 'Enable Protection'}
          icon={screenProtected ? '🔓' : '🛡️'}
          onPress={handleToggleScreen}
          color={screenProtected ? '#dc2626' : '#0d9488'}
        />
        <ResultBox result={screenResult} />
      </FeatureCard>

      {/* Integrity */}
      <FeatureCard title="🛡️ Device Integrity">
        <ActionButton
          label="Check Integrity"
          icon="🔍"
          onPress={handleIntegrity}
          color="#d97706"
        />
        <ResultBox result={integrityResult} />
      </FeatureCard>

      {/* Diagnostics */}
      <FeatureCard title="📊 Diagnostics">
        <ActionButton
          label="Get Diagnostic Info"
          icon="📊"
          onPress={handleDiagnostics}
          color="#6366f1"
        />
        <ResultBox result={diagResult} />
      </FeatureCard>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Tab Bar ───────────────────────────────────────────────────

function TabBar({
  active,
  onTabPress,
}: {
  active: string;
  onTabPress: (tab: string) => void;
}) {
  const tabs = [
    { key: 'features', icon: '⚡', label: 'Features' },
    { key: 'about', icon: '📖', label: 'About' },
  ];

  return (
    <View style={tb.bar}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={tb.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[tb.tabIcon, isActive && tb.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[tb.tabLabel, isActive && tb.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={tb.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,15,30,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  tabLabelActive: { color: '#818cf8' },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 2,
    backgroundColor: '#818cf8',
    borderRadius: 1,
  },
});

// ─── Main App ──────────────────────────────────────────────────

export default function App() {
  const { loading } = useBiometrics();
  const [activeTab, setActiveTab] = useState('features');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#818cf8" />
        <Text style={styles.loadingText}>Initializing…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {activeTab === 'features' ? <FeaturesScreen /> : <AboutScreen />}
      <TabBar active={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c1d' },
  center: {
    flex: 1,
    backgroundColor: '#0c0c1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: -0.5,
  },
  versionBadge: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  versionText: { color: '#818cf8', fontSize: 13, fontWeight: '700' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statusType: { fontSize: 18, fontWeight: '700', color: '#e2e8f0' },
  statusMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
