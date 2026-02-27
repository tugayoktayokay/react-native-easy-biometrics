#import "EasyBiometrics.h"

#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTConvert.h>
#import <Security/Security.h>
#import <sys/utsname.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNEasyBiometricsSpec.h"
#endif

static NSString *const kKeychainTagPrefix = @"com.easybiometrics.keys.";

@implementation EasyBiometrics
RCT_EXPORT_MODULE()

// ─── Helper: Build keychain tag from alias ─────────────────────

- (NSData *)keychainTagForAlias:(NSString *)alias {
  NSString *tag =
      [kKeychainTagPrefix stringByAppendingString:(alias ?: @"default")];
  return [tag dataUsingEncoding:NSUTF8StringEncoding];
}

// ─── canAuthenticate ───────────────────────────────────────────

RCT_REMAP_METHOD(canAuthenticate,
                 canAuthenticateWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;
  BOOL canEvaluatePolicy =
      [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                           error:&la_error];

  if (canEvaluatePolicy) {
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

// ─── getBiometryType ───────────────────────────────────────────

RCT_REMAP_METHOD(getBiometryType,
                 getBiometryTypeWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;
  BOOL canEvaluatePolicy =
      [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                           error:&la_error];

  NSString *biometryType = @"None";
  BOOL available = NO;
  NSString *errorMsg = nil;

  if (canEvaluatePolicy) {
    available = YES;
    if (@available(iOS 11.0, *)) {
      switch (context.biometryType) {
      case LABiometryTypeFaceID:
        biometryType = @"FaceID";
        break;
      case LABiometryTypeTouchID:
        biometryType = @"TouchID";
        break;
      default:
        biometryType = @"None";
        break;
      }
    } else {
      biometryType = @"TouchID";
    }
  } else if (la_error) {
    errorMsg = la_error.localizedDescription;
    if (@available(iOS 11.0, *)) {
      switch (context.biometryType) {
      case LABiometryTypeFaceID:
        biometryType = @"FaceID";
        break;
      case LABiometryTypeTouchID:
        biometryType = @"TouchID";
        break;
      default:
        break;
      }
    }
  }

  NSMutableArray *biometryTypesArray = [NSMutableArray array];
  if (![biometryType isEqualToString:@"None"]) {
    [biometryTypesArray addObject:biometryType];
  }

  NSDictionary *result = @{
    @"available" : @(available),
    @"biometryType" : biometryType,
    @"biometryTypes" : biometryTypesArray,
  };

  if (errorMsg) {
    NSMutableDictionary *mutableResult = [result mutableCopy];
    mutableResult[@"error"] = errorMsg;
    resolve(mutableResult);
  } else {
    resolve(result);
  }
}

// ─── isEnrolled ────────────────────────────────────────────────

RCT_REMAP_METHOD(isEnrolled,
                 isEnrolledWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;
  BOOL canEvaluatePolicy =
      [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                           error:&la_error];

  if (canEvaluatePolicy) {
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

// ─── getSecurityLevel ──────────────────────────────────────────

RCT_REMAP_METHOD(getSecurityLevel,
                 getSecurityLevelWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;

  if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                           error:&la_error]) {
    resolve(@(3)); // BIOMETRIC_STRONG
    return;
  }

  la_error = nil;
  if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication
                           error:&la_error]) {
    resolve(@(1)); // SECRET (passcode)
    return;
  }

  resolve(@(0)); // NONE
}

// ─── getBiometricStateHash ────────────────────────────────────

RCT_REMAP_METHOD(getBiometricStateHash,
                 getBiometricStateHashWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;

  if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                           error:&la_error]) {
    NSData *domainState = context.evaluatedPolicyDomainState;
    if (domainState) {
      // Convert to hex string for cross-platform compatibility
      NSMutableString *hexString =
          [NSMutableString stringWithCapacity:domainState.length * 2];
      const unsigned char *bytes = (const unsigned char *)domainState.bytes;
      for (NSUInteger i = 0; i < domainState.length; i++) {
        [hexString appendFormat:@"%02x", bytes[i]];
      }
      resolve(hexString);
    } else {
      resolve([NSNull null]);
    }
  } else {
    resolve([NSNull null]);
  }
}

// ─── authenticate ─────────────────────────────────────────────

