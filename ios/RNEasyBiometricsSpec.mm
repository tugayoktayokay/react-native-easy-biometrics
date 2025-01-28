#ifdef RCT_NEW_ARCH_ENABLED
#import "RNEasyBiometricsSpec.h"

namespace facebook {
namespace react {

static facebook::jsi::Value __hostFunction_NativeEasyBiometricsSpecJSI_canAuthenticate(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
    return facebook::jsi::Value::undefined();
}

static facebook::jsi::Value __hostFunction_NativeEasyBiometricsSpecJSI_requestBioAuth(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
    return facebook::jsi::Value::undefined();
}

NativeEasyBiometricsSpecJSI::NativeEasyBiometricsSpecJSI(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params) {

    methodMap_["canAuthenticate"] = MethodMetadata{1, __hostFunction_NativeEasyBiometricsSpecJSI_canAuthenticate};
    methodMap_["requestBioAuth"] = MethodMetadata{3, __hostFunction_NativeEasyBiometricsSpecJSI_requestBioAuth};
}

} // namespace react
} // namespace facebook
#endif /* RCT_NEW_ARCH_ENABLED */ 