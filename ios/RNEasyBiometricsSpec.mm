#ifdef RCT_NEW_ARCH_ENABLED
#import "RNEasyBiometricsSpec.h"

namespace facebook {
namespace react {

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_canAuthenticate(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_getBiometryType(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_isEnrolled(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_getSecurityLevel(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_getBiometricStateHash(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_requestBioAuth(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_authenticate(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_cancelBioAuthRequest(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_createKeys(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_createSignature(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_biometricKeysExist(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_deleteKeys(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_secureStore(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_secureGet(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_secureDelete(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_secureGetAllKeys(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_setScreenCaptureProtection(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_getDiagnosticInfo(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value
__hostFunction_NativeEasyBiometricsSpecJSI_getDeviceIntegrity(
    facebook::jsi::Runtime &rt, TurboModule &turboModule,
    const facebook::jsi::Value *args, size_t count) {
  return facebook::jsi::Value::undefined();
}

NativeEasyBiometricsSpecJSI::NativeEasyBiometricsSpecJSI(
    const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params) {

  methodMap_["canAuthenticate"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_canAuthenticate};
  methodMap_["getBiometryType"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_getBiometryType};
  methodMap_["isEnrolled"] =
      MethodMetadata{1, __hostFunction_NativeEasyBiometricsSpecJSI_isEnrolled};
  methodMap_["getSecurityLevel"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_getSecurityLevel};
  methodMap_["getBiometricStateHash"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_getBiometricStateHash};
  methodMap_["requestBioAuth"] = MethodMetadata{
      3, __hostFunction_NativeEasyBiometricsSpecJSI_requestBioAuth};
  methodMap_["authenticate"] = MethodMetadata{
      6, __hostFunction_NativeEasyBiometricsSpecJSI_authenticate};
  methodMap_["cancelBioAuthRequest"] = MethodMetadata{
      0, __hostFunction_NativeEasyBiometricsSpecJSI_cancelBioAuthRequest};
  methodMap_["createKeys"] =
      MethodMetadata{1, __hostFunction_NativeEasyBiometricsSpecJSI_createKeys};
  methodMap_["createSignature"] = MethodMetadata{
      3, __hostFunction_NativeEasyBiometricsSpecJSI_createSignature};
  methodMap_["biometricKeysExist"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_biometricKeysExist};
  methodMap_["deleteKeys"] =
      MethodMetadata{1, __hostFunction_NativeEasyBiometricsSpecJSI_deleteKeys};
  methodMap_["secureStore"] =
      MethodMetadata{4, __hostFunction_NativeEasyBiometricsSpecJSI_secureStore};
  methodMap_["secureGet"] =
      MethodMetadata{3, __hostFunction_NativeEasyBiometricsSpecJSI_secureGet};
  methodMap_["secureDelete"] = MethodMetadata{
      2, __hostFunction_NativeEasyBiometricsSpecJSI_secureDelete};
  methodMap_["secureGetAllKeys"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_secureGetAllKeys};
  methodMap_["setScreenCaptureProtection"] = MethodMetadata{
      2, __hostFunction_NativeEasyBiometricsSpecJSI_setScreenCaptureProtection};
  methodMap_["getDiagnosticInfo"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_getDiagnosticInfo};
  methodMap_["getDeviceIntegrity"] = MethodMetadata{
      1, __hostFunction_NativeEasyBiometricsSpecJSI_getDeviceIntegrity};
}

} // namespace react
} // namespace facebook
#endif /* RCT_NEW_ARCH_ENABLED */