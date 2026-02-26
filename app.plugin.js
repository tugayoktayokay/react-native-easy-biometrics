/**
 * Expo Config Plugin for react-native-easy-biometrics.
 *
 * Automatically adds:
 * - NSFaceIDUsageDescription to iOS Info.plist
 * - USE_BIOMETRIC and USE_FINGERPRINT permissions to Android manifest
 *
 * @param {import('@expo/config-plugins').ConfigPlugin} config
 * @param {object} options
 * @param {string} [options.faceIDPermission] - Custom Face ID usage description
 */
module.exports = (config, options = {}) => {
  // Dynamically resolve from the app's node_modules (not the library's)
  let configPlugins;
  try {
    configPlugins = require(
      require.resolve('@expo/config-plugins', {
        paths: [process.cwd()],
      })
    );
  } catch {
    // Fallback: try direct require
    configPlugins = require('@expo/config-plugins');
  }

  const { withInfoPlist, withAndroidManifest } = configPlugins;

  const faceIDPermission =
    options.faceIDPermission ||
    'Allow $(PRODUCT_NAME) to use Face ID for authentication';

  // iOS: Add NSFaceIDUsageDescription
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.NSFaceIDUsageDescription =
      cfg.modResults.NSFaceIDUsageDescription || faceIDPermission;
    return cfg;
  });

  // Android: Add biometric permissions
  config = withAndroidManifest(config, (cfg) => {
    const mainApplication = cfg.modResults.manifest;

    if (!mainApplication['uses-permission']) {
      mainApplication['uses-permission'] = [];
    }

    const permissions = mainApplication['uses-permission'];

    const addPermission = (name) => {
      if (!permissions.find((p) => p.$['android:name'] === name)) {
        permissions.push({ $: { 'android:name': name } });
      }
    };

    addPermission('android.permission.USE_BIOMETRIC');
    addPermission('android.permission.USE_FINGERPRINT');

    return cfg;
  });

  return config;
};