RCT_REMAP_METHOD(
    authenticate,
    authenticateTitle : (NSString *)title message : (NSString *)
        message promptSubtitle : (NSString *)subtitle cancelButtonText : (
            NSString *)cancelButtonText fallbackLabel : (NSString *)
            fallbackLabel disableDeviceFallback : (BOOL)disableDeviceFallback
                authenticateWithResolver : (RCTPromiseResolveBlock)
                    resolve rejecter : (RCTPromiseRejectBlock)reject) {
  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        LAContext *context = [[LAContext alloc] init];
        self->_context = context;

        if (fallbackLabel != nil) {
          if ([fallbackLabel length] == 0) {
            context.localizedFallbackTitle = @"";
          } else {
            context.localizedFallbackTitle = fallbackLabel;
          }
        }

        if (cancelButtonText != nil && [cancelButtonText length] > 0) {
          if (@available(iOS 10.0, *)) {
            context.localizedCancelTitle = cancelButtonText;
          }
        }

        // iOS ignores subtitle — it's Android-only. No action needed.

        LAPolicy localAuthPolicy;
        if (disableDeviceFallback) {
          localAuthPolicy = LAPolicyDeviceOwnerAuthenticationWithBiometrics;
        } else {
          localAuthPolicy = LAPolicyDeviceOwnerAuthentication;
        }

        [context
             evaluatePolicy:localAuthPolicy
            localizedReason:message
                      reply:^(BOOL success, NSError *biometricError) {
                        self->_context = nil;

                        if (success) {
                          resolve(@(YES));
                        } else {
                          NSString *errorCode =
                              [self errorCodeFromLAError:biometricError];
                          reject(errorCode, biometricError.localizedDescription,
                                 biometricError);
                        }
                      }];
      });
}

// ─── cancelBioAuthRequest ──────────────────────────────────────

RCT_REMAP_METHOD(cancelBioAuthRequest, cancelIndex : (NSNumber *)index) {
  if (!_context)
    return;
  [_context invalidate];
  _context = nil;
}

// ─── Crypto Key Management ─────────────────────────────────────

RCT_REMAP_METHOD(
    createKeys,
    createKeysWithAlias : (NSString *)alias createKeysWithKeyType : (NSString *)
        keyType createKeysWithResolver : (RCTPromiseResolveBlock)
            resolve rejecter : (RCTPromiseRejectBlock)reject) {
  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSData *tag = [self keychainTagForAlias:alias];

        // Delete existing keys for this alias first
        [self deleteKeysWithTag:tag];

        BOOL isEC = [keyType isEqualToString:@"ec256"];
        CFErrorRef error = NULL;

        NSMutableDictionary *privateKeyAttrs = [@{
          (__bridge NSString *)kSecAttrIsPermanent : @YES,
          (__bridge NSString *)kSecAttrApplicationTag : tag,
        } mutableCopy];

        SecAccessControlRef accessControl = NULL;

        if (isEC) {
          // EC256: Secure Enclave strictly requires access control
          // with at least PrivateKeyUsage during key creation.
          // Biometric auth is enforced at signing time.
          accessControl = SecAccessControlCreateWithFlags(
              kCFAllocatorDefault, kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
              kSecAccessControlPrivateKeyUsage, &error);

          if (error != NULL || accessControl == NULL) {
            reject(@"key_error", @"Failed to create access control for EC",
                   (__bridge NSError *)error);
            return;
          }
          privateKeyAttrs[(__bridge NSString *)kSecAttrAccessControl] =
              (__bridge id)accessControl;
        } else {
          // RSA: add access control with biometric requirement
          accessControl = SecAccessControlCreateWithFlags(
              kCFAllocatorDefault,
              kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
              kSecAccessControlBiometryAny, &error);
          if (error != NULL || accessControl == NULL) {
            reject(@"key_error", @"Failed to create access control",
                   (__bridge NSError *)error);
            return;
          }
          privateKeyAttrs[(__bridge NSString *)kSecAttrAccessControl] =
              (__bridge id)accessControl;
        }

        NSMutableDictionary *attributes = [@{
          (__bridge NSString *)kSecAttrKeyType : isEC
              ? (__bridge NSString *)kSecAttrKeyTypeECSECPrimeRandom
              : (__bridge NSString *)kSecAttrKeyTypeRSA,
          (__bridge NSString *)kSecAttrKeySizeInBits : isEC ? @256 : @2048,
          (__bridge NSString *)kSecPrivateKeyAttrs : privateKeyAttrs,
        } mutableCopy];

        if (isEC) {
#if !TARGET_OS_SIMULATOR
          attributes[(__bridge NSString *)kSecAttrTokenID] =
              (__bridge NSString *)kSecAttrTokenIDSecureEnclave;
#endif
        }

        SecKeyRef privateKey =
            SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, &error);

        if (accessControl != NULL)
          CFRelease(accessControl);

        if (privateKey == NULL) {
          NSString *errorMsg = @"Failed to generate key pair";
          if (error != NULL) {
            NSError *nsError = (__bridge NSError *)error;
            errorMsg = [NSString stringWithFormat:@"Key generation failed: %@ "
                                                  @"(OSStatus %ld)",
                                                  nsError.localizedDescription,
                                                  (long)nsError.code];
          }
          reject(@"key_error", errorMsg, (__bridge NSError *)error);
          return;
        }

        SecKeyRef publicKey = SecKeyCopyPublicKey(privateKey);
        CFRelease(privateKey);

        if (publicKey == NULL) {
          reject(@"key_error", @"Failed to extract public key", nil);
          return;
        }

        CFErrorRef exportError = NULL;
        NSData *publicKeyData =
            (__bridge_transfer NSData *)SecKeyCopyExternalRepresentation(
                publicKey, &exportError);
        CFRelease(publicKey);

        if (publicKeyData == nil) {
          reject(@"key_error", @"Failed to export public key",
                 (__bridge NSError *)exportError);
          return;
        }

        NSString *base64PublicKey =
            [publicKeyData base64EncodedStringWithOptions:0];
        NSDictionary *result = @{
          @"publicKey" : base64PublicKey,
          @"keyType" : isEC ? @"ec256" : @"rsa2048",
        };
        resolve(result);
      });
}

