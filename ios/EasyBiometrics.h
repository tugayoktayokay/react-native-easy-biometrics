#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTBridgeModule.h>
#import <Security/Security.h>

@interface EasyBiometrics : NSObject <RCTBridgeModule>

@property(nonatomic, strong) LAContext *context;

@end
