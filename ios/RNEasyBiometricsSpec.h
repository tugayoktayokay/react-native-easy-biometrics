#pragma once

#ifdef RCT_NEW_ARCH_ENABLED
#import "RCTTurboModule.h"

namespace facebook
{
    namespace react
    {

        class JSI_EXPORT NativeEasyBiometricsSpecJSI : public ObjCTurboModule
        {
        public:
            explicit NativeEasyBiometricsSpecJSI(const ObjCTurboModule::InitParams &params);
        };

    } // namespace react
} // namespace facebook

#endif /* RCT_NEW_ARCH_ENABLED */