RCT_REMAP_METHOD(createSignature,
                 signPayload : (NSString *)payload signPromptMessage : (
                     NSString *)promptMessage signKeyAlias : (NSString *)alias
                     createSignatureWithResolver : (RCTPromiseResolveBlock)
                         resolve rejecter : (RCTPromiseRejectBlock)reject) {
  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSData *tag = [self keychainTagForAlias:alias];

        // Try EC first, then RSA
        SecKeyRef privateKey = NULL;
        BOOL isEC = NO;
        NSArray *keyTypes = @[
          (__bridge NSString *)kSecAttrKeyTypeECSECPrimeRandom,
          (__bridge NSString *)kSecAttrKeyTypeRSA
        ];

        for (NSString *keyType in keyTypes) {
          NSDictionary *query = @{
            (__bridge NSString *)kSecClass : (__bridge NSString *)kSecClassKey,
            (__bridge NSString *)kSecAttrApplicationTag : tag,
            (__bridge NSString *)kSecAttrKeyType : keyType,
            (__bridge NSString *)kSecReturnRef : @YES,
            (__bridge NSString *)kSecUseOperationPrompt : promptMessage,
          };
          OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query,
                                                (CFTypeRef *)&privateKey);
          if (status == errSecSuccess && privateKey != NULL) {
            isEC =
                [keyType isEqualToString:(__bridge NSString *)
                                             kSecAttrKeyTypeECSECPrimeRandom];
            break;
          }
        }

        if (privateKey == NULL) {
          reject(@"signature_error",
                 @"Private key not found. Call createKeys() first.", nil);
          return;
        }

        NSData *payloadData = [payload dataUsingEncoding:NSUTF8StringEncoding];
        CFErrorRef error = NULL;
        SecKeyAlgorithm algorithm =
            isEC ? kSecKeyAlgorithmECDSASignatureMessageX962SHA256
                 : kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA256;
        NSData *signature = (__bridge_transfer NSData *)SecKeyCreateSignature(
            privateKey, algorithm, (__bridge CFDataRef)payloadData, &error);

        CFRelease(privateKey);

        if (signature == nil) {
          reject(@"signature_error", @"Failed to create signature",
                 (__bridge NSError *)error);
          return;
        }

        NSString *base64Signature =
            [signature base64EncodedStringWithOptions:0];
        resolve(base64Signature);
      });
}

