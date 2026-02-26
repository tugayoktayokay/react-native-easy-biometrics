import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RNBiometrics, {
  useBiometrics,
  BiometryType,
  BiometricError,
  SecurityLevel,
} from 'react-native-easy-biometrics';

type LogEntry = {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
};

let logId = 0;

export default function App() {
  const {
    available,
    biometryType,
    isEnrolled,
    isAuthenticating,
    loading,
    authenticate,
    cancel,
  } = useBiometrics();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [savedHash, setSavedHash] = useState<string | null>(null);

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [{ id: ++logId, text, type }, ...prev].slice(0, 20));
  };

  const getBiometryIcon = () => {
    switch (biometryType) {
      case BiometryType.FACE_ID:
        return '😊';
      case BiometryType.TOUCH_ID:
        return '👆';
      case BiometryType.FINGERPRINT:
        return '🔐';
      case BiometryType.IRIS:
        return '👁️';
      default:
        return '❌';
    }
  };

  const handleAuthenticate = async () => {
    addLog('Starting authentication...');
    const result = await authenticate({
      promptTitle: 'Verify Identity',
      promptMessage: 'Authenticate to continue',
      cancelButtonText: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      addLog('✅ Authentication successful!', 'success');
    } else {
      addLog(`❌ Failed: ${result.error} — ${result.message}`, 'error');
    }
  };

  const handleAuthWithCancel = async () => {
    const controller = new AbortController();
    addLog('Auth started — will auto-cancel in 3s...');

    setTimeout(() => {
      controller.abort();
      addLog('⏱️ Auto-cancelled via AbortSignal');
    }, 3000);

    const result = await authenticate({
      promptTitle: 'Quick Auth',
      promptMessage: 'You have 3 seconds!',
      signal: controller.signal,
      disableDeviceFallback: true,
    });

    if (result.success) {
      addLog('✅ Authenticated before timeout!', 'success');
    } else {
      addLog(`Cancelled: ${result.error}`, 'error');
    }
  };

  const handleGetSensorInfo = async () => {
    const sensor = await RNBiometrics.getBiometryType();
    addLog(`Primary: ${sensor.biometryType}`);
    addLog(`All types: ${sensor.biometryTypes.join(', ') || 'None'}`);
  };

  const handleCheckEnrolled = async () => {
    const enrolled = await RNBiometrics.isEnrolled();
    addLog(`Enrolled: ${enrolled}`);
  };

  const handleSecurityLevel = async () => {
    const level = await RNBiometrics.getSecurityLevel();
    const labels = ['NONE', 'SECRET', 'BIOMETRIC_WEAK', 'BIOMETRIC_STRONG'];
    addLog(`Security Level: ${labels[level]} (${level})`);
  };

  const handleCreateKeys = async () => {
    addLog('Generating RSA 2048 key pair...');
    try {
      const result = await RNBiometrics.createKeys();
      addLog(
        `🔑 Public key: ${result.publicKey.substring(0, 40)}...`,
        'success'
      );
    } catch (e: any) {
      addLog(`Key generation failed: ${e.message}`, 'error');
    }
  };

  const handleSign = async () => {
    addLog('Signing payload...');
    const result = await RNBiometrics.createSignature({
      payload: 'Hello from Easy Biometrics!',
      promptMessage: 'Sign this message',
    });
    if (result.success) {
      addLog(
        `✍️ Signature: ${result.signature?.substring(0, 40)}...`,
        'success'
      );
    } else {
      addLog(`Sign failed: ${result.error}`, 'error');
    }
  };

  const handleCheckKeys = async () => {
    const exists = await RNBiometrics.biometricKeysExist();
    addLog(`Keys exist: ${exists}`);
  };

  const handleDeleteKeys = async () => {
    const deleted = await RNBiometrics.deleteKeys();
    addLog(deleted ? '🗑️ Keys deleted' : 'No keys to delete');
  };

  // ─── New Feature Handlers ───────────────────────────────────

  const handleGetStateHash = async () => {
    const hash = await RNBiometrics.getBiometricStateHash();
    if (hash) {
      setSavedHash(hash);
      addLog(`📋 State hash: ${hash.substring(0, 20)}...`, 'success');
      addLog('Hash saved — add/remove a fingerprint, then check again');
    } else {
      addLog('No biometric state available', 'error');
    }
  };

  const handleCheckBiometricChanged = async () => {
    if (!savedHash) {
      addLog('No saved hash — tap Get State Hash first', 'error');
      return;
    }
    const changed = await RNBiometrics.isBiometricChanged(savedHash);
    if (changed) {
      addLog('⚠️ Biometrics CHANGED since last check!', 'error');
    } else {
      addLog('✅ Biometrics unchanged', 'success');
    }
  };

  const handleAuthWithSubtitle = async () => {
    addLog('Auth with subtitle...');
    const result = await authenticate({
      promptTitle: 'Confirm Payment',
      promptMessage: 'Authenticate to confirm',
      promptSubtitle: '$99.99 — Apple Store',
      disableDeviceFallback: true,
    });
    if (result.success) {
      addLog('✅ Payment confirmed!', 'success');
    } else {
      addLog(`❌ ${result.error}`, 'error');
    }
  };

  const handleCreatePaymentKey = async () => {
    addLog('Creating payment key...');
    try {
      const result = await RNBiometrics.createKeys('payment');
      addLog(
        `🔑 Payment key: ${result.publicKey.substring(0, 30)}...`,
        'success'
      );
    } catch (e: any) {
      addLog(`Failed: ${e.message}`, 'error');
    }
  };

  const handleSignWithPaymentKey = async () => {
    addLog('Signing with payment key...');
    const result = await RNBiometrics.createSignature({
      payload: 'payment:99.99:USD',
      promptMessage: 'Sign payment',
      keyAlias: 'payment',
    });
    if (result.success) {
      addLog(
        `✍️ Payment sig: ${result.signature?.substring(0, 30)}...`,
        'success'
      );
    } else {
      addLog(`Sign failed: ${result.error}`, 'error');
    }
  };

  const handleCheckPaymentKey = async () => {
    const exists = await RNBiometrics.biometricKeysExist('payment');
    addLog(`Payment key exists: ${exists}`);
  };

  const handleDeletePaymentKey = async () => {
    const deleted = await RNBiometrics.deleteKeys('payment');
    addLog(deleted ? '🗑️ Payment key deleted' : 'No payment key to delete');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading biometrics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Easy Biometrics</Text>
          <Text style={styles.subtitle}>v2.0 Demo</Text>
        </View>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Device Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>{getBiometryIcon()}</Text>
            <View>
              <Text style={styles.statusText}>
                {biometryType} — {available ? 'Available' : 'Not Available'}
              </Text>
              <Text style={styles.statusSubtext}>
                Enrolled: {isEnrolled ? 'Yes' : 'No'} · Platform: {Platform.OS}
              </Text>
            </View>
          </View>
        </View>

        {/* Auth Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAuthenticate}
            disabled={isAuthenticating}
          >
            <Text style={styles.buttonText}>
              {isAuthenticating ? 'Authenticating...' : '🔓 Authenticate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleAuthWithCancel}
          >
            <Text style={styles.buttonText}>⏱️ Auth with 3s Auto-Cancel</Text>
          </TouchableOpacity>
          {isAuthenticating && (
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={cancel}
            >
              <Text style={styles.buttonText}>✋ Cancel Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Detection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detection</Text>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleGetSensorInfo}
          >
            <Text style={styles.buttonText}>📱 Get Sensor Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCheckEnrolled}
          >
            <Text style={styles.buttonText}>👤 Check Enrolled</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSecurityLevel}
          >
            <Text style={styles.buttonText}>🛡️ Security Level</Text>
          </TouchableOpacity>
        </View>

        {/* Crypto Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crypto Keys</Text>
          <TouchableOpacity
            style={[styles.button, styles.cryptoButton]}
            onPress={handleCreateKeys}
          >
            <Text style={styles.buttonText}>🔑 Create Keys</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cryptoButton]}
            onPress={handleSign}
          >
            <Text style={styles.buttonText}>✍️ Sign Payload</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cryptoButton]}
            onPress={handleCheckKeys}
          >
            <Text style={styles.buttonText}>🔍 Keys Exist?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteKeys}
          >
            <Text style={styles.buttonText}>🗑️ Delete Keys</Text>
          </TouchableOpacity>
        </View>

        {/* Biometric Change Detection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Change Detection</Text>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleGetStateHash}
          >
            <Text style={styles.buttonText}>📋 Get State Hash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCheckBiometricChanged}
          >
            <Text style={styles.buttonText}>🔄 Check If Changed</Text>
          </TouchableOpacity>
          {savedHash && (
            <Text style={styles.hashText}>
              Saved: {savedHash.substring(0, 16)}...
            </Text>
          )}
        </View>

        {/* Subtitle Auth */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subtitle Auth (Android)</Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleAuthWithSubtitle}
          >
            <Text style={styles.buttonText}>💳 Auth with Subtitle</Text>
          </TouchableOpacity>
        </View>

        {/* Multi-Alias Keys */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Multi-Alias Keys</Text>
          <TouchableOpacity
            style={[styles.button, styles.cryptoButton]}
            onPress={handleCreatePaymentKey}
          >
            <Text style={styles.buttonText}>🔑 Create Payment Key</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.cryptoButton]}
            onPress={handleSignWithPaymentKey}
          >
            <Text style={styles.buttonText}>✍️ Sign with Payment Key</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCheckPaymentKey}
          >
            <Text style={styles.buttonText}>🔍 Payment Key Exists?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeletePaymentKey}
          >
            <Text style={styles.buttonText}>🗑️ Delete Payment Key</Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs</Text>
          {logs.length === 0 && (
            <Text style={styles.emptyLog}>
              Tap a button to see results here
            </Text>
          )}
          {logs.map((log) => (
            <View
              key={log.id}
              style={[
                styles.logItem,
                log.type === 'success' && styles.logSuccess,
                log.type === 'error' && styles.logError,
              ]}
            >
              <Text style={styles.logText}>{log.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  loading: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    fontSize: 40,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  warningButton: {
    backgroundColor: '#d97706',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  cryptoButton: {
    backgroundColor: '#0d9488',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyLog: {
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  logItem: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#444',
  },
  logSuccess: {
    borderLeftColor: '#22c55e',
    backgroundColor: '#0a1f0a',
  },
  logError: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#1f0a0a',
  },
  logText: {
    color: '#ddd',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hashText: {
    color: '#666',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
});
