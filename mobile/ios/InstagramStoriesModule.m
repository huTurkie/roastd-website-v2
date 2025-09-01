
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(InstagramStoriesModule, NSObject)

RCT_EXTERN_METHOD(shareToInstagramStories:(NSString *)imageData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