RCT_REMAP_METHOD(biometricKeysExist,
                 keysExistForAlias : (NSString *)alias
                     biometricKeysExistWithResolver : (RCTPromiseResolveBlock)
                         resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSData *tag = [self keychainTagForAlias:alias];

  // Check both EC and RSA key types
  NSArray *keyTypes = @[
    (__bridge NSString *)kSecAttrKeyTypeECSECPrimeRandom,
    (__bridge NSString *)kSecAttrKeyTypeRSA
  ];

  for (NSString *keyType in keyTypes) {
    NSDictionary *query = @{
      (__bridge NSString *)kSecClass : (__bridge NSString *)kSecClassKey,
      (__bridge NSString *)kSecAttrApplicationTag : tag,
      (__bridge NSString *)kSecAttrKeyType : keyType,
      (__bridge NSString *)kSecReturnRef : @YES,
    };

    SecKeyRef privateKey = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query,
                                          (CFTypeRef *)&privateKey);
    if (privateKey != NULL) {
      CFRelease(privateKey);
    }
    if (status == errSecSuccess) {
      resolve(@YES);
      return;
    }
  }

  resolve(@NO);
}

RCT_REMAP_METHOD(deleteKeys,
                 deleteKeysForAlias : (NSString *)
                     alias deleteKeysWithResolver : (RCTPromiseResolveBlock)
                         resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSData *tag = [self keychainTagForAlias:alias];
  BOOL deleted = [self deleteKeysWithTag:tag];
  resolve(@(deleted));
}

// ─── Encrypted Storage ────────────────────────────────────────

static NSString *const kSecureStoreServicePrefix =
    @"com.easybiometrics.securestore.";

RCT_REMAP_METHOD(
    secureStore,
    secureStoreKey : (NSString *)key secureStoreValue : (NSString *)
        value secureStorePrompt : (NSString *)
            promptMessage secureStoreWithResolver : (RCTPromiseResolveBlock)
                resolve rejecter : (RCTPromiseRejectBlock)reject) {
  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSString *service =
            [kSecureStoreServicePrefix stringByAppendingString:key];

        // Delete existing item first
        NSDictionary *deleteQuery = @{
          (__bridge NSString *)
          kSecClass : (__bridge NSString *)kSecClassGenericPassword,
          (__bridge NSString *)kSecAttrService : service,
        };
        SecItemDelete((__bridge CFDictionaryRef)deleteQuery);

        // Create access control with biometric protection
        CFErrorRef error = NULL;
        SecAccessControlRef accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
            kSecAccessControlBiometryAny, &error);

        if (error != NULL || accessControl == NULL) {
          reject(@"storage_error", @"Failed to create access control",
                 (__bridge NSError *)error);
          return;
        }

        NSData *valueData = [value dataUsingEncoding:NSUTF8StringEncoding];

        LAContext *context = [[LAContext alloc] init];
        context.localizedReason =
            promptMessage ?: @"Authenticate to store data";

        NSDictionary *addQuery = @{
          (__bridge NSString *)
          kSecClass : (__bridge NSString *)kSecClassGenericPassword,
          (__bridge NSString *)kSecAttrService : service,
          (__bridge NSString *)kSecValueData : valueData,
          (__bridge NSString *)
          kSecAttrAccessControl : (__bridge id)accessControl,
          (__bridge NSString *)kSecUseAuthenticationContext : context,
        };

        OSStatus status = SecItemAdd((__bridge CFDictionaryRef)addQuery, NULL);
        CFRelease(accessControl);

        if (status == errSecSuccess) {
          resolve(@YES);
        } else {
          reject(@"storage_error",
                 [NSString
                     stringWithFormat:@"Failed to store data: %d", (int)status],
                 nil);
        }
      });
}

RCT_REMAP_METHOD(
    secureGet,
    secureGetKey : (NSString *)key secureGetPrompt : (NSString *)
        promptMessage secureGetWithResolver : (RCTPromiseResolveBlock)
            resolve rejecter : (RCTPromiseRejectBlock)reject) {
  dispatch_async(
      dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSString *service =
            [kSecureStoreServicePrefix stringByAppendingString:key];

        NSDictionary *query = @{
          (__bridge NSString *)
          kSecClass : (__bridge NSString *)kSecClassGenericPassword,
          (__bridge NSString *)kSecAttrService : service,
          (__bridge NSString *)kSecReturnData : @YES,
          (__bridge NSString *)kSecUseOperationPrompt : promptMessage
              ?: @"Authenticate to access data",
        };

        CFTypeRef result = NULL;
        OSStatus status =
            SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);

        if (status == errSecSuccess && result != NULL) {
          NSData *data = (__bridge_transfer NSData *)result;
          NSString *value =
              [[NSString alloc] initWithData:data
                                    encoding:NSUTF8StringEncoding];
          resolve(value);
        } else if (status == errSecItemNotFound) {
          resolve([NSNull null]);
        } else {
          reject(@"storage_error",
                 [NSString stringWithFormat:@"Failed to retrieve data: %d",
                                            (int)status],
                 nil);
        }
      });
}

RCT_REMAP_METHOD(secureDelete,
                 secureDeleteKey : (NSString *)
                     key secureDeleteWithResolver : (RCTPromiseResolveBlock)
                         resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSString *service = [kSecureStoreServicePrefix stringByAppendingString:key];

  NSDictionary *query = @{
    (__bridge NSString *)
    kSecClass : (__bridge NSString *)kSecClassGenericPassword,
    (__bridge NSString *)kSecAttrService : service,
  };

  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);
  resolve(@(status == errSecSuccess || status == errSecItemNotFound));
}

RCT_REMAP_METHOD(secureGetAllKeys,
                 secureGetAllKeysWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSDictionary *query = @{
    (__bridge NSString *)
    kSecClass : (__bridge NSString *)kSecClassGenericPassword,
    (__bridge NSString *)kSecReturnAttributes : @YES,
    (__bridge NSString *)
    kSecMatchLimit : (__bridge NSString *)kSecMatchLimitAll,
  };

  CFTypeRef result = NULL;
  OSStatus status =
      SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);

  NSMutableArray *keys = [NSMutableArray array];

  if (status == errSecSuccess && result != NULL) {
    NSArray *items = (__bridge_transfer NSArray *)result;
    for (NSDictionary *item in items) {
      NSString *service = item[(__bridge NSString *)kSecAttrService];
      if ([service hasPrefix:kSecureStoreServicePrefix]) {
        NSString *key =
            [service substringFromIndex:kSecureStoreServicePrefix.length];
        [keys addObject:key];
      }
    }
  }

  resolve(keys);
}

// ─── Screen Capture Protection ────────────────────────────────

RCT_REMAP_METHOD(setScreenCaptureProtection,
                 setScreenCaptureProtectionEnabled : (BOOL)
                     enabled setScreenCaptureProtectionWithResolver : (
                         RCTPromiseResolveBlock)
                         resolve rejecter : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    @try {
      UIWindow *window = [UIApplication sharedApplication].windows.firstObject;
      if (!window) {
        reject(@"screen_error", @"No window found", nil);
        return;
      }

      // Use a static variable to keep a strong reference to the secure field
      static UITextField *secureField = nil;

      if (enabled) {
        if (secureField == nil) {
          CGRect screenRect = [[UIScreen mainScreen] bounds];
          secureField = [[UITextField alloc] initWithFrame:screenRect];

          [secureField setTextAlignment:NSTextAlignmentCenter];
          [secureField setUserInteractionEnabled:NO];
          [secureField setSecureTextEntry:YES];

          [window makeKeyAndVisible];

          // Step 1: Add the textField's LAYER to the window's superlayer
          if (window.layer.superlayer) {
            [window.layer.superlayer addSublayer:secureField.layer];
          } else {
            [window addSubview:secureField];
          }

          // Step 2: Move window.layer INTO the textField's secure sublayer
          if (secureField.layer.sublayers.count > 0) {
            [secureField.layer.sublayers.firstObject addSublayer:window.layer];
          }
        }
      } else {
        if (secureField != nil) {
          [secureField setSecureTextEntry:NO];
          [secureField setBackgroundColor:[UIColor clearColor]];

          CALayer *textFieldLayer = secureField.layer;
          CALayer *windowSuperlayer = textFieldLayer.superlayer;
          CALayer *textFieldSecureSublayer =
              textFieldLayer.sublayers.firstObject;

          // Restore window.layer to its original position
          if (textFieldSecureSublayer &&
              [textFieldSecureSublayer.sublayers containsObject:window.layer]) {
            [window.layer removeFromSuperlayer];
            if (windowSuperlayer) {
              [windowSuperlayer addSublayer:window.layer];
            }
          }

          [textFieldLayer removeFromSuperlayer];
          [secureField removeFromSuperview];
          secureField = nil;
        }
      }

      resolve(@YES);
    } @catch (NSException *exception) {
      reject(@"screen_error", exception.reason, nil);
    }
  });
}

// ─── Diagnostics ──────────────────────────────────────────────

RCT_REMAP_METHOD(getDiagnosticInfo,
                 getDiagnosticInfoWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  LAContext *context = [[LAContext alloc] init];
  NSError *la_error = nil;
  BOOL canEvaluate =
      [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                           error:&la_error];

  NSMutableDictionary *result = [NSMutableDictionary dictionary];
  result[@"platform"] = @"ios";

  struct utsname systemInfo;
  uname(&systemInfo);
  result[@"device"] = [NSString stringWithCString:systemInfo.machine
                                         encoding:NSUTF8StringEncoding];
  result[@"osVersion"] = [[UIDevice currentDevice] systemVersion];
  result[@"model"] = [[UIDevice currentDevice] model];
  result[@"systemName"] = [[UIDevice currentDevice] systemName];

  // Biometric capabilities
  result[@"hasBiometric"] = @(canEvaluate);
  if (canEvaluate) {
    if (@available(iOS 11.0, *)) {
      result[@"hasFaceID"] = @(context.biometryType == LABiometryTypeFaceID);
      result[@"hasTouchID"] = @(context.biometryType == LABiometryTypeTouchID);
    }
  } else {
    result[@"hasFaceID"] = @NO;
    result[@"hasTouchID"] = @NO;
  }

  // Secure Enclave check
  BOOL hasSecureEnclave = NO;
  CFErrorRef seError = NULL;
  SecAccessControlRef seAccess = SecAccessControlCreateWithFlags(
      kCFAllocatorDefault, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
      kSecAccessControlPrivateKeyUsage, &seError);
  if (seAccess != NULL) {
    NSDictionary *seAttrs = @{
      (__bridge NSString *)
      kSecAttrKeyType : (__bridge NSString *)kSecAttrKeyTypeECSECPrimeRandom,
      (__bridge NSString *)kSecAttrKeySizeInBits : @256,
      (__bridge NSString *)
      kSecAttrTokenID : (__bridge NSString *)kSecAttrTokenIDSecureEnclave,
      (__bridge NSString *)kSecPrivateKeyAttrs : @{
        (__bridge NSString *)kSecAttrIsPermanent : @NO,
        (__bridge NSString *)kSecAttrAccessControl : (__bridge id)seAccess,
      },
    };
    SecKeyRef testKey =
        SecKeyCreateRandomKey((__bridge CFDictionaryRef)seAttrs, &seError);
    if (testKey != NULL) {
      hasSecureEnclave = YES;
      CFRelease(testKey);
    }
    CFRelease(seAccess);
  }
  result[@"hasSecureEnclave"] = @(hasSecureEnclave);

  // Passcode set
  LAContext *passcodeCtx = [[LAContext alloc] init];
  NSError *passcodeError = nil;
  result[@"hasPasscode"] =
      @([passcodeCtx canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication
                                 error:&passcodeError]);

  resolve(result);
}

// ─── Device Integrity ─────────────────────────────────────────

RCT_REMAP_METHOD(getDeviceIntegrity,
                 getDeviceIntegrityWithResolver : (RCTPromiseResolveBlock)
                     resolve rejecter : (RCTPromiseRejectBlock)reject) {
  BOOL isJailbroken = [self checkJailbroken];

  // Check Secure Enclave availability
  BOOL hasSecureEnclave = NO;
  if (@available(iOS 9.0, *)) {
    // Devices with A7+ chips have Secure Enclave
    // We test by checking if we can create an EC key with Secure Enclave
    CFErrorRef error = NULL;
    SecAccessControlRef accessControl = SecAccessControlCreateWithFlags(
        kCFAllocatorDefault, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
        kSecAccessControlPrivateKeyUsage, &error);
    if (accessControl != NULL) {
      NSDictionary *attributes = @{
        (__bridge NSString *)
        kSecAttrKeyType : (__bridge NSString *)kSecAttrKeyTypeECSECPrimeRandom,
        (__bridge NSString *)kSecAttrKeySizeInBits : @256,
        (__bridge NSString *)
        kSecAttrTokenID : (__bridge NSString *)kSecAttrTokenIDSecureEnclave,
        (__bridge NSString *)kSecPrivateKeyAttrs : @{
          (__bridge NSString *)kSecAttrIsPermanent : @NO,
          (__bridge NSString *)
          kSecAttrAccessControl : (__bridge id)accessControl,
        },
      };
      SecKeyRef testKey =
          SecKeyCreateRandomKey((__bridge CFDictionaryRef)attributes, &error);
      if (testKey != NULL) {
        hasSecureEnclave = YES;
        CFRelease(testKey);
      }
      CFRelease(accessControl);
    }
  }

  NSString *riskLevel = @"NONE";
  if (isJailbroken)
    riskLevel = @"HIGH";
  else if (!hasSecureEnclave)
    riskLevel = @"LOW";

  NSDictionary *result = @{
    @"isJailbroken" : @(isJailbroken),
    @"isCompromised" : @(isJailbroken),
    @"hasSecureEnclave" : @(hasSecureEnclave),
    @"riskLevel" : riskLevel,
  };
  resolve(result);
}

- (BOOL)checkJailbroken {
#if TARGET_OS_SIMULATOR
  return NO;
#else
  // Check for known jailbreak files
  NSArray *paths = @[
    @"/Applications/Cydia.app",
    @"/Applications/Sileo.app",
    @"/Library/MobileSubstrate/MobileSubstrate.dylib",
    @"/bin/bash",
    @"/usr/sbin/sshd",
    @"/etc/apt",
    @"/usr/bin/ssh",
    @"/private/var/lib/apt/",
    @"/private/var/lib/cydia",
    @"/private/var/stash",
  ];
  for (NSString *path in paths) {
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
      return YES;
    }
  }

  // Check if app can write to system paths
  NSError *error = nil;
  [@"jailbreak_test" writeToFile:@"/private/jailbreak_test.txt"
                      atomically:YES
                        encoding:NSUTF8StringEncoding
                           error:&error];
  if (error == nil) {
    [[NSFileManager defaultManager]
        removeItemAtPath:@"/private/jailbreak_test.txt"
                   error:nil];
    return YES;
  }

  // Check for Cydia URL scheme
  if ([[UIApplication sharedApplication]
          canOpenURL:
              [NSURL URLWithString:@"cydia://package/com.example.package"]]) {
    return YES;
  }

  return NO;
#endif
}

// ─── Private Helpers ───────────────────────────────────────────

- (BOOL)deleteKeysWithTag:(NSData *)tag {
  // Delete both EC and RSA keys for this tag
  BOOL deleted = NO;
  NSArray *keyTypes = @[
    (__bridge NSString *)kSecAttrKeyTypeECSECPrimeRandom,
    (__bridge NSString *)kSecAttrKeyTypeRSA
  ];
  for (NSString *keyType in keyTypes) {
    NSDictionary *query = @{
      (__bridge NSString *)kSecClass : (__bridge NSString *)kSecClassKey,
      (__bridge NSString *)kSecAttrApplicationTag : tag,
      (__bridge NSString *)kSecAttrKeyType : keyType,
    };
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);
    if (status == errSecSuccess)
      deleted = YES;
  }
  return deleted;
}

- (NSString *)errorCodeFromLAError:(NSError *)error {
  if (!error)
    return @"unknown";

  switch (error.code) {
  case LAErrorUserCancel:
    return @"user_cancel";
  case LAErrorAuthenticationFailed:
    return @"authentication_failed";
  case LAErrorSystemCancel:
    return @"system_cancel";
  case LAErrorPasscodeNotSet:
    return @"passcode_not_set";
  case LAErrorBiometryNotAvailable:
    return @"not_available";
  case LAErrorBiometryNotEnrolled:
    return @"not_enrolled";
  case LAErrorBiometryLockout:
    return @"lockout";
  case LAErrorUserFallback:
    return @"user_cancel";
  case LAErrorAppCancel:
    return @"app_cancel";
  case LAErrorInvalidContext:
    return @"app_cancel";
  default:
    return @"unknown";
  }
}

// ─── TurboModule ───────────────────────────────────────────────

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeEasyBiometricsSpecJSI>(params);
}
#endif

@end
